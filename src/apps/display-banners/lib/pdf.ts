import { addPdfAttributionToAllPages } from '../../../lib/pdfAttribution'
import { waitForFont } from '../../../lib/fonts'
import { textStrokeForContrast } from './colors'
import {
  getShapeBounds,
  getTextBox,
  insetRect,
  strokeBannerShape,
  type BannerShapeId,
  type Rect,
} from './shapes'
import {
  BANNER_FONT_WEIGHT,
  BANNER_LINE_HEIGHT,
  layoutBannerText,
} from './text'

export type BannersPerPage = 1 | 2 | 4

export const BANNERS_PER_PAGE_OPTIONS: BannersPerPage[] = [1, 2, 4]

export const PAGE_MARGIN_MM = 12
export const SLOT_GAP_MM = 8
const PRINT_DPI = 150
const JPEG_QUALITY = 0.86
const MIN_RENDER_PX = 360
const MAX_RENDER_PX = 1400

export type SlotRect = Rect

/** Two-up landscape halves are portrait; banners are drawn landscape then rotated. */
export function bannerContentIsRotated(bannersPerPage: BannersPerPage): boolean {
  return bannersPerPage === 2
}

export function getSlotRects(
  bannersPerPage: BannersPerPage,
  pageWidth: number,
  pageHeight: number,
): SlotRect[] {
  const margin = PAGE_MARGIN_MM
  const gap = SLOT_GAP_MM

  if (bannersPerPage === 1) {
    return [
      {
        x: margin,
        y: margin,
        width: pageWidth - margin * 2,
        height: pageHeight - margin * 2,
      },
    ]
  }

  if (bannersPerPage === 2) {
    const width = (pageWidth - margin * 2 - gap) / 2
    const height = pageHeight - margin * 2
    return [0, 1].map((index) => ({
      x: margin + index * (width + gap),
      y: margin,
      width,
      height,
    }))
  }

  const width = (pageWidth - margin * 2 - gap) / 2
  const height = (pageHeight - margin * 2 - gap) / 2
  return Array.from({ length: 4 }, (_, index) => ({
    x: margin + (index % 2) * (width + gap),
    y: margin + Math.floor(index / 2) * (height + gap),
    width,
    height,
  }))
}

function mmToPx(mm: number): number {
  return (mm / 25.4) * PRINT_DPI
}

function slotToPixels(slot: SlotRect): { width: number; height: number } {
  let width = mmToPx(slot.width)
  let height = mmToPx(slot.height)
  const longest = Math.max(width, height)
  if (longest > MAX_RENDER_PX) {
    const scale = MAX_RENDER_PX / longest
    width *= scale
    height *= scale
  }
  if (Math.min(width, height) < MIN_RENDER_PX) {
    const scale = MIN_RENDER_PX / Math.min(width, height)
    width *= scale
    height *= scale
  }
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}

function paintBannerContent(
  ctx: CanvasRenderingContext2D,
  text: string,
  shapeId: BannerShapeId,
  fontFamily: string,
  shapeColor: string,
  textColor: string,
  width: number,
  height: number,
): void {
  const frame = insetRect({ x: 0, y: 0, width, height }, 0.04)
  const shapeBounds = getShapeBounds(shapeId, frame)
  strokeBannerShape(ctx, shapeId, shapeBounds, shapeColor)

  const textBox = getTextBox(shapeId, shapeBounds)
  const layout = layoutBannerText(
    text,
    fontFamily,
    textBox.width,
    textBox.height,
  )
  if (layout.lines.length === 0 || layout.fontSize <= 0) {
    return
  }

  const stroke = textStrokeForContrast(textColor)
  const totalHeight = layout.lines.length * layout.fontSize * BANNER_LINE_HEIGHT
  const startY =
    textBox.y + (textBox.height - totalHeight) / 2 + layout.fontSize / 2
  const x = textBox.x + textBox.width / 2

  ctx.font = `${BANNER_FONT_WEIGHT} ${layout.fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i]!
    const y = startY + i * layout.fontSize * BANNER_LINE_HEIGHT
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = layout.fontSize * 0.12
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.strokeText(line, x, y)
    }
    ctx.fillStyle = textColor
    ctx.fillText(line, x, y)
  }
}

function paintBanner(
  ctx: CanvasRenderingContext2D,
  text: string,
  shapeId: BannerShapeId,
  fontFamily: string,
  shapeColor: string,
  textColor: string,
  width: number,
  height: number,
  rotate90: boolean,
): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  if (rotate90) {
    ctx.save()
    ctx.translate(width, 0)
    ctx.rotate(Math.PI / 2)
    paintBannerContent(
      ctx,
      text,
      shapeId,
      fontFamily,
      shapeColor,
      textColor,
      height,
      width,
    )
    ctx.restore()
    return
  }

  paintBannerContent(
    ctx,
    text,
    shapeId,
    fontFamily,
    shapeColor,
    textColor,
    width,
    height,
  )
}

async function renderBannerJpeg(
  text: string,
  shapeId: BannerShapeId,
  fontFamily: string,
  shapeColor: string,
  textColor: string,
  slot: SlotRect,
  rotate90: boolean,
): Promise<string> {
  await waitForFont(fontFamily)
  const { width, height } = slotToPixels(slot)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not available')
  }
  paintBanner(
    ctx,
    text,
    shapeId,
    fontFamily,
    shapeColor,
    textColor,
    width,
    height,
    rotate90,
  )
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export type BannerItem = {
  text: string
  textColor: string
}

export type GenerateDisplayBannersPdfOptions = {
  banners: BannerItem[]
  shapeId: BannerShapeId
  fontFamily?: string
  shapeColor?: string
  bannersPerPage?: BannersPerPage
  filename?: string
}

export async function generateDisplayBannersPdf({
  banners,
  shapeId,
  fontFamily = '"Baloo 2", sans-serif',
  shapeColor = '#000000',
  bannersPerPage = 1,
  filename = 'display-banners.pdf',
}: GenerateDisplayBannersPdfOptions): Promise<void> {
  if (!banners.some((banner) => banner.text.trim().length > 0)) {
    throw new Error('Enter some text to generate a PDF.')
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const slots = getSlotRects(bannersPerPage, pageWidth, pageHeight)
  const rotate90 = bannerContentIsRotated(bannersPerPage)
  const imageCache = new Map<string, string>()

  for (let index = 0; index < slots.length; index++) {
    const slot = slots[index]!
    const banner = banners[index] ?? { text: '', textColor: '#000000' }
    const cacheKey = `${banner.text}|${banner.textColor}|${slot.width}|${slot.height}|${rotate90}`
    let imageData = imageCache.get(cacheKey)
    if (!imageData) {
      imageData = await renderBannerJpeg(
        banner.text,
        shapeId,
        fontFamily,
        shapeColor,
        banner.textColor,
        slot,
        rotate90,
      )
      imageCache.set(cacheKey, imageData)
    }
    pdf.addImage(imageData, 'JPEG', slot.x, slot.y, slot.width, slot.height)
  }

  addPdfAttributionToAllPages(pdf)
  pdf.save(filename)
}
