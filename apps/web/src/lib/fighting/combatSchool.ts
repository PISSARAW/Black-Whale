import { get, writable } from 'svelte/store'
import { combatRoute, combatRoutesFor, type CombatFighter, type CombatRoute } from './combatRoutes'
import {
  COMBAT_ROUTE_AIR_OPENING_FRAME,
  createCombatRouteFight,
  combatRouteAction,
  combatRouteInput,
} from './combatRouteFight'
import {
  initialCombatProgress,
  observeCombatRoute,
  observeCombatDefense,
  type CombatProgress,
} from './combatSchoolProgress'
import { canStartFighterAttack } from './fighterAttacks'
import { recoveryFinishReady, recoveryFinishStep } from './combatRouteContacts'
import { moveForSlot } from './movesets'
import { setTrainingDummy } from './trainingSession'
import { packReplayInput } from './fightReplayInput'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'
import type { ReplayCommand } from './fightReplayTypes'
import { FIXED_STEP } from './fightClock'
import { comboSupportInput, waitingForComboSupport } from './kameos/comboLessons'
import {
  beginWakeup,
  DEFAULT_WAKEUP,
  observeWakeup,
  prepareWakeupFight,
  wakeupDefenderCommand,
  wakeupDemoCommand,
  wakeupDemoInput,
  wakeupGuard,
  type WakeupProgress,
  type WakeupSettings,
} from './combatWakeupPractice'
import {
  isSignatureLesson,
  observeSignatureLesson,
  signatureDemoAction,
  signatureDemoCommand,
  signatureDemoInput,
  startSignatureLesson,
  type SignatureProgress,
} from './signatureSchool'
import { performArsenalAction } from './arsenalExecution'
import { performAuraAttack } from './engine'
import type { ArsenalCommand } from './retrospectiveTypes'
import {
  WHIFF_PUNISH_START,
  whiffDemonstrationInput,
  whiffPunishReady,
} from './combatWhiffPractice'

interface SchoolProgress extends CombatProgress {
  wakeup?: WakeupProgress
  wakeupSettings?: WakeupSettings
  signature?: true
}
const signatureOf = (progress: SchoolProgress | null) =>
  progress?.signature ? (progress as SignatureProgress) : null

