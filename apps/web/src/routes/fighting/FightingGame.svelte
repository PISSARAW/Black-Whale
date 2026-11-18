<script lang="ts">
  import { clashCareer } from '$lib/fighting/career/profile'
  import { createCareerTracker } from '$lib/fighting/career/runtime'
  import { createCombatSchool } from '$lib/fighting/combatSchool'
  import { createClashPractice } from '$lib/fighting/clashPractice'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import type { ReplayCommand } from '$lib/fighting/fightReplayTypes'
  import { mountFightingPage } from './fightingLifecycle'
  import { createFightLessons } from '$lib/fighting/fightLessonController'
  import type { LessonId } from '$lib/fighting/fightLessons'
  import { createFightControls, dispatchFightKey } from './fightingControls'
  import { coarsePointer } from '$lib/fighting/controlSchemePreference'
  import type { PadAction } from '$lib/fighting/fightGamepad'
  import { resetTraining, setTrainingDummy } from '$lib/fighting/trainingSession'
  import type { TrainingPosition } from '$lib/fighting/trainingTypes'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { canControlFight } from './fightingPageHelpers'
  import { onMount, setContext } from 'svelte'
  import { FIGHT_CONTROLS_CONTEXT } from '$lib/fighting/fightControlHints'
  import {
    defaultEasterEggPreferences,
    readEasterEggPreferences,
  } from '$lib/fighting/easterEggPreferences'
  import { designateBlinkyTarget, selectBlinkyCommand } from '$lib/fighting/blinky'
  import { fightAcceptsCommands } from '$lib/fighting/fightOutcome'
  import FightGameSeo from '$lib/components/fighting/FightGameSeo.svelte'
  import FightBattle from '$lib/components/fighting/FightBattle.svelte'
  import { createFightPausePlan } from '$lib/fighting/fightPausePlan'
  import type { FightBattleActions } from '$lib/fighting/fightBattleActions'
  import FightGameShell from '$lib/components/fighting/FightGameShell.svelte'
  import FightLobby from '$lib/components/fighting/FightLobby.svelte'
  import { page } from '$app/stores'
  import { goto, afterNavigate } from '$app/navigation'
  import { fightScreen } from '$lib/fighting/fightNavigation'
  import { readFightSetup, saveFightSetup } from '$lib/fighting/fightSetupDraft'
  import { link, locale } from '$lib/i18n'
  import { createFight } from '$lib/fighting/engine'
  import { withChosenKameos } from '$lib/fighting/kameos/selection'
  import { DEFAULT_FIGHT_FORMAT, type FightFormatId } from '$lib/fighting/formats'
  import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
  import {
    EMPTY_INPUT,
    type AttackKind,
    type FightInput,
    type FightMode,
    type FightState,
    type FightSide,
    type FighterId,
    type MoveAction,
  } from '$lib/fighting/types'
  import { attackKeys } from './fightingKeys'
  import './fighting.css'
  import './fightingMatch.css'
  let mounted = false
  $: screen = fightScreen($page.url.pathname)
  $: if (mounted)
    saveFightSetup({
      player: selectedPlayer,
      opponent: selectedOpponent,
      environment,
      format: selectedFormat,
      mode: selectedMode,
    })
  const navigate = (destination: string) => void goto($link(`/fighting/${destination}`))
  afterNavigate(() => {
    if (screen === 'battle') return
    paused = !replays.active
    resetFightInputs()
    if ($replays.playback?.running) replays.toggle()
  })
  let selectedPlayer: FighterId = 'kurapika'
  let selectedOpponent: FighterId = 'hisoka'
  let environment = createFightEnvironment({ arenaInteractions: true })
  let selectedFormat: FightFormatId = DEFAULT_FIGHT_FORMAT
  let selectedMode: FightMode = 'versus-ai'
  let state: FightState | null = null
  let input: FightInput = { ...EMPTY_INPUT }
  let opponentInput: FightInput = { ...EMPTY_INPUT }
  /** Presses wait for the next simulated frame instead of landing between two. */
  const match = createFightMatchRuntime(undefined, {
    career: createCareerTracker(clashCareer.record),
  })
  const pausePlan = createFightPausePlan()
  const replays = match.replays
  const diagnostics = match.diagnostics
  const replayActions = {
    onOpen: openReplay,
    onClose: closeReplay,
    onRestart: restartReplay,
    review: {
      seek: seekReplay,
      takeover: takeoverReplay,
      repeat: repeatReplayPractice,
      returnToReplay,
    },
  }
  let replayReturnPaused = false
  let paused = false
  let language: 'fr' | 'en'
  let easterEggPreferences = defaultEasterEggPreferences()
  const lessons = createFightLessons()
  const practice = createClashPractice()
  const school = createCombatSchool()

  match.observeFrames((next) => {
    practice.observe(next)
    school.observe(next)
  })
  const controls = createFightControls(gamepadAction)
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)
  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: if (!replays.active) {
    lessons.observe(state)
    practice.observe(state)
  }
  function resetFightInputs() {
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
    match.clear()
    school.release()
    controls.release()
  }
  function startLesson(id: LessonId) {
    pausePlan.clear()
    navigate('battle')
    school.exit()
    resetFightInputs()
    paused = false
    practice.exit()
    state = lessons.start(id)
    match.begin(state)
  }
  function exitLesson() {
    lessons.exit()
    resetFightInputs()
    if (state) state = setTrainingDummy(state, { behavior: 'idle' })
  }
  function prepareFight() {
    pausePlan.clear()
    lessons.exit()
    navigate('battle')
    school.exit()
    practice.exit()
    const options = {
      formatId: selectedFormat,
      mode: selectedMode,
      environment,
      controls: controls.schemesFor(selectedMode, coarsePointer()),
    }
    state = withChosenKameos(createFight(selectedPlayer, selectedOpponent, options))
    resetFightInputs()
    match.begin(state)
    paused = false
  }
  function startFight() {
    paused = false
    if (state) state = match.apply(state, { kind: 'start' })
  }
  function rematch() {
    prepareFight()
    startFight()
  }
  function continueMatch() {
    if (!state) return
    state = match.apply(state, { kind: 'round' })
    resetFightInputs()
  }
  const chooseAgain = () => leaveFight('characters')
  const quitFight = () => leaveFight('')
  function leaveFight(destination: string) {
    pausePlan.clear()
    lessons.exit()
    navigate(destination)
    school.exit()
    practice.exit()
    state = null
    match.begin(null)
    resetFightInputs()
    paused = false
  }
  function queueAction(action: (current: FightState) => FightState) {
    if (!state || !fightAcceptsCommands(state) || replays.active) return
    if (paused) pausePlan.action(action)
    else match.queue(action)
  }
  function queueCommand(command: ReplayCommand) {
    if (!state || replays.active) return
    if (paused) pausePlan.command(command)
    else match.enqueue(state, command)
  }
  function sendMove(side: FightSide, action: MoveAction | 'ranged') {
    if (school.demonstrating) return
    if (
      side === 'opponent' &&
      ($lessons || practice.active || school.active || state?.mode === 'versus-ai')
    )
      return
    const pressed = controls.combine(side, side === 'player' ? input : opponentInput)
    queueCommand({ kind: 'move', side, action, input: packReplayInput(pressed) })
  }
  const attack = (action: AttackKind) => sendMove('player', action)
  const finisher = () => sendMove('player', 'finisher')
  const throwAttack = () => sendMove('player', 'throw')
  const opponentAttack = (action: MoveAction | 'ranged') => sendMove('opponent', action)
  function control(key: keyof FightInput, active: boolean) {
    if (paused || !canControlFight(state, paused)) return
    input = { ...input, [key]: active }
  }
  function opponentControl(key: keyof FightInput, active: boolean) {
    if ($lessons || practice.active || school.active) return
    if (paused || state?.mode === 'versus-ai') return
    opponentInput = { ...opponentInput, [key]: active }
  }
  function gamepadAction(side: FightSide, action: PadAction) {
    if (screen !== 'battle') return
    if (action === 'pause') {
      if (state?.phase === 'ready' && !paused) startFight()
      else togglePause()
      return
    }
    if (!paused) sendMove(side, action)
  }
  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state || screen !== 'battle') return
    if (paused) {
      if (active && !event.repeat) handlePauseKey(event.key)
      return
    }
    dispatchFightKey(event, active, {
      state,
      keys: easterEggPreferences.keys,
      input: controls.combine('player', input),
      opponentInput: controls.combine('opponent', opponentInput),
      easter: (side, slot) => queueCommand({ kind: 'easter', side, slot }),
      control,
      opponentControl,
      opponentAttack,
      attack,
      action: handleActionKey,
    })
  }
  function handleActionKey(key: string) {
    if (handlePauseKey(key)) return
    if (paused || !canControlFight(state, paused)) return
    if (key === 'o') return throwAttack()
    if (key === 'h') return finisher()
    const attackKind = attackKeys[key]
    if (attackKind) return attack(attackKind)
    if (key === 'Enter' && state?.phase === 'ready') startFight()
  }
  function handlePauseKey(key: string): boolean {
    if (key !== 'p') return false
    togglePause()
    return true
  }
  function togglePause() {
    paused = !paused
    resetFightInputs()
    if (!paused && state) pausePlan.flush({ match, state })
  }
  function resetLab(position: TrainingPosition) {
    if (!state) return
    state = resetTraining(state, position)
    resetFightInputs()
  }
  function stepLab() {
    if (!state || state.mode !== 'training' || !paused) return
    pausePlan.flush({ match, state })
    state = match.advance({ ...state, frameAccumulator: 0 }, input, {
      dt: FIXED_STEP,
      opponentInput,
    })
  }
  function launchPractice(next: FightState | null) {
    pausePlan.clear()
    navigate(next ? 'battle' : 'academy')
    lessons.exit()
    resetFightInputs()
    state = next
    match.begin(next)
    paused = false
  }
  function openReplay(id: string) {
    pausePlan.clear()
    if (!replays.active) replayReturnPaused = paused
    resetFightInputs()
    paused = false
    state = replays.open(id, state)
    if (!replays.active) paused = replayReturnPaused
    else navigate('battle')
  }
  function closeReplay() {
    pausePlan.clear()
    state = replays.close()
    navigate(state ? 'battle' : 'replays')
    paused = replayReturnPaused
    resetFightInputs()
  }
  function restartReplay() {
    state = replays.restart()
    resetFightInputs()
  }
  function seekReplay(packet: number) {
    const next = match.seekReplay(packet)
    if (next) state = next
    resetFightInputs()
  }
  function takeoverReplay() {
    const next = match.takeoverReplay()
    if (!next) return
    pausePlan.clear()
    lessons.exit()
    school.exit()
    practice.exit()
    state = next
    paused = false
    resetFightInputs()
  }
  function repeatReplayPractice() {
    const next = match.repeatReplayPractice()
    if (next) {
      state = next
      paused = false
      resetFightInputs()
    }
  }
  function returnToReplay() {
    const next = match.returnToReplay()
    if (next) {
      state = next
      paused = false
      resetFightInputs()
    }
  }
  const battleActions: FightBattleActions = {
    attack,
    throwAttack,
    finisher,
    control,
    opponentControl,
    queueAction,
    queueCommand,
    togglePause,
    startFight,
    rematch,
    continueMatch,
    chooseAgain,
    quitFight,
    resetLab,
    stepLab,
    resetFightInputs,
    startLesson,
    exitLesson,
    launchPractice,
    resetPlayback: () => (opponentInput = { ...EMPTY_INPUT }),
    blinkyTarget: (side, target) => {
      if (state) state = designateBlinkyTarget(state, side, target)
    },
    blinkyCommand: (side, command) => {
      if (state) state = selectBlinkyCommand(state, side, command)
    },
  }
  onMount(() => {
    clashCareer.load()
    const draft = readFightSetup()
    selectedPlayer = draft.player
    selectedOpponent = draft.opponent
    environment = draft.environment
    selectedFormat = draft.format
    selectedMode = draft.mode
    mounted = true
    if (screen === 'battle' && !state) void goto($link('/fighting/options'), { replaceState: true })
    easterEggPreferences = readEasterEggPreferences()
    controls.load()
    void replays.load()
    return mountFightingPage({
      controls,
      school,
      practice,
      match,
      handleKey,
      release: resetFightInputs,
      read: () => ({ state, input, opponentInput, active: screen === 'battle', paused }),
      update: (next) => (state = next),
      pause: () => (paused = true),
    })
  })
</script>

<FightGameSeo {language} />
<FightGameShell {language} {screen} playing={screen === 'battle' && Boolean(state)}>
  {#if screen !== 'battle' || !state}
    <FightLobby
      {language}
      {screen}
      player={selectedPlayer}
      opponent={selectedOpponent}
      {environment}
      format={selectedFormat}
      mode={selectedMode}
      {controls}
      {lessons}
      {school}
      {practice}
      {replays}
      {replayActions}
      onPlayer={(id) => (selectedPlayer = id)}
      onOpponent={(id) => (selectedOpponent = id)}
      onEnvironment={(next) => (environment = next)}
      onFormat={(id) => (selectedFormat = id)}
      onMode={(mode) => (selectedMode = mode)}
      onLaunch={prepareFight}
      onLesson={startLesson}
      onPractice={launchPractice}
      onExit={resetFightInputs}
    />
  {:else}
    <FightBattle
      bind:state
      {language}
      {paused}
      {controls}
      actions={battleActions}
      {replays}
      {pausePlan}
      {diagnostics}
      qwen={match.qwen}
      {lessons}
      {school}
      {practice}
      {replayActions}
      bind:easterEggPreferences
    />
  {/if}
</FightGameShell>
