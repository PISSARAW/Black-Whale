import type { ArenaMap } from './arenaMap'

export function paintDocumentCanvas(
  context: CanvasRenderingContext2D,
  text: string,
  plan?: ArenaMap,
): void {
  context.fillStyle = '#f3ebd5'
  context.fillRect(0, 0, 256, 320)
  context.fillStyle = '#25222b'
  const compact = !plan && text.length > 240
  context.font = compact ? '10px sans-serif' : '18px sans-serif'
  const width = compact ? 44 : 20
  const lines = text
    .split('\n')
    .flatMap((line) => line.match(new RegExp(`.{1,${width}}`, 'gu')) ?? [''])
  lines.slice(0, plan ? 3 : compact ? 30 : 12).forEach((line, index) => {
    context.fillText(line, 12, (compact ? 17 : 30) + index * (compact ? 10 : 23), 232)
  })
  if (plan) paintArenaPlan(context, plan)
}

function paintArenaPlan(context: CanvasRenderingContext2D, plan: ArenaMap): void {
  context.strokeStyle = '#6c6250'
  context.lineWidth = 2
  context.strokeRect(14, 105, 228, 170)
  context.beginPath()
  for (const x of [71, 128, 185]) {
    context.moveTo(x, 105)
    context.lineTo(x, 275)
  }
  context.moveTo(14, 190)
  context.lineTo(242, 190)
  context.stroke()
  context.font = '14px sans-serif'
  context.fillText(`${plan.left} · gauche`, 14, 298)
  context.fillText(`${plan.right} · droite`, 160, 298)
}
