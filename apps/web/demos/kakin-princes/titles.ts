import type { Shot } from './shots'

const paper = '#f5ecda'
const gold = '#d8b684'

function lettered(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  for (const character of text) {
    ctx.fillText(character, x, y)
    x += ctx.measureText(character).width + 2.4
  }
}

export function titleCard(ctx: CanvasRenderingContext2D, progress: number) {
  const { width, height } = ctx.canvas
  ctx.fillStyle = '#171417'
  ctx.fillRect(0, 0, width, height)
  const halo = ctx.createRadialGradient(
    width * 0.5,
    height * 0.46,
    0,
    width * 0.5,
    height * 0.46,
    width * 0.41,
  )
  halo.addColorStop(0, '#4c3430')
  halo.addColorStop(1, '#171417')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  ctx.globalAlpha = Math.min(1, progress * 4)
  ctx.strokeStyle = '#927052'
  ctx.strokeRect(35, 35, width - 70, height - 70)
  ctx.strokeRect(43, 43, width - 86, height - 86)
  ctx.font = '600 20px Georgia'
  ctx.textAlign = 'center'
  ctx.fillStyle = gold
  ctx.fillText('BLACK WHALE  /  LA GUERRE DE SUCCESSION', width * 0.5, height * 0.39)
  ctx.font = '74px Georgia'
  ctx.fillStyle = paper
  ctx.fillText('Les quatorze princes de Kakin', width * 0.5, height * 0.51)
  ctx.font = '20px Georgia'
  ctx.fillStyle = gold
  ctx.fillText('D’après le manga de Yoshihiro Togashi', width * 0.5, height * 0.6)
  ctx.restore()
}

export function portraitTitle(
  ctx: CanvasRenderingContext2D,
  info: {
    shot: Shot
    index: number
    guardianKacho: boolean
  },
) {
  const { shot, index, guardianKacho } = info
  const { width, height } = ctx.canvas
  const lower = ctx.createLinearGradient(0, height * 0.62, 0, height)
  lower.addColorStop(0, '#15121500')
  lower.addColorStop(0.7, '#151215ca')
  lower.addColorStop(1, '#151215f5')
  ctx.fillStyle = lower
  ctx.fillRect(0, height * 0.62, width, height * 0.38)
  ctx.strokeStyle = '#f1d6a323'
  ctx.strokeRect(23, 23, width - 46, height - 46)

  ctx.fillStyle = gold
  ctx.font = '600 16px Arial'
  lettered(ctx, `KAKIN  /  ${String(index + 1).padStart(2, '0')}`, 55, height - 144)
  ctx.fillStyle = paper
  ctx.font = '64px Georgia'
  ctx.fillText(guardianKacho ? 'Without You' : shot.name, 51, height - 77)
  ctx.font = '19px Arial'
  ctx.fillText(
    guardianKacho
      ? 'Sous les traits de Kacho, aux côtés de Fugetsu'
      : `Suite ${1001 + index}  ·  ${shot.label}`,
    56,
    height - 45,
  )
  ctx.font = '16px Georgia'
  ctx.fillStyle = gold
  ctx.textAlign = 'right'
  ctx.fillText(guardianKacho ? 'CH. 383 · p. 16' : `CH. ${shot.source}`, width - 55, height - 47)
  ctx.textAlign = 'left'
}

export function verticalTitle(
  ctx: CanvasRenderingContext2D,
  info: { shot: Shot; index: number; guardianKacho: boolean; opening: boolean },
) {
  const { shot, index, guardianKacho, opening } = info
  const { width, height } = ctx.canvas
  const lower = ctx.createLinearGradient(0, height * 0.59, 0, height * 0.91)
  lower.addColorStop(0, '#15121500')
  lower.addColorStop(0.62, '#151215b8')
  lower.addColorStop(1, '#151215ed')
  ctx.fillStyle = lower
  ctx.fillRect(0, height * 0.59, width, height * 0.41)

  if (opening) {
    const top = ctx.createLinearGradient(0, 0, 0, height * 0.31)
    top.addColorStop(0, '#151215ef')
    top.addColorStop(1, '#15121500')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, width, height * 0.31)
    ctx.fillStyle = gold
    ctx.font = '600 24px Arial'
    lettered(ctx, 'HUNTER × HUNTER', 52, height * 0.096)
    ctx.fillStyle = paper
    ctx.font = '62px Georgia'
    ctx.fillText('Les 14 princes', 48, height * 0.154)
    ctx.fillText('de Kakin', 48, height * 0.204)
  }

  const baseline = height * 0.758
  ctx.fillStyle = gold
  ctx.font = '600 20px Arial'
  lettered(ctx, `KAKIN  /  ${String(index + 1).padStart(2, '0')}`, 52, baseline - 63)
  ctx.fillStyle = paper
  ctx.font = '58px Georgia'
  ctx.fillText(guardianKacho ? 'Without You' : shot.name, 48, baseline, width * 0.72)
  ctx.font = '25px Arial'
  ctx.fillText(
    guardianKacho ? 'Sous les traits de Kacho' : `Suite ${1001 + index}  ·  ${shot.label}`,
    52,
    baseline + 43,
    width * 0.71,
  )
}
