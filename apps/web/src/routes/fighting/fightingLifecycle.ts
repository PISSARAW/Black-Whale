import { advanceCombatSchool, type CombatSchool } from '$lib/fighting/combatSchool'
import type { ClashPractice } from '$lib/fighting/clashPractice'
import type { FightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
import type { FightInput, FightState } from '$lib/fighting/types'
import { listenFightEvents } from './fightingEvents'
import type { FightControls } from './fightingControls'
import { get } from 'svelte/store'

interface FightPageFrame {
  state: FightState | null
  input: FightInput
  opponentInput: FightInput
  active: boolean
  paused: boolean
}
interface FightLifecycleOptions {
  controls: FightControls
  school: CombatSchool
  practice: ClashPractice
  match: FightMatchRuntime
  read: () => FightPageFrame
  update: (next: FightState) => void
  pause: () => void
  handleKey: (event: KeyboardEvent, active: boolean) => void
  release: () => void
}

function hideFight(options: FightLifecycleOptions) {
  const replays = options.match.replays
  if (replays.active) {
    // The replay controller owns its own pause state.
    if (get(replays).playback?.running) replays.toggle()
  } else if (options.read().state?.phase === 'fighting') options.pause()
}

function advancePage(options: FightLifecycleOptions, dt: number) {
  const beforeInput = options.read()
  const { controls, school, practice, match } = options
  controls.poll(
    beforeInput.state?.mode,
    Boolean(
      beforeInput.active &&
      !beforeInput.paused &&
      beforeInput.state?.phase === 'fighting' &&
      !match.replays.active,
    ),
  )
  // Start/Pause can change the match synchronously while the pads are sampled.
  const frame = options.read()
  if (!frame.state || !frame.active || frame.paused) return
  options.update(
    advanceCombatSchool({
      school,
      match,
      state: frame.state,
      dt,
      input: controls.combine('player', frame.input),
      opponentInput: practice.opponentInput(controls.combine('opponent', frame.opponentInput)),
    }),
  )
}

/** A single clock and input listener set shared by all Clash pages. */
export function mountFightingPage(options: FightLifecycleOptions): () => void {
  let frame = 0
  let last = performance.now()
  const stopEvents = listenFightEvents({
    controls: options.controls,
    handleKey: options.handleKey,
    release: options.release,
    hidden: () => hideFight(options),
  })
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    advancePage(options, dt)
    frame = requestAnimationFrame(loop)
  }
  frame = requestAnimationFrame(loop)
  return () => {
    options.match.qwen.dispose()
    cancelAnimationFrame(frame)
    stopEvents()
  }
}
