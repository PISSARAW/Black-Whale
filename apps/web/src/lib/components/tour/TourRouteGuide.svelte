<script lang="ts">
  import {
    reachesRouteStep,
    TSERRIEDNICH_ROUTE,
    type TserriednichRouteStep,
  } from '$lib/tour/tserriednichRoute'
  import type { Vec2 } from '$lib/tour/types'

  interface Props {
    currentSpaceId: string | null
    position: Vec2
    french: boolean
    onRestart: () => void
    onClose: () => void
  }

  let { currentSpaceId, position, french, onRestart, onClose }: Props = $props()
  let stepIndex = $state(0)
  const finished = $derived(stepIndex >= TSERRIEDNICH_ROUTE.length)
  const step = $derived<TserriednichRouteStep | null>(
    finished ? null : TSERRIEDNICH_ROUTE[stepIndex],
  )

  $effect(() => {
    if (step && reachesRouteStep(step, currentSpaceId, position)) stepIndex += 1
  })

  function previous() {
    stepIndex = Math.max(0, stepIndex - 1)
  }

  function next() {
    stepIndex = Math.min(TSERRIEDNICH_ROUTE.length, stepIndex + 1)
  }

  function restart() {
    stepIndex = 0
    onRestart()
  }
</script>

<aside class="guide" aria-live="polite" aria-label={french ? 'Parcours guidé' : 'Guided route'}>
  <div class="eyebrow">
    <span>{french ? 'Parcours Tserriednich' : 'Tserriednich route'}</span>
    <button class="close" type="button" onclick={onClose} aria-label={french ? 'Fermer' : 'Close'}>
      ×
    </button>
  </div>

  {#if step}
    <div class="meta">
      <span>{french ? 'Chap.' : 'Ch.'} {step.chapter}</span>
      <span>{stepIndex + 1} / {TSERRIEDNICH_ROUTE.length}</span>
      <span class:reconstructed={step.evidence === 'reconstructed'}>
        {step.evidence === 'panel'
          ? french
            ? 'attesté'
            : 'attested'
          : french
            ? 'reconstitué'
            : 'reconstructed'}
      </span>
    </div>
    <h2>{french ? step.titleFr : step.title}</h2>
    <p>{french ? step.instructionFr : step.instruction}</p>
  {:else}
    <div class="meta"><span>{french ? 'Chap. 420' : 'Ch. 420'}</span></div>
    <h2>{french ? 'Parcours terminé' : 'Route complete'}</h2>
    <p>
      {french
        ? 'Vous avez refait tout le trajet, de la chambre 1004 au pont extérieur.'
        : 'You retraced the full route from Room 1004 to the exterior deck.'}
    </p>
  {/if}

  <div class="actions">
    <button type="button" onclick={previous} disabled={stepIndex === 0}>
      {french ? 'Précédent' : 'Previous'}
    </button>
    {#if finished}
      <button class="primary" type="button" onclick={restart}>
        {french ? 'Recommencer' : 'Restart'}
      </button>
    {:else}
      <button type="button" onclick={next}>{french ? 'Passer' : 'Skip'}</button>
    {/if}
  </div>
</aside>

<style>
  .guide {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 35;
    width: min(22rem, calc(100% - 5rem));
    padding: 0.8rem 0.9rem;
    border: 1px solid rgb(255 215 0 / 0.45);
    border-radius: 3px;
    background: rgb(5 5 5 / 0.92);
    box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.42);
    color: #fffff0;
    pointer-events: auto;
  }
  .eyebrow,
  .meta,
  .actions {
    display: flex;
    align-items: center;
  }
  .eyebrow {
    justify-content: space-between;
    color: rgb(255 215 0 / 0.82);
    font-size: 0.67rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .meta {
    gap: 0.55rem;
    margin-top: 0.65rem;
    color: rgb(255 255 240 / 0.56);
    font-size: 0.65rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .meta span + span::before {
    margin-right: 0.55rem;
    content: '·';
  }
  .meta .reconstructed {
    color: #e8b96d;
  }
  h2 {
    margin: 0.45rem 0 0;
    font-family: var(--font-display, serif);
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.25;
  }
  p {
    margin: 0.4rem 0 0;
    color: rgb(255 255 240 / 0.72);
    font-size: 0.78rem;
    line-height: 1.45;
  }
  .actions {
    justify-content: flex-end;
    gap: 0.45rem;
    margin-top: 0.75rem;
  }
  button {
    padding: 0.35rem 0.55rem;
    border: 1px solid rgb(255 255 240 / 0.22);
    border-radius: 2px;
    background: transparent;
    color: rgb(255 255 240 / 0.74);
    font: inherit;
    font-size: 0.7rem;
    cursor: pointer;
  }
  button:hover:not(:disabled),
  button:focus-visible {
    border-color: rgb(255 215 0 / 0.7);
    color: #ffd700;
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  button.primary {
    border-color: rgb(255 215 0 / 0.55);
    color: #ffd700;
  }
  button.close {
    padding: 0 0.15rem;
    border: 0;
    font-size: 1.1rem;
    line-height: 1;
  }
  @media (max-width: 640px) {
    .guide {
      top: 0.5rem;
      right: 0.5rem;
      width: calc(100% - 4.5rem);
    }
  }
</style>
