import { attackPhase } from '../../src/lib/fighting/frameData'
import { seesCombatBody, readCounterplay } from '../../src/lib/fighting/fightCounterplay'
import { opponentWantsOn } from '../../src/lib/fighting/onTechnique'
import { gyoSight } from '../../src/lib/fighting/nenPerception'
import { styleReactionFrames } from '../../src/lib/fighting/styleMobility'
import { EMPTY_INPUT, type FightInput, type FightState } from '../../src/lib/fighting/types'

/** Own state and presently visible manifestations, never enemy input or hidden aura. */
export function hisokaInput(state: FightState): FightInput {
  const actor = state.player
  if (!seesCombatBody(actor)) return { ...EMPTY_INPUT }
  const input = movement(state)
  const gap = Math.abs(actor.x - state.opponent.x)
  if (opponentWantsOn(actor)) return { ...input, aura: true, hatsu: true }
  if (actor.aura < 30 && gap > 21) return { ...input, aura: true, down: true }
  if (visibleThreat(state, gap)) return defensiveInput(state, input)
  return offenseInput(state, input)
}

function movement(state: FightState): FightInput {
  const actor = state.player
  const input = { ...EMPTY_INPUT }
  const target = state.opponent
  const gap = Math.abs(actor.x - target.x)
  const retreat = retreats(state, gap)
  const toward = target.x > actor.x ? 1 : -1
  const direction = retreat ? -toward : toward
  if (retreat || gap > 4.2) {
    input.left = direction < 0
    input.right = direction > 0
  }
  return input
}

function retreats(state: FightState, gap: number): boolean {
  return gap < 30 && (state.player.aura < 22 || state.opponent.knockdownFrames > 0)
}

function offenseInput(state: FightState, input: FightInput): FightInput {
  const actor = state.player
  const gap = Math.abs(actor.x - state.opponent.x)
  input.aura = actor.aura > 58 && gap < 16
  input.shu = actor.aura > 42 && gap > 11
  input.focusHands = actor.aura > 60 && gap < 12 && !actor.nen.ko
  const cue = readCounterplay(state, 'player')
  input.jump = cue?.kind === 'projectile' && gap > 12 && state.frame % 90 < 25
  return { ...input, ...perceptionInput(state, gap) }
}

function perceptionInput(state: FightState, gap: number): Pick<FightInput, 'gyo' | 'conceal'> {
  const actor = state.player
  return {
    gyo: actor.aura > 28 && (state.frame % 180 < 24 || state.opponent.pose === 'special'),
    conceal: actor.aura > 48 && gap > 12 && state.bungeeGum?.owner === 'player',
  }
}

function visibleThreat(state: FightState, gap: number): boolean {
  const attack = state.opponent.attack
  if (!attack || state.player.attack || gap > 13) return false
  if (attack.concealed && !gyoSight(state.player)) return false
  return (
    attack.frame >= styleReactionFrames(state.player) && attackPhase(state.opponent) !== 'recovery'
  )
}

function defensiveInput(state: FightState, input: FightInput): FightInput {
  const actor = state.player
  return {
    ...input,
    left: false,
    right: false,
    guard: true,
    aura: actor.aura > 30,
    down: state.opponent.attack?.variant === 'low',
    focusTorso: actor.aura > 28 && !actor.nen.ko,
  }
}
