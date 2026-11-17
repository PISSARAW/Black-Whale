<script lang="ts">
  import { fightLesson } from '$lib/fighting/fightLessons'
  import { combatRoute } from '$lib/fighting/combatRoutes'
  import { FIGHT_CHALLENGES } from '$lib/fighting/fightChallenges'
  import { ARCADE_ENCOUNTERS } from '$lib/fighting/clashArcade'
  import type { FightLessonsController } from '$lib/fighting/fightLessonController'
  import type { CombatSchool } from '$lib/fighting/combatSchool'
  import type { ClashPractice } from '$lib/fighting/clashPractice'
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  import type { ControlCommand } from '$lib/fighting/fightInputBindings'
  export let language: 'fr' | 'en'
  export let lessons: FightLessonsController
  export let school: CombatSchool
  export let practice: ClashPractice
  const bindings = useFightBindings()
  $: fr = language === 'fr'
  $: index = fr ? 0 : 1
  $: lesson = $lessons ? fightLesson($lessons.id) : null
  $: route = $school && !$school.id.endsWith(':defense') ? combatRoute($school.id) : null
  $: challenge = FIGHT_CHALLENGES.find((entry) => entry.id === $practice.challenge?.id)
  $: encounter = $practice.arcade ? ARCADE_ENCOUNTERS[$practice.arcade.index] : null
  function hint(text: string) {
    return text.replace(/\{(\w+)\}/g, (_, key: string) => {
      const command = `player${key[0].toUpperCase()}${key.slice(1)}` as ControlCommand
      const value = $bindings[command]
      return value === ' ' ? (fr ? 'Espace' : 'Space') : (value?.toUpperCase() ?? key)
    })
  }
</script>

{#if lesson && $lessons}
  <aside class="battle-objective" aria-label={fr ? 'Objectif de l’exercice' : 'Exercise objective'}>
    <strong>{lesson.title[index]} · {$lessons.step + 1}/{lesson.steps.length}</strong><span
      role="status"
      >{$lessons.complete
        ? fr
          ? 'Exercice réussi. Suite dans le menu pause.'
          : 'Exercise complete. Continue in the pause menu.'
        : hint(lesson.steps[$lessons.step]?.[index] ?? '')}</span
    >
  </aside>
{:else if $school}
  <aside class="battle-objective">
    <strong
      >{$school.demo ? (fr ? 'Démonstration' : 'Demonstration') : fr ? 'Exercice' : 'Exercise'} · {route
        ?.title[index] ?? (fr ? 'Bloquer puis punir' : 'Block and punish')}</strong
    ><span role="status"
      >{$school.complete
        ? fr
          ? 'Exercice réussi'
          : 'Exercise complete'
        : `${$school.step} / ${route?.moves.length ?? 2}`}</span
    >
  </aside>
{:else if challenge}
  <aside class="battle-objective">
    <strong>{challenge.title[index]}</strong><span>{challenge.instruction[index]}</span>
  </aside>
{:else if encounter}
  <aside class="battle-objective">
    <strong>{encounter.title[index]}</strong><span>{encounter.lesson[index]}</span>
  </aside>
{/if}

<style>
  .battle-objective {
    position: absolute;
    z-index: 26;
    top: 118px;
    left: 50%;
    transform: translateX(-50%);
    display: grid;
    gap: 0.25rem;
    width: max-content;
    max-width: min(36rem, 90%);
    padding: 0.6rem 1rem;
    border-left: 2px solid #ff864b;
    background: #0d0914ce;
    color: #d0b9e0;
    text-align: center;
    pointer-events: none;
    font: 0.65rem/1.5 var(--font-mono);
  }
  strong {
    color: #f3d3bf;
    font-size: 0.7rem;
  }
  @media (max-width: 600px) {
    .battle-objective {
      top: 108px;
      padding: 0.45rem 0.6rem;
      font-size: 0.58rem;
    }
    strong {
      font-size: 0.6rem;
    }
  }
</style>
