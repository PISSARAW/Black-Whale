<script lang="ts">
  import { onMount } from 'svelte'
  import { confirmedThrow } from '$lib/fighting/throwCinematic'
  import { throwPerformance } from '$lib/fighting/throws/catalogue'
  import type { FightState } from '$lib/fighting/types'
  import type { FightComfort } from '$lib/fighting/fightComfort'
  export let state: FightState
  export let comfort: FightComfort
  export let language: 'fr' | 'en'
  export let enabled = true
  export let active = false
  let reduced = true
  onMount(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  })
  $: frame = enabled && !reduced && (comfort.camera ?? 1) > 0 ? confirmedThrow(state) : null
  $: active = Boolean(frame && frame.age < frame.duration)
  $: name = throwPerformance(frame?.performance)?.name
  $: title =
    frame?.performance === 'bonolenov-prologue' && !state[frame.attacker].battleCantabile?.prologue
      ? 'Le dernier accord'
      : name
</script>

{#if active && frame}
  <div class="throw-film" data-throw-cinematic={frame.performance ?? 'physical'} aria-live="polite">
    <div class="film-top"></div>
    <div class="film-bottom">
      <span
        >{frame.powered
          ? language === 'fr'
            ? 'SUPER PROJECTION'
            : 'SUPER THROW'
          : language === 'fr'
            ? 'PROJECTION'
            : 'THROW'}</span
      >
      {#if title}<strong>{title}</strong>{/if}
    </div>
  </div>
{/if}

<style>
  .throw-film {
    position: absolute;
    inset: 0;
    z-index: 24;
    pointer-events: none;
  }
  .film-top,
  .film-bottom {
    position: absolute;
    left: 0;
    right: 0;
    background: #030609f5;
  }
  .film-top {
    top: 0;
    height: 4%;
  }
  .film-bottom {
    bottom: 0;
    min-height: 7%;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }
  span {
    font: 600 0.6rem/1.2 var(--font-mono);
    letter-spacing: 0.12em;
    color: #c6a6e7;
  }
  strong {
    font-size: clamp(0.7rem, 1.3vw, 0.95rem);
    color: #f4effa;
  }
  @media (max-width: 500px) {
    .film-bottom {
      gap: 0.25rem;
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
