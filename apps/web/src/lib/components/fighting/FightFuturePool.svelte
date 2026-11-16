<script lang="ts">
  import FightFutureInset from './FightFutureInset.svelte'
  import type { FutureCameraView } from '$lib/fighting/parallelFutureCamera'
  import type { CameraDetailRect } from '$lib/fighting/cinematicDetailLayout'
  import type { FightComfort } from '$lib/fighting/fightComfort'
  import type { FightStageId } from '$lib/fighting/stages'
  export let prediction: FutureCameraView | null
  export let active: boolean
  export let rect: CameraDetailRect
  export let comfort: FightComfort
  export let language: 'fr' | 'en'
  export let stageId: FightStageId
  let last: FutureCameraView | null = null
  // Reuse only a frame already received by this viewer, never compute a forecast here.
  $: if (prediction) last = prediction
</script>

{#if last}
  <FightFutureInset
    prediction={last}
    active={Boolean(prediction) && active}
    {rect}
    {comfort}
    {language}
    {stageId}
  />
{/if}
