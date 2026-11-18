import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { attackPhase } from './frameData'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { setTrainingDummy } from './trainingSession'
import { packReplayInput } from './fightReplayInput'
import type { ReplayCommand } from './fightReplayTypes'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from './types'

export type WakeupReaction = 'guard' | 'jab' | 'tech' | 'wait'
export type WakeupFollowup = 'strike' | 'throw' | 'bait'
export interface WakeupSettings {
  position: 'centre' | 'corner'
  reaction: WakeupReaction
  followup: WakeupFollowup
}

export const DEFAULT_WAKEUP: WakeupSettings = {
  position: 'centre',
  reaction: 'guard',
  followup: 'strike',
}
type Phase = 'down' | 'stun' | 'protected' | 'open'
type Result =
  | 'hit'
  | 'blocked'
  | 'tech'
  | 'defender-hit'
  | 'defender-blocked'
  | 'protected'
  | 'punish'
  | 'reset'

export interface WakeupProgress {
  start: number
  lastImpact: number
  lastTech: number
  phase: Phase
  openAt?: number
  result?: Result
  gap: number
  knockdown: boolean
}

const CLOSE = 5.9
const BAIT_DISTANCE = 10
const EXCHANGE_FRAMES = 145

export function prepareWakeupFight(state: FightState, settings: WakeupSettings): FightState {
  const x = settings.position === 'corner' ? 93 : 50
  return setTrainingDummy(
    {
      ...state,
      player: { ...state.player, x: x - 6 },
      opponent: { ...state.opponent, x },
    },
    { behavior: 'manual' },
  )
}

function gap(state: FightState): number {
  return Math.abs(state.player.x - state.opponent.x)
}

function wakeupPhase({ opponent }: FightState): Phase {
  if (opponent.knockdownFrames > 0) return 'down'
  if (opponent.hitStun > 0) return 'stun'
  return opponent.wakeupInvulnerableFrames > 0 ? 'protected' : 'open'
}

export function beginWakeup(state: FightState): WakeupProgress {
  return {
    start: state.frame,
    lastImpact: state.impact?.sequence ?? 0,
    lastTech: state.throwTech?.sequence ?? 0,
    phase: wakeupPhase(state),
    gap: gap(state),
    knockdown: state.opponent.knockdownFrames > 0,
  }
}

function exchangeResult(state: FightState, progress: WakeupProgress): Result | undefined {
  if ((state.throwTech?.sequence ?? 0) > progress.lastTech) return 'tech'
  const impact = state.impact
  if (impact && impact.sequence > progress.lastImpact) return wakeupImpactResult(impact)
  if (state.frame - progress.start >= EXCHANGE_FRAMES) return 'reset'
}

function wakeupImpactResult(impact: NonNullable<FightState['impact']>): Result {
  if (impact.invulnerable || impact.avoided) return 'protected'
  if (impact.attacker === 'opponent') return impact.blocked ? 'defender-blocked' : 'defender-hit'
  if (impact.blocked) return 'blocked'
  return impact.punish ? 'punish' : 'hit'
}

export function observeWakeup(state: FightState, progress: WakeupProgress): WakeupProgress {
  if (progress.result) return progress
  const phase = wakeupPhase(state)
  const result = exchangeResult(state, progress)
  if (phase === progress.phase && !result) return progress
  return {
    ...progress,
    phase,
    openAt: progress.openAt ?? (phase === 'open' ? state.frame : undefined),
    result,
  }
}

export function wakeupGuard(
  progress: WakeupProgress | undefined,
  reaction: WakeupReaction,
): FightInput {
  return {
    ...EMPTY_INPUT,
    guard: !progress?.result && (reaction === 'guard' || reaction === 'tech'),
  }
}

export function wakeupDemoInput(state: FightState, followup: WakeupFollowup): FightInput {
  const { player, opponent } = state
  if (followup === 'bait' && opponent.attack?.kind === 'light') {
    return { ...EMPTY_INPUT, guard: true }
  }
  if (followup === 'bait' && opponent.knockdownFrames <= 14)
    return gap(state) < BAIT_DISTANCE
      ? combatRouteInput('backHeavy', player.facing)
      : { ...EMPTY_INPUT, guard: true }
  return gap(state) > CLOSE ? combatRouteInput('forwardLight', player.facing) : EMPTY_INPUT
}

function ready(state: FightState, side: FightSide, slot: MoveSlot) {
  const actor = state[side]
  const move = moveForSlot(actor.id, slot)!
  return !state.hitstop && !actor.attack && canStartFighterAttack(actor, move.kind, move.id)
}

function command(state: FightState, side: FightSide, slot: MoveSlot): ReplayCommand {
  return {
    kind: 'move',
    side,
    action: combatRouteAction(slot),
    input: packReplayInput(combatRouteInput(slot, state[side].facing)),
  }
}

export function wakeupDefenderCommand(
  state: FightState,
  progress: WakeupProgress,
  reaction: WakeupReaction,
): ReplayCommand | undefined {
  if (reaction === 'jab' && ready(state, 'opponent', 'standingLight'))
    return command(state, 'opponent', 'standingLight')
  if (reaction !== 'tech' || !ready(state, 'opponent', 'throw')) return
  const timely =
    state.player.attack?.variant === 'throw' && state.opponent.wakeupInvulnerableFrames <= 1
  const delayed = progress.openAt !== undefined && state.frame >= progress.openAt + 2
  if (timely || delayed) return command(state, 'opponent', 'throw')
}

export function wakeupDemoCommand(
  state: FightState,
  progress: WakeupProgress,
  followup: WakeupFollowup,
): ReplayCommand | undefined {
  const { opponent, player } = state
  if (followup === 'bait') return punishBait(state)
  const slot = followup === 'throw' ? 'throw' : 'standingLight'
  if (!ready(state, 'player', slot) || gap(state) > CLOSE || progress.phase === 'down') return
  if (opponent.hitStun > 0) return
  const { startup } = moveForSlot(player.id, slot)!.tuning
  if (opponent.wakeupInvulnerableFrames <= startup) return command(state, 'player', slot)
}

function punishBait(state: FightState): ReplayCommand | undefined {
  const { opponent } = state
  if (attackPhase(opponent) !== 'recovery' || opponent.attack?.impacted) return
  if (ready(state, 'player', 'forwardLight')) return command(state, 'player', 'forwardLight')
}
