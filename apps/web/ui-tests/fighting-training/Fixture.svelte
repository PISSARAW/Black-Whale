<script lang="ts">
  import { tick } from 'svelte'
  import FightTrainingTools from '$lib/components/fighting/FightTrainingTools.svelte'
  import FightTrainingOverlay from '$lib/components/fighting/FightTrainingOverlay.svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import {
    resetTraining,
    setTrainingResources,
    setTrainingDummy,
  } from '$lib/fighting/trainingSession'
  import {
    playTrainingRecording,
    toggleTrainingRecording,
    setTrainingLoop,
  } from '$lib/fighting/trainingRecording'
  import { performTrainingAction as performMove } from '$lib/fighting/trainingAction'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { EMPTY_INPUT, type FightInput, type FightState } from '$lib/fighting/types'
  import type { TrainingAction } from '$lib/fighting/trainingTypes'
  let state = resetTraining(beginFight(createFight('hisoka', 'phinks', { mode: 'training' })))
  let paused = false
  let language: 'fr' | 'en' = 'fr'
  function step() {
    state = tickFight({ ...state, frameAccumulator: 0 }, EMPTY_INPUT, {
      dt: FIXED_STEP,
      opponentInput: EMPTY_INPUT,
    })
  }
  export async function advance(frames: number, input: Partial<FightInput> = {}) {
    if (!paused)
      for (let frame = 0; frame < frames; frame++)
        state = tickFight(
          state,
          { ...EMPTY_INPUT, ...input },
          { dt: FIXED_STEP, opponentInput: EMPTY_INPUT },
        )
    await tick()
  }
  export async function attack(action: TrainingAction = 'light') {
    if (action !== 'ranged') state = performMove({ state, side: 'player', action })
    await tick()
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  export function snapshot(): FightState {
    return state
  }
</script>

<main>
  <div class="arena"><FightScene {state} /><FightTrainingOverlay {state} {language} /></div>
  <FightTrainingTools
    {state}
    {language}
    {paused}
    onPause={() => (paused = !paused)}
    onStep={() => {
      if (paused) step()
    }}
    onReset={(position) => (state = resetTraining(state, position))}
    onResources={(side, update) => (state = setTrainingResources(state, side, update))}
    onDummy={(update) => (state = setTrainingDummy(state, update))}
    onRecord={() => (state = toggleTrainingRecording(state))}
    onPlay={() => (state = playTrainingRecording(state))}
    onLoop={(loop) => (state = setTrainingLoop(state, loop))}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #050c12;
    color: #e3edf2;
  }
  main {
    margin: auto;
    max-width: 1200px;
    padding: 0.5rem;
  }
  .arena {
    position: relative;
    height: 430px;
    overflow: hidden;
    isolation: isolate;
  }
  @media (max-width: 600px) {
    .arena {
      height: 360px;
    }
  }
</style>
