<script lang="ts">
  import { link } from '$lib/i18n'
  import { historicalSequenceFinished } from '$lib/fighting/heavensDeathMatch/library'
  import { onMount } from 'svelte'
  import FightStage from './FightStage.svelte'
  import FightFullscreenButton from './FightFullscreenButton.svelte'
  import { enterFightFullscreen, mountFightViewport } from '$lib/fighting/fightFullscreen'
  import FightPauseMenu from './FightPauseMenu.svelte'
  import FightPauseOverview from './FightPauseOverview.svelte'
  import FightPauseDisplay from './FightPauseDisplay.svelte'
  import FightPauseTechniques from './FightPauseTechniques.svelte'
  import FightChrolloLiveBook from './FightChrolloLiveBook.svelte'
  import FightPauseTraining from './FightPauseTraining.svelte'
  import FightActiveObjective from './FightActiveObjective.svelte'
  import FightMatchOverlays from './FightMatchOverlays.svelte'
  import FightMoveList from './FightMoveList.svelte'
  import FightControlsManual from './FightControlsManual.svelte'
  import FightInputSettings from './FightInputSettings.svelte'
  import FightReplays from './FightReplays.svelte'
  import FightAudioSettings from './FightAudioSettings.svelte'
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { DEFAULT_FIGHT_AUDIO } from '$lib/fighting/audio/director'
  import { fightStage } from '$lib/fighting/stages'
  import { fightFormat } from '$lib/fighting/formats'
  import { battleStageCallbacks, callFightBody } from '../../../routes/fighting/battleCallbacks'
  import type { FightControls } from '../../../routes/fighting/fightingControls'
  import type { FightBattleActions } from '$lib/fighting/fightBattleActions'
  import type { FightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import type { FightReplayController } from '$lib/fighting/fightReplayController'
  import type { ReplayReviewActions } from '$lib/fighting/fightReplayReview'
  import type { FightPausePlan } from '$lib/fighting/fightPausePlan'
  import type { CombatSchool } from '$lib/fighting/combatSchool'
  import type { ClashPractice } from '$lib/fighting/clashPractice'
  import type { FightLessonsController } from '$lib/fighting/fightLessonController'
  import type { FightState } from '$lib/fighting/types'
  import {
    readHudModePreference,
    resolveFightHudMode,
    saveHudModePreference,
    toggleHudModePreference,
    type FightHudModePreference,
  } from '$lib/fighting/perception/hudMode'
  import { defaultEasterEggPreferences } from '$lib/fighting/easterEggPreferences'
  import './fightBattle.css'
  export let language: 'fr' | 'en'
  export let state: FightState
  export let paused: boolean
  export let controls: FightControls
  export let actions: FightBattleActions
  export let replays: FightReplayController
  export let pausePlan: FightPausePlan
  export let diagnostics: FightMatchRuntime['diagnostics']
  export let audioSeek = 0
  export let lessons: FightLessonsController
  export let school: CombatSchool
  export let practice: ClashPractice
  export let easterEggPreferences = defaultEasterEggPreferences()
  export let replayActions: {
    onOpen: (id: string) => void
    onClose: () => void
    onRestart: () => void
    review?: ReplayReviewActions
  }
  let victoryActive = false
  let target: HTMLDivElement
  let comfort = defaultFightComfort()
  let audioSettings = { ...DEFAULT_FIGHT_AUDIO }
  let detailed = false
  let hudScale = 1
  let hudModePreference: FightHudModePreference = 'auto'
  let hudPreferenceLoaded = false
  let controlMode = 'auto'
  let touchDevice = false
  let pauseTab = 'overview'
  const bindings = useFightBindings()
  $: fr = language === 'fr'
  $: stage = fightStage(state.environment.stageId)
  $: format = fightFormat(state.formatId)
  $: hudMode = resolveFightHudMode({ state, replay: replays.active, preference: hudModePreference })
  $: if (hudPreferenceLoaded && typeof window !== 'undefined') {
    saveHudModePreference(hudModePreference, window.localStorage)
  }
  $: pausedView = paused || Boolean($replays.playback && !$replays.playback.running)
  $: showControls = controlMode === 'on' || (controlMode === 'auto' && touchDevice)
  $: hasTraining = state.mode === 'training' || Boolean($school || $lessons || practice.active)
  $: introEnabled = !$replays.playback && !hasTraining
  function menuKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.repeat || event.defaultPrevented || paused) return
    event.preventDefault()
    actions.togglePause()
  }
  onMount(() => {
    hudModePreference = readHudModePreference(window.localStorage)
    hudPreferenceLoaded = true
    const pointer = window.matchMedia(
      '(any-pointer: coarse), (max-width: 600px), (max-width: 1000px) and (max-height: 600px)',
    )
    const update = () => (touchDevice = pointer.matches)
    update()
    pointer.addEventListener('change', update)
    return () => pointer.removeEventListener('change', update)
  })
