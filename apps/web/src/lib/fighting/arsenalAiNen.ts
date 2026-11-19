import { preparePhysicalFocus } from './nenFocusCommand'
import { applyAuraContext, KO_COST, setIn } from './nen'
import { attackPhase } from './frameData'
import { seesCombatBody } from './fightCounterplay'
import { voluntaryNenAvailable } from './nenAccess'
import { attackAuraCost } from './fightAttackCost'
import { EMPTY_INPUT } from './types'
import type { FightState, FighterId } from './types'
import type { FighterMove } from './movesetTypes'
import type { AuraAttackOptions } from './auraAttackAction'

/** Attested uses of concealed aura; this does not make the physical support invisible. */
const IN_USERS: readonly FighterId[] = ['kurapika', 'hisoka', 'machi', 'illumi']
/** These masters use concentrated aura; a concealed threat never grants a safe Ko opening. */
const KO_USERS: readonly FighterId[] = ['kurapika', 'hisoka', 'biscuit']

export function performOpponentArsenalMove(
  options: { state: FightState; move: FighterMove; roll: number },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, move, roll } = options
  let prepared = prepareConcealment(state, move, roll)
  const charged = shouldUseKo(prepared, move, roll)
  if (!charged && ['light', 'heavy'].includes(move.kind))
    prepared = {
      ...prepared,
      opponent: preparePhysicalFocus(prepared.opponent, move.tuning.auraZone),
    }
  const next = perform({
    state: prepared,
    side: 'opponent',
    kind: move.kind,
    variant: move.variant,
    moveId: move.id,
    auraCharged: charged,
  })
  if (!next.opponent.attack || next.opponent.attack === prepared.opponent.attack) return next
  // The same Aura-release action as a player: pays Ko and exposes every other body zone.
  return charged ? { ...next, opponent: applyAuraContext(next.opponent, EMPTY_INPUT) } : next
}

function prepareConcealment(state: FightState, move: FighterMove, roll: number): FightState {
  const fighter = state.opponent
  if (move.kind !== 'special' || !IN_USERS.includes(fighter.id) || roll < 0.65) return state
  if (!voluntaryNenAvailable(fighter) || fighter.attack) return state
  const cost = attackAuraCost({ fighter, kind: move.kind, moveId: move.id, concealed: true })
  if (fighter.aura < cost + 12) return state
  return { ...state, opponent: setIn(fighter, true) }
}

function shouldUseKo(state: FightState, move: FighterMove, roll: number): boolean {
  const fighter = state.opponent
  if (move.kind !== 'heavy' || roll < 0.6 || !KO_USERS.includes(fighter.id)) return false
  if (!voluntaryNenAvailable(fighter) || fighter.attack || fighter.aura < KO_COST + 30) return false
  return hasVisibleOpening(state)
}

function hasVisibleOpening(state: FightState): boolean {
  if (!seesCombatBody(state.opponent) || state.parallelFuture) return false
  const target = state.player
  if (target.hitStun > 15 || target.knockdownFrames > 15) return true
  return Boolean(target.attack && !target.attack.concealed && attackPhase(target) === 'recovery')
}
