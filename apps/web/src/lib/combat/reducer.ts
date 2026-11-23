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
import { advancePersistentNenEffects } from './effects'
import { advanceEnvironment, reactEnvironment } from './environment'
import { prepareFightingMove, releaseBufferedMove } from './fightingMove'
import { fightingHatsuAction } from './fightingHatsu'
import { isBlinkyUtilityMove, resolveFightingBlinky } from './fightingBlinky'
import { castHatsu, prepareHatsu } from './hatsuCast'
import { usesClashNen } from './clashNen'
import { startJump } from './airMovement'
import { initialCombatState, type CombatAction, type CombatState } from './types'

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  if (state.outcome !== 'playing') return state
  if (action.type === 'TICK')
    return state.hitstop > 0 ? advanceHitstop(state, action.dt) : tick(state, action.dt)
  if (state.hitstop > 0)
    return action.type === 'FIGHTING_MOVE' && !isBlinkyUtilityMove(action)
      ? prepareFightingMove(state, action)
      : state
  if (action.type === 'SYNC_POSITION')
    return replace(state, action.side, syncPosition(state[action.side], action.position))
  if (action.type === 'FACE')
    return replace(state, action.side, { ...state[action.side], facing: action.heading })
  if (action.type === 'EVADE') return evade(state, action.side, action.vector)
  if (action.type === 'MOVE')
    return replace(state, action.side, setMovement(state[action.side], action.vector))
  if (action.type === 'JUMP')
    return replace(state, action.side, startJump(state[action.side], action.vector))
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
    if (isBlinkyUtilityMove(action)) return resolveFightingBlinky(state, action)
    const hatsu = fightingHatsuAction(state, action)
    if (!hatsu) return prepareFightingMove(state, action)
    if (hatsu.type === 'PREPARE_HATSU') return prepareHatsu(state, hatsu.side, hatsu.hatsuId)
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

function advanceHitstop(state: CombatState, dt: number): CombatState {
  const freeze = state.hitstop
  const remaining = freeze - dt
  const held = { ...state, hitstop: remaining > 1e-9 ? remaining : 0 }
  if (held.hitstop > 0) return held
  const resumed = releaseBufferedMove(releaseBufferedMove(held, 'player'), 'opponent')
  return dt - freeze > 1e-9 ? tick(resumed, dt - freeze) : resumed
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
