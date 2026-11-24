import { abilityPower } from './nenAbility'
import { freeCombatBody } from './fightActorState'
import {
  battleBodyAvailable,
  battleMindAvailable,
  battleTechniqueAvailable,
  stopBattleMusic,
} from './battleCantabileRules'
import { BATTLE_MOVES, JUPITER_RADIUS } from './battleCantabileTypes'
import { unwrapBonolenovInstrument } from './bonolenovInstrument'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Validate after impacts too: a broken dance has no free grace frame. */
export function reconcileBattleCantabile(state: FightState): FightState {
  return (['player', 'opponent'] as const).reduce((next, side) => {
    const fighter = next[side]
    if (!fighter.battleCantabile) return next
    if (state.phase !== 'fighting' || !battleValid(fighter))
      return {
        ...next,
        [side]: stopBattleMusic(fighter),
        projectiles: next.projectiles.filter((shot) => !(shot.owner === side && shot.jupiter)),
      }
    return next
  }, state)
}

function battleValid(fighter: ArcadeFighter): boolean {
  if (fighter.battleCantabile?.form)
    return battleTechniqueAvailable(fighter, BATTLE_MOVES.metamorphosen)
  const dance = fighter.battleCantabile?.preparation
  const move = dance ? BATTLE_MOVES[dance.piece] : undefined
  if (!dance && fighter.battleCantabile?.prologue)
    return (
      fighter.health > 0 && battleTechniqueAvailable(fighter) && battleMindAvailable(fighter, true)
    )
  return (
    freeCombatBody(fighter) &&
    battleTechniqueAvailable(fighter, move) &&
    battleMindAvailable(fighter) &&
    !fighter.blocking &&
    fighter.y === 0
  )
}

export function advanceBattleCantabile(state: FightState): FightState {
  let next = reconcileBattleCantabile(state)
  for (const side of ['player', 'opponent'] as const) next = advancePiece(next, side)
  return next
}

function advancePiece(state: FightState, side: FightSide): FightState {
  const fighter = state.phase === 'fighting' ? unwrapBonolenovInstrument(state[side]) : state[side]
  if (fighter !== state[side]) state = { ...state, [side]: fighter }
  const battle = fighter.battleCantabile
  if (!battle || !battleBodyAvailable(fighter)) return state
  const preparation = battle.preparation
  if (preparation) {
    if (preparation.remaining > 1)
      return {
        ...state,
        [side]: {
          ...fighter,
          battleCantabile: {
            ...battle,
            preparation: { ...preparation, remaining: preparation.remaining - 1 },
          },
        },
      }
    return finishPiece(state, side)
  }
  if (battle.form) {
    const remaining = battle.form.remaining - 1
    return {
      ...state,
      [side]: {
        ...fighter,
        battleCantabile: { ...battle, form: remaining > 0 ? { ...battle.form, remaining } : null },
      },
    }
  }
  return state
}

function finishPiece(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const battle = fighter.battleCantabile!
  const preparation = battle.preparation!
  const next = {
    ...state,
    [side]: {
      ...fighter,
      pose: 'idle' as const,
      battleCantabile: {
        ...battle,
        preparation: null,
        prologue: preparation.piece === 'prologue',
        form:
          preparation.piece === 'metamorphosen' && preparation.model
            ? {
                model: preparation.model,
                duration: preparation.duration!,
                remaining: preparation.duration!,
              }
            : null,
      },
    },
  }
  return preparation.piece === 'jupiter' ? spawnJupiter(next, side) : next
}

function spawnJupiter(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [
      ...state.projectiles,
      {
        id: state.nextProjectileId,
        owner: side,
        fighterId: 'bonolenov',
        x: fighter.x,
        y: fighter.y + JUPITER_RADIUS,
        velocityX: fighter.facing * 84,
        width: JUPITER_RADIUS,
        height: JUPITER_RADIUS,
        damage: 38,
        hitstun: 32,
        blockstun: 22,
        hitstop: 12,
        knockback: 7,
        targetZone: 'torso',
        shape: 'orb',
        colour: '#d8aa72',
        matter: 'nen',
        age: 0,
        lifetime: 180,
        jupiter: true,
        concealed: false,
        nenPower: abilityPower(fighter, 'battle-cantabile-jupiter'),
        hatsuPower: 1,
      },
    ],
  }
}
