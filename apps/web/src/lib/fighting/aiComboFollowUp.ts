import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { cancelGrammarFor } from './duelComboProfiles'
import { performMove } from './engine'
import { canUseMovesetMove, moveById } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { FightState, MoveSlot } from './types'

/** Chance that the AI notices its own confirmed contact and continues (else it drops). */
export const AI_CONFIRM_RATE = 0.8
/** Chance that the AI extends a blocked string by one more chain (a frame trap). */
export const AI_PRESSURE_RATE = 0.5
/** Hits after which the AI stops chaining and spends its ender or super. */
const AI_CHAIN_HITS = 3

const slotOf = (id: string) => id.split(':')[1] as MoveSlot

function roll(state: FightState): [FightState, number] {
  const rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0
  return [{ ...state, rng }, rng / 0x100000000]
}

/** Hit confirm: chain while the combo is short, then the affordable super, else an ender. */
function onHit(state: FightState, move: FighterMove): MoveSlot | null {
  const grammar = cancelGrammarFor(state.opponent.id)!
  const targets = move.cancelInto.map(slotOf)
  const usable = (slot: MoveSlot) => {
    const next = moveById(`${state.opponent.id}:${slot}`)
    return Boolean(next && canUseMovesetMove(state, 'opponent', next))
  }
  const chains = targets.filter(
    (slot) => !grammar.specials.includes(slot) && !grammar.supers.includes(slot),
  )
  if (state.player.comboHits < AI_CHAIN_HITS && chains.length) return chains[0]
  const superSlot = targets.find((slot) => grammar.supers.includes(slot) && usable(slot))
  return superSlot ?? targets.find((slot) => grammar.specials.includes(slot)) ?? chains[0] ?? null
}

/** Block pressure: one more chain between normals, never an ender or a paid technique. */
function onBlock(state: FightState, move: FighterMove): MoveSlot | null {
  const grammar = cancelGrammarFor(state.opponent.id)!
  return (
    move.cancelOnBlockInto
      .map(slotOf)
      .find((slot) => !grammar.specials.includes(slot) && !grammar.supers.includes(slot)) ?? null
  )
}

/**
 * Evaluated every frame, unlike the 16–24-frame AI cadence that is too slow for a cancel
 * window. It only proposes a command; the ordinary admission rules decide if it runs.
 */
type Attack = NonNullable<FightState['opponent']['attack']>

/** The AI's attack that has just been confirmed and not yet given a follow-up roll. */
function freshConfirmation(state: FightState): { attack: Attack; move: FighterMove } | null {
  const attack = state.opponent.attack
  if (!attack?.moveId || state.hitstop > 0 || attack.aiFollowUpRolled) return null
  if (!cancelGrammarFor(state.opponent.id)) return null
  if (!attack.confirmedHit && !attack.confirmedBlock) return null
  const move = moveById(attack.moveId)
  return move ? { attack, move } : null
}

export function aiComboFollowUp(state: FightState): FightState | null {
  const confirmed = freshConfirmation(state)
  if (!confirmed) return null
  const { attack, move } = confirmed
  const [rolled, chance] = roll(state)
  const marked: FightState = {
    ...rolled,
    opponent: { ...rolled.opponent, attack: { ...attack, aiFollowUpRolled: true } },
  }
  const continues = attack.confirmedHit ? chance < AI_CONFIRM_RATE : chance < AI_PRESSURE_RATE
  const slot = continues ? (attack.confirmedHit ? onHit : onBlock)(marked, move) : null
  if (!slot) return marked
  const next = performMove({
    state: marked,
    side: 'opponent',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, marked.opponent.facing),
  })
  // A command that is not admissible yet stays in the ordinary input buffer.
  return next
}
