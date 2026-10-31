import { waitForFont } from '../../../lib/fonts'
import { textStrokeForContrast } from './colors'
import {
  getShapeBounds,
  getTextBox,
  insetRect,
  strokeBannerShape,
  type BannerShapeId,
} from './shapes'
import {
  BANNER_FONT_WEIGHT,
  BANNER_LINE_HEIGHT,
  layoutBannerText,
} from './text'

export type RenderBannerTransparentOptions = {
  text: string
  shapeId: BannerShapeId
  fontFamily: string
  shapeColor: string
  textColor: string
  width?: number
  height?: number
}

const DEFAULT_BANNER_WIDTH = 1200
const DEFAULT_BANNER_HEIGHT = 800

/**
 * Renders the banner shape and text directly onto a canvas with a transparent background.
 * Unlike the PDF rendering, no background rectangle is drawn.
 */
export async function renderBannerTransparentBlob({
  text,
  shapeId,
  fontFamily,
  shapeColor,
  textColor,
  width = DEFAULT_BANNER_WIDTH,
  height = DEFAULT_BANNER_HEIGHT,
}: RenderBannerTransparentOptions): Promise<Blob> {
  await waitForFont(fontFamily)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not available')
  }

  // Ensure transparent background (clear any default pixels)
  ctx.clearRect(0, 0, width, height)

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

  if (layout.lines.length > 0 && layout.fontSize > 0) {
    const stroke = textStrokeForContrast(textColor)
    const totalHeight =
      layout.lines.length * layout.fontSize * BANNER_LINE_HEIGHT
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

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to generate image blob from canvas.'))
      }
    }, 'image/png')
  })
}

/**
 * Copies the current banner shape and text with a transparent background to the clipboard as a PNG image.
 */
export async function copyBannerToClipboard(
  options: RenderBannerTransparentOptions,
): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Clipboard API is not supported in this browser.')
  }

  if (typeof ClipboardItem === 'undefined') {
    throw new Error('ClipboardItem is not supported in this browser.')
  }

  const blob = await renderBannerTransparentBlob(options)
  const clipboardItem = new ClipboardItem({
    'image/png': blob,
  })

  await navigator.clipboard.write([clipboardItem])
}
