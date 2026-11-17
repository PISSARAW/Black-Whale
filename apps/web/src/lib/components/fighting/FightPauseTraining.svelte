<script lang="ts">
  import FightCombatSchool from './FightCombatSchool.svelte'
  import FightPracticeHub from './FightPracticeHub.svelte'
  import FightLessons from './FightLessons.svelte'
  import FightResponseDiagnostics from './FightResponseDiagnostics.svelte'
  import FightLabSession from './FightLabSession.svelte'
  import type { FightState } from '$lib/fighting/types'
  import type { CombatSchool } from '$lib/fighting/combatSchool'
  import type { ClashPractice } from '$lib/fighting/clashPractice'
  import type { FightLessonsController } from '$lib/fighting/fightLessonController'
  import type { FightBattleActions } from '$lib/fighting/fightBattleActions'
  import type { FightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  export let language: 'fr' | 'en'
  export let state: FightState
  export let actions: FightBattleActions
  export let school: CombatSchool
  export let practice: ClashPractice
  export let lessons: FightLessonsController
  export let diagnostics: FightMatchRuntime['diagnostics']
  export let replay = false
</script>

<div class="pause-training">
  {#if !replay}
    {#if $lessons}<FightLessons
        {lessons}
        {language}
        presentation="panel"
        onStart={actions.startLesson}
        onExit={actions.exitLesson}
      />
    {:else}<FightLessons {lessons} {language} onStart={actions.startLesson} />{/if}
    <FightCombatSchool
      {school}
      {language}
      onLaunch={actions.launchPractice}
      beforeLaunch={practice.exit}
      onExit={actions.resetFightInputs}
    />
    {#if practice.active}<FightPracticeHub
        {practice}
        {state}
        {language}
        fighter={state.player.id}
        onLaunch={actions.launchPractice}
      />{/if}
    {#if state.mode === 'training' && !$lessons && !$school && !practice.active}
      <FightLabSession
        bind:state
        {language}
        paused
        onPause={actions.togglePause}
        onStep={actions.stepLab}
        onReset={actions.resetLab}
        onPlayback={actions.resetPlayback}
        onReferenceStart={actions.launchPractice}
      />
      <FightResponseDiagnostics {diagnostics} {language} />
    {/if}
  {/if}
</div>

<style>
  .pause-training {
    display: grid;
    gap: 0.8rem;
  }
  .pause-training :global(.lesson-panel) {
    flex-direction: column;
    align-items: stretch;
  }
  .pause-training :global(.lesson-actions) {
    max-width: none;
  }
</style>
