<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { cinematicFrame, createKurapikaVideoDemo, transitionOpacity } from './demo'

  const demo = createKurapikaVideoDemo()
  let state = demo.initial
  let frame = 0
  let cameraFrame = cinematicFrame(state, frame)
  let cut = transitionOpacity(frame)
  const comfort = {
    graphics: 'quality' as const,
    shake: 0.5 as const,
    camera: 1 as const,
    flashes: true,
    highContrast: false,
  }

  export async function advance(count = 2) {
    for (let index = 0; index < count; index++) {
      const next = demo.advance()
      state = next.state
      frame = next.frame
    }
    cameraFrame = cinematicFrame(state, frame)
    cut = transitionOpacity(frame)
    await tick()
  }
  export function diagnostics() {
    return demo.diagnostics()
  }
</script>

<main>
  <div class="film">
    <FightScene
      {state}
      {comfort}
      {cameraFrame}
      presentationSeconds={frame / 60}
      stageId="banquet-hall"
      viewer="player"
      keepCombatantMarkers={false}
      hideSecondaryView={true}
    />
    <div class="grade"></div>
    <div class="cut" style:opacity={cut}></div>
    {#if frame < 92}
      <div class="title" style:opacity={Math.min(1, frame / 25, (92 - frame) / 25)}>
        <small>BLACK WHALE</small>
        <strong>KURAPIKA × MIZAISTOM</strong>
      </div>
    {/if}
    {#if frame >= 700 && frame < 790}
      <div class="scarlet" style:opacity={Math.min(1, (frame - 700) / 24, (790 - frame) / 24)}>
        EMPEROR TIME
      </div>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000;
    color: white;
    font-family: system-ui;
  }
  main,
  .film {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000;
  }
  .film :global(.fight-scene) {
    position: absolute;
    inset: 0;
  }
  .film::before,
  .film::after {
    content: '';
    position: absolute;
    z-index: 8;
    left: 0;
    right: 0;
    height: 54px;
    background: #000;
    pointer-events: none;
  }
  .film::before {
    top: 0;
  }
  .film::after {
    bottom: 0;
  }
  .grade {
    position: absolute;
    z-index: 5;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 50% 48%, transparent 45%, rgb(3 8 16 / 28%) 100%),
      linear-gradient(180deg, rgb(12 22 38 / 14%), transparent 42%, rgb(8 12 22 / 18%));
    mix-blend-mode: multiply;
  }
  .cut {
    position: absolute;
    z-index: 12;
    inset: 0;
    pointer-events: none;
    background: #020307;
  }
  .title {
    position: absolute;
    z-index: 10;
    left: 70px;
    bottom: 86px;
    display: grid;
    gap: 5px;
    text-shadow: 0 2px 12px #000;
  }
  .title small {
    color: #b7cce0;
    font-size: 10px;
    letter-spacing: 0.4em;
  }
  .title strong {
    font-size: 22px;
    font-weight: 560;
    letter-spacing: 0.08em;
  }
  .scarlet {
    position: absolute;
    z-index: 10;
    right: 68px;
    bottom: 82px;
    color: #e85a75;
    font-size: 12px;
    letter-spacing: 0.38em;
    text-shadow: 0 0 16px #8b1129;
  }
</style>
