import { ease } from './resources'
import { BASHO_POEMS } from '../bashoPoem'

export const BASHO_CONTACTS = [216, 300, 384] as const
export const BASHO_TIMING = {
  written: 144,
  pocket: 174,
  first: 216,
  second: 300,
  last: 384,
  collapse: 420,
  read: 486,
}
export function bashoBeat(age: number) {
  let contact: number = BASHO_CONTACTS[0]
  for (const at of BASHO_CONTACTS) if (age >= at - 24) contact = at
  const delta = age - contact
  const extension = delta < 0 ? ease((delta + 24) / 24) : 1 - ease(delta / 24)
  return { contact, delta, extension, impacts: BASHO_CONTACTS.filter((at) => age >= at).length }
}
export function bashoWriting(age: number) {
  const progress = ease(age / 144),
    lines = BASHO_POEMS.fr.split('\n')
  let line = 0,
    chars = BASHO_POEMS.fr.length * progress
  while (line < 2 && chars > lines[line].length) {
    chars -= lines[line].length + 1
    line++
  }
  const along = Math.max(0, Math.min(1, chars / lines[line].length))
  let x = -0.12 + along * 0.24,
    y = 0.06 - line * 0.077,
    lift = 0
  if (line > 0 && chars < 0) {
    const move = ease(chars + 1)
    x = 0.12 - move * 0.24
    y = 0.06 - (line - 1 + move) * 0.077
    lift = Math.sin(Math.PI * move) * 0.035
  }
  return { progress, line, along, x, y, lift }
}
