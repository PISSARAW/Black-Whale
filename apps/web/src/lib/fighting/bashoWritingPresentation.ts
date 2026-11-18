import { BASHO_WRITING_FRAMES } from './bashoPoem'
import type { BashoPoem } from './bashoPoem'
import type { Object3D } from 'three'

/** Render only the composition already accepted by the engine, at its actual writing progress. */
export function bashoInk(poem: BashoPoem) {
  const progress = poem.ready
    ? 1
    : Math.max(0, Math.min(1, 1 - poem.writingFrames / BASHO_WRITING_FRAMES))
  const chars = Array.from(poem.text)
  const count = Math.floor(chars.length * progress)
  const lines = chars.slice(0, count).join('').split('\n')
  return { progress, lines: ['GREAT HIKER', ...lines] }
}
export function poseBashoPen(pen: Object3D, poem: BashoPoem, reduced: boolean) {
  const { progress, lines } = bashoInk(poem)
  const line = Math.min(2, lines.length - 2)
  const full = Array.from(poem.text.split('\n')[line] ?? '').length
  const along = Array.from(lines.at(-1) ?? '').length / Math.max(1, full)
  pen.visible = poem.writingFrames > 0
  pen.position.set(
    reduced ? 0.15 : -0.36 + along * 0.56,
    reduced ? 0.205 : 0.205 - line * 0.059,
    0.04,
  )
  pen.rotation.set(0, 0, reduced ? -0.4 : -0.4 + Math.sin(progress * Math.PI * 24) * 0.08)
  pen.userData.progress = progress
}
