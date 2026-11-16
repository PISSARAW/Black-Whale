import type { Texture } from 'three'
import type { SceneryKit } from './stageKit'
import type { HumanProfile } from '../tour/humanProfiles'
import { BACKGROUND_GLYPHS } from './stageBackgroundGlyphs'
import type { StageBackgroundDefinition } from './stageBackgroundTypes'
import type { BackgroundMedium } from './stageBackgroundSceneTypes'

interface ArtOptions {
  image: StageBackgroundDefinition['image']
  accent: string
  medium: BackgroundMedium
  portrait: { profile: HumanProfile; name: string }
}
const cssColour = (colour: number) => `#${colour.toString(16).padStart(6, '0')}`

function drawPortrait(ctx: CanvasRenderingContext2D, options: ArtOptions): void {
  const { profile, name } = options.portrait
  ctx.fillStyle = '#28343b'
  ctx.fillRect(0, 0, 512, 640)
  ctx.fillStyle = cssColour(profile.jacket)
  ctx.beginPath()
  ctx.ellipse(256, 526, 166, 188, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = cssColour(profile.shirt)
  ctx.beginPath()
  ctx.moveTo(212, 383)
  ctx.lineTo(256, 488)
  ctx.lineTo(300, 383)
  ctx.fill()
  ctx.fillStyle = cssColour(profile.skin)
  ctx.fillRect(225, 300, 62, 106)
  ctx.beginPath()
  ctx.ellipse(256, 245, 93, 122, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = cssColour(profile.hair)
  ctx.beginPath()
  ctx.ellipse(256, 168, 98, 60, 0, Math.PI, Math.PI * 2)
  ctx.lineTo(354, 235)
  ctx.lineTo(305, 170)
  ctx.lineTo(164, 230)
  ctx.fill()
  ctx.fillStyle = '#152027'
  for (const x of [220, 292]) {
    ctx.beginPath()
    ctx.ellipse(x, 245, 8, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = '#563c3b'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(239, 308)
  ctx.lineTo(273, 308)
  ctx.stroke()
  ctx.fillStyle = options.accent
  ctx.fillRect(32, 563, 448, 45)
  ctx.fillStyle = '#17232c'
  ctx.textAlign = 'center'
  ctx.font = '700 22px sans-serif'
  ctx.fillText(name.toUpperCase(), 256, 593, 410)
}
function drawGlyph(ctx: CanvasRenderingContext2D, options: ArtOptions): void {
  ctx.strokeStyle = options.accent
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(BACKGROUND_GLYPHS[options.image.motif]))
}
function drawPoster(ctx: CanvasRenderingContext2D, options: ArtOptions): void {
  ctx.fillStyle = '#101921'
  ctx.fillRect(0, 0, 512, 640)
  ctx.strokeStyle = options.accent
  ctx.lineWidth = 3
  ctx.strokeRect(18, 18, 476, 604)
  ctx.fillStyle = options.accent
  ctx.font = '700 30px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(options.image.headline, 256, 78, 442)
  ctx.font = '14px sans-serif'
  ctx.fillText(options.image.subline, 256, 111, 430)
  ctx.save()
  ctx.translate(76, 157)
  ctx.scale(3.6, 3.6)
  drawGlyph(ctx, options)
  ctx.restore()
  for (let i = 0; i < 14; i++) {
    ctx.beginPath()
    ctx.arc(61 + i * 30, 548, i === 13 ? 4 : 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.font = '700 26px monospace'
  ctx.fillText(options.image.code, 256, 594)
}
function drawMonitor(ctx: CanvasRenderingContext2D, options: ArtOptions): void {
  ctx.fillStyle = '#11262c'
  ctx.fillRect(0, 0, 512, 640)
  ctx.fillStyle = options.accent
  ctx.font = '700 42px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('CLASH · LIVE', 256, 95)
  ctx.save()
  ctx.translate(106, 150)
  ctx.scale(3, 3)
  drawGlyph(ctx, options)
  ctx.restore()
  ctx.font = '700 58px monospace'
  ctx.fillText(options.image.code, 256, 562)
}
function drawArt(canvas: HTMLCanvasElement, options: ArtOptions): void {
  const ctx = canvas.getContext('2d')!
  const painters: Record<BackgroundMedium, () => void> = {
    poster: () => drawPoster(ctx, options),
    portrait: () => drawPortrait(ctx, options),
    monitor: () => drawMonitor(ctx, options),
    graffiti: () => {
      ctx.translate(26, 80)
      ctx.scale(4.6, 4.6)
      drawGlyph(ctx, options)
    },
    'floor-mark': () => {
      ctx.translate(26, 80)
      ctx.scale(4.6, 4.6)
      drawGlyph(ctx, options)
    },
  }
  painters[options.medium]()
}

export function backgroundArt(kit: SceneryKit, options: ArtOptions): Texture {
  const { THREE } = kit
  if (typeof document === 'undefined') {
    const pixel = new THREE.DataTexture(new Uint8Array([180, 158, 103, 255]), 1, 1)
    pixel.needsUpdate = true
    return pixel
  }
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  drawArt(canvas, options)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
