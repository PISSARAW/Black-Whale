<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { createHisokaMachiDemo } from './demo'

  const demo = createHisokaMachiDemo()
  let state = demo.initial
  let title = '1 / Cartes physiques et frappes sans téléportation'
  let frame = 0
  const comfort = {
    graphics: 'quality' as const,
    shake: 0.25 as const,
    camera: 0.65 as const,
    flashes: true,
    highContrast: false,
  }

  export async function advance(count = 2) {
    for (let index = 0; index < count; index++) {
      const next = demo.advance()
      state = next.state
      title = next.title
      frame = next.frame
    }
    await tick()
  }

  export function diagnostics() {
    return demo.diagnostics()
  }
</script>

<main>
  <header>
    <div>
      <span>BLACK WHALE CLASH / HISOKA VS MACHI</span>
      <h1>{title}</h1>
    </div>
    <p>Cartes réelles · Bungee Gum<br />Texture Surprise · IA observatrice</p>
  </header>
  <div class="arena">
    <FightLiveScene
      {state}
      {comfort}
      stageId="heavens-arena"
      viewer={frame < 900 ? 'player' : 'opponent'}
    />
    <FightHud {state} language="fr" />
  </div>
  <footer>
    <span>Hisoka contre Machi · Démonstration des corrections</span><span
      >Simulation réelle · {String(Math.floor(frame / 60)).padStart(2, '0')} s</span
    >
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0a0c14;
    color: #f4eef4;
    font-family: system-ui;
  }
  main {
    height: 100vh;
    display: grid;
    grid-template-rows: 84px 1fr 38px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 28px;
    border-bottom: 1px solid #583c62;
    background: linear-gradient(90deg, #17101e, #0a0c14 65%);
  }
  header span {
    color: #e0a7d7;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    margin: 6px 0 0;
    font-size: 21px;
    font-weight: 600;
  }
  header p {
    margin: 0;
    color: #e4c894;
    font-size: 12px;
    line-height: 1.7;
    text-align: right;
  }
  .arena {
    position: relative;
    overflow: hidden;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    color: #aeb5c5;
    font-size: 12px;
  }
</style>
