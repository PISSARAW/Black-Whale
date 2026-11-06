interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/** Fit the complete drawing without changing the shared coordinates used by the markers. */
export function fittedMapTransform(options: {
  viewport: { width: number; height: number }
  viewBox: Rectangle
  drawing: Rectangle
}) {
  const { viewport, viewBox, drawing } = options
  if (!viewport.width || !viewport.height || !viewBox.width || !viewBox.height) {
    return { x: 0, y: 0, scale: 1 }
  }
  const svgScale = Math.min(viewport.width / viewBox.width, viewport.height / viewBox.height)
  const width = Math.max(drawing.width * svgScale, 1)
  const height = Math.max(drawing.height * svgScale, 1)
  const scale = Math.min(
    5,
    Math.max(0.5, 0.88 * Math.min(viewport.width / width, viewport.height / height)),
  )
  const left = (viewport.width - viewBox.width * svgScale) / 2
  const top = (viewport.height - viewBox.height * svgScale) / 2
  const centerX = left + (drawing.x - viewBox.x + drawing.width / 2) * svgScale
  const centerY = top + (drawing.y - viewBox.y + drawing.height / 2) * svgScale
  return {
    x: viewport.width / 2 - centerX * scale,
    y: viewport.height / 2 - centerY * scale,
    scale,
  }
}
