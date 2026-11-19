import { hisokaInput } from './hisokaSenses'
import { seesCombatBody } from '../../src/lib/fighting/fightCounterplay'
import { canAct } from '../../src/lib/fighting/fightActorState'
import { moveById, moveForSlot, canUseMovesetMove } from '../../src/lib/fighting/movesets'
import { selectedGumLink } from '../../src/lib/fighting/bungeeNetwork'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import type { FighterMove } from '../../src/lib/fighting/movesetTypes'
import type { ArsenalCommand } from '../../src/lib/fighting/retrospectiveTypes'
import type { ReplayCommand } from '../../src/lib/fighting/fightReplayTypes'
import type { FightInput, FightState, MoveAction, MoveSlot } from '../../src/lib/fighting/types'

export interface HisokaDecision {
  input: FightInput
  command?: ReplayCommand
  arsenal?: ArsenalCommand
  reason?: string
}

/** A reactive player-side bot. No frame schedule, winner or damage is prescribed. */
export function createHisokaAgent(seed: number) {
  let rng = seed >>> 0
  let nextDecision = 0
  let nextEquipment = 0
  let round = 0
  return (state: FightState): HisokaDecision => {
    if (state.roundNumber !== round) {
      round = state.roundNumber
      nextDecision = state.frame
      nextEquipment = state.frame
    }
    const input = hisokaInput(state)
    if (!available(state, input) || state.frame < nextDecision) return { input }
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0
    const roll = rng / 2 ** 32
    nextDecision = state.frame + 16 + (rng % 9)
    if (state.frame >= nextEquipment && !state.player.attack) {
      nextEquipment = state.frame + 150
      const arsenal = equipment(state)
      if (arsenal) return { input, arsenal, reason: arsenal.action }
    }
    const gap = Math.abs(state.player.x - state.opponent.x)
    const move = followup(state, roll) ?? chooseMove(state, { gap, roll })
    if (!move) return rangedDecision(state, input, gap)
    return { input, command: moveCommand(state, move), reason: move.id }
  }
}

function available(state: FightState, input: FightInput): boolean {
  return (
    state.phase === 'fighting' &&
    canAct(state.player) &&
    seesCombatBody(state.player) &&
    !input.guard &&
    !input.hatsu
  )
}

function equipment(state: FightState): ArsenalCommand | null {
  const actor = state.player
  const gap = Math.abs(actor.x - state.opponent.x)
  if ((actor.openWounds ?? 0) > (actor.gumWoundSeals ?? 0) && gap > 14)
    return { action: 'gum-seal' }
  if (gap > 18 && actor.aura > 45 && !actor.gumThrowReady) return { action: 'gum-prepare-throw' }
  return null
}

function followup(state: FightState, roll: number): FighterMove | null {
  const attack = state.player.attack
  if (!attack?.impacted) return null
  const current = moveById(attack.moveId)
  const blocked = state.impact?.blocked
  const ids = blocked ? current?.cancelOnBlockInto : current?.cancelInto
  const choices = (ids ?? [])
    .map(moveById)
    .filter((move): move is FighterMove =>
      Boolean(move && canUseMovesetMove(state, 'player', move)),
    )
  return choices.length ? choices[Math.floor(roll * choices.length)] : null
}

function chooseMove(state: FightState, choice: { gap: number; roll: number }): FighterMove | null {
  if (state.player.attack || state.player.nen.mode === 'zetsu') return null
  const slots = tacticalSlots(state, choice)
  return (
    slots
      .map((slot) => moveForSlot('hisoka', slot))
      .find(
        (move) => move && inRange(move, choice.gap) && canUseMovesetMove(state, 'player', move),
      ) ?? null
  )
}

function tacticalSlots(state: FightState, choice: { gap: number; roll: number }): MoveSlot[] {
  if (state.player.y > 0) return ['airHeavy', 'airLight']
  if (state.opponent.blocking && choice.gap < 6) return ['throw', 'lowLight', 'forwardHeavy']
  return hatsuSlots(state, choice) ?? closeSlots(choice.roll)
}

function hatsuSlots(state: FightState, choice: { gap: number; roll: number }): MoveSlot[] | null {
  const { gap, roll } = choice
  const link = selectedGumLink(state, 'player')
  if (needsAttachment(state) && gap < 15 && roll < 0.85) return ['neutralSpecial', 'standingLight']
  if (link?.target.kind === 'fighter' && gap > 11)
    return [roll < 0.5 ? 'forwardSpecial' : 'backSpecial', 'forwardLight']
  if (textureOpening(state, choice)) return ['downSpecial']
  return null
}

function textureOpening(state: FightState, choice: { gap: number; roll: number }): boolean {
  return (
    !state.player.textureSurprise &&
    state.player.health < state.player.maxHealth * 0.8 &&
    choice.gap > 16 &&
    choice.roll > 0.68
  )
}

function needsAttachment(state: FightState): boolean {
  const link = selectedGumLink(state, 'player')
  return !link || link.target.kind !== 'fighter'
}

function closeSlots(roll: number): MoveSlot[] {
  if (roll < 0.22) return ['finisher', 'forwardLight', 'standingLight']
  if (roll < 0.44) return ['lowLight', 'lowHeavy', 'standingHeavy']
  if (roll < 0.68) return ['backHeavy', 'standingHeavy', 'standingLight']
  return ['standingLight', 'forwardHeavy', 'standingHeavy']
}

function inRange(move: FighterMove, gap: number): boolean {
  return move.tuning.damage === 0 || gap <= move.tuning.reach + Math.max(0, move.tuning.lunge) + 1
}

function rangedDecision(state: FightState, input: FightInput, gap: number): HisokaDecision {
  if (gap < 15 || gap > 44 || state.player.attack || state.player.aura < 60) return { input }
  return {
    input,
    command: { kind: 'move', side: 'player', action: 'ranged', input: packReplayInput(input) },
    reason: 'physical-card',
  }
}

function moveCommand(state: FightState, move: FighterMove): ReplayCommand {
  const input = { ...hisokaInput(state), left: false, right: false, down: false }
  const forward = state.player.facing === 1 ? 'right' : 'left'
  const back = state.player.facing === 1 ? 'left' : 'right'
  if (move.slot.startsWith('forward')) input[forward] = true
  if (move.slot.startsWith('back')) input[back] = true
  if (move.slot.startsWith('low') || move.slot === 'downSpecial') input.down = true
  const action = moveAction(move)
  return { kind: 'move', side: 'player', action, input: packReplayInput(input) }
}

function moveAction(move: FighterMove): MoveAction {
  if (move.slot === 'finisher' || move.slot === 'throw') return move.slot
  return move.kind as MoveAction
}
