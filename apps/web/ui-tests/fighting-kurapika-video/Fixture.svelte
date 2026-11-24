<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { createKurapikaVideoDemo } from './demo'

  const demo = createKurapikaVideoDemo()
  let state = demo.initial
  let title = '1 / Garde verticale et pas-éclair de 1999'
  let note = 'Rémanences de corps entier · dash toujours vulnérable'
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
      note = next.note
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
      <span>BLACK WHALE CLASH / PREUVE DE FIDÉLITÉ</span>
      <h1>{title}</h1>
      <p>{note}</p>
    </div>
    <aside>1999 + 2011 + BLACK WHALE</aside>
  </header>
  <div class="arena">
    <FightLiveScene {state} {comfort} stageId="banquet-hall" viewer="player" />
    <FightHud {state} language="fr" />
  </div>
  <footer>
    <span>Kurapika contre Mizaistom · démonstration contrôlée</span>
    <span>{String(Math.floor(frame / 60)).padStart(2, '0')} s · moteur réel à 60 Hz</span>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #edf4fb;
    font-family: system-ui;
  }
  main {
    height: 100vh;
    display: grid;
    grid-template-rows: 100px 1fr 40px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    border-bottom: 1px solid #314b61;
    background: linear-gradient(90deg, #0b1724, #161326);
  }
  header span {
    color: #8eb9d8;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    margin: 5px 0 3px;
    font-size: 22px;
    font-weight: 650;
  }
  p {
    margin: 0;
    color: #c5d1dc;
    font-size: 12px;
  }
  aside {
    padding: 9px 13px;
    border: 1px solid #8e4f65;
    color: #efb4c4;
    font-size: 11px;
    letter-spacing: 0.1em;
  }
  .arena {
    position: relative;
    overflow: hidden;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    color: #a9bac7;
    font-size: 12px;
  }
</style>
