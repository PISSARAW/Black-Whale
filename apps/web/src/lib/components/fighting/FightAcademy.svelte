<script lang="ts">
  import FightLessons from './FightLessons.svelte'
  import FightCombatSchool from './FightCombatSchool.svelte'
  import FightPracticeHub from './FightPracticeHub.svelte'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import type { FightLessonsController } from '$lib/fighting/fightLessonController'
  import type { LessonId } from '$lib/fighting/fightLessons'
  import type { CombatSchool } from '$lib/fighting/combatSchool'
  import type { ClashPractice } from '$lib/fighting/clashPractice'
  import type { FighterId, FightState } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  export let player: FighterId
  export let lessons: FightLessonsController
  export let school: CombatSchool
  export let practice: ClashPractice
  export let onPlayer: (id: FighterId) => void
  export let onLesson: (id: LessonId) => void
  export let onLaunch: (state: FightState | null) => void
  export let onExit: () => void
  let tab = 'lessons'
  $: fr = language === 'fr'
  $: tabs = [
    { id: 'lessons', name: fr ? 'Les bases & le Nen' : 'Fundamentals & Nen', note: '01' },
    { id: 'combos', name: fr ? 'Combos & défense' : 'Combos & defense', note: '02' },
    { id: 'challenges', name: fr ? 'Défis & Arcade' : 'Challenges & Arcade', note: '03' },
  ]
</script>

<section class="clash-page academy-page" aria-labelledby="academy-title">
  <p class="clash-kicker">TRAIN / LEARN / MASTER</p>
  <h1 class="clash-title" id="academy-title">{fr ? 'Académie du Nen.' : 'Nen Academy.'}</h1>
  <p class="clash-subtitle">
    {fr
      ? 'Un pas après l’autre. Apprends les bases, trouve tes enchaînements, relève les défis.'
      : 'One step at a time. Learn the basics, find your combos, take on the challenges.'}
  </p>
  <div class="academy-tabs" aria-label={fr ? 'Catégories d’entraînement' : 'Training categories'}>
    {#each tabs as entry (entry.id)}<button
        type="button"
        aria-pressed={tab === entry.id}
        onclick={() => (tab = entry.id)}
        ><small>{entry.note} /</small><strong>{entry.name}</strong><span aria-hidden="true">↗</span
        ></button
      >{/each}
  </div>
  <div class="academy-content">
    {#if tab === 'lessons'}<FightLessons {lessons} {language} onStart={onLesson} expanded />
    {:else if tab === 'combos'}<FightCombatSchool
        {school}
        {language}
        {onLaunch}
        beforeLaunch={practice.exit}
        {onExit}
        expanded
      />
    {:else}<label class="arcade-fighter"
        >{fr ? 'Ton personnage pour le parcours Arcade' : 'Your Arcade route fighter'}<select
          aria-label={fr ? 'Personnage Arcade' : 'Arcade fighter'}
          value={player}
          onchange={(event) => onPlayer(event.currentTarget.value as FighterId)}
          >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
              >{fighter.name}</option
            >{/each}</select
        ></label
      ><FightPracticeHub
        {practice}
        state={null}
        fighter={player}
        {language}
        {onLaunch}
        expanded
      />{/if}
  </div>
</section>

<style>
  .academy-page {
    padding-bottom: 3rem;
    min-height: 65vh;
  }
  .academy-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 2rem 0;
  }
  .academy-tabs button {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: 1.3rem;
    border: 1px solid #514158;
    color: #e8d8f4;
    background: #1b1422;
    text-align: left;
    cursor: pointer;
  }
  .academy-tabs button[aria-pressed='true'] {
    border-color: #ff864b;
    background: #ff864b12;
  }
  .academy-tabs small {
    grid-column: 1 / -1;
    color: #b998ce;
    font: 0.6rem var(--font-mono);
  }
  .academy-tabs strong {
    font:
      italic 800 1.1rem Arial,
      sans-serif;
  }
  .academy-tabs span {
    color: #ff864b;
  }
  .academy-content {
    max-width: 1000px;
    margin: auto;
  }
  .academy-content :global(.lessons-launcher),
  .academy-content :global(.combat-school),
  .academy-content :global(.practice-hub) {
    background: #16111c;
    border-color: #514158;
    border-radius: 0;
    padding: 1.2rem;
  }
  .academy-content :global(summary) {
    color: #d5b5ee;
  }
  .academy-content :global(.practice-hub > a) {
    display: none;
  }
  .arcade-fighter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    color: #c3b3cf;
    font-size: 0.8rem;
  }
  select {
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #7d6190;
    background: #20152a;
    color: #f5eafa;
  }
  @media (max-width: 600px) {
    .academy-tabs {
      gap: 0.5rem;
    }
    .academy-tabs button {
      padding: 0.8rem 0.6rem;
    }
    .academy-tabs strong {
      font-size: 0.8rem;
    }
    .academy-tabs span {
      display: none;
    }
  }
</style>
