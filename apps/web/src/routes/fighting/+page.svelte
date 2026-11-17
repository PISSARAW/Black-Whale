<script lang="ts">
  import { createReplayReviewActions } from '$lib/fighting/fightReplayReviewActions'
  import { clashCareer } from '$lib/fighting/career/profile'
  import { createCareerTracker } from '$lib/fighting/career/runtime'
  import FightMatchOverlays from '$lib/components/fighting/FightMatchOverlays.svelte'
  import FightCombatSchool from '$lib/components/fighting/FightCombatSchool.svelte'
  import { createCombatSchool, advanceCombatSchool } from '$lib/fighting/combatSchool'
  import { createClashPractice } from '$lib/fighting/clashPractice'
  import FightPracticeHub from '$lib/components/fighting/FightPracticeHub.svelte'
  import FightLabSession from '$lib/components/fighting/FightLabSession.svelte'
  import FightReplays from '$lib/components/fighting/FightReplays.svelte'
  import FightResponseDiagnostics from '$lib/components/fighting/FightResponseDiagnostics.svelte'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import type { ReplayCommand } from '$lib/fighting/fightReplayTypes'
  import { listenFightEvents } from './fightingEvents'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import FightLessons from '$lib/components/fighting/FightLessons.svelte'
  import { createFightLessons } from '$lib/fighting/fightLessonController'
  import type { LessonId } from '$lib/fighting/fightLessons'
  import { createFightControls, dispatchFightKey } from './fightingControls'
  import type { PadAction } from '$lib/fighting/fightGamepad'
  import FightInputSettings from '$lib/components/fighting/FightInputSettings.svelte'
  import { resetTraining, setTrainingDummy } from '$lib/fighting/trainingSession'
  import type { TrainingPosition } from '$lib/fighting/trainingTypes'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { canControlFight } from './fightingPageHelpers'
  import FightLynchInterrogation from '$lib/components/fighting/FightLynchInterrogation.svelte'
  import { askLynchQuestion } from '$lib/fighting/lynchAction'
  import { onMount, setContext } from 'svelte'
  import { FIGHT_CONTROLS_CONTEXT } from '$lib/fighting/fightControlHints'
  import {
    defaultEasterEggPreferences,
    readEasterEggPreferences,
  } from '$lib/fighting/easterEggPreferences'
  import FightHatsuPanels from '$lib/components/fighting/FightHatsuPanels.svelte'
  import { designateBlinkyTarget, selectBlinkyCommand } from '$lib/fighting/blinky'
  import { fightAcceptsCommands } from '$lib/fighting/fightOutcome'
  import { battleStageCallbacks, callFightBody } from './battleCallbacks'
  import Seo from '$lib/components/Seo.svelte'
  import FightPageNavigation from '$lib/components/fighting/FightPageNavigation.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightDisplaySettings from '$lib/components/fighting/FightDisplaySettings.svelte'
  import FightSetup from '$lib/components/fighting/FightSetup.svelte'
  import FightControlsManual from '$lib/components/fighting/FightControlsManual.svelte'
  import { link, locale } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { createFight, performAuraAttack } from '$lib/fighting/engine'
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
  import { fightingCopy } from './fightingCopy'
  import { attackKeys } from './fightingKeys'
  import './fighting.css'
  import './fightingMatch.css'
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
  const replays = match.replays
  const diagnostics = match.diagnostics
  const replayActions = {
    onOpen: openReplay,
    onClose: closeReplay,
    onRestart: restartReplay,
    review: createReplayReviewActions({
      match,
      release: resetFightInputs,
      update: (next) => {
        state = next
        paused = false
      },
      onTakeover: () => {
        lessons.exit()
        school.exit()
        practice.exit()
      },
    }),
  }
  let victoryActive = false
  let replayReturnPaused = false
  let comfort = defaultFightComfort()
  let stageElement: HTMLDivElement | undefined
  let showDetails = false
  let hudScale = 1
  let showControls = false
  let paused = false
  let language: 'fr' | 'en'
  let easterEggPreferences = defaultEasterEggPreferences()
  const lessons = createFightLessons()
  const practice = createClashPractice()
  const school = createCombatSchool()
  const schoolActions = {
    onLaunch: launchPractice,
    beforeLaunch: practice.exit,
    onExit: resetFightInputs,
  }
  match.observeFrames((next) => {
    practice.observe(next)
    school.observe(next)
  })
  const controls = createFightControls(gamepadAction)
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)
  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: copy = fightingCopy(language)
  $: pausedView = paused || Boolean($replays.playback && !$replays.playback.running)
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
    school.exit()
    practice.exit()
    state = createFight(selectedPlayer, selectedOpponent, {
      formatId: selectedFormat,
      mode: selectedMode,
      environment,
    })
    resetFightInputs()
    match.begin(state)
    paused = false
  }
  function startFight() {
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
  function chooseAgain() {
    school.exit()
    practice.exit()
    state = null
    match.begin(null)
    resetFightInputs()
    paused = false
  }
  function queueAction(action: (current: FightState) => FightState) {
    if (state && fightAcceptsCommands(state) && (!paused || state.mode === 'training'))
      match.queue(action)
  }
  function queueCommand(command: ReplayCommand) {
    if (state && (!paused || state.mode === 'training')) match.enqueue(state, command)
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
    if (!canControlFight(state, paused)) return
    input = { ...input, [key]: active }
  }
  function opponentControl(key: keyof FightInput, active: boolean) {
    if ($lessons || practice.active || school.active) return
    if ((paused && state?.mode !== 'training') || state?.mode === 'versus-ai') return
    opponentInput = { ...opponentInput, [key]: active }
  }
  function gamepadAction(side: FightSide, action: PadAction) {
    if (action === 'pause') {
      if (replays.active) {
        replays.toggle()
        return
      }
      if (state?.phase === 'ready') startFight()
      else if (state?.phase === 'fighting') togglePause()
      return
    }
    sendMove(side, action)
  }
  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state) return
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
    if (!canControlFight(state, paused)) return
    if (key === 'o') return throwAttack()
    if (key === 'h') return finisher()
    const attackKind = attackKeys[key]
    if (attackKind) return attack(attackKind)
    if (key === 'Enter' && state?.phase === 'ready') startFight()
  }
  function handlePauseKey(key: string): boolean {
    if (key !== 'p' || state?.phase !== 'fighting') return false
    togglePause()
    return true
  }
  function togglePause() {
    if (replays.active) {
      replays.toggle()
      return
    }
    paused = !paused
    resetFightInputs()
  }
  function resetLab(position: TrainingPosition) {
    if (!state) return
    state = resetTraining(state, position)
    resetFightInputs()
  }
  function stepLab() {
    if (!state || state.mode !== 'training' || !paused) return
    state = match.advance({ ...state, frameAccumulator: 0 }, input, {
      dt: FIXED_STEP,
      opponentInput,
    })
  }
  function launchPractice(next: FightState | null) {
    lessons.exit()
    resetFightInputs()
    state = next
    match.begin(next)
    paused = false
  }
  function openReplay(id: string) {
    if (!replays.active) replayReturnPaused = paused
    resetFightInputs()
    paused = false
    state = replays.open(id, state)
    if (!replays.active) paused = replayReturnPaused
  }
  function closeReplay() {
    state = replays.close()
    paused = replayReturnPaused
    resetFightInputs()
  }
  function restartReplay() {
    state = replays.restart()
    resetFightInputs()
  }
  onMount(() => {
    clashCareer.load()
    easterEggPreferences = readEasterEggPreferences()
    controls.load()
    void replays.load()
    let frame = 0
    let last = performance.now()
    const stopEvents = listenFightEvents({
      controls,
      handleKey,
      release: resetFightInputs,
      hidden: () => {
        if (replays.active) {
          if ($replays.playback?.running) replays.toggle()
        } else if (state?.phase === 'fighting') paused = true
      },
    })
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      controls.poll(state?.mode, Boolean(state?.phase === 'fighting' && !paused && !replays.active))
      if (state && !paused)
        state = advanceCombatSchool({
          school,
          match,
          state,
          input: controls.combine('player', input),
          dt,
          opponentInput: practice.opponentInput(controls.combine('opponent', opponentInput)),
        })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      stopEvents()
    }
  })
