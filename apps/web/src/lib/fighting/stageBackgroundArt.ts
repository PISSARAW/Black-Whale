import type { Texture } from 'three'
import type { SceneryKit } from './stageKit'
import { BACKGROUND_GLYPHS } from './stageBackgroundGlyphs'
import type { StageBackgroundDefinition } from './stageBackgroundTypes'

function drawArt(
  canvas: HTMLCanvasElement,
  image: StageBackgroundDefinition['image'],
  accent: string,
): void {
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#101921'
  ctx.fillRect(0, 0, 512, 640)
  ctx.strokeStyle = accent
  ctx.lineWidth = 3
  ctx.strokeRect(18, 18, 476, 604)
  ctx.fillStyle = accent
  ctx.font = '700 30px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(image.headline, 256, 78, 442)
  ctx.font = '14px sans-serif'
  ctx.fillText(image.subline, 256, 111, 430)
  ctx.save()
  ctx.translate(76, 157)
  ctx.scale(3.6, 3.6)
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(BACKGROUND_GLYPHS[image.motif]))
  ctx.restore()
  // Fourteen tiny points link every print to the succession voyage.
  for (let i = 0; i < 14; i++) {
    ctx.beginPath()
    ctx.arc(61 + i * 30, 548, i === 13 ? 4 : 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.font = '700 26px monospace'
  ctx.fillText(image.code, 256, 594)
}

export function backgroundArt(
  kit: SceneryKit,
  image: StageBackgroundDefinition['image'],
  accent: string,
): Texture {
  const { THREE } = kit
  if (typeof document === 'undefined') {
    const pixel = new THREE.DataTexture(new Uint8Array([180, 158, 103, 255]), 1, 1)
    pixel.needsUpdate = true
    return pixel
  }
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  drawArt(canvas, image, accent)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
