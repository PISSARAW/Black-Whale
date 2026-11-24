import { arenaPov } from '../pov'
import { moveFrameAdvantage } from '../../fighting/moveFrameAdvantage'
import { moveById, moveForSlot } from '../../fighting/movesets'
import type { ReplayCoachFinding } from '../../fighting/replayCoachTypes'
import type { CombatEvent, CombatState } from '../../combat/types'
import { scanReplayFrames, type ArenaReplayFrame } from './player'
import type { ArenaReplay } from './types'

export interface ArenaReplayCoachFinding {
  id: string
  kind: ReplayCoachFinding['kind']
  eventTick: number
  resumeTick: number
  moveId: string
  responseFrames?: number
}

export interface ArenaReplayCoachReport {
  ticks: number
  findings: ArenaReplayCoachFinding[]
  nonExhaustive: true
}

const MAX_FINDINGS = 12

export function coachArenaReplay(replay: ArenaReplay): ArenaReplayCoachReport {
  const observer = createArenaReplayCoachObserver(replay)
  scanReplayFrames(replay, observer.observe)
  return { ticks: replay.ticks, findings: observer.findings, nonExhaustive: true }
}

export function createArenaReplayCoachObserver(replay: ArenaReplay) {
  const findings: ArenaReplayCoachFinding[] = []
  let lastOwnMoveTick = 0
  let lastOwnMoveId = ''
  let previousEvent = ''
  function add(finding: ArenaReplayCoachFinding | null) {
    if (finding && findings.length < MAX_FINDINGS) findings.push(finding)
  }
  return {
    observe(frame: ArenaReplayFrame) {
      const before = arenaPov(frame.before, 'player')
      const after = arenaPov(frame.after, 'player')
      if (!before.player.intent?.moveId && after.player.intent?.moveId) {
        lastOwnMoveTick = Math.max(0, frame.tick - 1)
        lastOwnMoveId = after.player.intent.moveId
      }
      const event = newEvent(before, after, previousEvent)
      if (!event) return
      previousEvent = eventKey(event)
      add(recoveryOpportunity({ replay, after, event, tick: frame.tick }))
      add(recoveryPunished({ before, event, tick: frame.tick, lastOwnMoveTick, lastOwnMoveId }))
    },
    get findings() {
      return findings.slice()
    },
  }
}

function recoveryOpportunity(input: {
  replay: ArenaReplay
  after: CombatState
  event: CombatEvent
  tick: number
}): ArenaReplayCoachFinding | null {
  const { replay, after, event, tick } = input
  if (!isRecoveryOpportunityEvent(event)) return null
  if (after.player.condition !== 'ready') return null
  if (event.impact === 'miss' && after.player.cooldown > 0) return null
  const enemyMove = moveById(event.moveId)
  const playerId = replay.match.fighterId ?? 'kurapika'
  const response = moveForSlot(playerId, 'standingLight')
  if (!enemyMove || !response || !withinLightRange(after, response.tuning.reach)) return null
  const opening = punishableFrames(replay, after, event)
  if (opening < response.tuning.startup) return null
  return {
    id: `opportunity:${tick}:${enemyMove.id}`,
    kind: 'recovery-opportunity',
    eventTick: tick,
    resumeTick: Math.max(0, tick - 1),
    moveId: enemyMove.id,
    responseFrames: response.tuning.startup,
  }
}

function isRecoveryOpportunityEvent(event: CombatEvent): boolean {
  return event.attacker === 'opponent' && (event.impact === 'miss' || event.impact === 'blocked')
}

function recoveryPunished(input: {
  before: CombatState
  event: CombatEvent
  tick: number
  lastOwnMoveTick: number
  lastOwnMoveId: string
}): ArenaReplayCoachFinding | null {
  const { before, event, tick, lastOwnMoveTick, lastOwnMoveId } = input
  if (event.attacker !== 'opponent' || ['miss', 'blocked'].includes(event.impact)) return null
  const ownMove = moveById(lastOwnMoveId)
  if (before.player.cooldown <= 0 || !ownMove) return null
  return {
    id: `punished:${tick}:${ownMove.id}`,
    kind: 'recovery-punished',
    eventTick: tick,
    resumeTick: lastOwnMoveTick,
    moveId: ownMove.id,
  }
}

function punishableFrames(replay: ArenaReplay, state: CombatState, event: CombatEvent): number {
  if (event.impact === 'miss') return Math.floor(state.opponent.cooldown * replay.tickRate)
  const move = moveById(event.moveId)
  const frames = move ? moveFrameAdvantage(move) : null
  return frames && typeof frames.onBlock === 'number' ? -frames.onBlock : 0
}

function withinLightRange(state: CombatState, authoredReach: number): boolean {
  const gap = Math.hypot(
    state.player.position[0] - state.opponent.position[0],
    state.player.position[1] - state.opponent.position[1],
  )
  return gap <= Math.min(8, Math.max(1.6, authoredReach / 5))
}

function newEvent(before: CombatState, after: CombatState, previous: string) {
  const event = after.lastEvent
  if (!event || event === before.lastEvent || eventKey(event) === previous) return null
  return event
}

function eventKey(event: CombatEvent): string {
  return `${event.at}:${event.attacker}:${event.impact}:${event.moveId ?? event.technique}`
}
