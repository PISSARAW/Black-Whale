<script lang="ts">
  import { tick, onMount } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { buildFilm, filmReport, FPS, INTRO, HOLD } from './film'

  const params = new URLSearchParams(location.search)
  const film = buildFilm()
  const count = film.placed.length
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }
  let frame = $state(0)
  let simOverride = $state<number | null>(null)
  let playing = $state(!params.has('export'))
  let now = $derived(film.at(frame))
  let combo = $derived(now.placed.combo)
  // Training mode draws collision boxes; the film shows the same simulation without them.
  let state = $derived({
    ...combo.states[simOverride ?? now.sim],
    mode: 'versus-ai' as const,
  })
  let intro = $derived(frame < INTRO)
  let ending = $derived(frame >= film.frames - HOLD)
  let fade = $derived(Math.min(1, now.local / 4))
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
  <header>BLACK WHALE <b>CLASH</b><small>FEITAN · EVERY COMBO</small></header>
  {#if intro}
    <section class="card" style={`opacity:${1 - Math.max(0, (frame - INTRO + 8) / 8)}`}>
      <h2>Feitan</h2>
      <p>{count} combos · Kameos included</p>
    </section>
  {:else if ending}
    <section class="card" style={`opacity:${Math.min(1, (frame - (film.frames - HOLD)) / 8)}`}>
      <h2>{count} combos</h2>
      <p>Play free · exploreblackwhale.com/fighting</p>
    </section>
  {:else}
    <aside style={`opacity:${fade}`}>
      <div class="tag">
        <span>{String(now.index + 1).padStart(2, '0')} / {count}</span>
        <em class:kameo={combo.family === 'Kameo'} class:signature={combo.family === 'Signature'}
          >{combo.family}</em
        >
      </div>
      <h1>{combo.title}</h1>
      {#if combo.steps.length}
        <ol>
          {#each combo.steps as step, i (i)}
            <li><kbd>{step.input}</kbd><span>{step.name}</span></li>
          {/each}
        </ol>
      {/if}
      <p class="stats">{combo.hits} hits · {combo.damage} damage</p>
    </aside>
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
  header small {
    display: block;
    margin-top: 0.6em;
    font: 2.4vw system-ui;
    letter-spacing: 0.25em;
    color: #ffffffc0;
  }
  aside {
    position: absolute;
    left: 5%;
    right: 5%;
    bottom: 10%;
    text-shadow: 0 3px 9px #000;
  }
  .tag {
    display: flex;
    gap: 0.8em;
    align-items: center;
    font: 2.4vw system-ui;
    letter-spacing: 0.2em;
  }
  em {
    font-style: normal;
    text-transform: uppercase;
    padding: 0.2em 0.6em;
    border: 1px solid #edcc89;
    color: #edcc89;
  }
  em.kameo {
    background: #edcc89;
    color: #07090e;
    text-shadow: none;
  }
  em.signature {
    background: #b3261e;
    border-color: #b3261e;
    color: #fff;
  }
  h1 {
    margin: 0.25em 0 0.35em;
    font-size: 7.4vw;
    line-height: 1.05;
    text-transform: uppercase;
  }
  ol {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em 1.1em;
    margin: 0;
    padding: 0;
    list-style: none;
    font: 2.5vw system-ui;
  }
  li {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }
  kbd {
    font: 700 3.2vw system-ui;
    color: #fff;
  }
  li span {
    color: #ffffffb0;
    font-size: 2.1vw;
  }
  .stats {
    margin: 0.8em 0 0;
    font: 2.6vw system-ui;
    color: #edcc89;
  }
  .card {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    background: #07090eb0;
  }
  h2 {
    margin: 0;
    font-size: 14vw;
    text-transform: uppercase;
  }
  .card p {
    font: 4vw system-ui;
    color: #edcc89;
  }
  footer {
    position: absolute;
    bottom: 4%;
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
