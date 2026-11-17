<script lang="ts">
  import FightScene from './FightScene.svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FutureCameraView } from '$lib/fighting/parallelFutureCamera'
  import type { CameraDetailRect } from '$lib/fighting/cinematicDetailLayout'
  import type { FightComfort } from '$lib/fighting/fightComfort'
  import type { FightStageId } from '$lib/fighting/stages'
  export let prediction: FutureCameraView
  export let active = true
  export let rect: CameraDetailRect
  export let comfort: FightComfort
  export let language: 'fr' | 'en'
  export let stageId: FightStageId
  const stillCamera = { strength: 0, side: null, detail: null }
  $: quiet = { ...comfort, camera: 0 as const, shake: 0 as const }
  $: owner = prediction.state[prediction.owner]
  $: observer = prediction.state[prediction.owner === 'player' ? 'opponent' : 'player']
  // Preserve the terminal predicted effects without running a real victory ceremony.
  $: renderState = {
    ...prediction.state,
    phase: prediction.state.phase === 'finished' ? ('fighting' as const) : prediction.state.phase,
    winner: null,
    matchWinner: null,
  }
</script>

<div
  class="prediction-panel"
  class:dormant={!active}
  aria-hidden={!active}
  data-camera-detail="prediction"
  data-camera-source="tserriednich"
  data-camera-event="tserriednich.prediction"
  data-prediction-phase={prediction.phase}
  style:left={`${rect.x * 100}%`}
  style:top={`${rect.y * 100}%`}
  style:width={`${rect.width * 100}%`}
  style:height={`${rect.height * 100}%`}
  role="img"
  aria-label={language === 'fr'
    ? 'Laplace Demon : action prédite, distincte de la réalité'
    : 'Laplace Demon: predicted action, separate from reality'}
>
  <div class="view">
    <FightScene
      {active}
      state={renderState}
      {stageId}
      {language}
      comfort={quiet}
      viewer={prediction.owner}
      cameraDirection={stillCamera}
      cameraFrame={comfort.camera === 0 ? undefined : prediction.cameraFrame}
      viewRole="prediction"
    />
  </div>
  <div class="prediction-title">
    <span
      >{language === 'fr' ? 'VISION DE' : 'PERCEIVED BY'}
      {fighterDefinition(observer.id).name}</span
    >
    <span class="timestamp">+{((prediction.index + 1) / 60).toFixed(1)} s</span>
  </div>
  {#if prediction.damage > 0 && comfort.flashes}<div class="hit-flash"></div>{/if}
  <div class="prediction-result" data-predicted-health={owner.health}>
    <strong
      >{owner.health <= 0
        ? language === 'fr'
          ? 'K.-O. PRÉDIT'
          : 'PREDICTED K.O.'
        : observer.hatsuEffects.painPacker?.sun && prediction.damageTaken > 0
          ? language === 'fr'
            ? 'RISING SUN FRAPPE L’IMAGE'
            : 'RISING SUN HITS THE IMAGE'
          : language === 'fr'
            ? 'ACTION PRÉDITE'
            : 'PREDICTED ACTION'}</strong
    >
    <span
      >{fighterDefinition(owner.id).name} · {Math.ceil(owner.health)}
      {language === 'fr' ? 'PV prédits' : 'predicted HP'}</span
    >
  </div>
</div>

<style>
  .prediction-panel.dormant {
    visibility: hidden;
  }
  .prediction-panel {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid #e8a987;
    box-shadow: 0 4px 18px #0009;
    background: #070e17;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    container-type: inline-size;
  }
  .view {
    position: relative;
    grid-row: 2;
    min-height: 0;
  }
  .prediction-title,
  .prediction-result {
    position: relative;
    left: 0;
    right: 0;
    background: #080e18e8;
    color: #ffd9bd;
    font: 600 clamp(8px, 2.6cqw, 13px)/1.3 var(--font-mono, monospace);
    padding: 0.3rem 0.45rem;
  }
  .prediction-title {
    grid-row: 1;
    display: flex;
    justify-content: space-between;
    gap: 4px;
    letter-spacing: 0.06em;
  }
  .prediction-result {
    grid-row: 3;
    display: grid;
    gap: 0.15rem;
  }
  strong {
    color: #ffb49a;
  }
  .timestamp {
    white-space: nowrap;
    color: #fff;
  }
  .hit-flash {
    position: absolute;
    inset: 0;
    background: #ff38291c;
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .hit-flash {
      display: none;
    }
  }
  @media (max-width: 600px) {
    .prediction-title,
    .prediction-result {
      font-size: 7px;
      padding: 2px 4px;
      letter-spacing: 0;
      gap: 0;
    }
  }
</style>
