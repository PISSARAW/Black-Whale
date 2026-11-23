<script lang="ts">
  import type { ArcadeFighter } from '$lib/fighting/types'

  export let fighter: ArcadeFighter & { maxHealth?: number }
  export let language: 'fr' | 'en'
  export let mirrored = false
  export let detailed = false
  export let displayedHealth: number | undefined = undefined
  export let ghostHealth: number | undefined = undefined
  export let textureMasked = false
  export let auraSeeping = false

  const healthPerDivision = 100
  $: maximum = fighter.maxHealth ?? healthPerDivision
  $: shownHealth = displayedHealth ?? fighter.health
  $: percent = Math.max(0, Math.min(100, (100 * shownHealth) / maximum))
  $: ghostPercent =
    ghostHealth !== undefined ? Math.max(0, Math.min(100, (100 * ghostHealth) / maximum)) : null
  $: label = language === 'fr' ? 'Vie' : 'Health'
  $: divisions = Array.from(
    { length: Math.max(0, Math.ceil(maximum / healthPerDivision) - 1) },
    (_, index) => ((index + 1) * healthPerDivision * 100) / maximum,
  )
</script>

<div
  class="health-reserve"
  class:mirrored
  class:critical={percent <= 25}
  class:texture-masked={textureMasked}
  class:aura-seeping={auraSeeping}
>
  <div
    class="health-bar"
    role="meter"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax={maximum}
    aria-valuenow={shownHealth}
    title={`${label} · ${Math.ceil(shownHealth)} / ${maximum}`}
  >
    <span class="health-fill" style={`width:${percent}%`}></span>
    {#if ghostPercent !== null}
      <span class="health-ghost" style={`left:${ghostPercent}%`} aria-hidden="true"></span>
    {/if}
    {#each divisions as position (position)}
      <i style={`left:${position}%`} aria-hidden="true"></i>
    {/each}
  </div>
  {#if detailed}
    <div class="health-label">
      {Math.ceil(shownHealth)} / {maximum}
      {language === 'fr' ? 'PV' : 'HP'}
    </div>
  {/if}
</div>

<style>
  .health-bar {
    position: relative;
    height: calc(20px * var(--hud-scale, 1));
    overflow: hidden;
    border: 1px solid #c6c6a2;
    background: #12191f;
    box-shadow: 0 2px 6px #0008;
  }
  .health-fill {
    display: block;
    height: 100%;
    background: linear-gradient(0deg, #99af4d, #dfeb91);
    transition: width 120ms ease-out;
  }
  .critical .health-fill {
    background: linear-gradient(0deg, #bd4345, #ffb49a);
  }
  .texture-masked .health-bar {
    border-color: #f38bc2;
  }
  .aura-seeping .health-bar {
    box-shadow:
      0 0 10px #f38bc280,
      inset 0 0 6px #f38bc24d;
  }
  .health-ghost {
    position: absolute;
    inset-block: 0;
    width: 3px;
    background: #ff69b4;
    box-shadow: 0 0 6px #ff69b4;
    z-index: 2;
  }
  .health-bar i {
    position: absolute;
    inset-block: 0;
    width: 2px;
    background: #10171dc9;
  }
  .mirrored .health-bar {
    transform: scaleX(-1);
  }
  .health-label {
    margin-top: 0.25rem;
    color: #e3edf2;
    font: 600 var(--hud-font, 0.75rem)/1.25 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .mirrored .health-label {
    text-align: right;
  }
  @media (prefers-reduced-motion: reduce) {
    .health-fill {
      transition: none;
    }
  }
</style>
