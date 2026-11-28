<script lang="ts">
  import { VICTORY_TITLES } from '$lib/fighting/victory/catalogue'
  import {
    FUTURE_EYES_OPEN,
    FUTURE_FORECAST_SECONDS,
    FUTURE_VERDICT,
    FUTURE_VISION_START,
    FUTURE_ZETSU_END,
    tserriednichSplit,
  } from '$lib/fighting/victory/tserriednichTiming'

  export let elapsed: number
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: vision = elapsed >= FUTURE_VISION_START && elapsed < FUTURE_EYES_OPEN
  $: split = tserriednichSplit(elapsed)
  $: dissolve = Math.max(0, (elapsed - (FUTURE_ZETSU_END - 0.3)) / 0.3)
</script>

<div class="cinema-grade" aria-hidden="true"></div>

{#if vision}
  <div class="forecast-grade" aria-hidden="true"></div>
  <div class="label forecast">
    {fr ? 'Prévision' : 'Forecast'} · {FUTURE_FORECAST_SECONDS} s
  </div>
{:else if split}
  <div class="split" data-future-split>
    <div class="perceived">
      <div class="wash" style:opacity={dissolve}></div>
      <span class="label">{fr ? 'Perception du rival' : 'Rival’s perception'}</span>
    </div>
    <div class="real">
      <span class="label">{fr ? 'Réalité' : 'Reality'}</span>
    </div>
  </div>
{:else if elapsed >= FUTURE_VERDICT}
  <div class="title">{VICTORY_TITLES.tserriednich[fr ? 0 : 1]}</div>
{/if}

<style>
  .cinema-grade {
    position: absolute;
    inset: 7% 0;
    background: radial-gradient(ellipse at 49% 48%, transparent 33%, #08090f73 100%);
    backdrop-filter: contrast(1.09) saturate(0.88);
  }
  .forecast-grade {
    position: absolute;
    inset: 0;
    backdrop-filter: saturate(0.25) contrast(1.08);
    background: radial-gradient(ellipse at 51% 48%, #26394312 26%, #0c1d3173 100%);
  }
  .split {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .perceived,
  .real {
    position: relative;
  }
  .perceived {
    border-right: 1px solid #c7d3d8a6;
    background: radial-gradient(ellipse at 50% 50%, transparent 42%, #142837a6 100%);
    backdrop-filter: saturate(0.64);
  }
  .wash {
    position: absolute;
    inset: 0;
    background: #0d141b;
  }
  .label,
  .title {
    position: absolute;
    top: 11%;
    left: 5%;
    color: #f6ebd5;
    text-shadow:
      0 2px 8px #05090d,
      0 0 16px #05090d;
  }
  .label {
    width: max-content;
    font-family: var(--font-mono, monospace);
    font-size: clamp(10px, 1.2vw, 15px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .perceived .label,
  .forecast {
    color: #c1dce9;
  }
  .title {
    font-size: clamp(23px, 4vw, 56px);
    font-weight: 700;
  }
  @container (max-aspect-ratio: 1/1) {
    .split {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: repeat(2, minmax(0, 1fr));
    }
    .perceived {
      border-right: 0;
      border-bottom: 1px solid #c7d3d8a6;
    }
    .perceived .label {
      top: 19%;
    }
  }
</style>
