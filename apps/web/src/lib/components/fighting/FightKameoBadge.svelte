<script lang="ts">
  import { kameoBadge } from '$lib/fighting/kameos/hud'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'

  $: badge = kameoBadge(state, side, language)
</script>

{#if badge}
  <div class="kameo" class:ready={badge.ready} role="status" aria-live="polite">
    <span class="name"><strong>{badge.name}</strong> · {badge.role}</span>
    <span class="state">{badge.status}</span>
    <span class="cooldown" aria-hidden="true"
      ><span style={`width:${Math.round((1 - badge.cooldown) * 100)}%`}></span></span
    >
  </div>
{/if}

<style>
  .kameo {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.15rem 0.4rem;
    margin-top: 0.35rem;
    color: #b1c0cd;
    font: 600 var(--hud-font)/1.3 var(--font-mono);
  }
  .name {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .name strong {
    color: #eef8ff;
  }
  .state {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .ready .state {
    color: #edce7b;
  }
  .cooldown {
    grid-column: 1 / -1;
    height: calc(3px * var(--hud-scale, 1));
    overflow: hidden;
    background: #101a24;
  }
  .cooldown > span {
    display: block;
    height: 100%;
    background: #50778c;
  }
  .ready .cooldown > span {
    background: #edce7b;
  }
</style>
