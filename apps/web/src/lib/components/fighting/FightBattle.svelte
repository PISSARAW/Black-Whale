<script lang="ts">
  import { onMount } from 'svelte'
  import FightStage from './FightStage.svelte'
  import { parallelFutureCamera } from '$lib/fighting/parallelFutureCamera'
  import type { PerceivedResultAction } from '$lib/fighting/futurePerceptionResults'
  import FightQwenControl from './FightQwenControl.svelte'
  import { supportsQwenDuel } from '$lib/fighting/qwen/observation'
  import type { QwenDuel } from '$lib/fighting/qwen/duel'
  import FightKurapikaLiveChains from './FightKurapikaLiveChains.svelte'
  import FightChrolloLiveBook from './FightChrolloLiveBook.svelte'
  import FightHisokaLiveGum from './FightHisokaLiveGum.svelte'
  import FightFullscreenButton from './FightFullscreenButton.svelte'
  import { enterFightFullscreen, mountFightViewport } from '$lib/fighting/fightFullscreen'
  import FightPauseMenu from './FightPauseMenu.svelte'
  import FightPauseOverview from './FightPauseOverview.svelte'
  import FightPauseDisplay from './FightPauseDisplay.svelte'
  import FightPauseTechniques from './FightPauseTechniques.svelte'
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
  import type { FightSide, FightState } from '$lib/fighting/types'
  import { defaultEasterEggPreferences } from '$lib/fighting/easterEggPreferences'
  import './fightBattle.css'
  export let language: 'fr' | 'en'
  export let qwen: QwenDuel | undefined = undefined
  export let state: FightState
  export let paused: boolean
  export let controls: FightControls
  export let actions: FightBattleActions
  export let replays: FightReplayController
  export let pausePlan: FightPausePlan
  export let diagnostics: FightMatchRuntime['diagnostics']
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
  let controlMode = 'auto'
  let touchDevice = false
  let pauseTab = 'overview'
  const bindings = useFightBindings()
  $: fr = language === 'fr'
  $: stage = fightStage(state.environment.stageId)
  $: format = fightFormat(state.formatId)
  $: pausedView = paused || Boolean($replays.playback && !$replays.playback.running)
  $: showControls = controlMode === 'on' || (controlMode === 'auto' && touchDevice)
  $: hasTraining = state.mode === 'training' || Boolean($school || $lessons || practice.active)
  $: introEnabled = !replays.active && state.mode !== 'training'
  $: visibleState = parallelFutureCamera(state, 'player').main
  function resultAction(action: PerceivedResultAction) {
    if (state.phase !== 'finished') {
      actions.queueCommand({ kind: 'perceived-result', action })
      return
    }
    if (action === 'continue') actions.continueMatch()
    else actions.rematch()
  }
  function menuKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.repeat || event.defaultPrevented || paused) return
    event.preventDefault()
    actions.togglePause()
  }
  onMount(() => {
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
  {#if qwen && supportsQwenDuel(state) && !$replays.playback}
    <FightQwenControl {qwen} disabled={paused || state.phase === 'finished'} />
  {/if}
  <div class="battle-surface match-area" tabindex="-1">
    <FightStage
      {state}
      {language}
      {comfort}
      {showControls}
      {detailed}
      minimal
      {introEnabled}
      onIntroComplete={actions.startFight}
      onMoves={() => {
        pauseTab = 'moves'
        actions.togglePause()
      }}
      bind:victoryActive
      victoryEnabled={!$replays.playback}
      victoryPaused={pausedView}
      paused={pausedView}
      training={state.mode === 'training' && detailed}
      stageId={state.environment.stageId}
      bind:audioSettings
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
      {#if state.player.id === 'kurapika' && state.phase === 'fighting' && !pausedView}
        <FightKurapikaLiveChains
          state={visibleState}
          {language}
          {actions}
          replay={Boolean($replays.playback)}
        />
      {/if}
      {#each ['player', 'opponent'] as seat (seat)}
        {@const side = seat as FightSide}
        {#if state[side].id === 'hisoka' && (side === 'player' || state.mode === 'versus-local') && state.phase === 'fighting' && !pausedView}
          <FightHisokaLiveGum state={visibleState} {language} {actions} {side} />
        {/if}
        {#if state[side].id === 'chrollo' && (side === 'player' || state.mode === 'versus-local') && state.phase === 'fighting' && !pausedView}
          <FightChrolloLiveBook
            state={visibleState}
            {language}
            {actions}
            {side}
            readOnly={Boolean($replays.playback)}
          />
        {/if}
      {/each}
    </FightStage>
    {#if !paused && !victoryActive}<FightMatchOverlays
        state={visibleState}
        {language}
        replay={replays.active}
        {introEnabled}
        startFight={() => {
          if (touchDevice) void enterFightFullscreen(target)
          actions.startFight()
        }}
        rematch={() => resultAction('rematch')}
        continueMatch={() => resultAction('continue')}
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
          state={visibleState}
          {language}
          replay={replays.active}
          canRematch={!$lessons && !$school && !practice.active}
          onRematch={actions.rematch}
          onChoose={actions.chooseAgain}
          onQuit={actions.quitFight}
        />
      {:else if pauseTab === 'techniques'}<FightPauseTechniques
          state={visibleState}
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
