import { Vector3 } from 'three'
import { BASHO_POEMS } from '../bashoPoem'
import type { BashoPose } from './bashoPose'
import { ease } from './resources'

/** Match the brush to the actual printed glyph metrics, including a lifted line return. */
export function bashoCursor(pose: BashoPose, measure: (text: string) => number) {
  const lines = BASHO_POEMS.fr.split('\n')
  let line = 0,
    chars = BASHO_POEMS.fr.length * pose.writing.progress
  while (line < 2 && chars > lines[line].length) {
    chars -= lines[line].length + 1
    line++
  }
  const index = Math.floor(Math.max(0, chars))
  const before = measure(lines[line].slice(0, index))
  const after = measure(lines[line].slice(0, index + 1))
  let x = 70 + before + (after - before) * Math.max(0, chars - index),
    y = 330 + line * 160,
    lift = 0
  if (line > 0 && chars < 0) {
    const move = ease(chars + 1)
    x = 70 + measure(lines[line - 1]) * (1 - move)
    y = 330 + (line - 1 + move) * 160
    lift = Math.sin(Math.PI * move) * 0.035
  }
  return pose.page
    .clone()
    .add(
      new Vector3((x / 768 - 0.5) * 0.36, (0.5 - y / 900) * 0.43, 0.006 + lift).applyQuaternion(
        pose.pageQ,
      ),
    )
}
