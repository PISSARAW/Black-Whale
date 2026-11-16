<script lang="ts">
  import type { FutureCameraView } from '$lib/fighting/parallelFutureCamera'
  import type { CameraDetailRect } from '$lib/fighting/cinematicDetailLayout'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  export let prediction: FutureCameraView
  export let rect: CameraDetailRect
  export let language: 'fr' | 'en'
  export let realState: FightState
  $: elapsed = prediction.elapsedFrames / 60
  $: duration = prediction.durationFrames / 60
  $: remaining = Math.max(0, duration - elapsed)
  $: name = fighterDefinition(prediction.state[prediction.owner].id).name
  $: sun =
    realState.player.hatsuEffects.painPacker?.sun ?? realState.opponent.hatsuEffects.painPacker?.sun
</script>

<div
  class="future-clock"
  data-laplace-elapsed={elapsed.toFixed(1)}
  data-laplace-remaining={remaining.toFixed(1)}
  style:left={`${rect.x * 100}%`}
  style:top={`${rect.y * 100}%`}
  style:width={`${rect.width * 100}%`}
>
  <strong
    >Laplace Demon · {prediction.phase === 'vision'
      ? language === 'fr'
        ? 'VISION +10 s'
        : '+10 s VISION'
      : language === 'fr'
        ? 'DIVERGENCE · CORPS RÉEL'
        : 'DIVERGENCE · REAL BODY'}</strong
  >
  <progress
    max={prediction.durationFrames}
    value={prediction.elapsedFrames}
    aria-label={language === 'fr' ? 'Temps écoulé de Laplace Demon' : 'Laplace Demon elapsed time'}
  ></progress>
  <span class="times"
    >{elapsed.toFixed(1)} / {duration.toFixed(1)} s
    <span>{remaining.toFixed(1)} s {language === 'fr' ? 'restantes' : 'remaining'}</span></span
  >
  <span class="reality" data-real-health={prediction.realHealth}
    >{name} · {language === 'fr' ? 'CORPS RÉEL' : 'REAL BODY'} · {Math.ceil(prediction.realHealth)}
    {language === 'fr' ? 'PV' : 'HP'}</span
  >
  {#if sun}<span class="heat"
      >Rising Sun · {language === 'fr' ? 'Chaleur restante' : 'Heat remaining'} : {Math.max(
        0,
        (sun.duration - sun.age) / 60,
      ).toFixed(1)} s</span
    >{/if}
</div>

<style>
  .future-clock {
    position: absolute;
    transform: translateY(calc(-100% - 6px));
    box-sizing: border-box;
    z-index: 2;
    pointer-events: none;
    background: #090d15ed;
    border-left: 2px solid #6bdfe8;
    color: #9ce7ef;
    padding: 7px 10px;
    font: 600 clamp(8px, 0.8vw, 12px)/1.4 var(--font-mono, monospace);
  }
  strong {
    display: block;
    font-size: inherit;
  }
  progress {
    display: block;
    width: 100%;
    height: 4px;
    margin: 5px 0;
    accent-color: #6bdfe8;
  }
  .times {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    font-variant-numeric: tabular-nums;
  }
  .reality {
    display: block;
    color: #e0faff;
    font-size: 0.9em;
  }
  .heat {
    display: block;
    color: #ffc696;
    font-size: 0.9em;
  }
  @media (max-width: 600px) {
    .future-clock {
      padding: 3px 4px;
      font-size: 7px;
      transform: translateY(calc(-100% - 3px));
    }
    progress {
      height: 3px;
      margin: 2px 0;
    }
  }
</style>
