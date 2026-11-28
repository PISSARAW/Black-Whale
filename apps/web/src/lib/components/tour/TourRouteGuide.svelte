<script lang="ts">
  import { untrack } from 'svelte'
  import { comfort } from '$lib/tour/comfort'
  import type { GangwayPresentation } from '$lib/tour/gangwayLockdownView'
  import {
    completesRouteStep,
    reachesRouteStep,
    TSERRIEDNICH_HALL,
    TSERRIEDNICH_ROUTE,
    TSERRIEDNICH_ROUTE_SOURCES,
    type TserriednichRouteStep,
  } from '$lib/tour/tserriednichRoute'
  import type { Vec2 } from '$lib/tour/types'

  interface Props {
    currentSpaceId: string | null
    position: Vec2
    heading: number
    pitch: number
    gangways: GangwayPresentation
    french: boolean
    onRestart: () => void
    onClose: () => void
    onVisitStep: (step: TserriednichRouteStep) => void
    onLockdownChange: (active: boolean) => void
  }

  let {
    currentSpaceId,
    position,
    heading,
    pitch,
    gangways,
    french,
    onRestart,
    onClose,
    onVisitStep,
    onLockdownChange,
  }: Props = $props()
  let stepIndex = $state(0)
  let lockdown = $state(false)
  const evidenceLabels = {
    panel: { en: 'Shown in manga', fr: 'Vu en planche' },
    mixed: { en: 'Manga and reconstruction', fr: 'Planche et reconstitution' },
    reconstructed: { en: 'Reconstructed connection', fr: 'Raccord reconstitué' },
  }
  const finished = $derived(stepIndex >= TSERRIEDNICH_ROUTE.length)
  const step = $derived<TserriednichRouteStep | null>(
    finished ? null : TSERRIEDNICH_ROUTE[stepIndex],
  )
  const view = $derived({ spaceId: currentSpaceId, position, heading, pitch, gangways })
  const atLockdownInJumpMode = $derived(
    $comfort.jumpOnly && step?.id === 'recreation-hall' && completesRouteStep(step, view),
  )
  const atTerraceViewpoint = $derived(
    step?.id === 'outside' && reachesRouteStep(step, currentSpaceId, position),
  )

  $effect(() => {
    const observation = view
    const jumpOnly = $comfort.jumpOnly
    untrack(() => {
      if (observation.spaceId === TSERRIEDNICH_HALL) lockdown = true
      if (jumpOnly && step?.id === 'recreation-hall') return
      if (step && completesRouteStep(step, observation)) next()
    })
  })
  $effect(() => onLockdownChange(lockdown))

  function previous() {
    stepIndex = Math.max(0, stepIndex - 1)
  }

  function next() {
    stepIndex = Math.min(TSERRIEDNICH_ROUTE.length, stepIndex + 1)
  }

  function restart() {
    lockdown = false
    stepIndex = 0
    onRestart()
  }
</script>

<aside
  class="guide"
  hidden={gangways === 'cutaway'}
  aria-live="polite"
  aria-label={french ? 'Parcours guidé' : 'Guided route'}
>
  <div class="eyebrow">
    <span>{french ? 'Parcours Tserriednich' : 'Tserriednich route'}</span>
    <button class="close" type="button" onclick={onClose} aria-label={french ? 'Fermer' : 'Close'}>
      ×
    </button>
  </div>

  {#if step}
    <div class="meta">
      <a href={TSERRIEDNICH_ROUTE_SOURCES[step.chapter]} target="_blank" rel="noreferrer">
        {french ? 'Chap.' : 'Ch.'}
        {step.chapter}, p. {step.pages}
      </a>
      <span>{stepIndex + 1} / {TSERRIEDNICH_ROUTE.length}</span>
    </div>
    <h2>{french ? step.titleFr : step.title}</h2>
    <p class="evidence" class:reconstructed={step.evidence !== 'panel'}>
      {evidenceLabels[step.evidence][french ? 'fr' : 'en']}
    </p>
    {#if atLockdownInJumpMode}
      <p>
        {french
          ? 'Les trois passerelles sont rétractées. La route A est fermée.'
          : 'The three gangways have retracted. Route A is closed.'}
      </p>
    {:else}
      <p>{french ? step.instructionFr : step.instruction}</p>
      {#if $comfort.jumpOnly}
        <p>
          {french
            ? 'Suivez le parcours par étapes, sans déplacement continu.'
            : 'Follow the route by jumping between stops.'}
        </p>
      {/if}
    {/if}
  {:else}
    <div class="meta"><span>{french ? 'Chap. 420' : 'Ch. 420'}</span></div>
    <h2>{french ? 'Parcours terminé' : 'Route complete'}</h2>
    <p>
      {french
        ? 'Le dernier repère du chapitre 420 est le bassin sous blocus. Tserriednich se trouve encore du côté du paquebot.'
        : 'Chapter 420 ends with the basin under blockade. Tserriednich is still on the liner side.'}
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
    {:else if atLockdownInJumpMode}
      <button class="primary" type="button" onclick={next}>
        {french ? 'Continuer' : 'Continue'}
      </button>
    {:else if step && $comfort.jumpOnly}
      <button class="primary" type="button" onclick={() => onVisitStep(step!)}>
        {french ? 'Aller à l’étape' : 'Go to stop'}
      </button>
    {:else if step && atTerraceViewpoint}
      <button class="primary" type="button" onclick={() => onVisitStep(step!)}>
        {french ? 'Regarder le quai' : 'Look at the quay'}
      </button>
    {:else if step?.id !== 'outside'}
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
  .meta {
    justify-content: space-between;
  }
  .meta a {
    color: inherit;
    text-underline-offset: 0.15em;
  }
  .evidence {
    font-size: 0.67rem;
    font-weight: 700;
  }
  .evidence.reconstructed {
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
      top: 3.75rem;
      right: 0.5rem;
      width: calc(100% - 4.5rem);
    }
    .actions button {
      min-height: 2.75rem;
    }
  }
</style>
