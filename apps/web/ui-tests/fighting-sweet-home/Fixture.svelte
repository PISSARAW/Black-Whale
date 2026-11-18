<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { tickFight } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'
  import {
    createSweetHomeScenario,
    prepareSweetHomeContact,
    resolveSweetHomeContact,
    type SweetHomeScenario,
  } from './scenarios'
  const names: Record<SweetHomeScenario, string> = {
    return: 'Sweet Home · Renvoi de sa blessure',
    absorb: 'Sweet Home · Absorption vers soi',
    backlash: 'Sweet Home · Contrecoup dans la main gauche',
    object: 'Sweet Home · Transfert vers un objet',
    'external-object': 'Sweet Home · Absorption et transfert vers un objet',
    'broken-object': 'Sweet Home · Réceptacle détruit',
    'no-contact': 'Sweet Home · Contact gauche absent',
    stance: 'Sweet Home · Posture seule',
  }
  let selected: SweetHomeScenario = 'return',
    side: FightSide = 'player',
    viewer: FightSide = 'player'
  let state = createSweetHomeScenario(selected, side),
    generation = 0,
    running = false,
    ready = false,
    queued = false
  let comfort = defaultFightComfort(),
    audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const root = this.getObjectByName('sweet-home-type-one')
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
      right:
        root.visible &&
        root.children.some((n) => n.visible && n.getObjectByName('sweet-home-right')?.visible),
      left:
        root.visible &&
        root.children.some((n) => n.visible && n.getObjectByName('sweet-home-left')?.visible),
      object: this.getObjectByName(`prepared:${side}:crate`)?.visible ?? false,
    }
  }
  export async function reset(mode: SweetHomeScenario = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    viewer = place
    running = false
    ready = false
    queued = false
    state = createSweetHomeScenario(mode, place)
    generation++
    await tick()
  }
  export async function act() {
    state = prepareSweetHomeContact(state, selected, side)
    await tick()
    state = resolveSweetHomeContact(state, selected)
    await tick()
  }
  export async function advance(n: number) {
    for (let i = 0; i < n; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
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
    <span>CLASH / TEREBELLUM · SWEET HOME</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Absorption et transfert de blessure · Type 1.</p>
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
