import { get } from 'svelte/store'
import { createFightControls, dispatchFightKey } from '../../src/routes/fighting/fightingControls'
import { createFightMatchRuntime } from '../../src/lib/fighting/fightMatchRuntime'
import { defaultEasterEggPreferences } from '../../src/lib/fighting/easterEggPreferences'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
} from '../../src/lib/fighting/types'
import type { PadAction } from '../../src/lib/fighting/fightGamepad'
import type { DrawnFight } from './renderProbe'

interface Trial {
  source: 'keyboard-event' | 'simulated-gamepad-state'
  receivedAt: number
  queuedAt?: number
  executedAt?: number
  drawnAt?: number
  frame?: number
  queueMs?: number
  outcome?: string
}

export function createQualificationInput() {
  const runtime = createFightMatchRuntime()
  let state: FightState
  let held = { ...EMPTY_INPUT },
    opponent = { ...EMPTY_INPUT }
  let paused = false,
    inputAt = 0,
    source: Trial['source'] = 'keyboard-event'
  let marker: Trial | null = null
  let trials: Trial[] = []
  let drawn: DrawnFight | null = null
  let simulated = false,
    padPressed = false
  const controls = createFightControls((side, action) => command(side, action))
  const realPads = navigator.getGamepads.bind(navigator)
  const pad = () => ({
    index: 0,
    id: 'Simulated Xbox standard controller',
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, (_, index) => ({
      pressed: index === 0 && padPressed,
      value: Number(index === 0 && padPressed),
    })),
  })
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    value: () => (simulated ? [pad()] : realPads()),
  })

  function command(side: FightSide, action: PadAction) {
    if (action === 'pause') {
      paused = !paused
      release()
      return
    }
    if (paused) return
    if (!marker) {
      marker = { source, receivedAt: inputAt || performance.now(), queuedAt: performance.now() }
      trials.push(marker)
    }
    const current = controls.combine(side, side === 'player' ? held : opponent)
    runtime.enqueue(state, { kind: 'move', side, action, input: packReplayInput(current) })
  }
  function control(key: keyof FightInput, active: boolean) {
    held = { ...held, [key]: active }
  }
  function key(event: KeyboardEvent, active: boolean) {
    if (!state) return
    source = 'keyboard-event'
    inputAt = performance.now()
    controls.key(event, active, (mapped, down) =>
      dispatchFightKey(mapped, down, {
        state,
        keys: defaultEasterEggPreferences().keys,
        input: held,
        opponentInput: opponent,
        easter: () => {},
        control,
        opponentControl: (name, value) => {
          opponent = { ...opponent, [name]: value }
        },
        opponentAttack: (action) => command('opponent', action),
        attack: (action) =>
          command('player', action === 'special' ? 'special' : (action as PadAction)),
        action: (logical) => {
          const actions: Record<string, PadAction> = {
            j: 'light',
            k: 'heavy',
            u: 'ranged',
            o: 'throw',
            h: 'finisher',
            p: 'pause',
          }
          if (actions[logical]) command('player', actions[logical])
        },
      }),
    )
  }
  function release() {
    held = { ...EMPTY_INPUT }
    opponent = { ...EMPTY_INPUT }
    padPressed = false
    controls.release()
    runtime.clear()
  }
  const down = (event: KeyboardEvent) => key(event, true)
  const up = (event: KeyboardEvent) => key(event, false)
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', release)
  return {
    reset(initial: FightState) {
      release()
      state = structuredClone(initial)
      paused = false
      marker = null
      drawn = null
      runtime.begin(state)
    },
    advance(dt: number) {
      controls.poll(state.mode, !paused)
      if (simulated) padPressed = false
      if (!paused)
        state = runtime.advance(state, controls.combine('player', held), {
          dt,
          opponentInput: controls.combine('opponent', opponent),
        })
      const attempt = get(runtime.diagnostics).at(-1)
      if (marker && attempt?.outcome === 'executed' && marker.executedAt === undefined) {
        marker.executedAt = performance.now()
        marker.frame = attempt.executedFrame
        marker.queueMs = attempt.queueMs
        marker.outcome = attempt.outcome
      }
      return state
    },
    draw(sample: DrawnFight) {
      drawn = sample
      if (
        marker?.executedAt !== undefined &&
        marker.drawnAt === undefined &&
        sample.moveId === `${state.player.id}:standingLight`
      )
        marker.drawnAt = performance.now()
    },
    ready() {
      return Boolean(drawn && drawn.moveId === null && !marker)
    },
    completed() {
      return marker?.drawnAt !== undefined
    },
    simulatedPad(on: boolean) {
      simulated = on
      release()
    },
    pressPad() {
      source = 'simulated-gamepad-state'
      inputAt = performance.now()
      padPressed = true
    },
    result() {
      return trials.map((trial) => ({
        ...trial,
        drawMs: trial.drawnAt === undefined ? null : trial.drawnAt - trial.receivedAt,
        executionMs: trial.executedAt === undefined ? null : trial.executedAt - trial.receivedAt,
      }))
    },
    clearResults() {
      trials = []
    },
    pause(on: boolean) {
      paused = on
      release()
    },
    snapshot() {
      return { state, held, opponent, paused, attempts: get(runtime.diagnostics) }
    },
    dispose() {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: realPads })
    },
  }
}
