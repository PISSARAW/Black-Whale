import type { FighterId } from './types'
import type { ArenaTechnique } from './arenaTechniqueTypes'
import { FIRST_ARENA_TECHNIQUES } from './arenaTechniquesFirst'
import { SECOND_ARENA_TECHNIQUES } from './arenaTechniquesSecond'
export type { ArenaTechnique } from './arenaTechniqueTypes'

/** Applications of existing abilities; the names are duel labels, not new manga Hatsu. */
export const ARENA_TECHNIQUES: Partial<Record<FighterId, ArenaTechnique>> = {
  ...FIRST_ARENA_TECHNIQUES,
  ...SECOND_ARENA_TECHNIQUES,
}

export function arenaTechnique(id: FighterId): ArenaTechnique | undefined {
  return ARENA_TECHNIQUES[id]
}
