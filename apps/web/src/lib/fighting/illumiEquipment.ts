import type { ArcadeFighter, FightState } from './types'

/** Physical needles belong to the body, never to a borrowed execution identity. */
export function hasIllumiNeedles(fighter: ArcadeFighter): boolean {
  if (fighter.weaponsConfiscated) return false
  return fighter.equipment?.includes('needles') ?? (fighter.nenOwner ?? fighter.id) === 'illumi'
}

/** An explicit match loadout lets borrowers bring real needles without copying equipment. */
export function setupIllumiNeedles(state: FightState): FightState {
  const stock = state.environment.needleStock
  return {
    ...state,
    player: supply(state.player, stock?.player ?? ['illumi', 'machi'].includes(state.player.id)),
    opponent: supply(
      state.opponent,
      stock?.opponent ?? ['illumi', 'machi'].includes(state.opponent.id),
    ),
  }
}

export function preserveIllumiNeedles(
  fighter: ArcadeFighter,
  previous: ArcadeFighter,
): ArcadeFighter {
  return supply(fighter, hasIllumiNeedles(previous) && !previous.equipmentProps?.needles?.copyId)
}

function supply(fighter: ArcadeFighter, equipped: boolean): ArcadeFighter {
  if (!equipped)
    return fighter.equipment?.includes('needles')
      ? { ...fighter, equipment: fighter.equipment.filter((item) => item !== 'needles') }
      : fighter
  if (hasIllumiNeedles(fighter)) return fighter
  return { ...fighter, equipment: [...(fighter.equipment ?? []), 'needles'] }
}
