import { toCanvas } from 'html-to-image'

interface PostcardExportOptions {
  frame: HTMLElement
  photo: HTMLImageElement
  overlay: HTMLElement
  pixelRatio?: number
}

interface Crop {
  sx: number
  sy: number
  sw: number
  sh: number
}

function coverCrop(image: HTMLImageElement, width: number, height: number): Crop {
  const sourceRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = width / height

  if (sourceRatio > targetRatio) {
    const sw = image.naturalHeight * targetRatio
    return { sx: (image.naturalWidth - sw) / 2, sy: 0, sw, sh: image.naturalHeight }
  }

  const sh = image.naturalWidth / targetRatio
  return { sx: 0, sy: (image.naturalHeight - sh) / 2, sw: image.naturalWidth, sh }
}

function drawPhoto(
  context: CanvasRenderingContext2D,
  options: PostcardExportOptions,
  pixelRatio: number,
): void {
  const frameRect = options.frame.getBoundingClientRect()
  const photoRect = options.photo.getBoundingClientRect()
  const x = (photoRect.left - frameRect.left) * pixelRatio
  const y = (photoRect.top - frameRect.top) * pixelRatio
  const width = photoRect.width * pixelRatio
  const height = photoRect.height * pixelRatio
  const crop = coverCrop(options.photo, photoRect.width, photoRect.height)

  context.drawImage(options.photo, crop.sx, crop.sy, crop.sw, crop.sh, x, y, width, height)

  const border = getComputedStyle(options.photo)
  const borderWidth = Number.parseFloat(border.borderTopWidth) * pixelRatio
  if (borderWidth > 0) {
    context.strokeStyle = border.borderTopColor
    context.lineWidth = borderWidth
    context.strokeRect(
      x + borderWidth / 2,
      y + borderWidth / 2,
      width - borderWidth,
      height - borderWidth,
    )
  }
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  overlay: HTMLCanvasElement,
  options: PostcardExportOptions,
): void {
  const pixelRatio = options.pixelRatio ?? 2
  const frameRect = options.frame.getBoundingClientRect()
  const overlayRect = options.overlay.getBoundingClientRect()
  context.drawImage(
    overlay,
    (overlayRect.left - frameRect.left) * pixelRatio,
    (overlayRect.top - frameRect.top) * pixelRatio,
  )
}

/**
 * Composites the captured bitmap directly instead of asking an SVG
 * `foreignObject` clone to decode it. Safari and embedded Chromium can keep
 * the image element's box while dropping its pixels during that clone.
 */
export async function createPostcardBlob(options: PostcardExportOptions): Promise<Blob | null> {
  const pixelRatio = options.pixelRatio ?? 2
  const base = await toCanvas(options.frame, {
    pixelRatio,
    filter: (node) => node !== options.photo && node !== options.overlay,
  })
  const overlay = await toCanvas(options.overlay, {
    pixelRatio,
    backgroundColor: 'transparent',
  })
  const context = base.getContext('2d')
  if (!context) return null

  drawPhoto(context, options, pixelRatio)
  drawOverlay(context, overlay, options)
  return await new Promise<Blob | null>((resolve) => base.toBlob(resolve, 'image/png'))
}
