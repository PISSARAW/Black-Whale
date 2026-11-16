<script lang="ts">
  import { onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
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
    performMove,
    performThrow,
    tickFight,
  } from '$lib/fighting/engine'
  import { type FightFormatId } from '$lib/fighting/formats'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
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
  import {
    attackKeys,
    movementKeys,
    opponentAttackKeys,
    opponentMovementKeys,
  } from './fightingKeys'
  import './fighting.css'

  let selectedPlayer: FighterId = 'kurapika'
  let selectedOpponent: FighterId = 'hisoka'
  let selectedStage: FightStageId = DEFAULT_FIGHT_STAGE
  let selectedFormat: FightFormatId = 'heavens-arena'
  let selectedMode: FightMode = 'versus-ai'
  let state: FightState | null = null
  let input: FightInput = { ...EMPTY_INPUT }
  let opponentInput: FightInput = { ...EMPTY_INPUT }
  /** Presses wait for the next simulated frame instead of landing between two. */
  let pendingActions: Array<(current: FightState) => FightState> = []
  let paused = false
  let recording = false
  let playingRecording = false
  let recordingStartFrame = 0
  let playbackStartFrame = 0
  let playbackIndex = 0
  type DummyCommandData =
    | { type: 'input'; key: keyof FightInput; active: boolean }
    | { type: 'attack'; action: MoveAction | 'ranged' }
  type DummyCommand = DummyCommandData & { frame: number }
  let dummyRecording: DummyCommand[] = []
  let language: 'fr' | 'en'

  $: language = $locale === 'fr' ? 'fr' : 'en'
  $: copy = fightingCopy(language)

  function prepareFight() {
    state = createFight(selectedPlayer, selectedOpponent, {
      formatId: selectedFormat,
      mode: selectedMode,
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
    if (state?.phase === 'fighting' && !paused) pendingActions = [...pendingActions, action]
  }

  function attack(kind: AttackKind) {
    const pressed = { ...input }
    queueAction((current) =>
      kind === 'ranged'
        ? performAuraAttack({ state: current, side: 'player', kind, auraCharged: pressed.aura })
        : performMove({ state: current, side: 'player', action: kind, input: pressed }),
    )
  }

  function finisher() {
    const pressed = { ...input }
    queueAction((current) =>
      performMove({ state: current, side: 'player', action: 'finisher', input: pressed }),
    )
  }

  function throwAttack() {
    queueAction((current) => performThrow(current, 'player'))
  }

  function flushPendingActions(current: FightState): FightState {
    const actions = pendingActions
    pendingActions = []
    return actions.reduce((next, action) => action(next), current)
  }

  function control(key: keyof FightInput, active: boolean) {
    if (paused) return
    input = { ...input, [key]: active }
  }

  function opponentControl(key: keyof FightInput, active: boolean) {
    if (paused || state?.mode === 'versus-ai') return
    opponentInput = { ...opponentInput, [key]: active }
    recordDummy({ type: 'input', key, active })
  }

  function opponentAttack(action: MoveAction | 'ranged') {
    if (!state || paused || state.mode === 'versus-ai') return
    const pressed = { ...opponentInput }
    queueAction((current) =>
      action === 'throw'
        ? performThrow(current, 'opponent')
        : action === 'ranged'
          ? performAuraAttack({
              state: current,
              side: 'opponent',
              kind: action,
              auraCharged: pressed.aura,
            })
          : performMove({ state: current, side: 'opponent', action, input: pressed }),
    )
    recordDummy({ type: 'attack', action })
  }

  function recordDummy(command: DummyCommandData) {
    if (!recording || !state || state.mode !== 'training') return
    dummyRecording = [
      ...dummyRecording,
      { ...command, frame: state.frame - recordingStartFrame } as DummyCommand,
    ]
  }

  function toggleRecording() {
    if (!state || state.mode !== 'training') return
    if (!recording) {
      dummyRecording = []
      recordingStartFrame = state.frame
      playingRecording = false
    }
    recording = !recording
  }

  function playDummyRecording() {
    if (!state || dummyRecording.length === 0) return
    recording = false
    playingRecording = true
    playbackStartFrame = state.frame
    playbackIndex = 0
    opponentInput = { ...EMPTY_INPUT }
  }

  function winnerLabel(current: FightState): string {
    if (current.winner === 'draw') return copy.draw
    return current.winner === 'player' ? copy.victory : copy.defeat
  }

  function finishLabel(current: FightState): string {
    if (current.finishReason === 'time') return 'TIME'
    if (current.finishReason === 'hits') return '10 PTS'
    if (current.finishReason === 'technical-knockout') return 'T.K.O.'
    return 'K.O.'
  }

  function handleKey(event: KeyboardEvent, active: boolean) {
    if (!state) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (handleOpponentKey(event, active, key)) return
    if (handleHatsuKey(event, active, key)) return
    const movement = movementKeys[key]
    if (movement) {
      event.preventDefault()
      control(movement, active)
      return
    }
    if (!active || event.repeat) return
    handleActionKey(key)
  }

  function handleOpponentKey(event: KeyboardEvent, active: boolean, key: string): boolean {
    if (state?.mode === 'versus-ai') return false
    const movement = opponentMovementKeys[key]
    const action = opponentAttackKeys[key]
    if (!movement && !action) return false
    event.preventDefault()
    if (movement) opponentControl(movement, active)
    if (action && active && !event.repeat) opponentAttack(action)
    return true
  }

  function handleActionKey(key: string) {
    if (handlePauseKey(key)) return
    if (paused) return
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
  }

  function handleHatsuKey(event: KeyboardEvent, active: boolean, key: string): boolean {
    if (key !== 'l') return false
    event.preventDefault()
    if (active && !event.repeat) control('hatsu', true)
    if (!active) {
      attack('special')
      control('hatsu', false)
    }
    return true
  }

  function advanceDummyPlayback() {
    if (!state || !playingRecording) return
    const elapsed = state.frame - playbackStartFrame
    while (
      playbackIndex < dummyRecording.length &&
      dummyRecording[playbackIndex].frame <= elapsed
    ) {
      const command = dummyRecording[playbackIndex++]
      if (command.type === 'input') {
        opponentInput = { ...opponentInput, [command.key]: command.active }
      } else {
        opponentAttack(command.action)
      }
    }
    if (playbackIndex >= dummyRecording.length) {
      playingRecording = false
      opponentInput = { ...EMPTY_INPUT }
    }
  }

  onMount(() => {
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
        advanceDummyPlayback()
        const versusAi = state.mode === 'versus-ai'
        state = tickFight(flushPendingActions(state), input, {
          dt,
          opponentInput: versusAi ? undefined : opponentInput,
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

<main class="fighting-shell">
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
      stage={selectedStage}
      format={selectedFormat}
      mode={selectedMode}
      launchLabel={copy.launch}
      playerLabel={copy.player}
      opponentLabel={copy.opponent}
      onPlayer={(id) => (selectedPlayer = id)}
      onOpponent={(id) => (selectedOpponent = id)}
      onStage={(id) => (selectedStage = id)}
      onFormat={(id) => (selectedFormat = id)}
      onMode={(mode) => (selectedMode = mode)}
      onLaunch={prepareFight}
    />
  {:else}
    <div class="stage-wrap">
      <FightStage
        {state}
        {language}
        stageId={selectedStage}
        onAttack={attack}
        onThrow={throwAttack}
        onFinisher={finisher}
        onControl={control}
        training={state.mode === 'training'}
      />

      {#if state.mode === 'training'}
        <FightTrainingTools
          {language}
          {recording}
          playing={playingRecording}
          commandCount={dummyRecording.length}
          onRecord={toggleRecording}
          onPlay={playDummyRecording}
        />
      {/if}

      {#if state.phase === 'fighting'}
        <button type="button" class="pause-fight" aria-pressed={paused} onclick={togglePause}>
          {paused ? (language === 'fr' ? 'Reprendre' : 'Resume') : 'Pause'}
        </button>
      {/if}

      {#if paused && state.phase === 'fighting'}
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
          <p>{finishLabel(state)}</p>
          <h2>{winnerLabel(state)}</h2>
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
  {/if}
</main>
