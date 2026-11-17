<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { createLiveDriver } from './liveDriver'
  import { createReplayPlayer } from '$lib/fighting/fightReplayPlayer'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { performanceTape, type PerformanceScenario } from './scenario'
  import type { installFrameProbe } from './frameProbe'
  import { stressManifested, type StressScenario } from './stressScenario'
  import { expressionProof } from './expressionProof'
  export let probe: ReturnType<typeof installFrameProbe>
  let tape = performanceTape({ fighter: 'kurapika', stage: 'heavens-arena', effects: false })
  let live = false
  const driver = () => (live ? createLiveDriver(tape) : createReplayPlayer(tape))
  let replay = driver()
  let state = replay.state
  let running = false
  let verified = 0
  let failure = ''
  let scenario: StressScenario | undefined
  let requiredEffectSeen = true
  let predictionRenderers = new WeakSet<THREE.WebGLRenderer>()
  let predictionContexts = 0
  let comfort = defaultFightComfort()
  let primaryScene: THREE.Scene | undefined
  THREE.Scene.prototype.onAfterRender = function (renderer, scene) {
    if (scene.userData.fightView === 'prediction' && !predictionRenderers.has(renderer)) {
      predictionRenderers.add(renderer)
      predictionContexts++
    }
    if (scene.userData.fightView === 'primary') {
      primaryScene = scene
      probe.draw(renderer)
    }
  }
  export function start(options: PerformanceScenario) {
    running = false
    comfort = { ...defaultFightComfort(), graphics: options.graphics ?? 'quality' }
    scenario = options.scenario
    requiredEffectSeen = !scenario
    predictionRenderers = new WeakSet()
    predictionContexts = 0
    tape = performanceTape(options)
    live = options.live ?? false
    replay = driver()
    state = replay.state
    verified = 0
    failure = ''
    probe.reset()
    running = true
  }
  export function freeze(options: PerformanceScenario, frame: number) {
    start(options)
    running = false
    for (let tick = 0; tick <= frame; tick++) state = replay.advance(1 / 60)
    probe.freezeTime(6000)
    probe.stop()
  }
  export function reset() {
    verified = 0
    requiredEffectSeen = stressManifested(state, scenario)
    probe.reset()
  }
  export function pause() {
    running = false
    probe.stop()
  }
  export function gpuTiming(value: boolean) {
    probe.gpuTiming(value)
  }
  export function result() {
    return {
      ...probe.result(),
      verified,
      failure: failure || replay.error,
      tapeHash: tape.checkpoints.at(-1)!.hash,
      failedScene: Boolean(document.querySelector('.fight-scene.failed')),
      requiredEffectSeen,
      predictionContexts,
      stateFrame: state.frame,
      expressions: expressionProof(primaryScene),
    }
  }
  onMount(() => {
    let last = performance.now(),
      frame = 0
    const advance = (now: number) => {
      if (running) {
        if (replay.done) {
          if (replay.error) {
            failure = replay.error
            running = false
          } else {
            verified++
            replay = driver()
          }
        }
        state = replay.advance(Math.min(0.05, (now - last) / 1000))
        requiredEffectSeen ||= stressManifested(state, scenario)
      }
      last = now
      frame = requestAnimationFrame(advance)
    }
    frame = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frame)
  })
</script>

<main>
  <p>Production benchmark · {state.player.id} / {state.opponent.id}</p>
  <FightStage
    {state}
    {comfort}
    language="fr"
    stageId={state.environment.stageId}
    onAttack={() => {}}
    onThrow={() => {}}
    onCall={() => {}}
    onFinisher={() => {}}
    onControl={() => {}}
    onOpponentControl={() => {}}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #e9eef4;
  }
  main {
    padding: 0.5rem;
  }
  :global(.fight-arena) {
    height: 560px !important;
    min-height: 560px !important;
  }
  :global(.fight-stage) {
    margin: 0;
  }
</style>
