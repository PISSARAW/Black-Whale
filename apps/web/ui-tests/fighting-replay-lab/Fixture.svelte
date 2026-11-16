<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import FightReplays from '$lib/components/fighting/FightReplays.svelte'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { EMPTY_INPUT } from '$lib/fighting/types'
  import type { ReplayFighter } from '$lib/fighting/fightReplayTypes'
  import { fresh, distribution, benchmarkEngine } from './performance'
  let runtime = createFightMatchRuntime()
  let replays = runtime.replays
  let state = fresh('kurapika')
  let running = false
  let lastRender: number | null = null
  let samples: number[] = []
  let tick = 0
  THREE.Scene.prototype.onAfterRender = function (_renderer, scene) {
    if (!(scene instanceof THREE.Scene) || !scene.getObjectByName('fight-collision-boxes')) return
    const now = performance.now()
    if (lastRender !== null) samples.push(now - lastRender)
    lastRender = now
  }
  export function start(id: ReplayFighter, recording: boolean) {
    runtime = createFightMatchRuntime(undefined, { record: recording })
    replays = runtime.replays
    state = fresh(id)
    runtime.begin(state)
    state = runtime.apply(state, { kind: 'start' })
    running = true
    tick = 0
    resetSamples()
  }
  export function resetSamples() {
    samples = []
    lastRender = null
  }
  export function result() {
    const canvas = document.querySelector('canvas')
    const gl = canvas?.getContext('webgl2')
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    return {
      renderMilliseconds: distribution(samples),
      renderer: info && gl ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown',
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      packets: runtime.replays.active ? 0 : undefined,
    }
  }
  export function engine() {
    return benchmarkEngine()
  }
  onMount(() => {
    let raf = 0
    let previous = performance.now()
    const frame = (now: number) => {
      if (running) {
        if (state.phase === 'finished') {
          if (!state.matchWinner) state = runtime.apply(state, { kind: 'round' })
          else {
            const id = state.player.id as ReplayFighter
            state = fresh(id)
            runtime.begin(state)
            state = runtime.apply(state, { kind: 'start' })
          }
        }
        if (tick++ % 45 === 0)
          runtime.enqueue(state, {
            kind: 'move',
            side: 'player',
            action: tick % 90 === 1 ? 'special' : 'heavy',
            input: 0,
          })
        if (tick % 90 === 0)
          runtime.enqueue(state, { kind: 'move', side: 'opponent', action: 'ranged', input: 0 })
        state = runtime.advance(
          state,
          { ...EMPTY_INPUT, right: true },
          {
            dt: Math.min(0.05, (now - previous) / 1000),
            opponentInput: { ...EMPTY_INPUT, left: true },
          },
        )
      }
      previous = now
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  })
</script>

<main>
  <p>{state.player.id} · capture et rendu de référence</p>
  <FightReplays {replays} language="fr" onOpen={() => {}} onClose={() => {}} onRestart={() => {}} />
  <div class="arena">
    {#key `${state.player.id}:${state.opponent.id}`}<FightScene
        {state}
        stageId="heavens-arena"
      />{/key}
    <FightHud {state} language="fr" />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #e8edf7;
  }
  main {
    padding: 0.5rem;
  }
  .arena {
    position: relative;
    height: 560px;
    width: 100%;
    overflow: hidden;
  }
</style>
