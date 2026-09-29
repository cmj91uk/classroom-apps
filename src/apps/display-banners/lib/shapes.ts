export type BannerShapeId =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'oval'
  | 'cloud'
  | 'star'
  | 'speech-bubble'

export type BannerShape = {
  id: BannerShapeId
  label: string
  description: string
}

export const BANNER_SHAPES: BannerShape[] = [
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Straight-edged poster',
  },
  {
    id: 'rounded-rectangle',
    label: 'Rounded rectangle',
    description: 'Soft corners',
  },
  {
    id: 'oval',
    label: 'Oval',
    description: 'Ellipse that fills the slot',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    description: 'Full outline cloud',
  },
  {
    id: 'star',
    label: 'Star',
    description: 'Five-point star',
  },
  {
    id: 'speech-bubble',
    label: 'Speech bubble',
    description: 'Rounded bubble with pointer tail',
  },
]

export const DEFAULT_SHAPE_ID: BannerShapeId = 'rounded-rectangle'

export function getBannerShape(id: string): BannerShape {
  return (
    BANNER_SHAPES.find((shape) => shape.id === id) ?? BANNER_SHAPES[1]!
  )
}

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Full outline cloud (sketch-style puffs + a complete belly).
 * Coordinates sit in a 240×140 viewBox.
 */
export const CLOUD_VIEWBOX = { width: 250, height: 140 }
export const CLOUD_PATH =
  'M 42 112 C 18 112 8 92 16 74 C 4 66 8 40 34 38 C 38 16 64 4 90 16 C 104 4 128 2 148 16 C 168 4 200 10 210 36 C 230 38 242 58 232 76 C 246 86 242 110 216 114 C 206 128 176 132 156 120 C 138 132 110 132 90 120 C 68 132 50 126 42 112 Z'

const STAR_INNER_RATIO = 0.4

export function starPathD(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number = outerR * STAR_INNER_RATIO,
  points = 5,
): string {
  const step = Math.PI / points
  let angle = -Math.PI / 2
  const coords: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    coords.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    angle += step
  }
  return `${coords.join(' ')} Z`
}

export function speechBubbleTailHeight(bounds: Rect): number {
  return Math.min(bounds.height * 0.22, Math.max(12, bounds.height * 0.16))
}

