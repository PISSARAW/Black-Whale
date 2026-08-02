/**
 * The duel's pure reducer: one action in, one state out, no clock of its own.
 *
 * Split from `state.ts` so the shape of a duel and the rules that move it stay
 * separately readable, and so neither file grows towards the five hundred lines
 * `hatsu.ts` is the warning about.
 */
import { payForGyo } from './gyo'
import { payForIn } from './in'
import { payForKen, raiseKen } from './ken'
import { chargeKo, gather, isReady } from './ko'
import { setRyu, type RyuSetting } from './ryu'
import { checkExhaustion, resolveStrike, type Side } from './resolve'
import { setZetsu, tickDisengage } from './disengage'
import { tickHolds } from './inherit'
import type { BodyZone, DuelState, DuelistState } from './state'

export type DuelAction =
  | { type: 'TICK'; dt: number }
  | { type: 'RYU'; side: Side; setting: RyuSetting }
  | { type: 'GYO'; side: Side; on: boolean }
  | { type: 'IN'; side: Side; on: boolean }
  | { type: 'KEN'; side: Side; on: boolean }
  | { type: 'KO'; side: Side; zone: BodyZone }
  | { type: 'ZETSU'; on: boolean }
  | { type: 'HUNTER'; duelist: DuelistState }

export function duelReducer(state: DuelState, action: DuelAction): DuelState {
  if (state.outcome !== 'playing') return state

  switch (action.type) {
    case 'TICK':
      return tick(state, action.dt)
    case 'RYU':
      return replace(state, action.side, setRyu(state[action.side], action.setting))
    case 'GYO':
      return replace(state, action.side, { ...state[action.side], gyo: action.on })
    case 'IN':
      return replace(state, action.side, { ...state[action.side], in: action.on })
    case 'KEN':
      return replace(state, action.side, raiseKen(state[action.side], action.on))
    case 'KO':
      return replace(state, action.side, chargeKo(state[action.side], action.zone))
    case 'ZETSU':
      return setZetsu(state, action.on)
    case 'HUNTER':
      return { ...state, hunter: action.duelist }
    default:
      return state
  }
}

function replace(state: DuelState, side: Side, duelist: DuelistState): DuelState {
  return { ...state, [side]: duelist }
}

/**
 * One tick: the continuous principles are charged, gathered blows come closer
 * to landing, the holds run down, the attempt to break away makes progress or
 * does not, and only then is exhaustion read — so a duelist who cannot pay for
 * Ken this tick drops it and is judged on the reservoir that left them.
 */
function tick(state: DuelState, dt: number): DuelState {
  const charged: DuelState = {
    ...state,
    clock: state.clock + dt,
    player: gather(charge(state.player, dt), dt),
    hunter: gather(charge(state.hunter, dt), dt),
  }
  return checkExhaustion(tickDisengage(tickHolds(land(charged), dt), dt))
}

/**
 * A gathered Ko lands by itself once the wind-up is over. Nobody chooses to
 * throw it: the choice was made when it was gathered, and everything after that
 * belongs to whoever is answering it.
 */
function land(state: DuelState): DuelState {
  const thrown = isReady(state.player) ? resolveStrike(state, 'player') : state
  if (thrown.outcome !== 'playing') return thrown
  return isReady(thrown.hunter) ? resolveStrike(thrown, 'hunter') : thrown
}

function charge(duelist: DuelistState, dt: number): DuelistState {
  // Zetsu is the absence of aura, not a technique: nothing to pay for, and
  // nothing left running.
  if (duelist.zetsu) return { ...duelist, gyo: false, in: false, ken: false }
  return payForKen(payForIn(payForGyo(duelist, dt), dt), dt)
}
