import { ease } from './resources'

export const MIZAISTOM_TIMING = {
  warnings: [42, 258],
  violations: [144, 300],
  releases: [234, 390],
  hits: [236, 392],
  fall: 394,
  panel: 414,
  portrait: 486,
} as const

export function mizaistomBeat(age: number) {
  const start = age >= 258 ? 300 : 144
  const end = start + 90
  const warning = age >= 42 && (age < 234 || (age >= 258 && age < 390))
  const confined = age >= start && age < end
  const flip = ease((age - start + 10) / 10) * (1 - ease((age - end) / 18))
  const strike = MIZAISTOM_TIMING.hits.reduce(
    (value, hit) => Math.max(value, ease((age - hit + 22) / 22) * (1 - ease((age - hit) / 22))),
    0,
  )
  return {
    warning,
    confined,
    flip,
    strike,
    confinementStart: start,
    confinementEnd: end,
    hits: MIZAISTOM_TIMING.hits.filter((hit) => age >= hit).length,
  }
}
