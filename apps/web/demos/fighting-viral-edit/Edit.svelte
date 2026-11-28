<script lang="ts">
  import { tick, onMount } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { buildFilm, filmReport, FPS } from './film'
  import { FREEZE } from './shots'

  const params = new URLSearchParams(location.search)
  const film = buildFilm()
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }
  let frame = $state(0)
  let simOverride = $state<number | null>(null)
  let playing = $state(!params.has('export'))
  let now = $derived(film.at(frame))
  let cut = $derived(now.cut)
  let look = $derived(now.look)
  // Training mode draws collision boxes; the edit shows the same simulation without them.
  let state = $derived({
    ...cut.shot.route.states[simOverride ?? now.sim],
    mode: 'versus-ai' as const,
  })
  let sinceFreeze = $derived(cut.freeze === undefined ? -1 : now.local - cut.freeze)
  /** Text pops in large and settles within four frames. */
  const pop = (since: number) => (since < 0 ? 0 : 1 + Math.max(0, 4 - since) * 0.12)
  let counted = $derived(
    cut.damage ? Math.round(cut.damage * Math.min(1, Math.max(0, sinceFreeze + 1) / FREEZE)) : 0,
  )
  let filter = $derived(
    look.impact === 2
      ? 'invert(1) grayscale(1) contrast(3)'
      : look.impact === 1
        ? 'grayscale(1) contrast(4) brightness(1.2)'
        : look.gray
          ? 'grayscale(1) contrast(1.3) brightness(0.8)'
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

<main>
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
  <div class="lines" style={`opacity:${look.lines}`}></div>
  <div class="flash" style={`opacity:${look.flash}`}></div>

  {#if cut.section === 'hook' && now.local >= 4}
    <h2 class="hook" style={`transform:scale(${pop(now.local - 4)})`}>Who hits<br />hardest?</h2>
  {:else if cut.section === 'build' && frame < 78}
    <h2 class="hook small" style={`transform:scale(${pop(frame - 48)})`}>40 fighters.</h2>
  {:else if cut.section === 'brake'}
    <h2 class="top" style={`transform:scale(${pop(now.local)})`}>Top 3</h2>
  {:else if cut.section === 'drop' && sinceFreeze >= 0}
    <div class="rank" style={`transform:scale(${pop(sinceFreeze)})`}>
      <b>#{cut.rank}</b>
      <span>{now.name}</span>
      <em>{counted} dmg</em>
    </div>
  {:else if cut.section === 'end'}
    <div class="end" style={`transform:scale(${pop(now.local)})`}>
      <span>Who's your main?</span>
      <small>Play free · exploreblackwhale.com/fighting</small>
    </div>
  {/if}
  {#if cut.section === 'build' || cut.section === 'rush'}
    <p class="name">{now.name}</p>
  {/if}
  <header>BLACK WHALE <b>CLASH</b></header>
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
    background: #fff;
    pointer-events: none;
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
    text-shadow:
      0 0.6vw 0 #b3261e,
      0 1vw 3vw #000;
  }
  .hook {
    top: 20%;
    font-size: 15vw;
  }
  .hook.small {
    font-size: 11vw;
  }
  .top {
    top: 38%;
    font-size: 26vw;
    color: #edcc89;
  }
  .rank {
    position: absolute;
    left: 6%;
    right: 6%;
    top: 16%;
    display: grid;
    justify-items: center;
    text-transform: uppercase;
    -webkit-text-stroke: 0.25vw #000;
    text-shadow: 0 1vw 3vw #000;
    transform-origin: 50% 30%;
  }
  .rank b {
    font-size: 30vw;
    line-height: 0.9;
    color: #edcc89;
    text-shadow:
      0 0.8vw 0 #b3261e,
      0 1vw 3vw #000;
  }
  .rank span {
    font-size: 12vw;
  }
  .rank em {
    font-style: normal;
    font-size: 9vw;
    color: #ff5a4a;
  }
  .end {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    gap: 3vw;
    text-transform: uppercase;
  }
  .end span {
    font-size: 10vw;
    -webkit-text-stroke: 0.25vw #000;
    text-shadow: 0 0.8vw 0 #b3261e;
  }
  .end small {
    font: 3.6vw system-ui;
    text-transform: none;
    color: #edcc89;
  }
  .name {
    position: absolute;
    left: 6%;
    bottom: 9%;
    margin: 0;
    font-size: 9vw;
    text-transform: uppercase;
    -webkit-text-stroke: 0.2vw #000;
    text-shadow: 0 0.6vw 0 #b3261e;
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
  button {
    position: absolute;
    bottom: 1%;
    right: 2%;
  }
</style>
