import { combatReducer } from '../combat/reducer'
import {
  initialCombatState,
  type CombatAction,
  type CombatSetup,
  type CombatState,
} from '../combat/types'
import type { FighterId } from '../fighting/types'

export const PARITY_TICK_RATE = 60
/** Allows one 60 Hz integration step of drift between Arena seconds and Clash frames. */
export const PARITY_AURA_EPSILON = 0.05
/** One centimetre absorbs only floating-point drift, not a missed authored movement. */
export const PARITY_POSITION_EPSILON = 0.01

export interface ParityCommand {
  frame: number
  action: Exclude<CombatAction, { type: 'TICK' }>
}

export interface ArenaParityScenario {
  id: string
  fighters: Record<'player' | 'opponent', FighterId>
  setup: CombatSetup
  frames: number
  commands: readonly ParityCommand[]
}

export interface ParityEvent {
  frame: number
  attacker: 'player' | 'opponent'
  zone: 'head' | 'torso' | 'arms' | 'legs'
  impact: 'miss' | 'blocked' | 'clean' | 'critical' | 'knockdown' | 'ko'
  points: number
  technique: 'strike' | 'ko' | 'hatsu'
  parried: boolean
}

export interface ParityFighterDigest {
  aura: number
  airborne: boolean
  condition: CombatState['player']['condition']
  score: number
  position: readonly [number, number]
}

export interface ArenaParityTrace {
  id: string
  events: readonly ParityEvent[]
  player: ParityFighterDigest
  opponent: ParityFighterDigest
  outcome: CombatState['outcome']
}

export interface ParityDifference {
  path: string
  arena: unknown
  clash: unknown
}

/** Executes an Arena exchange on the same fixed 60 Hz boundary Clash uses. */
export function runArenaParityScenario(scenario: ArenaParityScenario): ArenaParityTrace {
  const commands = commandsByFrame(scenario.commands)
  let state: CombatState = { ...initialCombatState(scenario.setup), nenRules: 'clash' }
  const events: ParityEvent[] = []
  let previousEvent = state.lastEvent

  for (let frame = 0; frame < scenario.frames; frame += 1) {
    for (const action of commands.get(frame) ?? []) state = combatReducer(state, action)
    state = combatReducer(state, { type: 'TICK', dt: 1 / PARITY_TICK_RATE })
    if (state.lastEvent && state.lastEvent !== previousEvent) {
      const { attacker, zone, impact, points, technique, parried = false } = state.lastEvent
      events.push({ frame, attacker, zone, impact, points, technique, parried })
      previousEvent = state.lastEvent
    }
  }

  return {
    id: scenario.id,
    events,
    player: fighterDigest(state.player),
    opponent: fighterDigest(state.opponent),
    outcome: state.outcome,
  }
}

export function compareParityEvents(
  arena: ArenaParityTrace,
  clash: ArenaParityTrace,
): ParityDifference[] {
  const differences: ParityDifference[] = []
  const length = Math.max(arena.events.length, clash.events.length)
  for (let index = 0; index < length; index += 1) {
    const arenaEvent = arena.events[index]
    const clashEvent = clash.events[index]
    for (const field of [
      'frame',
      'attacker',
      'zone',
      'impact',
      'points',
      'technique',
      'parried',
    ] as const) {
      if (arenaEvent?.[field] === clashEvent?.[field]) continue
      differences.push({
        path: `events.${index}.${field}`,
        arena: arenaEvent?.[field],
        clash: clashEvent?.[field],
      })
    }
  }
  return differences
}

export function compareParityResults(
  arena: ArenaParityTrace,
  clash: ArenaParityTrace,
): ParityDifference[] {
  const differences = compareParityEvents(arena, clash)
  compareValue({ differences, path: 'outcome', arena: arena.outcome, clash: clash.outcome })
  for (const side of ['player', 'opponent'] as const) {
    for (const field of ['aura', 'airborne', 'condition', 'score'] as const) {
      if (field === 'aura' && Math.abs(arena[side].aura - clash[side].aura) <= PARITY_AURA_EPSILON)
        continue
      compareValue({
        differences,
        path: `${side}.${field}`,
        arena: arena[side][field],
        clash: clash[side][field],
      })
    }
    for (const axis of [0, 1] as const) {
      if (
        Math.abs(arena[side].position[axis] - clash[side].position[axis]) <= PARITY_POSITION_EPSILON
      )
        continue
      differences.push({
        path: `${side}.position.${axis}`,
        arena: arena[side].position[axis],
        clash: clash[side].position[axis],
      })
    }
  }
  return differences
}

function compareValue({
  differences,
  path,
  arena,
  clash,
}: ParityDifference & { differences: ParityDifference[] }): void {
  if (arena !== clash) differences.push({ path, arena, clash })
}

function commandsByFrame(commands: readonly ParityCommand[]) {
  const byFrame = new Map<number, Array<ParityCommand['action']>>()
  for (const command of commands) {
    const frame = Math.max(0, Math.trunc(command.frame))
    byFrame.set(frame, [...(byFrame.get(frame) ?? []), command.action])
  }
  return byFrame
}

function fighterDigest(fighter: CombatState['player']): ParityFighterDigest {
  return {
    aura: rounded(fighter.aura),
    airborne: fighter.height > 0,
    condition: fighter.condition,
    score: fighter.score,
    position: [rounded(fighter.position[0]), rounded(fighter.position[1])],
  }
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}
