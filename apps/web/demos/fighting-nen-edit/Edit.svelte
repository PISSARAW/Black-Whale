<script lang="ts">
  import { tick, onMount } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { buildFilm, filmReport, FPS } from './film'
  import { BEAT, PIVOT_FREEZE } from './shots'
  import { COLOURS, TITLES } from './groups'
  import Hexagon from './Hexagon.svelte'

  const params = new URLSearchParams(location.search)
  const film = buildFilm()
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }
  let frame = $state(0)
  let simOverride = $state<number | null>(null)
  let playing = $state(!params.has('export'))
  let now = $derived(film.at(frame))
  let cut = $derived(now.cut)
  let look = $derived(now.look)
  let colour = $derived(COLOURS[now.category])
  // Training mode draws collision boxes; the edit shows the same simulation without them.
  let state = $derived({
    ...cut.shot.route.states[simOverride ?? now.sim],
    mode: 'versus-ai' as const,
  })
  const pop = (since: number) => (since < 0 ? 0 : 1 + Math.max(0, 4 - since) * 0.12)
  let held = $derived(cut.kind === 'pivot' ? now.local - PIVOT_FREEZE : -1)
  let bigTitle = $derived((cut.opens && now.local < 18) || (held >= BEAT / 2 && held < BEAT + 8))
  let titleSince = $derived(cut.opens ? now.local : held - BEAT / 2)
  let filter = $derived(
    look.impact === 2
      ? 'invert(1) grayscale(1) contrast(3)'
      : look.impact === 1
        ? 'grayscale(1) contrast(4) brightness(1.2)'
        : look.gray
          ? 'grayscale(1) contrast(1.2) brightness(0.75)'
          : 'none',
  )
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

<main style={`--aura:${colour}`}>
  <div
    class="stage"
    style={`transform:translate(${look.shakeX}px,${look.shakeY}px) scale(${look.zoom});filter:${filter}`}
  >
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
  </div>
  <div class="scarlet" style={`opacity:${look.scarlet}`}></div>
  <div class="lines" style={`opacity:${look.lines}`}></div>
  <div class="flash" style={`opacity:${look.flash}`}></div>

  <header>BLACK WHALE <b>CLASH</b></header>
  {#if cut.kind !== 'hook'}
    <div class="hex"><Hexagon active={now.category} size={30} /></div>
  {/if}

  {#if cut.kind === 'hook'}
    <h2 class="hook" style={`transform:scale(${pop(frame - 4)})`}>
      {frame < 24 ? '40 fighters' : '6 types of Nen'}
    </h2>
  {:else if cut.kind === 'end'}
    <div class="end" style={`transform:scale(${pop(now.local)})`}>
      <Hexagon active="unknown" size={34} />
      <span>Who's your main?</span>
      <small>40 fighters · play free · exploreblackwhale.com/fighting</small>
    </div>
  {:else}
    {#if bigTitle}
      <h2 class="section" style={`transform:scale(${pop(titleSince)})`}>
        {TITLES[now.category]}
      </h2>
    {/if}
    {#if held >= 0 && held < BEAT / 2}
      <p class="emperor">Emperor Time</p>
    {/if}
    {#if !(held >= 0 && held < BEAT)}
      <aside style={`opacity:${Math.min(1, now.local / 3)}`}>
        <em>{TITLES[now.category]}</em>
        <h1>{cut.name}</h1>
        <p>{cut.title}</p>
      </aside>
    {/if}
  {/if}
  {#if playing}<button onclick={() => (playing = false)}>Pause</button>{/if}
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: #000;
    overflow: hidden;
    color: #fff;
    font-family: Impact, sans-serif;
  }
  main {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
  .stage {
    position: absolute;
    inset: 0;
    transform-origin: 50% 55%;
  }
  .stage :global(.fight-scene) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .scarlet {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 45%, transparent 30%, #c4000099 75%, #4a0000 100%);
    mix-blend-mode: multiply;
  }
  .lines {
    position: absolute;
    inset: -20%;
    pointer-events: none;
    background: repeating-conic-gradient(
      from 0deg at 50% 52%,
      #fff0 0deg 5deg,
      #ffffffd0 5deg 5.6deg,
      #fff0 5.6deg 9deg,
      #000000a0 9deg 9.4deg
    );
    mask-image: radial-gradient(circle at 50% 52%, transparent 28%, #000 62%);
  }
  .flash {
    position: absolute;
    inset: 0;
    background: var(--aura);
    pointer-events: none;
    mix-blend-mode: screen;
  }
  header {
    position: absolute;
    top: 4%;
    left: 5%;
    font-size: 4.4vw;
    letter-spacing: 0.05em;
    text-shadow: 0 2px 5px #000;
  }
  header b {
    color: #d9b674;
  }
  .hex {
    position: absolute;
    top: 3%;
    right: 4%;
  }
  h2 {
    position: absolute;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    text-transform: uppercase;
    line-height: 0.95;
    -webkit-text-stroke: 0.25vw #000;
  }
  .hook {
    top: 22%;
    font-size: 14vw;
    text-shadow:
      0 0.6vw 0 #b3261e,
      0 1vw 3vw #000;
  }
  .section {
    top: 30%;
    font-size: 10vw;
    color: var(--aura);
    text-shadow:
      0 0.7vw 0 #000,
      0 0 6vw var(--aura);
  }
  .emperor {
    position: absolute;
    top: 30%;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    font-size: 9vw;
    text-transform: uppercase;
    color: #ff2a2a;
    -webkit-text-stroke: 0.2vw #000;
    text-shadow: 0 0 5vw #ff0000;
  }
  aside {
    position: absolute;
    left: 6%;
    right: 6%;
    bottom: 8%;
    text-shadow: 0 3px 9px #000;
  }
  aside em {
    font: 700 2.8vw system-ui;
    font-style: normal;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--aura);
  }
  h1 {
    margin: 0.1em 0 0;
    font-size: 12vw;
    line-height: 1;
    text-transform: uppercase;
    -webkit-text-stroke: 0.2vw #000;
  }
  aside p {
    margin: 0.3em 0 0;
    font: 600 3.6vw system-ui;
    color: #edcc89;
  }
  .end {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    text-align: center;
    gap: 3vw;
    text-transform: uppercase;
  }
  .end span {
    font-size: 11vw;
    -webkit-text-stroke: 0.25vw #000;
    text-shadow: 0 0.8vw 0 #b3261e;
  }
  .end small {
    font: 3.4vw system-ui;
    text-transform: none;
    color: #edcc89;
  }
  button {
    position: absolute;
    bottom: 1%;
    right: 2%;
  }
</style>