export function createCombatSchool() {
  const view = writable<SchoolProgress | null>(null)
  let sentStep = -1
  let opponentAt = -1000
  let whiffAt = 0
  let wakeupSent = { player: false, opponent: false }
  let signatureSentAt = -1
  function definition(id: string) {
    return id.endsWith(':defense')
      ? combatRoutesFor(id.split(':')[0] as CombatFighter)[0]
      : combatRoute(id)
  }
  return {
    subscribe: view.subscribe,
    get active() {
      return get(view) !== null
    },
    get demonstrating() {
      return get(view)?.demo === true
    },
    get useFixedTiming() {
      const current = get(view)
      return Boolean(
        current?.signature ||
        current?.wakeupSettings ||
        (current && definition(current.id).kameo) ||
        (current?.demo && definition(current.id).whiff),
      )
    },
    start(id: string, demo = false, wakeup: Partial<WakeupSettings> = DEFAULT_WAKEUP): FightState {
      return isSignatureLesson(id) ? startSignature(id, demo) : startRoute(id, demo, wakeup)
    },
    release() {
      sentStep = -1
      if (opponentAt >= 0 && get(view)?.lastFrame === opponentAt) opponentAt = -1000
    },
    exit() {
      view.set(null)
    },
    observe(state: FightState) {
      const current = get(view)
      if (!current) return
      const signature = signatureOf(current)
      if (signature) return observeSignature(signature, state)
      const route = definition(current.id)
      if (
        state.mode !== 'training' ||
        state.player.id !== route.fighter ||
        state.frame < current.lastFrame
      ) {
        view.set(null)
        return
      }
      const next = observeSchoolProgress(current, state, route)
      if (next !== current) view.set(next)
    },
    input(state: FightState, input: FightInput): FightInput {
      const current = get(view)
      if (!current?.demo) return input
      const signature = signatureOf(current)
      if (signature) return signatureInput(signature, state)
      if (current.wakeup && current.wakeupSettings)
        return current.wakeup.result ? EMPTY_INPUT : wakeupDemoInput(state, current.wakeupSettings)
      const route = definition(current.id)
      if (current.complete || current.failed) return EMPTY_INPUT
      return demonstrationInput(state, route, { step: current.step, whiffAt })
    },
    opponentInput(input: FightInput): FightInput {
      const current = get(view)
      if (!current) return input
      if (current.signature) return EMPTY_INPUT
      if (current.wakeup && current.wakeupSettings)
        return wakeupGuard(current.wakeup, current.wakeupSettings.reaction)
      const route = definition(current.id)
      if (recoveryFinishStep(route, current.step)) return EMPTY_INPUT
      return openingGuard(current, route)
    },
    wakeupCommands(state: FightState): ReplayCommand[] {
      const current = get(view)
      if (!current?.wakeup || current.wakeup.result || !current.wakeupSettings) return []
      const { wakeup, wakeupSettings } = current
      const player =
        current.demo && !wakeupSent.player
          ? wakeupDemoCommand(state, wakeup, wakeupSettings.followup)
          : undefined
      const opponent = !wakeupSent.opponent
        ? wakeupDefenderCommand(state, wakeup, wakeupSettings.reaction)
        : undefined
      if (sentWakeupAttack(player)) wakeupSent.player = true
      if (opponent) wakeupSent.opponent = true
      return [player, opponent].filter((entry) => entry !== undefined)
    },
    command(state: FightState): ReplayCommand | null {
      const signature = signatureOf(get(view))
      return signature ? signatureCommand(signature, state) : routeCommand(state)
    },
    /** A Hatsu command of a signature demonstration that is not an attack. */
    action(state: FightState): ArsenalCommand | null {
      const signature = signatureOf(get(view))
      if (!signature || state.frame <= signatureSentAt) return null
      const command = signatureDemoAction(signature, state)
      if (command) signatureSentAt = state.frame
      return command
    },
  }
  function startRoute(id: string, demo: boolean, wakeup: Partial<WakeupSettings>): FightState {
    const settings: WakeupSettings = { ...DEFAULT_WAKEUP, ...wakeup }
    const route = definition(id)
    if (!route) throw Error('Unknown combat exercise')
    sentStep = -1
    opponentAt = -1000
    wakeupSent = { player: false, opponent: false }
    const progress = initialCombatProgress(id, demo, Boolean(route.whiff))
    view.set(route.wakeup ? { ...progress, wakeupSettings: settings } : progress)
    // A common, genuinely punishable heavy keeps this lesson stable across personal links.
    const defensePartner = id.endsWith(':defense') ? ('benjamin' as const) : undefined
    const state = createCombatRouteFight(route, defensePartner)
    whiffAt = state.frame + WHIFF_PUNISH_START
    if (route.wakeup) return prepareWakeupFight(state, settings)
    if (route.kameo) {
      const x = settings.position === 'corner' ? 93 : 50
      return {
        ...state,
        player: { ...state.player, x: x - 6 },
        opponent: { ...state.opponent, x },
      }
    }
    return defensePartner
      ? setTrainingDummy(
          { ...state, player: { ...state.player, x: state.opponent.x - 4 } },
          { behavior: 'manual' },
        )
      : state
  }
  function routeCommand(state: FightState): ReplayCommand | null {
    const current = get(view)
    if (!current || current.complete || current.failed) return null
    if (current.id.endsWith(':defense')) {
      const command = defenseCommand(current, state, opponentAt)
      if (command) opponentAt = state.frame
      return command
    }
    const practice = definition(current.id).whiff
    if (practice && state.frame >= whiffAt && opponentAt < 0) {
      opponentAt = state.frame
      return { kind: 'move', side: 'opponent', action: 'heavy', input: 0 }
    }
    const command = demonstrationCommand(current, state, sentStep)
    if (command) sentStep = current.step
    return command
  }
  function startSignature(id: string, demo: boolean): FightState {
    const lesson = startSignatureLesson(id, demo)
    signatureSentAt = -1
    view.set(lesson.progress)
    return lesson.state
  }
  function observeSignature(progress: SignatureProgress, state: FightState) {
    if (state.mode !== 'training' || state.frame < progress.lastFrame) return view.set(null)
    const next = observeSignatureLesson(progress, state)
    if (next !== progress) view.set(next)
  }
  function signatureInput(progress: SignatureProgress, state: FightState): FightInput {
    const { input, tapFrom } = signatureDemoInput(progress, state)
    const next: SignatureProgress = { ...progress, tapFrom }
    if (tapFrom !== progress.tapFrom) view.set(next)
    return input
  }
  function signatureCommand(progress: SignatureProgress, state: FightState) {
    if (state.frame <= signatureSentAt) return null
    const command = signatureDemoCommand(progress, state)
    if (command) signatureSentAt = state.frame
    return command
  }
}
export type CombatSchool = ReturnType<typeof createCombatSchool>

function sentWakeupAttack(command: ReturnType<typeof wakeupDemoCommand>): boolean {
  return command !== undefined && command.action !== 'special'
}

