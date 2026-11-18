export const LYNCH_CONTACTS = [132, 246, 318, 330, 342, 354, 396] as const
export const LYNCH_TIMING = { question: 24, barrage: 318, final: 396, fall: 397, portrait: 480 }

export function lynchBeat(age: number) {
  let index = 0
  for (let i = 0; i < LYNCH_CONTACTS.length; i++)
    if (age >= LYNCH_CONTACTS[i] - (i > 1 && i < 6 ? 6 : 24)) index = i
  const contact = LYNCH_CONTACTS[index]
  const rapid = index > 1 && index < 6
  const wind = rapid ? 6 : 24
  const recovery = rapid ? 6 : 24
  const delta = age - contact
  const t = Math.max(0, Math.min(1, delta < 0 ? (delta + wind) / wind : 1 - delta / recovery))
  return {
    index,
    contact,
    side: index % 2 ? ('left' as const) : ('right' as const),
    extension: t * t * (3 - 2 * t),
    delta,
  }
}
