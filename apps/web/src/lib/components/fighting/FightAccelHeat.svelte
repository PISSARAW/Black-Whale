<script lang="ts">
  import { accelHeatView } from '$lib/fighting/accelHeatPresentation'
  import type { ArcadeFighter } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let mirrored = false

  $: view = accelHeatView(fighter, language)
</script>

{#if view}
  <div
    class="accel-heat {view.phase}"
    class:mirrored
    role="meter"
    aria-label={language === 'fr' ? 'Chaleur du Ren' : 'Ren heat'}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={view.percent}
    aria-valuetext={view.label}
  >
    <div class="track"><span style={`width:${view.percent}%`}></span></div>
    <small>{view.label}</small>
  </div>
{/if}

<style>
  .accel-heat {
    margin-top: 0.2rem;
    color: #ffc58a;
    font: 800 calc(0.65rem * var(--hud-scale, 1)) / 1.2 var(--font-mono);
    letter-spacing: 0.06em;
  }
  .track {
    height: calc(4px * var(--hud-scale, 1));
    overflow: hidden;
    margin-bottom: 2px;
    border: 1px solid #8a5a33;
    background: #1c130d;
  }
  .track > span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #ffb35c, #ff6a3d);
    transition: width 80ms linear;
  }
  .ready {
    color: #8ff3ff;
  }
  .overheated {
    color: #ff7b6b;
  }
  .overheated .track {
    border-color: #ff5d4a;
  }
  .overheated .track > span {
    background: repeating-linear-gradient(135deg, #ff5d4a 0 6px, #a3261b 6px 12px);
  }
  .mirrored {
    text-align: right;
  }
  .mirrored .track {
    transform: scaleX(-1);
  }
</style>
