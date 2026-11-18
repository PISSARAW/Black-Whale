import { attackData } from './frameData'
import {
  REST_CAMERA_ACCENT,
  strikeCameraAccent,
  type CombatCameraAccent,
} from './combatCameraAccent'
import type { FightSide, FightState } from './types'

const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

function nearbyStrike(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    rival = state[other(side)]
  if (!actor.attack || actor.attack.variant === 'throw') return false
  const data = attackData(actor.attack.kind, actor)
  return Math.abs(actor.x - rival.x) <= data.box.right + 3
}

function confirmedSide(state: FightState, sequence?: number): FightSide | undefined {
  const hit = state.impact
  if (!hit || hit.sequence === sequence || hit.projectileId !== null) return
  if (hit.blocked || hit.parried || hit.avoided || hit.invulnerable) return
  return hit.attacker
}

function phraseSide(state: FightState, held: FightSide | null, sequence?: number) {
  const confirmed = confirmedSide(state, sequence)
  if (confirmed && nearbyStrike(state, confirmed)) return confirmed
  if (held && nearbyStrike(state, held)) return held
  return (['player', 'opponent'] as const).find((side) => nearbyStrike(state, side)) ?? null
}

interface PhraseMemory {
  key: string
  frame: number
  clock: number
  lastEngaged: number
  sequence?: number
  owner: FightSide | null
  peak: CombatCameraAccent
  drawn: CombatCameraAccent
}

function freshPhrase(): PhraseMemory {
  return {
    key: '',
    frame: -1,
    clock: 0,
    lastEngaged: -Infinity,
    owner: null,
    peak: { ...REST_CAMERA_ACCENT },
    drawn: { ...REST_CAMERA_ACCENT },
  }
}

/** Scene-owned envelope: cancels extend a phrase without restarting its camera movement. */
export function createCombatCameraPhrase() {
  let memory = freshPhrase()
  return (state: FightState, enabled = true, finishTicks = 0): CombatCameraAccent => {
    const key = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
    if (!enabled || key !== memory.key || state.frame < memory.frame || state.phase === 'ready')
      memory = { ...freshPhrase(), frame: state.frame, key }
    const ticks = phraseTicks(state, memory.frame, finishTicks)
    memory.frame = state.frame
    memory.clock += ticks
    if (!enabled) return { ...REST_CAMERA_ACCENT }
    advancePhrase(memory, state)
    const release = Math.min(1, Math.max(0, (memory.clock - memory.lastEngaged - 8) / 24))
    const weight = 1 - release * release * (3 - 2 * release)
    const target = weightedAccent(memory.peak, weight)
    memory.drawn = approachAccent(memory.drawn, target, 1 - Math.exp(-ticks / 6))
    return { ...memory.drawn }
  }
}

function advancePhrase(memory: PhraseMemory, state: FightState) {
  const side = state.phase === 'fighting' ? phraseSide(state, memory.owner, memory.sequence) : null
  memory.sequence = state.impact?.sequence
  if (side && (side !== memory.owner || memory.clock - memory.lastEngaged > 12)) {
    memory.owner = side
    memory.peak = { ...REST_CAMERA_ACCENT, side }
  }
  if (phraseEngaged(memory.owner, side, state)) memory.lastEngaged = memory.clock
  if (side && side === memory.owner)
    memory.peak = strongerAccent(memory.peak, strikeCameraAccent(state, side))
}

function phraseEngaged(owner: FightSide | null, side: FightSide | null, state: FightState) {
  return owner && state.phase === 'fighting' && (side === owner || state[other(owner)].hitStun > 0)
}

function strongerAccent(held: CombatCameraAccent, next: CombatCameraAccent): CombatCameraAccent {
  if (next.tilt !== 0) return { ...next, push: Math.max(held.push, next.push) }
  return next.push >= held.push ? next : held
}

function phraseTicks(state: FightState, previous: number, finishTicks: number) {
  if (state.phase === 'finished') return Math.max(0, finishTicks)
  return state.hitstop > 0 ? 0 : Math.max(0, state.frame - previous)
}

function weightedAccent(accent: CombatCameraAccent, weight: number): CombatCameraAccent {
  return {
    push: accent.push * weight,
    look: accent.look * weight,
    tilt: accent.tilt * weight,
    lead: accent.lead * weight,
    side: weight > 0 ? accent.side : null,
  }
}

function approachAccent(from: CombatCameraAccent, to: CombatCameraAccent, amount: number) {
  return {
    push: from.push + (to.push - from.push) * amount,
    look: from.look + (to.look - from.look) * amount,
    tilt: from.tilt + (to.tilt - from.tilt) * amount,
    lead: from.lead + (to.lead - from.lead) * amount,
    side: amount > 0 ? to.side : from.side,
  }
}
