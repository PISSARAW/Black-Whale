<script lang="ts">
  import type { ReplayReviewActions } from '$lib/fighting/fightReplayReview'
  import { goto } from '$app/navigation'
  import { link } from '$lib/i18n'
  import type { FightScreen } from '$lib/fighting/fightNavigation'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FightFormatId } from '$lib/fighting/formats'
  import type { FightMode, FighterId, FightState } from '$lib/fighting/types'
  import type { FightSide } from '$lib/fighting/types'
  import type { KameoPicks } from '$lib/fighting/kameos/state'
  import type { KameoId } from '$lib/fighting/kameos/types'
  import type { FightLessonsController } from '$lib/fighting/fightLessonController'
  import type { LessonId } from '$lib/fighting/fightLessons'
  import type { CombatSchool } from '$lib/fighting/combatSchool'
  import type { ClashPractice } from '$lib/fighting/clashPractice'
  import type { FightReplayController } from '$lib/fighting/fightReplayController'
  import type { FightControls } from '../../../routes/fighting/fightingControls'
  import FightMainMenu from './FightMainMenu.svelte'
  import FightCharacterSelection from './FightCharacterSelection.svelte'
  import FightStageSelection from './FightStageSelection.svelte'
  import FightRulesSelection from './FightRulesSelection.svelte'
  import FightAcademy from './FightAcademy.svelte'
  import FightReplays from './FightReplays.svelte'
  import FightHistoricalSetup from './FightHistoricalSetup.svelte'
  import {
    duelFormat,
    historicalEnvironment,
    historicalSeats,
  } from '$lib/fighting/heavensDeathMatch/historicalSetup'
  import { DEATH_MATCH_FORMAT } from '$lib/fighting/heavensDeathMatch/loadout'
  import type { DeathMatchOptions } from '$lib/fighting/heavensDeathMatch/scenario'
  import './clashLobby.css'
  export let language: 'fr' | 'en'
  export let screen: FightScreen
  export let player: FighterId
  export let opponent: FighterId
  export let environment: FightEnvironment
  export let format: FightFormatId
  export let mode: FightMode
  export let controls: FightControls
  export let kameos: KameoPicks = {}
  export let onKameo: (side: FightSide, id?: KameoId) => void = () => {}
  export let lessons: FightLessonsController
  export let school: CombatSchool
  export let practice: ClashPractice
  export let replays: FightReplayController
  export let onPlayer: (id: FighterId) => void
  export let onOpponent: (id: FighterId) => void
  export let onEnvironment: (next: FightEnvironment) => void
  export let onFormat: (id: FightFormatId) => void
  export let onMode: (mode: FightMode) => void
  export let onLaunch: () => void
  export let onLesson: (id: LessonId) => void
  export let onPractice: (next: FightState | null) => void
  export let onExit: () => void
  export let replayActions: {
    onOpen: (id: string) => void
    onClose: () => void
    onRestart: () => void
    review?: ReplayReviewActions
  }
  function navigate(destination: string) {
    void goto($link(`/fighting/${destination}`))
  }
  function chooseMode(next: FightMode) {
    onMode(next)
    onFormat(duelFormat(format))
    navigate('characters')
  }
  /** The historical fight: Hisoka and Chrollo, the death-match format, the Tower. */
  function setHistorical(options: Partial<DeathMatchOptions>) {
    const next = historicalEnvironment(environment, options)
    const seats = historicalSeats(next.deathMatch?.chrolloSide ?? 'opponent')
    onEnvironment(next)
    onPlayer(seats.player)
    onOpponent(seats.opponent)
    onFormat(DEATH_MATCH_FORMAT)
    onMode('versus-ai')
  }
  // Reached by its address too: the screen always installs its own fight.
  $: if (screen === 'historical' && format !== DEATH_MATCH_FORMAT) setHistorical({})
  function chooseHistorical() {
    setHistorical({})
    navigate('historical')
  }
</script>

{#if screen === 'historical'}
  <FightHistoricalSetup
    {language}
    {player}
    {opponent}
    {environment}
    onOptions={setHistorical}
    onLibraryStart={onPractice}
    {onLaunch}
  />
{:else if screen === 'characters'}
  <FightCharacterSelection
    {language}
    {player}
    {opponent}
    {onPlayer}
    {onOpponent}
    onContinue={() => navigate('stage')}
  />
{:else if screen === 'stage'}
  <FightStageSelection
    {language}
    {player}
    {opponent}
    {environment}
    {onEnvironment}
    onContinue={() => navigate('options')}
  />
{:else if screen === 'options' || screen === 'battle'}
  <FightRulesSelection
    {language}
    {player}
    {opponent}
    {environment}
    {format}
    {mode}
    {controls}
    {onEnvironment}
    {onFormat}
    {onLaunch}
    {kameos}
    {onKameo}
  />
{:else if screen === 'academy'}
  <FightAcademy
    {language}
    {player}
    {lessons}
    {school}
    {practice}
    {onPlayer}
    {onLesson}
    onLaunch={onPractice}
    {onExit}
  />
{:else if screen === 'replays'}
  <section class="clash-page replay-page">
    <p class="clash-kicker">WATCH / ANALYZE / IMPROVE</p>
    <h1 class="clash-title">{language === 'fr' ? 'Salle des replays.' : 'Replay room.'}</h1>
    <p class="clash-subtitle">
      {language === 'fr'
        ? 'Revois tes duels, étudie tes ouvertures. Tes cinq derniers combats sont conservés ici.'
        : 'Revisit your duels. Study your openings. Your five latest fights live here.'}
    </p>
    <FightReplays {replays} {language} {...replayActions} expanded />
  </section>
{:else}
  <FightMainMenu
    {language}
    {player}
    {opponent}
    onMode={chooseMode}
    onHistorical={chooseHistorical}
  />
{/if}

<style>
  .replay-page {
    min-height: 65vh;
    padding-bottom: 3rem;
  }
  .replay-page :global(.fight-replays) {
    background: #17111e;
    border-color: #5d436e;
    border-radius: 0;
    padding: 1.5rem;
  }
</style>