</script>

<svelte:window onkeydown={menuKey} />
<div
  class="clash-battle"
  class:with-touch={showControls}
  bind:this={target}
  use:mountFightViewport
  style={`--hud-scale:${hudScale}`}
>
  <header class="battle-bar">
    <div class="battle-identity">
      <strong>CLASH<span>/</span></strong><span>{fr ? format.titleFr : format.titleEn}</span><i
      ></i><span>{fr ? stage.nameFr : stage.nameEn}</span>
    </div>
    <div class="battle-actions">
      <button
        type="button"
        class="battle-menu-button hud-mode-toggle"
        aria-pressed={hudMode === 'omniscient'}
        title={fr
          ? 'Basculer entre HUD tactique (HxH) et HUD complet'
          : 'Switch between tactical (HxH) HUD and full HUD'}
        onclick={() => (hudModePreference = toggleHudModePreference(hudMode))}
      >
        {hudMode === 'omniscient'
          ? fr
            ? 'HUD complet'
            : 'Full HUD'
          : fr
            ? 'HUD tactique'
            : 'Tactical HUD'}
      </button>
      <FightFullscreenButton {language} {target} compact />
      <button
        type="button"
        class="battle-menu-button pause-fight"
        aria-label={fr ? 'Ouvrir le menu pause' : 'Open pause menu'}
        aria-haspopup="dialog"
        aria-expanded={paused}
        onclick={actions.togglePause}
        ><span aria-hidden="true">Ⅱ</span>
        {fr ? 'Menu pause' : 'Pause menu'}<kbd
          >{$bindings.pause.toUpperCase()} / {fr ? 'Échap' : 'Esc'}</kbd
        ></button
      >
    </div>
  </header>
  <div class="battle-surface match-area" tabindex="-1">
    <FightStage
      {state}
      {language}
      {comfort}
      {showControls}
      {detailed}
      {hudMode}
      minimal
      {introEnabled}
      onIntroComplete={actions.startFight}
      onMoves={() => {
        pauseTab = 'moves'
        actions.togglePause()
      }}
      bind:victoryActive
      victoryEnabled={!$replays.playback}
      showRecovery={state.mode === 'training' || Boolean($replays.playback)}
      victoryPaused={pausedView}
      paused={pausedView}
      training={state.mode === 'training' && detailed}
      stageId={state.environment.stageId}
      bind:audioSettings
      {audioSeek}
      bind:easterEggPreferences
      onEasterEgg={(side, slot) => actions.queueCommand({ kind: 'easter', side, slot })}
      onAttack={actions.attack}
      onThrow={actions.throwAttack}
      onCall={() => actions.queueAction(callFightBody)}
      onFinisher={actions.finisher}
      onEmperor={() => actions.queueCommand({ kind: 'emperor', side: 'player' })}
      onBlinkyTarget={actions.blinkyTarget}
      onBlinkyCommand={actions.blinkyCommand}
      onOpponentControl={actions.opponentControl}
      onControl={actions.control}
      {...battleStageCallbacks(actions.queueAction)}
    >
      <FightActiveObjective {language} {lessons} {school} {practice} />
    </FightStage>
    {#if historicalSequenceFinished(state.deathMatch)}
      <div class="historical-sequence-end" role="status">
        <strong>{fr ? 'Séquence terminée' : 'Sequence complete'}</strong>
        <a href={$link('/fighting/historical')}
          >{fr ? 'Retour au combat historique' : 'Back to the historical fight'}</a
        >
      </div>
    {/if}
    {#if state.player.id === 'chrollo' && state.phase === 'fighting' && !pausedView && !replays.active && !victoryActive}
      <FightChrolloLiveBook {state} {language} {actions} />
    {/if}
    {#if !paused && !victoryActive}<FightMatchOverlays
        {state}
        {language}
        replay={replays.active}
        {introEnabled}
        startFight={() => {
          if (touchDevice) void enterFightFullscreen(target)
          actions.startFight()
        }}
        rematch={actions.rematch}
        continueMatch={actions.continueMatch}
        chooseAgain={actions.chooseAgain}
        quitFight={actions.quitFight}
      />{/if}
    {#if $replays.playback}<span class="battle-replay-label" role="status"
        >REPLAY · {Math.floor($replays.playback.elapsed)} / {Math.ceil($replays.playback.duration)}s {#if $replays.playback.finished}·
          {fr ? 'Terminé' : 'Finished'}{/if}</span
      >{/if}
  </div>
  {#if paused}
    <FightPauseMenu
      {language}
      bind:tab={pauseTab}
      training={hasTraining && !replays.active}
      onResume={actions.togglePause}
    >
      {#if pauseTab === 'overview'}<FightPauseOverview
          {state}
          {language}
          replay={replays.active}
          canRematch={!$lessons && !$school && !practice.active}
          onRematch={actions.rematch}
          onChoose={actions.chooseAgain}
          onQuit={actions.quitFight}
        />
      {:else if pauseTab === 'techniques'}<FightPauseTechniques
          {state}
          {language}
          {actions}
          replay={replays.active}
          queued={$pausePlan}
          bind:easterEggPreferences
        />
      {:else if pauseTab === 'moves'}<div class="pause-moves-page">
          <h3>{fr ? 'Coups & combos' : 'Moves & combos'}</h3>
          <p>
            {fr
              ? 'Maintiens une direction et touche une attaque pour choisir sa variante. Enchaîne les coups dans les fenêtres de combo. Hatsu : maintiens pour charger, relâche pour lancer.'
              : 'Hold a direction and tap an attack to choose its variant. Chain attacks during combo windows. Hatsu: hold to charge, release to perform.'}
          </p>
          <FightMoveList {language} fighterId={state.player.id} touch={showControls} />
        </div>
      {:else if pauseTab === 'controls'}<div class="pause-controls-page">
          <FightInputSettings {controls} {language} inline onEditing={actions.resetFightInputs} />
          <details class="pause-movelist">
            <summary>{fr ? 'Liste des coups & techniques' : 'Move list & techniques'}</summary
            ><FightControlsManual
              {language}
              fighterId={state.player.id}
              mode={state.mode}
              title={fr ? 'Commandes et techniques' : 'Controls and techniques'}
            />
          </details>
        </div>
      {:else if pauseTab === 'settings'}<FightPauseDisplay
          {language}
          {target}
          bind:comfort
          bind:detailed
          bind:hudScale
          bind:hudModePreference
          bind:controlMode
        /><FightAudioSettings {language} bind:settings={audioSettings} inline />
      {:else if pauseTab === 'replays'}<FightReplays
          {replays}
          {language}
          {...replayActions}
          expanded
        />
      {:else if pauseTab === 'training'}<FightPauseTraining
          bind:state
          {language}
          {actions}
          {school}
          {practice}
          {lessons}
          {diagnostics}
          replay={replays.active}
        />{/if}
    </FightPauseMenu>
  {/if}
</div>

<style>
  .historical-sequence-end {
    position: absolute;
    z-index: 40;
    inset: auto 0 15%;
    margin: auto;
    width: fit-content;
    display: grid;
    gap: 0.75rem;
    background: #181517ed;
    color: #fff6e5;
    padding: 1rem 1.5rem;
    text-align: center;
  }
  .historical-sequence-end a {
    color: #e9cda0;
  }
</style>
