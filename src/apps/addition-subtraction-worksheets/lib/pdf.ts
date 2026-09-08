import { addPdfAttributionToAllPages } from '../../../lib/pdfAttribution'
import { primaryFontName, waitForFont } from '../../../lib/fonts'
import {
  formatAnswerLine,
  worksheetLetter,
  worksheetTitle,
  type ProblemKind,
  type WorksheetProblem,
} from './problems'

export const PROBLEMS_PER_PAGE_MIN = 16
export const PROBLEMS_PER_PAGE_MAX = 32
export const WORKSHEET_COUNT_MAX = 26
const COLUMNS = 4
const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const MARGIN_X_MM = 14
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
    await document.fonts.load(`700 64px "${primaryFontName(FONT_FAMILY)}"`)
    await document.fonts.load(`600 48px "${primaryFontName(FONT_FAMILY)}"`)
  } catch {
    // Canvas will fall back to the next family in the stack.
  }
  return FONT_FAMILY
}

function createPageCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
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
  const size = mmToPx(4.2)
  ctx.font = `400 ${size}px ${fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('Name: ________________________', x, y)
  ctx.textAlign = 'right'
  ctx.fillText('Date: ______________', right, y)
  return y + mmToPx(8)
}

function drawHeadings(
  ctx: CanvasRenderingContext2D,
  fontFamily: string,
  kinds: ProblemKind[],
  letter: string | null,
  startY: number,
): number {
  const title = worksheetTitle(kinds)
  const cx = mmToPx(PAGE_WIDTH_MM / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `700 ${mmToPx(7.2)}px ${fontFamily}`
  ctx.fillText(title, cx, startY)

  if (!letter) {
    return startY + mmToPx(12)
  }

  ctx.font = `600 ${mmToPx(4.4)}px ${fontFamily}`
  ctx.fillText(`Worksheet ${letter}`, cx, startY + mmToPx(8))
  return startY + mmToPx(16)
}

function drawProblem(
  ctx: CanvasRenderingContext2D,
  fontFamily: string,
  problem: WorksheetProblem,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const fontSize = Math.min(height * 0.2, mmToPx(9))
  const rightX = x + width * 0.72
  const blockTop = y + height * 0.18
  const row = fontSize * 1.28

  ctx.font = `600 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = '#111111'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(problem.left), rightX, blockTop)
  ctx.fillText(String(problem.right), rightX, blockTop + row)

  const twoDigits = ctx.measureText('00').width
  ctx.textAlign = 'left'
  ctx.fillText(
    problem.operator,
    rightX - twoDigits - fontSize * 0.7,
    blockTop + row,
  )

  const lineLeft = rightX - twoDigits - fontSize * 0.85
  const lineRight = rightX + fontSize * 0.12
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = Math.max(1.2, mmToPx(0.35))
  ctx.beginPath()
  ctx.moveTo(lineLeft, blockTop + row + fontSize * 0.62)
  ctx.lineTo(lineRight, blockTop + row + fontSize * 0.62)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(lineLeft, blockTop + row + fontSize * 2.15)
  ctx.lineTo(lineRight, blockTop + row + fontSize * 2.15)
  ctx.stroke()
}

export async function renderWorksheetJpeg(
  problems: WorksheetProblem[],
  kinds: ProblemKind[],
  letter: string | null,
): Promise<string> {
  const fontFamily = await prepareFont()
  const { canvas, ctx } = createPageCanvas()

  let y = drawNameDate(ctx, fontFamily)
  y = drawHeadings(ctx, fontFamily, kinds, letter, y)

  const gridTop = y
  const gridBottom = mmToPx(CONTENT_BOTTOM_MM)
  const gridLeft = mmToPx(MARGIN_X_MM)
  const gridWidth = mmToPx(PAGE_WIDTH_MM - MARGIN_X_MM * 2)
  const rows = Math.ceil(problems.length / COLUMNS)
  const colWidth = gridWidth / COLUMNS
  const rowHeight = (gridBottom - gridTop) / rows

  problems.forEach((problem, index) => {
    const col = index % COLUMNS
    const rowIndex = Math.floor(index / COLUMNS)
    drawProblem(
      ctx,
      fontFamily,
      problem,
      gridLeft + col * colWidth,
      gridTop + rowIndex * rowHeight,
      colWidth,
      rowHeight,
    )
  })

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export async function renderAnswerSheetJpegs(
  worksheets: WorksheetProblem[][],
  showLetters: boolean,
): Promise<string[]> {
  const fontFamily = await prepareFont()
  const pages: string[] = []
  const columns = 2
  const lineHeight = mmToPx(5.6)
  const titleSize = mmToPx(6.2)
  const bodySize = mmToPx(3.8)
  const top = mmToPx(MARGIN_TOP_MM + 4)
  const bottom = mmToPx(CONTENT_BOTTOM_MM)
  const left = mmToPx(MARGIN_X_MM)
  const usableWidth = mmToPx(PAGE_WIDTH_MM - MARGIN_X_MM * 2)
  const colWidth = usableWidth / columns

  type Line = { text: string; heading: boolean }
  const lines: Line[] = [{ text: 'Answer sheet', heading: true }]

  worksheets.forEach((problems, worksheetIndex) => {
    if (showLetters) {
      lines.push({
        text: `Worksheet ${worksheetLetter(worksheetIndex)}`,
        heading: true,
      })
    }
    problems.forEach((problem, problemIndex) => {
      lines.push({
        text: formatAnswerLine(problem, problemIndex),
        heading: false,
      })
    })
  })

  let index = 0
  while (index < lines.length) {
    const { canvas, ctx } = createPageCanvas()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    let cursorY = top
    let col = 0

    while (index < lines.length) {
      const line = lines[index]!
      const size = line.heading ? titleSize : bodySize
      const needed = line.heading ? lineHeight * 1.15 : lineHeight
      if (cursorY + needed > bottom) {
        col += 1
        if (col >= columns) {
          break
        }
        cursorY = top
      }

      ctx.font = `${line.heading ? '700' : '500'} ${size}px ${fontFamily}`
      ctx.fillText(line.text, left + col * colWidth, cursorY)
      cursorY += needed
      index += 1
    }

    pages.push(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
  }

  return pages
}

export type GenerateWorksheetsPdfOptions = {
  worksheets: WorksheetProblem[][]
  kinds: ProblemKind[]
  includeAnswerSheet: boolean
  filename?: string
}

export async function generateWorksheetsPdf({
  worksheets,
  kinds,
  includeAnswerSheet,
  filename = 'addition-subtraction-worksheets.pdf',
}: GenerateWorksheetsPdfOptions): Promise<void> {
  if (worksheets.length === 0 || worksheets.some((sheet) => sheet.length === 0)) {
    throw new Error('Choose at least one type of sum to generate a PDF.')
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const showLetters = worksheets.length > 1

  for (let i = 0; i < worksheets.length; i++) {
    if (i > 0) {
      pdf.addPage()
    }
    const image = await renderWorksheetJpeg(
      worksheets[i]!,
      kinds,
      showLetters ? worksheetLetter(i) : null,
    )
    pdf.addImage(image, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
  }

  if (includeAnswerSheet) {
    const answerPages = await renderAnswerSheetJpegs(worksheets, showLetters)
    for (const image of answerPages) {
      pdf.addPage()
      pdf.addImage(image, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
    }
  }

  addPdfAttributionToAllPages(pdf, { contentBottomMm: CONTENT_BOTTOM_MM })
  pdf.save(filename)
}
