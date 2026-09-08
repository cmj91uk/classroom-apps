import { addPdfAttributionToAllPages } from '../../../lib/pdfAttribution'
import { primaryFontName, waitForFont } from '../../../lib/fonts'
import { worksheetLetter, shownValue, type PartWholeProblem } from './problems'

const COLUMNS = 3
const ROWS = 4
const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const MARGIN_X_MM = 12
const MARGIN_TOP_MM = 12
const CONTENT_BOTTOM_MM = 286
const PRINT_DPI = 150
const JPEG_QUALITY = 0.92
const FONT_FAMILY = 'Montserrat, sans-serif'

function mmToPx(mm: number): number {
  return (mm / 25.4) * PRINT_DPI
}

async function prepareFont(): Promise<string> {
  await waitForFont(FONT_FAMILY)
  try {
    await document.fonts.load(`700 48px "${primaryFontName(FONT_FAMILY)}"`)
    await document.fonts.load(`600 36px "${primaryFontName(FONT_FAMILY)}"`)
  } catch {
    // Canvas will fall back to the next family in the stack.
  }
  return FONT_FAMILY
}

function createPageCanvas(): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(mmToPx(PAGE_WIDTH_MM))
  canvas.height = Math.round(mmToPx(PAGE_HEIGHT_MM))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not available')
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#111111'
  return { canvas, ctx }
}

function drawNameDate(ctx: CanvasRenderingContext2D, fontFamily: string): number {
  const x = mmToPx(MARGIN_X_MM)
  const right = mmToPx(PAGE_WIDTH_MM - MARGIN_X_MM)
  const y = mmToPx(MARGIN_TOP_MM + 4)
  const size = mmToPx(4)
  ctx.font = `400 ${size}px ${fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('Name: ________________________', x, y)
  ctx.textAlign = 'right'
  ctx.fillText('Date: ______________', right, y)
  return y + mmToPx(8)
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  fontFamily: string,
  startY: number,
  letter: string | null,
): number {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${mmToPx(6.4)}px ${fontFamily}`
  ctx.fillText('Part Part Whole', mmToPx(PAGE_WIDTH_MM / 2), startY)

  if (!letter) {
    return startY + mmToPx(10)
  }

  ctx.font = `600 ${mmToPx(4.2)}px ${fontFamily}`
  ctx.fillText(`Worksheet ${letter}`, mmToPx(PAGE_WIDTH_MM / 2), startY + mmToPx(7.5))
  return startY + mmToPx(16)
}

function circleEdgePoint(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  radius: number,
): { x: number; y: number } {
  const dx = toX - fromX
  const dy = toY - fromY
  const length = Math.hypot(dx, dy) || 1
  return {
    x: fromX + (dx / length) * radius,
    y: fromY + (dy / length) * radius,
  }
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  fontFamily: string,
  x: number,
  y: number,
  radius: number,
  value: number | null,
  blank: boolean,
): void {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = Math.max(1.4, mmToPx(0.4))
  ctx.stroke()

  if (blank || value === null) {
    return
  }

  const text = String(value)
  const maxWidth = radius * 1.55
  let fontSize = radius * 0.72
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#111111'
  ctx.font = `600 ${fontSize}px ${fontFamily}`
  while (fontSize > radius * 0.32 && ctx.measureText(text).width > maxWidth) {
    fontSize -= 1
    ctx.font = `600 ${fontSize}px ${fontFamily}`
  }
  ctx.fillText(text, x, y)
}

function drawModel(
  ctx: CanvasRenderingContext2D,
  fontFamily: string,
  problem: PartWholeProblem,
  x: number,
  y: number,
  width: number,
  height: number,
  blank: boolean,
): void {
  const partCount = problem.partCount
  const wholeRadius = Math.min(width, height) * (partCount === 3 ? 0.16 : 0.18)
  const partRadius = wholeRadius * 0.92
  const wholeX = x + width / 2
  const wholeY = y + height * 0.28
  const partsY = y + height * 0.72
  const spread = width * (partCount === 3 ? 0.32 : 0.24)
  const partXs =
    partCount === 2
      ? [wholeX - spread, wholeX + spread]
      : [wholeX - spread, wholeX, wholeX + spread]

  ctx.strokeStyle = '#111111'
  ctx.lineWidth = Math.max(1.2, mmToPx(0.35))
  partXs.forEach((partX) => {
    const start = circleEdgePoint(wholeX, wholeY, partX, partsY, wholeRadius)
    const end = circleEdgePoint(partX, partsY, wholeX, wholeY, partRadius)
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  })

  drawCircle(
    ctx,
    fontFamily,
    wholeX,
    wholeY,
    wholeRadius,
    shownValue(problem, 'whole'),
    blank,
  )
  partXs.forEach((partX, index) => {
    drawCircle(
      ctx,
      fontFamily,
      partX,
      partsY,
      partRadius,
      shownValue(problem, index),
      blank,
    )
  })
}

export async function renderWorksheetJpeg(
  problems: PartWholeProblem[],
  blank: boolean,
  letter: string | null = null,
): Promise<string> {
  const fontFamily = await prepareFont()
  const { canvas, ctx } = createPageCanvas()

  let gridTop = mmToPx(MARGIN_TOP_MM)
  if (!blank) {
    gridTop = drawTitle(
      ctx,
      fontFamily,
      drawNameDate(ctx, fontFamily),
      letter,
    )
  } else if (letter) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${mmToPx(4.2)}px ${fontFamily}`
    ctx.fillText(
      `Worksheet ${letter}`,
      mmToPx(PAGE_WIDTH_MM / 2),
      gridTop + mmToPx(3),
    )
    gridTop += mmToPx(10)
  }

  const gridLeft = mmToPx(MARGIN_X_MM)
  const gridWidth = mmToPx(PAGE_WIDTH_MM - MARGIN_X_MM * 2)
  const gridBottom = mmToPx(CONTENT_BOTTOM_MM)
  const colWidth = gridWidth / COLUMNS
  const rowHeight = (gridBottom - gridTop) / ROWS

  problems.slice(0, COLUMNS * ROWS).forEach((problem, index) => {
    const col = index % COLUMNS
    const row = Math.floor(index / COLUMNS)
    const cellX = gridLeft + col * colWidth
    const cellY = gridTop + row * rowHeight

    if (!blank) {
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#111111'
      ctx.font = `600 ${mmToPx(3.6)}px ${fontFamily}`
      ctx.fillText(String(index + 1), cellX + mmToPx(2), cellY + mmToPx(1))
    }

    drawModel(
      ctx,
      fontFamily,
      problem,
      cellX,
      cellY,
      colWidth,
      rowHeight,
      blank,
    )
  })

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export async function generatePartWholePdf(options: {
  worksheets: PartWholeProblem[][]
  blank: boolean
  filename?: string
}): Promise<void> {
  if (
    options.worksheets.length === 0 ||
    options.worksheets.some((sheet) => sheet.length === 0)
  ) {
    throw new Error('Could not generate any problems for these settings.')
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const showLetters = options.worksheets.length > 1

  for (let i = 0; i < options.worksheets.length; i++) {
    if (i > 0) {
      pdf.addPage()
    }
    const image = await renderWorksheetJpeg(
      options.worksheets[i]!,
      options.blank,
      showLetters ? worksheetLetter(i) : null,
    )
    pdf.addImage(image, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
  }

  addPdfAttributionToAllPages(pdf, { contentBottomMm: CONTENT_BOTTOM_MM })
  pdf.save(options.filename ?? 'part-part-whole-worksheets.pdf')
}
