<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { makeNenBout, boutEvidence } from './film'
  let chapter = $state(0)
  let cursor = $state(0)
  let bout = $state(makeNenBout(0))
  let state = $derived(bout.states[cursor])
  const comfort = { ...defaultFightComfort(), camera: 1, shake: 0.25 }
  export async function select(index: number) {
    chapter = index
    bout = makeNenBout(index)
    cursor = 0
    await tick()
  }
  export async function seek(index: number) {
    cursor = Math.min(bout.states.length - 1, index * 2)
    await tick()
  }
  export function report() {
    return { ...boutEvidence(bout), frames: Math.ceil(bout.states.length / 2), replay: bout.replay }
  }
  export function snapshot() {
    return state
  }
</script>

<main>
  <header>
    <strong>CLASH · NEN EN COMBAT</strong><span
      >{bout.player.toUpperCase()} / {bout.opponent.toUpperCase()}</span
    ><b>VITESSE NORMALE · 1×</b>
  </header>
  <section>
    {#key chapter}<FightScene
        {state}
        {comfort}
        language="fr"
        stageId={state.environment.stageId}
        viewer="player"
        presentationSeconds={cursor / 60}
      />{/key}
    <FightHud {state} language="fr" />
  </section>
  <footer>
    COMBAT AUTONOME · COMMANDES NATIVES · REPLAY VÉRIFIÉ <span>{(cursor / 60).toFixed(1)} s</span>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b13;
    color: #e5ecf8;
    font-family: Arial, sans-serif;
  }
  main {
    width: 1280px;
    height: 720px;
    display: grid;
    grid-template-rows: 54px 628px 38px;
  }
  header,
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    letter-spacing: 0.08em;
    font-size: 12px;
  }
  header strong {
    color: #b6e1f2;
  }
  header b {
    color: #d7c79f;
  }
  section {
    position: relative;
    overflow: hidden;
  }
  footer {
    color: #95a6b9;
    font-size: 10px;
  }
</style>