</script>

<Seo
  title="Black Whale: Clash — Duel 2D"
  description={copy.intro}
  jsonLd={breadcrumbSchema([
    { name: 'Black Whale', path: $link('/') },
    { name: language === 'fr' ? 'Modes jouables' : 'Playable modes', path: $link('/tour/modes') },
    { name: 'Black Whale: Clash', path: $link('/fighting') },
  ])}
/>
<main class="fighting-shell" class:is-playing={Boolean(state)}>
  <FightPageNavigation />
  <header class="fight-header">
    <p class="eyebrow">{copy.eyebrow}</p>
    <h1>{copy.title}</h1>
    <p class="intro">{copy.intro}</p>
  </header>

  {#if !replays.active && !$school}<FightPracticeHub
      {practice}
      {state}
      {language}
      fighter={selectedPlayer}
      onLaunch={launchPractice}
    />{/if}
  {#if !state}
    <FightCombatSchool {school} {language} {...schoolActions} />
    <FightReplays {replays} {language} {...replayActions} />
    <FightLessons {lessons} {language} onStart={startLesson} />
    <FightSetup
      {language}
      player={selectedPlayer}
      opponent={selectedOpponent}
      {environment}
      format={selectedFormat}
      mode={selectedMode}
      launchLabel={copy.launch}
      playerLabel={copy.player}
      opponentLabel={copy.opponent}
      onPlayer={(id) => (selectedPlayer = id)}
      onOpponent={(id) => (selectedOpponent = id)}
      onEnvironment={(next) => (environment = next)}
      onFormat={(id) => (selectedFormat = id)}
      onMode={(mode) => (selectedMode = mode)}
      onLaunch={prepareFight}
    />
  {:else}
    <div class="stage-wrap" bind:this={stageElement} style={`--hud-scale:${hudScale}`}>
      {#if !replays.active}<FightCombatSchool {school} {language} {...schoolActions} />{/if}
      {#if !$lessons && !$school}<FightReplays {replays} {language} {...replayActions} />{/if}
      <FightDisplaySettings
        bind:comfort
        {language}
        formatId={state.formatId}
        target={stageElement}
        bind:detailed={showDetails}
        bind:hudScale
        bind:showControls
        paused={pausedView}
        canPause={state.phase === 'fighting'}
        onPause={togglePause}
        ><FightInputSettings
          {controls}
          {language}
          onEditing={() => {
            if (state?.phase === 'fighting' && !pausedView) togglePause()
            resetFightInputs()
          }}
        /></FightDisplaySettings
      >
      <FightLessons
        {lessons}
        {language}
        presentation="panel"
        onStart={startLesson}
        onExit={exitLesson}
      />
      <div class="match-area">
        <FightLynchInterrogation
          {state}
          {language}
          paused={pausedView}
          onQuestion={(side, question) =>
            queueAction((current) =>
              askLynchQuestion({ state: current, side, question }, performAuraAttack),
            )}
        />
        <FightHatsuPanels
          {state}
          {language}
          paused={pausedView}
          onAction={queueAction}
          perform={performAuraAttack}
          onEditing={() => {
            resetFightInputs()
          }}
        />
        <FightStage
          bind:victoryActive
          victoryEnabled={!$replays.playback}
          victoryPaused={pausedView}
          {comfort}
          {state}
          bind:easterEggPreferences
          onEasterEgg={(side, slot) => queueCommand({ kind: 'easter', side, slot })}
          {language}
          paused={pausedView}
          {showControls}
          detailed={showDetails || state.mode === 'training'}
          stageId={state.environment.stageId}
          onAttack={attack}
          onThrow={throwAttack}
          onCall={() => queueAction(callFightBody)}
          onFinisher={finisher}
          onEmperor={() => queueCommand({ kind: 'emperor', side: 'player' })}
          onBlinkyTarget={(side, target) => {
            if (state) state = designateBlinkyTarget(state, side, target)
          }}
          onBlinkyCommand={(side, command) => {
            if (state) state = selectBlinkyCommand(state, side, command)
          }}
          onOpponentControl={opponentControl}
          onControl={control}
          {...battleStageCallbacks(queueAction)}
          training={state.mode === 'training'}
        />

        {#if state.mode === 'training' && !$lessons && !practice.active && !replays.active && !$school}
          <FightResponseDiagnostics {diagnostics} {language} />
          <FightLabSession
            bind:state
            {language}
            paused={pausedView}
            onPause={togglePause}
            onStep={stepLab}
            onReset={resetLab}
            onPlayback={() => (opponentInput = { ...EMPTY_INPUT })}
          />
        {/if}
        {#if !victoryActive}<FightMatchOverlays
            {state}
            {language}
            {paused}
            replay={replays.active}
            {togglePause}
            {startFight}
            {rematch}
            {continueMatch}
            {chooseAgain}
          />{/if}
      </div>
    </div>

    <details class="fight-manual">
      <summary>{language === 'fr' ? 'Commandes et techniques' : 'Controls and techniques'}</summary>
      <FightControlsManual
        {language}
        fighterId={state.player.id}
        mode={state.mode}
        title={copy.controls}
      />
    </details>
  {/if}
</main>
