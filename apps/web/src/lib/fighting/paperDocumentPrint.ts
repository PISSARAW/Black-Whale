import type { ArenaMap } from './arenaMap'

export function paintDocumentCanvas(
  context: CanvasRenderingContext2D,
  text: string,
  plan?: ArenaMap,
): void {
  context.fillStyle = '#f3ebd5'
  context.fillRect(0, 0, 256, 320)
  context.fillStyle = '#25222b'
  context.font = '18px sans-serif'
  text
    .match(/.{1,20}/gu)
    ?.slice(0, plan ? 3 : 12)
    .forEach((line, index) => {
      context.fillText(line, 12, 30 + index * 23, 232)
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
