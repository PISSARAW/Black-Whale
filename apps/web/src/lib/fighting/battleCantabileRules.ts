import { voluntaryNenAvailable } from './nenAccess'
import { chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { musicPacifies, melodyRestrictsCombat } from './melodyRules'
import { BATTLE_MOVES } from './battleCantabileTypes'
import type { ArcadeFighter, AttackKind, FighterId } from './types'

export function battleNenAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { requireReserve: true })
}

/** Copying the Hatsu supplies neither the Gyudondond's body holes nor a learned model. */
export function battleBodyAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'bonolenov' &&
    !fighter.kurapika &&
    (fighter.nenOwner ?? fighter.id) === 'bonolenov'
  )
}

export function dolphinMissingBattleBody(fighter: ArcadeFighter): boolean {
  return fighter.kurapika?.held?.source === 'bonolenov' && !battleBodyAvailable(fighter)
}

export function battleTechniqueAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  return (
    battleBodyAvailable(fighter) &&
    battleNenAvailable(fighter) &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    !chainAbilitySealed(fighter, moveId)
  )
}

export function battleMindAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    !fighter.hanzoProjection &&
    !musicPacifies(fighter) &&
    ![
      fighter.hatsuEffects.manipulatedFrames,
      Number(Boolean(fighter.needlePuppet)),
      fighter.hatsuEffects.possessedFrames,
      fighter.hatsuEffects.momozeFrames,
    ].some((value) => value > 0)
  )
}

export function battlePreparing(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.battleCantabile?.preparation)
}

export function battleCombatBusy(fighter: ArcadeFighter): boolean {
  return battlePreparing(fighter) || melodyRestrictsCombat(fighter)
}

export function battleRangedAvailable(fighter: ArcadeFighter): boolean | null {
  if (fighter.id !== 'bonolenov') return null
  return (
    battleTechniqueAvailable(fighter, BATTLE_MOVES.jupiter) &&
    battleMindAvailable(fighter) &&
    !battlePreparing(fighter) &&
    !fighter.attack &&
    fighter.aura >= 55
  )
}

export function battleAppearance(fighter: ArcadeFighter): FighterId {
  return (
    fighter.chrolloHistorical?.appearance?.model ??
    fighter.battleCantabile?.form?.model ??
    fighter.id
  )
}

export function battleCommand(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): string | null {
  if (fighter.id === 'bonolenov') {
    if (kind === 'ranged') return BATTLE_MOVES.jupiter
    return kind === 'special' ? (moveId ?? BATTLE_MOVES.prologue) : null
  }
  if (moveId?.startsWith('bonolenov:')) return moveId
  return kind === 'special' && chrolloPageForMove(fighter, moveId) === 'bonolenov'
    ? BATTLE_MOVES.prologue
    : null
}

/** In-place dance is vulnerable. A deliberate guard, jump or step ends it. */
export function battleInput(
  fighter: ArcadeFighter,
  input: import('./types').FightInput,
): ArcadeFighter {
  if (!fighter.battleCantabile) return fighter
  if (fighter.battleCantabile.form) return fighter
  const interrupted =
    input.guard || input.jump || (battlePreparing(fighter) && (input.left || input.right))
  return interrupted ? stopBattleMusic(fighter) : fighter
}

export function stopBattleMusic(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.battleCantabile) return fighter
  return {
    ...fighter,
    battleCantabile: { ...fighter.battleCantabile, preparation: null, prologue: false, form: null },
  }
}
