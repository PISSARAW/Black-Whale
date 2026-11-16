<script lang="ts">
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { createQueuedFightActions } from './fightingQueuedActions'
  import FightLessons from '$lib/components/fighting/FightLessons.svelte'
  import { createFightLessons } from '$lib/fighting/fightLessonController'
  import type { LessonId } from '$lib/fighting/fightLessons'
  import { performTrainingAction } from '$lib/fighting/trainingAction'
  import { createFightControls, dispatchFightKey } from './fightingControls'
  import type { PadAction } from '$lib/fighting/fightGamepad'
  import FightInputSettings from '$lib/components/fighting/FightInputSettings.svelte'
  import {
    resetTraining,
    setTrainingResources,
    setTrainingDummy,
  } from '$lib/fighting/trainingSession'
  import {
    toggleTrainingRecording,
    playTrainingRecording,
    setTrainingLoop,
  } from '$lib/fighting/trainingRecording'
  import type { TrainingPosition } from '$lib/fighting/trainingTypes'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { winnerLabel, finishLabel, canControlFight } from './fightingPageHelpers'
  import FightLynchInterrogation from '$lib/components/fighting/FightLynchInterrogation.svelte'
  import { askLynchQuestion } from '$lib/fighting/lynchAction'
  import { onMount, setContext } from 'svelte'
  import { FIGHT_CONTROLS_CONTEXT } from '$lib/fighting/fightControlHints'
  import { performEasterEgg } from '$lib/fighting/easterEggs'
  import {
    defaultEasterEggPreferences,
    readEasterEggPreferences,
  } from '$lib/fighting/easterEggPreferences'
  import FightHatsuPanels from '$lib/components/fighting/FightHatsuPanels.svelte'
  import { designateBlinkyTarget, selectBlinkyCommand } from '$lib/fighting/blinky'
  import { fightAcceptsCommands } from '$lib/fighting/fightOutcome'
  import { battleStageCallbacks, callFightBody } from './battleCallbacks'
  import Seo from '$lib/components/Seo.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightDisplaySettings from '$lib/components/fighting/FightDisplaySettings.svelte'
  import FightSetup from '$lib/components/fighting/FightSetup.svelte'
  import FightTrainingTools from '$lib/components/fighting/FightTrainingTools.svelte'
  import FightControlsManual from '$lib/components/fighting/FightControlsManual.svelte'
  import { link, locale } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import {
    beginFight,
    createFight,
    nextRound,
    performAuraAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { toggleEmperorTime } from '$lib/fighting/kurapikaActions'
  import { DEFAULT_FIGHT_FORMAT, type FightFormatId } from '$lib/fighting/formats'
  import { fighterDefinition } from '$lib/fighting/roster'
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
  const pendingActions = createQueuedFightActions()
  let comfort = defaultFightComfort()
  let stageElement: HTMLDivElement | undefined
  let showDetails = false
  let hudScale = 1
  let showControls = false
  let paused = false
  let language: 'fr' | 'en'
  let easterEggPreferences = defaultEasterEggPreferences()
  const lessons = createFightLessons()
  const controls = createFightControls(gamepadAction)
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)

  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: copy = fightingCopy(language)
  $: lessons.observe(state)

  function resetFightInputs() {
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
    pendingActions.clear()
    controls.release()
  }

  function startLesson(id: LessonId) {
    resetFightInputs()
    paused = false
    state = lessons.start(id)
  }

  function exitLesson() {
    lessons.exit()
    resetFightInputs()
    if (state) state = setTrainingDummy(state, { behavior: 'idle' })
  }

  function prepareFight() {
    state = createFight(selectedPlayer, selectedOpponent, {
      formatId: selectedFormat,
      mode: selectedMode,
      environment,
    })
    resetFightInputs()
    paused = false
  }

  function startFight() {
    if (state) state = beginFight(state)
  }

  function rematch() {
    prepareFight()
    startFight()
  }

  function continueMatch() {
    if (!state) return
    state = beginFight(nextRound(state))
    resetFightInputs()
  }

  function chooseAgain() {
    state = null
    input = { ...EMPTY_INPUT }
    paused = false
  }

  function queueAction(action: (current: FightState) => FightState) {
    if (state && fightAcceptsCommands(state) && (!paused || state.mode === 'training'))
      pendingActions.push(action)
  }

  function attack(action: AttackKind) {
    const pressed = controls.combine('player', input)
    queueAction((state) => performTrainingAction({ state, side: 'player', action, input: pressed }))
  }

  function finisher() {
    const pressed = controls.combine('player', input)
    queueAction((state) =>
      performTrainingAction({ state, side: 'player', action: 'finisher', input: pressed }),
    )
  }

  function throwAttack() {
    const pressed = controls.combine('player', input)
    queueAction((state) =>
      performTrainingAction({ state, side: 'player', action: 'throw', input: pressed }),
    )
  }

  function callBody() {
    queueAction(callFightBody)
  }

  function control(key: keyof FightInput, active: boolean) {
    if (!canControlFight(state, paused)) return
    input = { ...input, [key]: active }
  }

  function opponentControl(key: keyof FightInput, active: boolean) {
    if ($lessons) return
    if ((paused && state?.mode !== 'training') || state?.mode === 'versus-ai') return
    opponentInput = { ...opponentInput, [key]: active }
  }

  function opponentAttack(action: MoveAction | 'ranged') {
    if ($lessons) return
    if (!state || (paused && state.mode !== 'training') || state.mode === 'versus-ai') return
    const pressed = controls.combine('opponent', opponentInput)
    queueAction((state) =>
      performTrainingAction({ state, side: 'opponent', action, input: pressed }),
    )
  }

  function gamepadAction(side: FightSide, action: PadAction) {
    if (action === 'pause') {
      if (state?.phase === 'ready') startFight()
      else if (state?.phase === 'fighting') togglePause()
      return
    }
    if (side === 'opponent') return opponentAttack(action)
    if (action === 'finisher') return finisher()
    if (action === 'throw') return throwAttack()
    attack(action)
  }

  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state) return
    dispatchFightKey(event, active, {
      state,
      keys: easterEggPreferences.keys,
      input: controls.combine('player', input),
      opponentInput: controls.combine('opponent', opponentInput),
      easter: (side, slot) => queueAction((current) => performEasterEgg(current, side, slot)),
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
    state = tickFight({ ...pendingActions.flush(state), frameAccumulator: 0 }, input, {
      dt: FIXED_STEP,
      opponentInput,
      ai: false,
    })
  }

  onMount(() => {
    easterEggPreferences = readEasterEggPreferences()
    controls.load()
    let frame = 0
    let last = performance.now()
    const keydown = (event: KeyboardEvent) => controls.key(event, true, handleKey)
    const keyup = (event: KeyboardEvent) => controls.key(event, false, handleKey)
    const release = () => {
      resetFightInputs()
    }
    const visibility = () => {
      if (document.hidden && state?.phase === 'fighting') paused = true
      release()
    }
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      controls.poll(state?.mode, Boolean(state?.phase === 'fighting' && !paused))
      if (state?.phase === 'fighting' && !paused) {
        const versusAi = state.mode === 'versus-ai'
        state = tickFight(pendingActions.flush(state), controls.combine('player', input), {
          dt,
          opponentInput: versusAi ? undefined : controls.combine('opponent', opponentInput),
          ai: versusAi,
        })
      }
      frame = requestAnimationFrame(loop)
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', visibility)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', visibility)
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
  <header class="fight-header">
    <nav aria-label="Breadcrumb" class="fight-breadcrumb">
      <a href={$link('/tour/modes')}>{language === 'fr' ? 'Modes jouables' : 'Playable modes'}</a>
      <span>/</span><span>Clash</span>
    </nav>
    <p class="eyebrow">{copy.eyebrow}</p>
    <h1>{copy.title}</h1>
    <p class="intro">{copy.intro}</p>
  </header>

  {#if !state}
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
      <FightDisplaySettings
        bind:comfort
        {language}
        formatId={state.formatId}
        target={stageElement}
        bind:detailed={showDetails}
        bind:hudScale
        bind:showControls
        {paused}
        canPause={state.phase === 'fighting'}
        onPause={togglePause}
        ><FightInputSettings
          {controls}
          {language}
          onEditing={() => {
            if (state?.phase === 'fighting' && !paused) togglePause()
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
          {paused}
          onQuestion={(side, question) =>
            queueAction((current) =>
              askLynchQuestion({ state: current, side, question }, performAuraAttack),
            )}
        />
        <FightHatsuPanels
          {state}
          {language}
          {paused}
          onAction={queueAction}
          perform={performAuraAttack}
          onEditing={() => {
            resetFightInputs()
          }}
        />
        <FightStage
          {comfort}
          {state}
          bind:easterEggPreferences
          onEasterEgg={(side, slot) =>
            queueAction((current) => performEasterEgg(current, side, slot))}
          {language}
          {paused}
          {showControls}
          detailed={showDetails || state.mode === 'training'}
          stageId={state.environment.stageId}
          onAttack={attack}
          onThrow={throwAttack}
          onCall={callBody}
          onFinisher={finisher}
          onEmperor={() => queueAction((current) => toggleEmperorTime(current, 'player'))}
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

        {#if state.mode === 'training' && !$lessons}
          <FightTrainingTools
            {state}
            {language}
            {paused}
            onPause={togglePause}
            onStep={stepLab}
            onReset={resetLab}
            onResources={(side, update) => {
              if (state) state = setTrainingResources(state, side, update)
            }}
            onDummy={(update) => {
              if (state) state = setTrainingDummy(state, update)
            }}
            onRecord={() => {
              if (state) state = toggleTrainingRecording(state)
            }}
            onPlay={() => {
              if (state) {
                state = playTrainingRecording(state)
                opponentInput = { ...EMPTY_INPUT }
              }
            }}
            onLoop={(loop) => {
              if (state) state = setTrainingLoop(state, loop)
            }}
          />
        {/if}

        {#if paused && state.phase === 'fighting' && state.mode !== 'training'}
          <div class="match-overlay pause-overlay">
            <p>{language === 'fr' ? 'COMBAT EN PAUSE' : 'FIGHT PAUSED'}</p>
            <h2>{language === 'fr' ? 'PAUSE' : 'PAUSED'}</h2>
            <button type="button" onclick={togglePause}>
              {language === 'fr' ? 'Reprendre' : 'Resume'}
            </button>
          </div>
        {/if}

        {#if state.phase === 'ready'}
          <div class="match-overlay ready-overlay">
            <p>
              {fighterDefinition(state.player.id).name} <span>VS</span>
              {fighterDefinition(state.opponent.id).name}
            </p>
            <h2>{copy.ready}</h2>
            <button type="button" onclick={startFight}>{copy.fight}</button>
          </div>
        {:else if state.phase === 'finished'}
          <div class="match-overlay result-overlay">
            <p>{finishLabel(state, language)}</p>
            <h2>{winnerLabel(state, copy)}</h2>
            <p>{state.roundsWon.player} — {state.roundsWon.opponent}</p>
            <div>
              {#if state.matchWinner}
                <button type="button" onclick={rematch}>{copy.rematch}</button>
              {:else}
                <button type="button" onclick={continueMatch}>
                  {language === 'fr' ? 'Manche suivante' : 'Next round'}
                </button>
              {/if}
              <button type="button" class="secondary" onclick={chooseAgain}>{copy.roster}</button>
            </div>
          </div>
        {/if}
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
