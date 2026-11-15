/** First chapter where Strategy may expose each adapted Hatsu. */
export const STRATEGY_ABILITY_REVEAL_CHAPTER: Readonly<Record<string, number>> = {
  'emperor-time': 340,
  'steal-chain': 340,
  'chain-jail': 340,
  'dowsing-chain': 340,
  'benjamin-aura': 359,
  'benjamin-baton': 363,
  'air-blow': 363,
  'secret-window': 363,
  'little-eye': 369,
  'cats-name': 373,
  contagion: 378,
  erigeron: 388,
  'biohazard-hinrigh': 391,
  culdcept: 411,
}

export function abilitiesRevealedByChapter(
  abilityIds: readonly string[],
  chapterNumber: number,
): string[] {
  return abilityIds.filter(
    (abilityId) =>
      (STRATEGY_ABILITY_REVEAL_CHAPTER[abilityId] ?? Number.POSITIVE_INFINITY) <= chapterNumber,
  )
}