function openingGuard(current: SchoolProgress, route: CombatRoute): FightInput {
  return current.wakeupSettings || route.recoveryFinish
    ? { ...EMPTY_INPUT, guard: current.lastImpact > 0 }
    : EMPTY_INPUT
}

function demonstrationInput(
  state: FightState,
  route: CombatRoute,
  timing: { step: number; whiffAt: number },
) {
  const { step, whiffAt } = timing
  if (route.kameo) return comboSupportInput(state, route.kameo, step)
  return route.whiff
    ? whiffDemonstrationInput(state, route.whiff, { at: whiffAt, step })
    : { ...EMPTY_INPUT, jump: route.kind === 'air' && state.frame < 4 }
}

function observeSchoolProgress(
  current: SchoolProgress,
  state: FightState,
  route: CombatRoute,
): SchoolProgress {
  if (current.wakeup) {
    const wakeup = observeWakeup(state, current.wakeup)
    return wakeup === current.wakeup ? current : { ...current, wakeup }
  }
  if (current.id.endsWith(':defense')) return observeCombatDefense(current, state)
  const next = observeCombatRoute(current, state, route)
  if (route.wakeup && next.complete) return { ...next, wakeup: beginWakeup(state) }
  return next
}

interface CombatSchoolFrame {
  school: CombatSchool
  match: import('./fightMatchRuntime').FightMatchRuntime
  state: FightState
  input: FightInput
  opponentInput: FightInput
  dt: number
}

export function advanceCombatSchool(options: CombatSchoolFrame): FightState {
  const { school, match, state } = options
  if (match.replays.active)
    return match.advance(state, options.input, {
      dt: options.dt,
      opponentInput: options.opponentInput,
    })
  if (school.useFixedTiming) return advanceTimedSchool(options)
  return advanceSchoolFrame(options)
}

function advanceTimedSchool(options: CombatSchoolFrame): FightState {
  let state = options.state
  let remaining = Math.min(options.dt, 0.05)
  // The short recovery window is measured in simulation frames, even at a lower render rate.
  while (remaining > FIXED_STEP) {
    state = advanceSchoolFrame({ ...options, state, dt: FIXED_STEP })
    remaining -= FIXED_STEP
  }
  return advanceSchoolFrame({ ...options, state, dt: remaining })
}

function advanceSchoolFrame(options: CombatSchoolFrame): FightState {
  const { school, match, state } = options
  const command = school.command(state)
  if (command) match.enqueue(state, command)
  const action = school.action(state)
  if (action)
    match.queue((current) =>
      performArsenalAction({ state: current, side: 'player', command: action }, performAuraAttack),
    )
  if (state.frameAccumulator + options.dt >= FIXED_STEP)
    for (const queued of school.wakeupCommands(state)) match.enqueue(state, queued)
  return match.advance(state, school.input(state, options.input), {
    dt: options.dt,
    opponentInput: school.opponentInput(options.opponentInput),
  })
}

function defenseCommand(
  progress: CombatProgress,
  state: FightState,
  opponentAt: number,
): ReplayCommand | null {
  if (progress.step > 0 || state.frame < 30 || state.frame - opponentAt < 120) return null
  return { kind: 'move', side: 'opponent', action: 'heavy', input: 0 }
}

function demonstrationOpeningReady(state: FightState, route: CombatRoute): boolean {
  if (route.kind === 'air' && state.frame < COMBAT_ROUTE_AIR_OPENING_FRAME) return false
  return !route.whiff || whiffPunishReady(state, route.whiff)
}

function demonstrationCommand(
  progress: CombatProgress,
  state: FightState,
  sentStep: number,
): ReplayCommand | null {
  if (!progress.demo || sentStep === progress.step) return null
  const route = combatRoute(progress.id)
  if (progress.step >= route.moves.length) return null
  const slot = route.moves[progress.step]
  if (!canDemonstrateStep(state, route, progress.step)) return null
  return {
    kind: 'move',
    side: 'player',
    action: combatRouteAction(slot),
    input: packReplayInput(combatRouteInput(slot, state.player.facing)),
  }
}

function canDemonstrateStep(state: FightState, route: CombatRoute, step: number): boolean {
  const move = moveForSlot(route.fighter, route.moves[step])!
  if (waitingForComboSupport(state, route, { step, startup: move.tuning.startup })) return false
  if (step === 0 && !demonstrationOpeningReady(state, route)) return false
  if (recoveryFinishStep(route, step) && !recoveryFinishReady(state)) return false
  return (
    state.player.attack?.moveId !== move.id &&
    canStartFighterAttack(state.player, move.kind, move.id)
  )
}
