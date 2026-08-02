/** Arena is the canonical keyboard vocabulary for Nen in every Tour mode. */
export const NEN_KEYS = {
  ten: 'KeyT', ren: 'KeyR', zetsu: 'KeyX', gyo: 'KeyG', in: 'KeyI', ken: 'KeyK',
  ryuDown: 'Minus', ryuUp: 'Equal', ko: 'KeyC', action: 'KeyF', hatsu: 'KeyH',
  on: 'KeyO', en: 'KeyN', shu: 'KeyU',
} as const

export const NEN_ZONE_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'] as const

export function nenZoneIndex(code: string): number | null {
  const index = NEN_ZONE_KEYS.indexOf(code as (typeof NEN_ZONE_KEYS)[number])
  return index < 0 ? null : index
}
