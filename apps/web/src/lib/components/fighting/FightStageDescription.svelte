<script lang="ts">
  import {
    backgroundParticipants,
    stageBackgroundDescription,
  } from '$lib/fighting/stageBackgroundCatalogue'
  import type { FightState } from '$lib/fighting/types'
  import type { FightStageId } from '$lib/fighting/stages'
  export let state: FightState
  export let stageId: FightStageId
  export let language: 'fr' | 'en'
  $: description = stageBackgroundDescription(stageId, backgroundParticipants(state), language)
</script>

<p class="background-description">{description}</p>

<style>
  .background-description {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
