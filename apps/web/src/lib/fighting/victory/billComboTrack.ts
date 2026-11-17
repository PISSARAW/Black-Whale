import { beginFight, createFight, performMove, tickFight } from '../engine'
import { combatRoute } from '../combatRoutes'
import { combatRouteAction, combatRouteInput } from '../combatRouteFight'
import { canStartFighterAttack } from '../fighterAttacks'
import { moveForSlot } from '../movesets'
import { EMPTY_INPUT, type FighterId, type FightState, type MoveSlot } from '../types'

export const BILL_COMBO_ROUTES = ['bill:economy', 'bill:precision', 'bill:growth'] as const
export interface BillComboImpact {
  index: number
  slot: MoveSlot
  comboHits: number
  route: string
}
const tracks = new Map<FighterId, ReturnType<typeof buildBillComboTrack>>()
export function billComboTrack(target: FighterId) {
  let held = tracks.get(target)
  if (!held) {
    held = buildBillComboTrack(target)
    tracks.set(target, held)
  }
  return held
}
/** Three actual production routes; the dummy attempts to guard every gap within each combo. */
function buildBillComboTrack(target: FighterId) {
  let state = beginFight(
    createFight('bill', target, { mode: 'versus-local', formatId: 'knockout' }),
  )
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
  const states: FightState[] = [state],
    impacts: BillComboImpact[] = []
  let guard = false
  const step = () => {
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard },
    })
    states.push(state)
  }
  const until = (ready: () => boolean) => {
    for (let i = 0; i < 300 && !ready(); i++) step()
    if (!ready()) throw new Error('Bill native combo did not reach its next legal command')
  }
  for (const id of BILL_COMBO_ROUTES) {
    guard = false
    until(() =>
      [state.player, state.opponent].every(
        (f) =>
          !f.attack &&
          !f.hitStun &&
          !f.blockStun &&
          !f.knockdownFrames &&
          !f.wakeupInvulnerableFrames,
      ),
    )
    // Walk back into range through real inputs; no root or health reset between routes.
    for (let i = 0; i < 180 && state.opponent.x - state.player.x > 6; i++) {
      state = tickFight(
        state,
        { ...EMPTY_INPUT, right: true },
        { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT },
      )
      states.push(state)
    }
    for (const [i, slot] of combatRoute(id).moves.entries()) {
      const move = moveForSlot('bill', slot)!
      until(() => !state.hitstop && canStartFighterAttack(state.player, move.kind, move.id))
      state = performMove({
        state,
        side: 'player',
        action: combatRouteAction(slot),
        input: combatRouteInput(slot, state.player.facing),
      })
      if (state.player.attack?.moveId !== move.id) throw new Error(`Bill command rejected: ${slot}`)
      states[states.length - 1] = state
      const sequence = state.impact?.sequence
      until(() => state.impact?.sequence !== sequence && state.impact?.attacker === 'player')
      verifyBillHit(state, { route: id, slot, hits: i + 1 })
      impacts.push({
        index: states.length - 1,
        slot,
        comboHits: state.opponent.comboHits,
        route: id,
      })
      guard = true
    }
  }
  return { states, impacts, last: states.length - 1 }
}
export type BillComboTrack = ReturnType<typeof billComboTrack>

function verifyBillHit(
  state: FightState,
  expected: { route: string; slot: MoveSlot; hits: number },
) {
  if (state.impact?.blocked || state.opponent.comboHits !== expected.hits)
    throw new Error(`Bill route broke: ${expected.route} ${expected.slot}`)
}
