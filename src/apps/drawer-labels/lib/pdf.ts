import { addPdfAttributionToAllPages } from '../../../lib/pdfAttribution'
import { primaryFontName, waitForFont } from '../../../lib/fonts'

export type DrawerLabel = {
  id: string
  name: string
  textColor: string
  outlineColor: string
}

export const LABELS_PER_PAGE = 4
export const PAGE_MARGIN_X_MM = 16
export const LABEL_HEIGHT_MM = 36
export const SLOT_GAP_MM = 20
const CORNER_RADIUS_MM = 3.5
const STROKE_MM = 1.05
const TEXT_PADDING_X_MM = 8
const TEXT_PADDING_Y_MM = 2.5
const PRINT_DPI = 150
const JPEG_QUALITY = 0.9
const LABEL_FONT_WEIGHT = 600

type SlotRect = { x: number; y: number; width: number; height: number }

export function getLabelSlots(
  pageWidth: number,
  pageHeight: number,
  countOnPage: number,
): SlotRect[] {
  const width = pageWidth - PAGE_MARGIN_X_MM * 2
  const height = LABEL_HEIGHT_MM
  const blockHeight =
    LABELS_PER_PAGE * height + (LABELS_PER_PAGE - 1) * SLOT_GAP_MM
  const startY = (pageHeight - blockHeight) / 2
  const x = PAGE_MARGIN_X_MM

  return Array.from({ length: countOnPage }, (_, index) => ({
    x,
    y: startY + index * (height + SLOT_GAP_MM),
    width,
    height,
  }))
}

export function pageCountFor(labelCount: number): number {
  if (labelCount === 0) {
    return 0
  }
  return Math.ceil(labelCount / LABELS_PER_PAGE)
}

function mmToPx(mm: number): number {
  return (mm / 25.4) * PRINT_DPI
}

async function renderLabelJpeg(
  name: string,
  textColor: string,
  outlineColor: string,
  fontFamily: string,
  widthMm: number,
  heightMm: number,
): Promise<string> {
  await waitForFont(fontFamily)
  try {
    await document.fonts.load(`600 64px "${primaryFontName(fontFamily)}"`)
  } catch {
    // Canvas will fall back to the next family in the stack.
  }

  const width = Math.round(mmToPx(widthMm))
  const height = Math.round(mmToPx(heightMm))
  const stroke = mmToPx(STROKE_MM)
  const radius = mmToPx(CORNER_RADIUS_MM)
  const padX = mmToPx(TEXT_PADDING_X_MM)
  const padY = mmToPx(TEXT_PADDING_Y_MM)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not available')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const inset = stroke / 2
  ctx.strokeStyle = outlineColor
  ctx.lineWidth = stroke
  ctx.beginPath()
  ctx.roundRect(
    inset,
    inset,
    width - stroke,
    height - stroke,
    radius,
  )
  ctx.stroke()

  const trimmed = name.trim()
  if (trimmed) {
    const maxWidth = width - padX * 2
    const innerHeight = height - stroke * 2 - padY * 2
    const maxFontSize = innerHeight * 0.88
    const minFontSize = Math.max(10, innerHeight * 0.35)
    let fontSize = maxFontSize
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = textColor

    while (fontSize > minFontSize) {
      ctx.font = `${LABEL_FONT_WEIGHT} ${fontSize}px ${fontFamily}`
      if (ctx.measureText(trimmed).width <= maxWidth) {
        break
      }
      fontSize -= 1
    }
    ctx.font = `${LABEL_FONT_WEIGHT} ${fontSize}px ${fontFamily}`

    let drawText = trimmed
    if (ctx.measureText(drawText).width > maxWidth) {
      while (drawText.length > 1 && ctx.measureText(`${drawText}…`).width > maxWidth) {
        drawText = drawText.slice(0, -1)
      }
      drawText = `${drawText}…`
    }

    ctx.fillText(drawText, width / 2, height / 2)
  }

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export type GenerateDrawerLabelsPdfOptions = {
  labels: DrawerLabel[]
  fontFamily?: string
  filename?: string
}

export async function generateDrawerLabelsPdf({
  labels,
  fontFamily = '"Baloo 2", sans-serif',
  filename = 'drawer-labels.pdf',
}: GenerateDrawerLabelsPdfOptions): Promise<void> {
  if (labels.length === 0) {
    throw new Error('Add at least one label to generate a PDF.')
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imageCache = new Map<string, string>()

  for (let pageStart = 0; pageStart < labels.length; pageStart += LABELS_PER_PAGE) {
    if (pageStart > 0) {
      pdf.addPage()
    }

    const chunk = labels.slice(pageStart, pageStart + LABELS_PER_PAGE)
    const slots = getLabelSlots(pageWidth, pageHeight, chunk.length)

    for (let i = 0; i < chunk.length; i++) {
      const label = chunk[i]!
      const slot = slots[i]!
      const cacheKey = `${label.name}|${label.textColor}|${label.outlineColor}|${fontFamily}|${slot.width}|${slot.height}`
      let imageData = imageCache.get(cacheKey)
      if (!imageData) {
        imageData = await renderLabelJpeg(
          label.name,
          label.textColor,
          label.outlineColor,
          fontFamily,
          slot.width,
          slot.height,
        )
        imageCache.set(cacheKey, imageData)
      }
      pdf.addImage(imageData, 'JPEG', slot.x, slot.y, slot.width, slot.height)
    }
  }

  addPdfAttributionToAllPages(pdf)
  pdf.save(filename)
}
