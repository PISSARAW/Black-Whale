<script lang="ts">
  import { tick, onMount } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { buildFilm, filmReport, FPS } from './film'
  import { HOLD } from './timeline'

  const params = new URLSearchParams(location.search)
  const film = buildFilm(params.get('only')?.split(','))
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }
  let frame = $state(0)
  let simOverride = $state<number | null>(null)
  let playing = $state(!params.has('export'))
  let now = $derived(film.at(frame))
  let shot = $derived(now.placed.shot)
  // Training mode draws collision boxes; the film shows the same simulation without them.
  let state = $derived({
    ...shot.route.states[simOverride ?? now.sim],
    mode: 'versus-ai' as const,
  })
  let ending = $derived(frame >= film.frames - HOLD)
  onMount(() => {
    let raf = 0
    let previous = 0
    let carry = 0
    const loop = (t: number) => {
      if (playing && previous) {
        carry += ((t - previous) * FPS) / 1000
        const step = Math.floor(carry)
        carry -= step
        frame = (frame + step) % film.frames
      }
      previous = t
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  })
  export async function seek(value: number) {
    playing = false
    simOverride = null
    frame = Math.min(film.frames - 1, Math.max(0, value))
    await tick()
  }
  export async function seekSim(value: number, simulation: number) {
    await seek(value)
    simOverride = simulation
    await tick()
  }
  export function report() {
    return filmReport(film)
  }
</script>

<main>
  {#key now.index}
    <FightScene
      {state}
      {comfort}
      language="en"
      stageId="heavens-arena"
      viewer="player"
      keepCombatantMarkers={false}
      hideSecondaryView
      cameraFrame={now.camera}
    />
  {/key}
  <header>BLACK WHALE <b>CLASH</b></header>
  {#if !ending}
    <aside style={`opacity:${Math.min(1, now.local / 4)}`}>
      <small>{String(now.index + 1).padStart(2, '0')} / {film.placed.length}</small>
      <h1>{shot.route.name}</h1>
      <p>{shot.route.title}</p>
    </aside>
  {:else}
    <section style={`opacity:${Math.min(1, (frame - (film.frames - HOLD)) / 8)}`}>
      <h2>{film.placed.length} fighters</h2>
      <p>one signature combo each</p>
    </section>
  {/if}
  <footer>exploreblackwhale.com/fighting</footer>
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
    font: 2.4vw system-ui;
    letter-spacing: 0.2em;
    color: #ffffffb0;
  }
  aside {
    position: absolute;
    left: 5%;
    right: 5%;
    bottom: 12%;
    text-shadow: 0 3px 9px #000;
  }
  h1 {
    margin: 0.1em 0 0;
    font-size: 10vw;
    text-transform: uppercase;
    line-height: 1;
  }
  p {
    margin: 0.4em 0 0;
    font: 3.4vw system-ui;
    color: #edcc89;
  }
  section {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    background: #07090eb0;
  }
  h2 {
    margin: 0;
    font-size: 12vw;
    text-transform: uppercase;
  }
  section p {
    font-size: 4.2vw;
  }
  footer {
    position: absolute;
    bottom: 5%;
    width: 100%;
    text-align: center;
    font: 2.6vw system-ui;
  }
  button {
    position: absolute;
    bottom: 1%;
    right: 2%;
  }
</style>
