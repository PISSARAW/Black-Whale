<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { createFeitanDemo } from './demo'

  const demo = createFeitanDemo()
  let state = demo.initial
  let title = '1 / Approches basses, dash, retrait et bond'
  let frame = 0
  const comfort = {
    graphics: 'quality' as const,
    shake: 0 as const,
    camera: 0.5 as const,
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
      <span>BLACK WHALE CLASH / FEITAN</span>
      <h1>{title}</h1>
    </div>
    <p>Marche +19 %<br />Dash et recul accélérés</p>
  </header>
  <div class="arena">
    <FightLiveScene
      {state}
      {comfort}
      stageId="heavens-arena"
      viewer={frame < 840 ? 'player' : 'opponent'}
    />
    <FightHud {state} language="fr" />
  </div>
  <footer>
    <span>Feitan contre Hisoka · Combat d’entraînement</span><span
      >Vitesse réelle · {String(Math.floor(frame / 60)).padStart(2, '0')} s</span
    >
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0c1019;
    color: #f2edf3;
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
    border-bottom: 1px solid #574158;
  }
  header span {
    color: #c4a3c3;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    font-size: 21px;
    font-weight: 600;
    margin: 6px 0 0;
  }
  header p {
    margin: 0;
    font-size: 12px;
    color: #e8d0a5;
    text-align: right;
    line-height: 1.7;
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
    color: #acb4c6;
    font-size: 12px;
  }
</style>
