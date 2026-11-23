<script lang="ts">
  import {
    FIGHT_CURRICULUM as FIGHT_LESSONS,
    fightLesson,
    type LessonId,
  } from '$lib/fighting/fightLessons'
  import type { FightLessonsController } from '$lib/fighting/fightLessonController'
  import { finisherHint, throwHint, useFightBindings } from '$lib/fighting/fightControlHints'
  import type { ControlCommand } from '$lib/fighting/fightInputBindings'
  export let lessons: FightLessonsController
  export let language: 'fr' | 'en'
  export let expanded = false
  export let presentation: 'launcher' | 'panel' = 'launcher'
  export let onStart: (id: LessonId) => void
  export let onExit: () => void = () => {}
  const bindings = useFightBindings()
  const commands: Record<string, ControlCommand> = {
    light: 'playerLight',
    aura: 'playerAura',
    guard: 'playerGuard',
    down: 'playerDown',
    heavy: 'playerHeavy',
    special: 'playerSpecial',
    left: 'playerLeft',
    right: 'playerRight',
  }
  $: index = language === 'fr' ? 0 : 1
  $: current = $lessons ? fightLesson($lessons.id) : null
  $: next = $lessons?.complete ? lessons.next() : null
  function hint(text: string): string {
    return text.replace(/\{(\w+)\}/g, (_, key: string) => {
      if (key === 'throw') return throwHint($bindings)
      if (key === 'finisher') return finisherHint($bindings)
      const value = $bindings[commands[key]]
      return value === ' '
        ? language === 'fr'
          ? 'Espace'
          : 'Space'
        : (value?.toUpperCase() ?? key)
    })
  }
</script>

{#if presentation === 'launcher'}
  <details class="lessons-launcher" open={expanded}>
    <summary
      >{language === 'fr'
        ? `Apprendre le Nen · ${FIGHT_LESSONS.length} exercices pratiques`
        : `Learn Nen · ${FIGHT_LESSONS.length} practical exercises`}</summary
    >
    <p>
      {language === 'fr'
        ? 'Chaque exercice lance un entraînement dédié. Réussis les actions demandées pour progresser.'
        : 'Each exercise starts dedicated training. Perform the requested actions to progress.'}
    </p>
    <div class="lesson-list">
      {#each FIGHT_LESSONS as lesson, i (lesson.id)}
        <button type="button" onclick={() => onStart(lesson.id)}
          >{i + 1}. {lesson.title[index]}</button
        >
      {/each}
    </div>
  </details>
{:else if $lessons && current}
  <section class="lesson-panel" aria-label={language === 'fr' ? 'Exercice du Nen' : 'Nen exercise'}>
    <div class="lesson-instruction">
      <strong>{current.title[index]}</strong>
      <p aria-live="polite">
        {#if $lessons.invalid}
          {language === 'fr'
            ? 'Le scénario a changé. Recommence cet exercice.'
            : 'The scenario changed. Retry this exercise.'}
        {:else if $lessons.complete}
          <b>{language === 'fr' ? 'Exercice réussi. ' : 'Exercise complete. '}</b>{current.takeaway[
            index
          ]}
        {:else}
          <span>{$lessons.step + 1}/{current.steps.length} · </span>{hint(
            current.steps[$lessons.step][index],
          )}
        {/if}
      </p>
    </div>
    <div class="lesson-actions">
      <button type="button" onclick={() => onStart(current!.id)}
        >{language === 'fr' ? 'Recommencer' : 'Retry'}</button
      >
      <button type="button" disabled={!next} onclick={() => next && onStart(next)}
        >{language === 'fr' ? 'Exercice suivant' : 'Next exercise'}</button
      >
      <button type="button" onclick={onExit}
        >{language === 'fr' ? 'Entraînement libre' : 'Free training'}</button
      >
    </div>
  </section>
{/if}

<style>
  .lessons-launcher,
  .lesson-panel {
    color: #e8edf7;
    background: #111b2b;
    border: 1px solid #50627c;
    border-radius: 0.75rem;
    padding: 0.85rem 1rem;
    margin: 0.65rem 0;
  }
  summary {
    cursor: pointer;
    font-weight: 700;
  }
  p {
    margin: 0.45rem 0 0;
    line-height: 1.5;
  }
  .lesson-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
  .lesson-panel {
    display: flex;
    gap: 0.7rem 1rem;
    align-items: center;
    justify-content: space-between;
  }
  .lesson-instruction {
    flex: 1;
    min-width: 0;
  }
  .lesson-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    flex-shrink: 0;
    max-width: 25rem;
  }
  button {
    background: #243752;
    border: 1px solid #71849f;
    border-radius: 0.4rem;
    padding: 0.5rem 0.7rem;
    color: #fff;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  button:hover,
  button:focus-visible {
    background: #3c5273;
    outline-color: #f5cc82;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  @media (max-width: 850px) {
    .lesson-panel {
      flex-direction: column;
      align-items: stretch;
    }
    .lesson-actions {
      max-width: none;
    }
  }
</style>
