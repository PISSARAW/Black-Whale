import { panelReplayCommand } from './fightReplayPanels'
import { trackEvent } from '$lib/analytics/client'
import { fightReplayHash } from './fightReplayHash'
import { FIXED_STEP } from './fightClock'
import { fightAcceptsCommands } from './fightOutcome'
import { applyReplayCommand } from './fightReplayCommands'
import { packReplayInput, unpackReplayInput } from './fightReplayInput'
import { createFightReplayController } from './fightReplayController'
import { createResponseDiagnostics } from './fightResponseDiagnostics'
import { tickFight, performAuraAttack } from './engine'
import { performFuturePerceptionAction } from './futurePerception'
import { performArsenalAction } from './arsenalExecution'
import { createQwenDuel, type QwenDuel } from './qwen/duel'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'
import type { ReplayCommand, ReplayPacket } from './fightReplayTypes'
import type { CareerTracker } from './career/runtime'

interface Queued {
  command?: ReplayCommand
  action?: (state: FightState) => FightState
  side?: FightSide
  receipt: number | null
}
function recordCompletion(before: FightState, after: FightState, practicing: boolean) {
  if (!before.matchWinner && after.matchWinner && !practicing)
    trackEvent('mode_complete', {
      variant: before.mode,
      result: after.matchWinner,
      format: before.formatId,
    })
}

export function createFightMatchRuntime(
  clock: () => number = () => performance.now(),
  options: { record?: boolean; career?: CareerTracker; qwen?: QwenDuel } = {},
) {
  const replays = createFightReplayController()
  const diagnostics = createResponseDiagnostics()
  const career = options.career
  const qwen = options.qwen ?? createQwenDuel({ clock })
  let pending: Queued[] = []
  let boundary: FightState | null = null
  let frameObserver: ((state: FightState) => void) | null = null
  function clear() {
    pending = []
    diagnostics.clearQueued()
  }
  function begin(state: FightState | null) {
    qwen.reset()
    boundary = state
    clear()
    diagnostics.reset()
    replays.begin(options.record === false ? null : state)
    career?.begin(state)
  }
  function apply(state: FightState, command: ReplayCommand) {
    if (replays.active) return state
    const after = applyReplayCommand(state, command)
    if (
      state.phase === 'ready' &&
      after.phase === 'fighting' &&
      state.roundNumber === 1 &&
      !replays.practicing
    )
      trackEvent('mode_start', { variant: state.mode, format: state.formatId })
    replays.append(state, [0, 0, 0, [command]], after)
    if (!replays.practicing) boundary = after
    career?.observe(state, after)
    return after
  }
  function flush(state: FightState) {
    const queued = pending
    pending = []
    const commands: ReplayCommand[] = []
    let next = state
    for (const item of queued) {
      if (!fightAcceptsCommands(next)) {
        if (item.command)
          diagnostics.applied({
            id: item.receipt,
            command: item.command,
            before: next,
            after: next,
            now: clock(),
          })
        continue
      }
      const before = next
      if (item.command) {
        commands.push(item.command)
        next = applyReplayCommand(next, item.command)
        diagnostics.applied({
          id: item.receipt,
          command: item.command,
          before,
          after: next,
          now: clock(),
        })
      } else if (item.action) {
        next =
          performFuturePerceptionAction(next, item.side ?? 'player', item.action) ??
          item.action(next)
        commands.push(panelReplayCommand(before, next))
      }
    }
    return { state: next, commands }
  }
  function recordBoundary(state: FightState) {
    if (replays.practicing || !boundary || boundary === state) return
    if (fightReplayHash(boundary) !== fightReplayHash(state))
      replays.append(boundary, [0, 0, 0, [panelReplayCommand(boundary, state)]], state)
  }
  function driveInputs(
    state: FightState,
    input: FightInput,
    settings: { dt: number; opponentInput?: FightInput },
  ) {
    const driven = state.frameAccumulator + settings.dt >= FIXED_STEP ? qwen.step(state) : null
    enqueueDriven(driven)
    return {
      player: packReplayInput(driven?.player ?? input),
      opponent: packReplayInput(driven?.opponent ?? settings.opponentInput ?? EMPTY_INPUT),
    }
  }

  function enqueueDriven(driven: ReturnType<QwenDuel['step']>) {
    if (!driven) return
    for (const command of driven.commands) pending.push({ command, receipt: null })
    for (const utility of driven.utilities)
      pending.push({
        action: (current) =>
          performArsenalAction({ state: current, ...utility }, performAuraAttack),
        side: utility.side,
        receipt: null,
      })
  }

  return {
    qwen,
    replays,
    diagnostics,
    observeFrames(observer: (state: FightState) => void) {
      frameObserver = observer
    },
    begin,
    clear,
    apply,
    seekReplay(packet: number) {
      clear()
      return replays.seek(packet)
    },
    takeoverReplay() {
      clear()
      diagnostics.reset()
      return replays.takeover()
    },
    repeatReplayPractice() {
      clear()
      diagnostics.reset()
      return replays.repeatPractice()
    },
    returnToReplay() {
      clear()
      return replays.returnToReplay()
    },
    enqueue(state: FightState, command: ReplayCommand) {
      if (replays.active || !fightAcceptsCommands(state)) return
      const receipt = diagnostics.receive(state, command, clock())
      if (pending.length >= 64) {
        diagnostics.discard(receipt, 'queue-full')
        return
      }
      pending.push({ command, receipt })
    },
    queue(action: (state: FightState) => FightState) {
      if (!replays.active && pending.length < 64) pending.push({ action, receipt: null })
    },
    advance(
      state: FightState,
      input: FightInput,
      options: { dt: number; opponentInput?: FightInput },
    ): FightState {
      if (replays.active) return replays.advance(options.dt) ?? state
      if (state.phase !== 'fighting') return state
      recordBoundary(state)
      const dt = Math.min(0.05, Math.max(0, options.dt))
      const { player, opponent } = driveInputs(state, input, { ...options, dt })
      const applied =
        state.frameAccumulator + dt >= FIXED_STEP ? flush(state) : { state, commands: [] }
      const after = tickFight(applied.state, unpackReplayInput(player), {
        dt,
        opponentInput: state.mode === 'versus-ai' ? undefined : unpackReplayInput(opponent),
        ai: state.mode === 'versus-ai',
        onFrame: (before, after) => {
          diagnostics.observeFrame(before, after)
          frameObserver?.(after)
          career?.observe(before, after)
        },
      })
      const packet: ReplayPacket = [dt, player, opponent, applied.commands]
      recordCompletion(state, after, replays.practicing)
      replays.append(state, packet, after)
      if (!replays.practicing) boundary = after
      return after
    },
  }
}
export type FightMatchRuntime = ReturnType<typeof createFightMatchRuntime>
