import { get, writable } from 'svelte/store'
import { tickFight } from '../engine'
import { applyReplayCommand } from '../fightReplayCommands'
import { fightAcceptsCommands } from '../fightOutcome'
import { FIXED_STEP } from '../fightClock'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
import type { ReplayCommand } from '../fightReplayTypes'
import { soloEncounter } from './catalogue'
import { createSoloFight } from './setup'
import { initialSoloObjective } from './objectives'
import { driveSoloOpponent } from './opponent'
import { newSoloRun, nextSoloRun, retrySoloRun, observeSoloRun } from './run'
import {
  emptySoloSave,
  loadSoloSave,
  saveSoloProgress,
  completedSoloSave,
  type SoloStorage,
} from './storage'
import type { SoloSession, SoloRun } from './types'

export function createSoloController(options: { storage?: SoloStorage } = {}) {
  const value = writable({
    save: emptySoloSave(),
    session: null as SoloSession | null,
    paused: true,
    issue: null as ReturnType<typeof loadSoloSave>['issue'],
  })
  let storage = options.storage,
    pending: ((state: FightState) => FightState)[] = []
  function checkpoint(run: SoloRun) {
    const current = get(value),
      save = completedSoloSave(current.save, run)
    const stored = saveSoloProgress(storage, save)
    value.set({ ...current, save, issue: stored ? null : 'storage' })
  }
  function install(run: SoloRun) {
    pending = []
    const state = createSoloFight(run)
    const session = { run, state, encounter: soloEncounter(run) }
    value.update((v) => ({ ...v, session, paused: true }))
    return state
  }
  function queue(action: (state: FightState) => FightState) {
    const current = get(value)
    if (current.paused || current.session?.run.status !== 'playing' || pending.length >= 64) return
    if (fightAcceptsCommands(current.session.state)) pending.push(action)
  }
  function publish(session: SoloSession) {
    const previous = get(value).session?.run.status
    value.update((v) => ({ ...v, session, paused: session.run.status !== 'playing' || v.paused }))
    if (previous !== session.run.status && session.run.status !== 'playing') checkpoint(session.run)
  }
  function step(session: SoloSession, input: FightInput): SoloSession {
    let { state, run } = session
    const commands = pending
    pending = []
    for (const apply of commands) {
      const before = state
      state = apply(state)
      run = observeSoloRun(run, before, state)
      if (run.status !== 'playing') return { ...session, state, run }
    }
    state = driveSoloOpponent(state, run)
    const ai = session.encounter.script === 'ai'
    state = tickFight({ ...state, frameAccumulator: 0 }, input, {
      dt: FIXED_STEP,
      ai,
      opponentInput: ai ? undefined : EMPTY_INPUT,
      onFrame: (before, after) => {
        run = observeSoloRun(run, before, after)
      },
    })
    return { ...session, state, run }
  }
  return {
    subscribe: value.subscribe,
    load(provided?: SoloStorage) {
      storage = provided ?? storage
      const { save, issue } = loadSoloSave(storage)
      value.set({ save, issue, session: null, paused: true })
    },
    start(options: Parameters<typeof newSoloRun>[0]) {
      const run = newSoloRun(options)
      const state = install(run)
      checkpoint(run)
      return state
    },
    resume() {
      const saved = get(value).save.run
      if (!saved) return null
      const run = structuredClone(saved)
      if (run.status === 'playing') {
        run.status = 'briefing'
        run.elapsed = run.results.reduce((n, r) => n + r.frames, 0)
        run.score = run.results.reduce((n, r) => n + r.score, 0)
        run.objective = initialSoloObjective(createSoloFight(run))
      }
      return install(run)
    },
    begin() {
      const current = get(value)
      if (current.session?.run.status !== 'briefing') return
      const run = { ...current.session.run, status: 'playing' as const }
      value.set({ ...current, session: { ...current.session, run }, paused: false })
      checkpoint(run)
    },
    next() {
      const run = get(value).session?.run
      if (!run || run.status !== 'won') return null
      const next = nextSoloRun(run),
        state = install(next)
      checkpoint(next)
      return state
    },
    retry() {
      const run = get(value).session?.run
      if (!run) return null
      const next = retrySoloRun(run)
      if (next === run) return null
      const state = install(next)
      checkpoint(next)
      return state
    },
    pause(paused: boolean) {
      pending = []
      value.update((v) => ({ ...v, paused: v.session?.run.status === 'playing' ? paused : true }))
    },
    queue,
    enqueue(command: ReplayCommand) {
      if (!('side' in command) || command.side !== 'player') return
      queue((state) => applyReplayCommand(state, command))
    },
    tick(dt: number, input: FightInput = EMPTY_INPUT): FightState | null {
      const current = get(value),
        session = current.session
      if (!session) return null
      if (current.paused || session.run.status !== 'playing') return session.state
      if (!Number.isFinite(dt) || dt <= 0) return session.state
      let next = session
      let budget = session.state.frameAccumulator + Math.min(0.05, dt)
      while (budget + 1e-9 >= FIXED_STEP && next.run.status === 'playing') {
        next = step(next, input)
        budget = Math.max(0, budget - FIXED_STEP)
      }
      next = { ...next, state: { ...next.state, frameAccumulator: budget } }
      publish(next)
      return next.state
    },
    leave() {
      pending = []
      value.update((v) => ({ ...v, session: null, paused: true }))
    },
  }
}
export type SoloController = ReturnType<typeof createSoloController>