export function speechBubblePathD(bounds: Rect): string {
  const tailHeight = speechBubbleTailHeight(bounds)
  const bodyHeight = Math.max(1, bounds.height - tailHeight)
  const r = Math.min(
    bounds.width / 2,
    bodyHeight / 2,
    Math.min(bounds.width, bodyHeight) * 0.22,
  )

  const minTailLeft = bounds.x + r + 2
  const maxTailRight = bounds.x + bounds.width - r - 2
  const preferredTailLeft = bounds.x + Math.max(r * 0.8, bounds.width * 0.18)
  const tailLeftX = Math.min(
    maxTailRight - 10,
    Math.max(minTailLeft, preferredTailLeft),
  )
  const preferredTailWidth = Math.min(
    bounds.width * 0.18,
    Math.max(tailHeight * 1.1, 16),
  )
  const tailWidth = Math.max(
    8,
    Math.min(preferredTailWidth, maxTailRight - tailLeftX),
  )
  const tailRightX = tailLeftX + tailWidth

  const tailTipX =
    bounds.x + Math.max(4, Math.min(tailLeftX - 4, bounds.width * 0.08))
  const tailTipY = bounds.y + bounds.height

  const cp1x = tailRightX - tailWidth * 0.2
  const cp1y = bounds.y + bodyHeight + tailHeight * 0.5
  const cp2x = tailLeftX
  const cp2y = bounds.y + bodyHeight + tailHeight * 0.6

  return [
    `M ${(bounds.x + r).toFixed(2)} ${bounds.y.toFixed(2)}`,
    `L ${(bounds.x + bounds.width - r).toFixed(2)} ${bounds.y.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(bounds.x + bounds.width).toFixed(2)} ${(bounds.y + r).toFixed(2)}`,
    `L ${(bounds.x + bounds.width).toFixed(2)} ${(bounds.y + bodyHeight - r).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(bounds.x + bounds.width - r).toFixed(2)} ${(bounds.y + bodyHeight).toFixed(2)}`,
    `L ${tailRightX.toFixed(2)} ${(bounds.y + bodyHeight).toFixed(2)}`,
    `Q ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${tailTipX.toFixed(2)} ${tailTipY.toFixed(2)}`,
    `Q ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${tailLeftX.toFixed(2)} ${(bounds.y + bodyHeight).toFixed(2)}`,
    `L ${(bounds.x + r).toFixed(2)} ${(bounds.y + bodyHeight).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${bounds.x.toFixed(2)} ${(bounds.y + bodyHeight - r).toFixed(2)}`,
    `L ${bounds.x.toFixed(2)} ${(bounds.y + r).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(bounds.x + r).toFixed(2)} ${bounds.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function containRect(
  frame: Rect,
  contentWidth: number,
  contentHeight: number,
): Rect {
  const scale = Math.min(
    frame.width / contentWidth,
    frame.height / contentHeight,
  )
  const width = contentWidth * scale
  const height = contentHeight * scale
  return {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + (frame.height - height) / 2,
    width,
    height,
  }
}

/** Padding inside a page slot before the shape is drawn. */
export function insetRect(rect: Rect, fraction: number): Rect {
  const padX = rect.width * fraction
  const padY = rect.height * fraction
  return {
    x: rect.x + padX,
    y: rect.y + padY,
    width: Math.max(0, rect.width - padX * 2),
    height: Math.max(0, rect.height - padY * 2),
  }
}

export function getShapeBounds(shapeId: BannerShapeId, frame: Rect): Rect {
  if (shapeId === 'star') {
    const size = Math.min(frame.width, frame.height)
    return containRect(frame, size, size)
  }
  if (shapeId === 'cloud') {
    return containRect(frame, CLOUD_VIEWBOX.width, CLOUD_VIEWBOX.height)
  }
  return frame
}

/** Inner box used to fit text, relative to the drawn shape. */
export function getTextBox(shapeId: BannerShapeId, shapeBounds: Rect): Rect {
  if (shapeId === 'speech-bubble') {
    const tailHeight = speechBubbleTailHeight(shapeBounds)
    const bodyHeight = Math.max(0, shapeBounds.height - tailHeight)
    const padX = shapeBounds.width * 0.12
    const padY = bodyHeight * 0.14
    return {
      x: shapeBounds.x + padX,
      y: shapeBounds.y + padY,
      width: Math.max(0, shapeBounds.width - padX * 2),
      height: Math.max(0, bodyHeight - padY * 2),
    }
  }

  const inset =
    shapeId === 'star'
      ? 0.32
      : shapeId === 'oval'
        ? 0.2
        : shapeId === 'cloud'
          ? 0.18
          : shapeId === 'rounded-rectangle'
            ? 0.1
            : 0.08

  const padX = shapeBounds.width * inset
  const padY =
    shapeId === 'cloud'
      ? shapeBounds.height * 0.22
      : shapeBounds.height * inset

  return {
    x: shapeBounds.x + padX,
    y: shapeBounds.y + padY,
    width: Math.max(0, shapeBounds.width - padX * 2),
    height: Math.max(0, shapeBounds.height - padY * 2),
  }
}

export function roundedRectRadius(bounds: Rect): number {
  return Math.min(bounds.width, bounds.height) * 0.14
}

export function shapeStrokeWidth(bounds: Rect): number {
  return Math.max(1.5, Math.min(bounds.width, bounds.height) * 0.038)
}

export function insetRectBy(rect: Rect, amount: number): Rect {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: Math.max(0, rect.width - amount * 2),
    height: Math.max(0, rect.height - amount * 2),
  }
}

function strokeAttrs(color: string, strokeWidth: number): string {
  return `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`
}

export function strokeBannerShape(
  ctx: CanvasRenderingContext2D,
  shapeId: BannerShapeId,
  bounds: Rect,
  color: string,
): void {
  const strokeWidth = shapeStrokeWidth(bounds)
  const inner = insetRectBy(bounds, strokeWidth / 2)

  ctx.strokeStyle = color
  ctx.lineWidth = strokeWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  if (shapeId === 'rectangle') {
    ctx.beginPath()
    ctx.rect(inner.x, inner.y, inner.width, inner.height)
    ctx.stroke()
    return
  }

  if (shapeId === 'rounded-rectangle') {
    ctx.beginPath()
    ctx.roundRect(
      inner.x,
      inner.y,
      inner.width,
      inner.height,
      roundedRectRadius(inner),
    )
    ctx.stroke()
    return
  }

  if (shapeId === 'oval') {
    ctx.beginPath()
    ctx.ellipse(
      inner.x + inner.width / 2,
      inner.y + inner.height / 2,
      inner.width / 2,
      inner.height / 2,
      0,
      0,
      Math.PI * 2,
    )
    ctx.stroke()
    return
  }

  if (shapeId === 'star') {
    ctx.stroke(
      new Path2D(
        starPathD(
          inner.x + inner.width / 2,
          inner.y + inner.height / 2,
          inner.width / 2,
        ),
      ),
    )
    return
  }

  if (shapeId === 'speech-bubble') {
    ctx.stroke(new Path2D(speechBubblePathD(inner)))
    return
  }

  const scale = Math.min(
    inner.width / CLOUD_VIEWBOX.width,
    inner.height / CLOUD_VIEWBOX.height,
  )
  const drawnWidth = CLOUD_VIEWBOX.width * scale
  const drawnHeight = CLOUD_VIEWBOX.height * scale
  const originX = inner.x + (inner.width - drawnWidth) / 2
  const originY = inner.y + (inner.height - drawnHeight) / 2
  ctx.save()
  ctx.translate(originX, originY)
  ctx.scale(scale, scale)
  ctx.lineWidth = strokeWidth / scale
  ctx.stroke(new Path2D(CLOUD_PATH))
  ctx.restore()
}

export function bannerShapeSvg(
  shapeId: BannerShapeId,
  bounds: Rect,
  color: string,
): string {
  const strokeWidth = shapeStrokeWidth(bounds)
  const inner = insetRectBy(bounds, strokeWidth / 2)

  if (shapeId === 'rectangle') {
    return `<rect x="${inner.x}" y="${inner.y}" width="${inner.width}" height="${inner.height}" ${strokeAttrs(color, strokeWidth)} />`
  }

  if (shapeId === 'rounded-rectangle') {
    const r = roundedRectRadius(inner)
    return `<rect x="${inner.x}" y="${inner.y}" width="${inner.width}" height="${inner.height}" rx="${r}" ry="${r}" ${strokeAttrs(color, strokeWidth)} />`
  }

  if (shapeId === 'oval') {
    return `<ellipse cx="${inner.x + inner.width / 2}" cy="${inner.y + inner.height / 2}" rx="${inner.width / 2}" ry="${inner.height / 2}" ${strokeAttrs(color, strokeWidth)} />`
  }

  if (shapeId === 'star') {
    return `<path d="${starPathD(inner.x + inner.width / 2, inner.y + inner.height / 2, inner.width / 2)}" ${strokeAttrs(color, strokeWidth)} />`
  }

  if (shapeId === 'speech-bubble') {
    return `<path d="${speechBubblePathD(inner)}" ${strokeAttrs(color, strokeWidth)} />`
  }

  const scale = Math.min(
    inner.width / CLOUD_VIEWBOX.width,
    inner.height / CLOUD_VIEWBOX.height,
  )
  const drawnWidth = CLOUD_VIEWBOX.width * scale
  const drawnHeight = CLOUD_VIEWBOX.height * scale
  const originX = inner.x + (inner.width - drawnWidth) / 2
  const originY = inner.y + (inner.height - drawnHeight) / 2
  return `<g transform="translate(${originX} ${originY}) scale(${scale})"><path d="${CLOUD_PATH}" ${strokeAttrs(color, strokeWidth / scale)} /></g>`
}
