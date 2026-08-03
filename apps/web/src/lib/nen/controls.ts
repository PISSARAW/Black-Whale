/** Arena is the canonical keyboard vocabulary for Nen in every Tour mode. */
export const NEN_KEYS = {
  ten: 'KeyT',
  ren: 'KeyR',
  zetsu: 'KeyX',
  gyo: 'KeyG',
  in: 'KeyI',
  ken: 'KeyK',
  ryuDown: 'Minus',
  ryuUp: 'Equal',
  ko: 'KeyC',
  action: 'KeyF',
  hatsu: 'KeyH',
  on: 'KeyO',
  en: 'KeyN',
  shu: 'KeyU',
} as const

export const NEN_ZONE_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'] as const

const NEN_CONTROL_CODES = new Set<string>([...Object.values(NEN_KEYS), ...NEN_ZONE_KEYS])

/** Mode listeners use this to leave every Nen input to the shared controller. */
export const isNenControlCode = (code: string) => NEN_CONTROL_CODES.has(code)

export function nenZoneIndex(code: string): number | null {
  const index = NEN_ZONE_KEYS.indexOf(code as (typeof NEN_ZONE_KEYS)[number])
  return index < 0 ? null : index
}

export type NenBodyZone = 'head' | 'torso' | 'hands' | 'feet'

/** Builds a complete two-sided Ryu split while keeping the chosen zone exact. */
export function ryuDistribution(zone: NenBodyZone, share: number) {
  const focused = Math.max(0.1, Math.min(0.9, share))
  const reserve: NenBodyZone = zone === 'torso' ? 'hands' : 'torso'
  return { [zone]: focused, [reserve]: 1 - focused }
}
