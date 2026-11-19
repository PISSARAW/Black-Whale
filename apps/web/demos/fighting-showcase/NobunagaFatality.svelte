<script lang="ts">
  import { onMount } from 'svelte'
  import { FIGHTING_ROSTER } from '../../src/lib/fighting/roster'
  import { FIGHT_STAGES } from '../../src/lib/fighting/stages'
  import type { createNobunagaFatalityScene } from './nobunagaFatalityScene'
  const query = new URLSearchParams(location.search)
  const target =
    query.get('target') === 'nobunaga'
      ? 'nobunaga'
      : (FIGHTING_ROSTER.find((fighter) => fighter.id === query.get('target'))?.id ?? 'franklin')
  const stageId = FIGHT_STAGES.find((stage) => stage.id === query.get('stage'))?.id ?? 'whale-hold'
  const targetName =
    target === 'nobunaga'
      ? 'Nobunaga'
      : FIGHTING_ROSTER.find((fighter) => fighter.id === target)!.name
  let canvas: HTMLCanvasElement, sound: HTMLAudioElement
  let scene: Awaited<ReturnType<typeof createNobunagaFatalityScene>> | undefined
  let age = 0,
    mounted = false,
    failed = false,
    playing = false,
    raf = 0
  $: phase =
    age < 72
      ? 'Ne franchis pas cette limite.'
      : age < 264
        ? 'En'
        : age < 300
          ? 'Un pas de trop'
          : age < 390
            ? 'Le dégainé'
            : age < 510
              ? 'Le dernier pas'
              : 'Trop tard.'
  export const ready = () => mounted || failed
  export const report = () => ({
    character: 'Nobunaga',
    target,
    stageId,
    duration: 10,
    frameCount: 600,
    standalone: true,
    playable: false,
    nativeModels: true,
    failed,
    currentAge: age,
    audit: scene?.audit(),
    victory: {
      entryFrame: 300,
      drawFrame: 300,
      contactFrame: 308,
      fallFrame: 390,
      sheathFrame: 510,
    },
  })
  export function seek(frame: number) {
    playing = false
    cancelAnimationFrame(raf)
    sound?.pause()
    age = Math.max(0, Math.min(599, frame))
    scene?.draw(age)
  }
  function play() {
    age = 0
    playing = true
    sound.currentTime = 0
    void sound.play().catch(() => {})
    const start = performance.now()
    const step = (now: number) => {
      age = Math.min(599, Math.floor((now - start) * 0.06))
      scene?.draw(age)
      if (age < 599 && playing) raf = requestAnimationFrame(step)
      else {
        playing = false
        sound.pause()
      }
    }
    raf = requestAnimationFrame(step)
  }
  onMount(() => {
    let alive = true
    void import('./nobunagaFatalityScene')
      .then(async ({ createNobunagaFatalityScene }) => {
        const built = await createNobunagaFatalityScene({
          canvas,
          target,
          stageId,
          reduced: query.has('reduced'),
        })
        if (!alive) {
          built.dispose()
          return
        }
        scene = built
        mounted = true
      })
      .catch((error) => {
        console.error(error)
        failed = true
      })
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      scene?.dispose()
    }
  })
</script>

<main>
  <canvas bind:this={canvas} aria-label="Fatality de Nobunaga" />
  <audio bind:this={sound} src="/clash-victories/nobunaga.m4a" preload="auto"></audio>
  <div class="letterbox top"></div>
  <div class="letterbox bottom"></div>
  <p class="match">Nobunaga <span>face à {targetName}</span></p>
  {#if age >= 480}<div class="verdict">
      <strong>FATALITY</strong><b>NOBUNAGA</b><span>Le dernier pas</span>
    </div>{/if}
  <footer>
    <b>BLACK WHALE <span>CLASH</span></b>
    <p>{phase}</p>
    <small>NOBUNAGA · LE DERNIER PAS</small>
  </footer>
  {#if !query.has('capture')}<button disabled={!mounted || playing} onclick={play}
      >{playing ? 'Lecture…' : 'Lire les 10 secondes'}</button
    >
    <p class="notice">Démo autonome · Nobunaga n’est pas encore jouable</p>{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #05090d;
    color: #eee9df;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    font-family: Arial, sans-serif;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .letterbox {
    position: absolute;
    left: 0;
    right: 0;
    height: 7%;
    background: #06070b;
  }
  .top {
    top: 0;
  }
  .bottom {
    bottom: 0;
  }
  .match {
    position: absolute;
    top: 1.5%;
    left: 3%;
    margin: 0;
    font-size: clamp(10px, 1.2vw, 16px);
    letter-spacing: 0.08em;
  }
  .match span {
    margin-left: 0.7em;
    font-size: 0.8em;
    color: #c3c0b8;
  }
  footer {
    position: absolute;
    bottom: 1%;
    left: 3%;
    right: 3%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #d9c390;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: clamp(8px, 1vw, 15px);
  }
  footer b {
    font-size: 0.7em;
  }
  footer b span {
    color: #eee;
    margin-left: 0.6em;
  }
  footer p {
    margin: 0;
    font-size: 0.8em;
  }
  footer small {
    font-size: 0.5em;
  }
  .verdict {
    position: absolute;
    top: 43%;
    left: 5%;
    display: grid;
    gap: 0.6rem;
  }
  .verdict strong {
    font-family: Georgia, serif;
    font-size: clamp(28px, 4vw, 65px);
    color: #efaa70;
    text-shadow: 0 3px 16px #000;
  }
  .verdict b {
    letter-spacing: 0.2em;
    font-size: clamp(14px, 1.6vw, 26px);
  }
  .verdict span {
    font-size: 12px;
  }
  button {
    position: absolute;
    right: 3%;
    top: 9%;
    background: #111b23;
    color: #eee;
    border: 1px solid #b7a16a;
    padding: 0.7rem 1rem;
    cursor: pointer;
  }
  .notice {
    position: absolute;
    bottom: 9%;
    left: 3%;
    font-size: 11px;
    opacity: 0.7;
  }
  @media (max-width: 600px) {
    footer small {
      display: none;
    }
  }
</style>
