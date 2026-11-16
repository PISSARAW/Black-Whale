<script lang="ts">
  import FightTrainingTools from './FightTrainingTools.svelte'
  import { setTrainingResources, setTrainingDummy } from '$lib/fighting/trainingSession'
  import {
    toggleTrainingRecording,
    playTrainingRecording,
    setTrainingLoop,
  } from '$lib/fighting/trainingRecording'
  import type { TrainingPosition } from '$lib/fighting/trainingTypes'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onPause: () => void
  export let onStep: () => void
  export let onReset: (position: TrainingPosition) => void
  export let onPlayback: () => void
</script>

<FightTrainingTools
  {state}
  {language}
  {paused}
  {onPause}
  {onStep}
  {onReset}
  onResources={(side, update) => (state = setTrainingResources(state, side, update))}
  onDummy={(update) => (state = setTrainingDummy(state, update))}
  onRecord={() => (state = toggleTrainingRecording(state))}
  onPlay={() => {
    state = playTrainingRecording(state)
    onPlayback()
  }}
  onLoop={(loop) => (state = setTrainingLoop(state, loop))}
/>
