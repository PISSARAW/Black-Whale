import { beginFight, createFight, performAuraAttack, tickFight } from '../fighting/engine'
import { moveForSlot } from '../fighting/movesets'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from '../fighting/types'
import { GUARD_WINDOW } from '../combat/fighter'
import { LANE_METRE } from '../combat/moveChain'
import type { BodyZone, CombatAction } from '../combat/types'
import {
  PARITY_TICK_RATE,
  type ArenaParityScenario,
  type ArenaParityTrace,
  type ParityCommand,
  type ParityEvent,
  type ParityFighterDigest,
} from './parity'

type ParityAction = ParityCommand['action']

/** Executes the pilot parity vocabulary through Clash's canonical frame engine. */
export function runClashParityScenario(scenario: ArenaParityScenario): ArenaParityTrace {
  let state = initialFight(scenario)
  const commands = commandsByFrame(scenario.commands)
  const guardUntil = { player: -1, opponent: -1 }
  const events: ParityEvent[] = []
  let impactSequence = state.impact?.sequence ?? 0

  for (let frame = 0; frame < scenario.frames; frame += 1) {
    for (const action of commands.get(frame) ?? []) {
      if (action.type === 'GUARD') guardUntil[action.side] = frame + guardFrames()
      else state = applyAction(state, action)
    }
    state = tickFight(state, input(frame, guardUntil.player), {
      dt: 1 / PARITY_TICK_RATE,
      ai: false,
      opponentInput: input(frame, guardUntil.opponent),
    })
    if (state.impact && state.impact.sequence !== impactSequence) {
      events.push(parityEvent(state))
      impactSequence = state.impact.sequence
    }
  }

  return {
    id: scenario.id,
    events,
    player: fighterDigest(state, 'player'),
    opponent: fighterDigest(state, 'opponent'),
    outcome: outcome(state),
  }
}

function initialFight(scenario: ArenaParityScenario): FightState {
  const state = beginFight(
    createFight(scenario.fighters.player, scenario.fighters.opponent, { mode: 'versus-local' }),
  )
  const gap = Math.hypot(
    scenario.setup.opponentAt[0] - scenario.setup.playerAt[0],
    scenario.setup.opponentAt[1] - scenario.setup.playerAt[1],
  )
  const laneGap = gap / LANE_METRE
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 50 - laneGap / 2, facing: 1 },
    opponent: { ...state.opponent, aura: 100, x: 50 + laneGap / 2, facing: -1 },
  }
}

function applyAction(state: FightState, action: ParityAction): FightState {
  if (action.type !== 'FIGHTING_MOVE') throw unsupported(action)
  const move = moveForSlot(action.fighterId, action.slot)
  if (!move || state[action.side].id !== action.fighterId) return state
  return performAuraAttack({
    state,
    side: action.side,
    kind: move.kind,
    moveId: move.id,
    auraCharged: false,
  })
}

function parityEvent(state: FightState): ParityEvent {
  const impact = state.impact!
  return {
    frame: state.frame,
    attacker: impact.attacker,
    zone: arenaZone(impact.zone),
    impact: impactKind(state),
    points: impact.points,
    technique: impact.kind === 'special' ? 'hatsu' : 'strike',
    parried: impact.parried,
  }
}

function impactKind(state: FightState): ParityEvent['impact'] {
  const impact = state.impact!
  const defender = impact.attacker === 'player' ? state.opponent : state.player
  if (impact.avoided) return 'miss'
  if (impact.blocked) return 'blocked'
  if (defender.health <= 0) return 'ko'
  if (impact.knockdown) return 'knockdown'
  return impact.critical ? 'critical' : 'clean'
}

function fighterDigest(state: FightState, side: FightSide): ParityFighterDigest {
  const fighter = state[side]
  return {
    aura: rounded(fighter.aura),
    condition:
      fighter.health <= 0
        ? 'ko'
        : fighter.knockdownFrames > 0
          ? 'down'
          : fighter.hitStun > 0
            ? 'staggered'
            : 'ready',
    score: state.score[side],
    position: [rounded(fighter.x * LANE_METRE), rounded(fighter.y * LANE_METRE)],
  }
}

function commandsByFrame(commands: readonly ParityCommand[]) {
  const byFrame = new Map<number, ParityAction[]>()
  for (const command of commands) {
    const frame = Math.max(0, Math.trunc(command.frame))
    byFrame.set(frame, [...(byFrame.get(frame) ?? []), command.action])
  }
  return byFrame
}

function input(frame: number, until: number): FightInput {
  return frame <= until ? { ...EMPTY_INPUT, guard: true } : EMPTY_INPUT
}

function guardFrames(): number {
  return Math.round(GUARD_WINDOW * PARITY_TICK_RATE)
}

function arenaZone(zone: 'head' | 'torso' | 'hands' | 'feet'): BodyZone {
  if (zone === 'hands') return 'arms'
  if (zone === 'feet') return 'legs'
  return zone
}

function outcome(state: FightState): ArenaParityTrace['outcome'] {
  if (state.phase !== 'finished') return 'playing'
  return state.winner === 'player' ? 'won' : 'lost'
}

function unsupported(action: CombatAction): Error {
  return new Error(`Clash parity does not support ${action.type} yet`)
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}
