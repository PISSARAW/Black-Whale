import {
  advanceTethers,
  chargeKo,
  evade,
  landReadyIntent,
  landReadyKo,
  prepareStrike,
  ringOut,
  strike,
} from './exchange'
import {
  activeGuard,
  advanceFighter,
  distance,
  feint,
  replace,
  setKen,
  setMode,
  setMovement,
  setRyu,
  syncPosition,
  toggle,
} from './fighter'
// Re-exported: the constants describe the arena's economy, and callers have
// always read them from here.
export {
  EVADE_COST,
  EVADE_DISTANCE,
  FEINT_COST,
  GUARD_WINDOW,
  GYO_PER_SECOND,
  HATSU_COST,
  IN_PER_SECOND,
  KEN_PER_SECOND,
  KO_COST,
  KO_WINDUP,
  MIN_SEPARATION,
  MOVE_SPEED,
  REN_PER_SECOND,
  RYU_SHIFT_TIME,
  SCORE_TO_WIN,
  STRIKE_WINDUP,
  ZETSU_RECOVERY,
} from './fighter'
import { HATSU_COST } from './fighter'
import type { Vec2 } from '../tour/types'
import { advancePersistentNenEffects } from './effects'
import { advanceEnvironment, reactEnvironment } from './environment'
import { resolveNamedHatsu } from './hatsu'
import { fightingHatsuAction, prepareFightingMove } from './fightingMove'
import { usesClashNen } from './clashNen'
import {
  initialCombatState,
  otherSide,
  type ArenaHatsuEffect,
  type BodyZone,
  type CombatAction,
  type CombatSide,
  type CombatState,
} from './types'

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  if (state.outcome !== 'playing') return state
  if (action.type === 'TICK') return tick(state, action.dt)
  if (action.type === 'SYNC_POSITION')
    return replace(state, action.side, syncPosition(state[action.side], action.position))
  if (action.type === 'FACE')
    return replace(state, action.side, { ...state[action.side], facing: action.heading })
  if (action.type === 'EVADE') return evade(state, action.side, action.vector)
  if (action.type === 'MOVE')
    return replace(state, action.side, setMovement(state[action.side], action.vector))
  if (action.type === 'MODE')
    return replace(state, action.side, setMode(state[action.side], action.mode))
  if (action.type === 'RYU') return ryu(state, action)
  if (action.type === 'GYO')
    return replace(state, action.side, toggle(state[action.side], 'gyo', action.on))
  if (action.type === 'IN')
    return replace(state, action.side, toggle(state[action.side], 'in', action.on))
  if (action.type === 'KEN')
    return replace(state, action.side, setKen(state[action.side], action.on))
  if (action.type === 'EN') {
    const fighter = state[action.side]
    if (fighter.mode === 'zetsu' || (action.radius !== null && action.radius <= 0)) return state
    return replace(state, action.side, { ...fighter, en: action.radius })
  }
  if (action.type === 'SHU') {
    const fighter = state[action.side]
    if (fighter.mode === 'zetsu') return state
    return replace(state, action.side, {
      ...fighter,
      shuObjectId: action.on
        ? action.objectId
        : fighter.shuObjectId === action.objectId
          ? null
          : fighter.shuObjectId,
    })
  }
  if (action.type === 'GUARD') return replace(state, action.side, activeGuard(state[action.side]))
  if (action.type === 'FEINT')
    return replace(state, action.side, feint(state[action.side], action.zone))
  if (action.type === 'PREPARE_STRIKE') return prepareStrike(state, action.side, action.zone)
  if (action.type === 'FIGHTING_MOVE') {
    const hatsu = fightingHatsuAction(action)
    if (!hatsu) return prepareFightingMove(state, action)
    const cast = castHatsu(state, hatsu)
    return cast === state ? state : reactEnvironment(cast, hatsu)
  }
  if (action.type === 'PREPARE_HATSU') return prepareHatsu(state, action.side, action.hatsuId)
  if (action.type === 'HATSU') {
    const cast = castHatsu(state, action)
    return cast === state ? state : reactEnvironment(cast, action)
  }
  if (action.type === 'STRIKE') {
    const struck = strike({
      state,
      side: action.side,
      zone: action.zone,
      technique: 'strike',
      targetAt: action.targetAt,
    })
    return struck === state ? state : reactEnvironment(struck, action)
  }
  if (action.type === 'KO') return chargeKo(state, action.side, action.zone)
  return state
}

export { initialCombatState }

/** Under Clash rules a held Ko cannot be redistributed: the aura is already engaged. */
function ryu(state: CombatState, action: Extract<CombatAction, { type: 'RYU' }>): CombatState {
  if (usesClashNen(state) && state[action.side].ko) return state
  return replace(state, action.side, setRyu(state[action.side], action))
}

function tick(state: CombatState, dt: number): CombatState {
  const context = { dt, state }
  const advanced: CombatState = {
    ...state,
    clock: state.clock + dt,
    player: advanceFighter(state.player, state.opponent, context),
    opponent: advanceFighter(state.opponent, state.player, context),
  }
  return advanceEnvironment(
    advancePersistentNenEffects(
      ringOut(landReadyKo(landReadyIntent(advanceTethers(advanced, dt)))),
      dt,
    ),
    dt,
  )
}

