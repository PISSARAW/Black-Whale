<script lang="ts">
  import { onMount } from 'svelte'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { IntroFrame } from '$lib/fighting/presentation/introPlayback'
  import FightScene from './FightScene.svelte'
  import FightFuturePool from './FightFuturePool.svelte'
  import FightFutureClock from './FightFutureClock.svelte'
  import { parallelFutureCamera, futureCameraDirection } from '$lib/fighting/parallelFutureCamera'
  import { futureDetailRect } from '$lib/fighting/cinematicDetailLayout'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { defaultAppearance, type CareerAppearance } from '$lib/fighting/career/types'
  import type { FightState, FightSide } from '$lib/fighting/types'
  import type { FightStageId } from '$lib/fighting/stages'
  export let victoryFrame: VictoryFrame | null = null
  export let introFrame: IntroFrame | null = null
  export let onSceneReady: () => void = () => {}
  export let onSceneFailed: () => void = () => {}
  export let state: FightState
  export let active = true
  export let showRecovery = false
  export let stageId: FightStageId
  export let language: 'fr' | 'en' = 'fr'
  export let viewer: FightSide = 'player'
  export let previewIndex: number | null = null
  export let comfort = defaultFightComfort()
  export let appearance: CareerAppearance = defaultAppearance()
  let host: HTMLDivElement
  let aspect = 1.7
  let height = 720
  let detailVisible = false
  $: comparison = parallelFutureCamera(state, viewer, previewIndex)
  $: prediction = comparison.prediction
  $: direction = prediction ? futureCameraDirection(prediction.owner) : undefined
  $: rect = futureDetailRect(aspect, height)
  onMount(() => {
    const observer = new ResizeObserver(() => {
      aspect = Math.max(0.1, host.clientWidth / Math.max(1, host.clientHeight))
      height = Math.max(1, host.clientHeight)
    })
    observer.observe(host)
    return () => observer.disconnect()
  })
</script>

<div class="live-scene" bind:this={host}>
  <FightScene
    {active}
    {showRecovery}
    state={comparison.main}
    {stageId}
    {language}
    {viewer}
    {comfort}
    {appearance}
    {victoryFrame}
    {introFrame}
    {onSceneReady}
    {onSceneFailed}
    cameraDirection={direction}
    detailLayout={prediction ? rect : undefined}
    hideSecondaryView={Boolean(prediction) || Boolean(victoryFrame?.active)}
    bind:detailVisible
  />
  {#if prediction && detailVisible && !victoryFrame?.active}<FightFutureClock
      {prediction}
      {rect}
      {language}
      realState={state}
    />
  {/if}
  {#key viewer}
    <FightFuturePool
      {prediction}
      active={detailVisible && active}
      {rect}
      {comfort}
      {language}
      {stageId}
    />
  {/key}
</div>

<style>
  .live-scene {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
</style>
