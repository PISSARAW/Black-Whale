<script lang="ts">
  import { tick, onMount } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import {
    recordClips,
    orderClips,
    simulationFrame,
    cutDistance,
    impactCues,
    LENGTH,
    FPS,
    BEAT,
  } from './film'

  const only = new URLSearchParams(location.search).get('only')?.split(',')
  const clips = orderClips(recordClips(only))
  const frames = clips.length * LENGTH
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }
  let frame = $state(0)
  let simOverride = $state<number | null>(null)
  let playing = $state(!new URLSearchParams(location.search).has('export'))
  let index = $derived(Math.min(clips.length - 1, Math.floor(frame / LENGTH)))
  let clip = $derived(clips[index])
  let local = $derived(frame % LENGTH)
  let sim = $derived(simOverride ?? simulationFrame(clip, local))
  let state = $derived(clip.states[sim])
  onMount(() => {
    let raf = 0
    let previous = 0
    let carry = 0
    const loop = (now: number) => {
      if (playing && previous) {
        carry += ((now - previous) * FPS) / 1000
        const advance = Math.floor(carry)
        carry -= advance
        frame = (frame + advance) % frames
      }
      previous = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  })
  export async function seek(value: number) {
    playing = false
    simOverride = null
    frame = Math.min(frames - 1, Math.max(0, value))
    await tick()
  }
  export async function seekSim(value: number, simulation: number) {
    await seek(value)
    simOverride = simulation
    await tick()
  }
  export function report() {
    const sims = Array.from({ length: frames }, (_, f) =>
      simulationFrame(clips[Math.floor(f / LENGTH)], f % LENGTH),
    )
    return {
      fps: FPS,
      bpm: 150,
      beat: BEAT,
      frames,
      duration: frames / FPS,
      failures: clips.filter((c) => c.error).map((c) => `${c.id}: ${c.error}`),
      cuts: clips.map((_, i) => i * LENGTH),
      sims,
      clock: sims.map((s, i) => (i % LENGTH ? Math.max(1, ((s - sims[i - 1]) * 1000) / 60) : 33)),
      cues: clips.flatMap((c, i) => [
        { at: i * LENGTH, kind: 'whoosh' },
        ...impactCues(c, i * LENGTH),
      ]),
      clips: clips.map((c, i) => ({
        id: c.id,
        stage: 'heavens-arena',
        frames: c.states.length,
        impacts: c.contacts,
        observed: [c.title],
        events: [],
        error: c.error,
        reached: c.reached,
        expectedContacts: c.expected,
        matchDistance: i ? cutDistance(clips[i - 1], c) : 0,
      })),
    }
  }
</script>

<main>
  {#key index}
    <FightScene
      {state}
      {comfort}
      language="fr"
      stageId="heavens-arena"
      viewer="player"
      keepCombatantMarkers={false}
      hideSecondaryView
    />
  {/key}
  <header>
    BLACK WHALE <b>CLASH</b><small>COMBOS SIGNATURES · {index + 1}/{clips.length}</small>
  </header>
  <aside>
    <h1>{clip.name}</h1>
    <p>{clip.title}</p>
  </aside>
  <footer>exploreblackwhale.com/fighting</footer>
  <div class="splice" style={`opacity:${local < 2 ? (2 - local) * 0.15 : 0}`}></div>
  {#if playing}<button onclick={() => (playing = false)}>Pause</button>{/if}
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: #07090e;
    overflow: hidden;
    color: #fff;
    font-family: Impact, sans-serif;
  }
  main {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
  main :global(.fight-scene) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  header {
    position: absolute;
    top: 5%;
    left: 5%;
    font-size: 5vw;
    letter-spacing: 0.05em;
    text-shadow: 0 2px 5px #000;
  }
  b {
    color: #d9b674;
  }
  small {
    display: block;
    font: 2.3vw system-ui;
    margin-top: 1em;
  }
  aside {
    position: absolute;
    left: 5%;
    right: 5%;
    bottom: 12%;
    text-shadow: 0 3px 9px #000;
  }
  h1 {
    margin: 0;
    font-size: 10vw;
    text-transform: uppercase;
  }
  p {
    font: 3.4vw system-ui;
    color: #edcc89;
  }
  footer {
    position: absolute;
    bottom: 5%;
    width: 100%;
    text-align: center;
    font: 2.6vw system-ui;
  }
  .splice {
    position: absolute;
    inset: 0;
    background: white;
    pointer-events: none;
  }
  button {
    position: absolute;
    bottom: 1%;
    right: 2%;
  }
</style>