/** The whole of a HATSU action, which is what `castHatsu` reads anyway. */
interface HatsuCast {
  side: CombatSide
  effect: ArenaHatsuEffect
  zone: BodyZone
  hatsuId?: string
  targetAt?: Vec2
  cost?: number
}

function prepareHatsu(
  state: CombatState,
  side: CombatSide,
  hatsuId: 'parallel-future' | 'rihan-predator',
): CombatState {
  const fighter = state[side]
  if (fighter.condition !== 'ready' || fighter.cooldown > 0) return state
  if (hatsuId === 'parallel-future') {
    if (fighter.mode !== 'zetsu') return state
    return replace(state, side, {
      ...fighter,
      hatsuPreparation: {
        id: hatsuId,
        observations: 1,
        targetHatsuId: null,
        expiresAt: state.clock + 2,
      },
      movement: [0, 0],
      cooldown: 0.35,
    })
  }
  const targetHatsuId = state.lastHatsuBySide[otherSide(side)]
  if (!targetHatsuId) return state
  const previous = fighter.hatsuPreparation
  const observations =
    previous?.id === hatsuId && previous.targetHatsuId === targetHatsuId
      ? previous.observations + 1
      : 1
  return replace(state, side, {
    ...fighter,
    hatsuPreparation: {
      id: hatsuId,
      observations,
      targetHatsuId,
      expiresAt: state.clock + 20,
    },
    cooldown: 0.25,
  })
}

function castHatsu(
  state: CombatState,
  { side, effect, zone, hatsuId, targetAt, cost: requestedCost }: HatsuCast,
): CombatState {
  const fighter = state[side]
  const preparation = fighter.hatsuPreparation
  if (
    hatsuId === 'parallel-future' &&
    (fighter.mode !== 'zetsu' || preparation?.id !== hatsuId || preparation.expiresAt < state.clock)
  )
    return state
  if (
    hatsuId === 'rihan-predator' &&
    (preparation?.id !== hatsuId ||
      preparation.observations < 3 ||
      preparation.expiresAt < state.clock)
  )
    return state
  const sequenceCost =
    requestedCost ??
    (hatsuId === 'ripper-cyclotron' || hatsuId === 'battle-cantabile-jupiter' ? 6 : HATSU_COST)
  if (
    (fighter.condition !== 'ready' && hatsuId !== 'cats-name') ||
    fighter.cooldown > 0 ||
    fighter.aura < sequenceCost
  )
    return state
  const paid = { ...fighter, aura: fighter.aura - sequenceCost, intent: null }
  let current = {
    ...replace(state, side, { ...paid, hatsuPreparation: null }),
    lastHatsuBySide: { ...state.lastHatsuBySide, [side]: hatsuId ?? null },
  }
  const rivalSide = otherSide(side)

  if (hatsuId === 'ripper-cyclotron' || hatsuId === 'battle-cantabile-jupiter') {
    const previous = fighter.hatsuSequence
    const continuous = previous?.id === hatsuId && state.clock - previous.lastAt <= 1.2
    const count = continuous ? previous.count + 1 : 1
    if (count < 3) {
      return replace(current, side, {
        ...paid,
        hatsuSequence: { id: hatsuId, count, lastAt: state.clock },
        cooldown: 0.2,
      })
    }
    current = replace(current, side, { ...paid, hatsuSequence: null })
    return strike({
      state: current,
      side,
      zone,
      technique: 'hatsu',
      power: hatsuId === 'ripper-cyclotron' ? 2.2 : 1.9,
      range: hatsuId === 'ripper-cyclotron' ? 2.4 : 4.5,
    })
  }

  if (hatsuId === 'double-machine-gun') {
    return strike({ state: current, side, zone, technique: 'hatsu', power: 0.95, range: 9 })
  }

  if (hatsuId === 'bungee-gum') {
    const anchor = targetAt ?? state[rivalSide].position
    const subject = targetAt ? side : rivalSide
    const gap = distance(state[subject].position, anchor)
    if (gap > 10) return state
    return {
      ...replace(current, side, { ...paid, cooldown: 0.8 }),
      tethers: [
        ...state.tethers.filter((tether) => tether.owner !== side),
        {
          id: `bungee-${side}`,
          owner: side,
          subject,
          anchor: targetAt ?? null,
          restLength: Math.max(0.8, gap * 0.6),
          remaining: 8,
        },
      ],
    }
  }

  const specialized = resolveNamedHatsu(current, { side, zone, hatsuId, paid })
  if (specialized) return specialized

  if (effect === 'bind') {
    if (distance(fighter.position, state[rivalSide].position) > 7) return state
    current = replace(current, side, { ...paid, cooldown: 1.1 })
    return replace(current, rivalSide, {
      ...current[rivalSide],
      bound: 1.6,
      movement: [0, 0],
      intent: null,
    })
  }
  if (effect === 'restore') {
    return replace(current, side, {
      ...paid,
      aura: Math.min(paid.capacity, paid.aura + 42),
      condition: 'ready',
      recovery: 0,
      cooldown: 2.2,
    })
  }
  if (effect === 'enhance') {
    return replace(current, side, { ...paid, empowered: 5, cooldown: 0.8 })
  }
  return strike({
    state: current,
    side,
    zone,
    technique: 'hatsu',
    power: effect === 'impact' ? 1.65 : 0.82,
    range: effect === 'barrage' ? 9 : 2.7,
  })
}
