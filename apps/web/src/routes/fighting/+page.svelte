<script lang="ts">
  import { performTrainingAction } from '$lib/fighting/trainingAction'
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
  import { ignoresFightKey, dispatchOpponentKey, dispatchHatsuKey } from './fightingKeyboard'
  import { winnerLabel, finishLabel, handleEasterKey, canControlFight } from './fightingPageHelpers'
  import FightLynchInterrogation from '$lib/components/fighting/FightLynchInterrogation.svelte'
  import { askLynchQuestion } from '$lib/fighting/lynchAction'
  import { onMount } from 'svelte'
  import { performEasterEgg } from '$lib/fighting/easterEggs'
  import {
    defaultEasterEggPreferences,
    readEasterEggPreferences,
  } from '$lib/fighting/easterEggPreferences'
  import FightHatsuPanels from '$lib/components/fighting/FightHatsuPanels.svelte'
  import { designateBlinkyTarget, selectBlinkyCommand } from '$lib/fighting/blinky'
  import { fightAcceptsCommands } from '$lib/fighting/fightOutcome'
  import { callHanzoBody } from '$lib/fighting/hanzoBodyCall'
  import { battleStageCallbacks } from './battleCallbacks'
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
    type FighterId,
    type MoveAction,
  } from '$lib/fighting/types'
  import { fightingCopy } from './fightingCopy'
  import { attackKeys, movementKeys } from './fightingKeys'
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
  let pendingActions: Array<(current: FightState) => FightState> = []
  let stageElement: HTMLDivElement | undefined
  let showDetails = false
  let hudScale = 1
  let showControls = false
  let paused = false
  let language: 'fr' | 'en'
  let easterEggPreferences = defaultEasterEggPreferences()

  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: copy = fightingCopy(language)

  function prepareFight() {
    state = createFight(selectedPlayer, selectedOpponent, {
      formatId: selectedFormat,
      mode: selectedMode,
      environment,
    })
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
    pendingActions = []
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
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
  }

  function chooseAgain() {
    state = null
    input = { ...EMPTY_INPUT }
    paused = false
  }

  function queueAction(action: (current: FightState) => FightState) {
    if (state && fightAcceptsCommands(state) && (!paused || state.mode === 'training'))
      pendingActions = [...pendingActions, action]
  }

  function attack(action: AttackKind) {
    const pressed = { ...input }
    queueAction((state) => performTrainingAction({ state, side: 'player', action, input: pressed }))
  }

  function finisher() {
    const pressed = { ...input }
    queueAction((state) =>
      performTrainingAction({ state, side: 'player', action: 'finisher', input: pressed }),
    )
  }

  function throwAttack() {
    queueAction((state) => performTrainingAction({ state, side: 'player', action: 'throw' }))
  }

  function callBody() {
    queueAction((current) => callHanzoBody(current, 'player'))
  }

  function flushPendingActions(current: FightState): FightState {
    const actions = pendingActions
    pendingActions = []
    return actions.reduce(
      (next, action) => (fightAcceptsCommands(next) ? action(next) : next),
      current,
    )
  }

  function control(key: keyof FightInput, active: boolean) {
    if (!canControlFight(state, paused)) return
    input = { ...input, [key]: active }
  }

  function opponentControl(key: keyof FightInput, active: boolean) {
    if ((paused && state?.mode !== 'training') || state?.mode === 'versus-ai') return
    opponentInput = { ...opponentInput, [key]: active }
  }

  function opponentAttack(action: MoveAction | 'ranged') {
    if (!state || (paused && state.mode !== 'training') || state.mode === 'versus-ai') return
    const pressed = { ...opponentInput }
    queueAction((state) =>
      performTrainingAction({ state, side: 'opponent', action, input: pressed }),
    )
  }

  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state) return
    if (ignoresFightKey(event, active)) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (
      handleEasterKey(
        event,
        { active, state, keys: easterEggPreferences.keys, input, opponentInput },
        (side, slot) => queueAction((current) => performEasterEgg(current, side, slot)),
      )
    )
      return
    if (
      dispatchOpponentKey(event, active, {
        mode: state.mode,
        control: opponentControl,
        attack: opponentAttack,
      })
    )
      return
    if (dispatchHatsuKey(event, active, { control, attack })) return
    const movement = movementKeys[key]
    if (movement) {
      event.preventDefault()
      control(movement, active)
      return
    }
    if (!active || event.repeat) return
    handleActionKey(key)
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
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
    pendingActions = []
  }

  function resetLab(position: TrainingPosition) {
    if (!state) return
    state = resetTraining(state, position)
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
    pendingActions = []
  }

  function stepLab() {
    if (!state || state.mode !== 'training' || !paused) return
    state = tickFight({ ...flushPendingActions(state), frameAccumulator: 0 }, input, {
      dt: FIXED_STEP,
      opponentInput,
      ai: false,
    })
  }

  onMount(() => {
    easterEggPreferences = readEasterEggPreferences()
    let frame = 0
    let last = performance.now()
    const keydown = (event: KeyboardEvent) => handleKey(event, true)
    const keyup = (event: KeyboardEvent) => handleKey(event, false)
    const release = () => {
      input = { ...EMPTY_INPUT }
      opponentInput = { ...EMPTY_INPUT }
    }
    const visibility = () => {
      if (document.hidden && state?.phase === 'fighting') paused = true
      release()
    }
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (state?.phase === 'fighting' && !paused) {
        const versusAi = state.mode === 'versus-ai'
        state = tickFight(
          flushPendingActions(state),
          { ...input },
          {
            dt,
            opponentInput: versusAi ? undefined : { ...opponentInput },
            ai: versusAi,
          },
        )
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
        {language}
        formatId={state.formatId}
        target={stageElement}
        bind:detailed={showDetails}
        bind:hudScale
        bind:showControls
        {paused}
        canPause={state.phase === 'fighting'}
        onPause={togglePause}
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
            input = { ...EMPTY_INPUT }
            opponentInput = { ...EMPTY_INPUT }
          }}
        />
        <FightStage
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

        {#if state.mode === 'training'}
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
        movement={copy.movement}
        jump={copy.jump}
        attacks={copy.attacks}
        aura={copy.aura}
      />
    </details>
  {/if}
</main>
