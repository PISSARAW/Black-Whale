<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { type FightSide } from '$lib/fighting/types'
  import { createPhinksScenario, actPhinks, advancePhinks, type PhinksScenario } from './scenarios'
  const names: Record<PhinksScenario, string> = {
    rotations: 'Ripper Cyclotron · Rotations complètes',
    hit: 'Ripper Cyclotron · Poing chargé — 3 tours',
    'one-turn': 'Ripper Cyclotron · Poing chargé — 1 tour',
    block: 'Ripper Cyclotron · Garde adverse',
    miss: 'Ripper Cyclotron · Hors de portée',
    interrupted: 'Ripper Cyclotron · Préparation interrompue',
    partial: 'Ripper Cyclotron · Tour incomplet abandonné',
    ordinary: 'Ripper Cyclotron · Coup ordinaire avec réserve',
  }
  let selected: PhinksScenario = 'rotations',
    side: FightSide = 'player',
    viewer: FightSide = 'player'
  let state = createPhinksScenario(selected, side),
    generation = 0,
    running = false,
    ready = false,
    queued = false
  let comfort = defaultFightComfort(),
    audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const root = this.getObjectByName('phinks-hatsu-effects')
    if (!root) return
    audit = {
      events: root.userData.events,
      visible: root.visible ? root.children.filter((n) => n.visible).length : 0,
      poses: root.children.map((n) =>
        n.children.map((part) => [
          part.name,
          part.position.toArray(),
          part.scale.toArray(),
          part.visible,
        ]),
      ),
    }
  }
  export async function reset(mode: PhinksScenario = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    viewer = place
    running = false
    ready = false
    queued = false
    state = createPhinksScenario(mode, place)
    generation++
    await tick()
  }
  export async function act() {
    state = actPhinks(state, selected, side)
    await tick()
  }
  export async function advance(n: number) {
    state = advancePhinks(state, n, selected)
    await tick()
  }
  export function snapshot() {
    return state
  }
  export function diagnostics() {
    return audit
  }
  export async function view(place: FightSide) {
    viewer = place
    await tick()
  }
  export async function conceal(value: boolean) {
    state = { ...state, [side]: { ...state[side], nen: { ...state[side].nen, in: value } } }
    await tick()
  }
  export async function gyo(place: FightSide, value: boolean) {
    state = { ...state, [place]: { ...state[place], nen: { ...state[place].nen, gyo: value } } }
    await tick()
  }
  async function play() {
    await reset(selected, side)
    queued = true
    if (ready) sceneReady()
  }
  function sceneReady() {
    ready = true
    if (queued) {
      queued = false
      void act().then(() => {
        running = true
      })
    }
  }
  const interval = setInterval(() => {
    if (running) void advance(1)
  }, 1000 / 60)
  onDestroy(() => {
    clearInterval(interval)
    Scene.prototype.onAfterRender = previousAfterRender
  })
</script>

<main>
  <header>
    <span>CLASH / PHINKS · RIPPER CYCLOTRON</span>
    <h1>{names[selected]}</h1>
    <p>Rotations · Type 1 — Impact confirmé du poing chargé · Type 2.</p>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        {viewer}
        stageId="heavens-arena"
        onSceneReady={sceneReady}
      />{/key}<FightHud {state} language="fr" />
  </div>
  <footer>
    <label
      >Technique <select bind:value={selected} on:change={() => reset(selected, side)}
        >{#each Object.entries(names) as [mode, name] (mode)}<option value={mode}>{name}</option
          >{/each}</select
      ></label
    ><button on:click={play}>Rejouer</button><button on:click={() => (running = !running)}
      >{running ? 'Pause' : 'Continuer'}</button
    >
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #090c12;
    color: #eee9df;
    font-family: system-ui;
  }
  main {
    max-width: 1440px;
    margin: auto;
  }
  header {
    padding: 22px 28px 16px;
  }
  header span {
    color: #d1b777;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    margin: 4px 0;
    font-size: 26px;
  }
  p {
    margin: 0;
    color: #b6b8c6;
    font-size: 14px;
  }
  .arena {
    position: relative;
    height: min(68vh, 680px);
    min-height: 360px;
    overflow: hidden;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    padding: 18px 28px;
  }
  label {
    color: #bbb8ac;
    font-size: 12px;
    max-width: 100%;
  }
  button,
  select {
    max-width: 100%;
    padding: 10px 14px;
    border: 1px solid #58546a;
    border-radius: 6px;
    background: #181c29;
    color: #e5cd8f;
  }
</style>
