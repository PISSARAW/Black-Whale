<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performAuraAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
  type Mode = 'short' | 'burst' | 'low' | 'prolonged'
  const names: Record<Mode, string> = {
    short: 'Double Machine Gun · Rafale courte',
    burst: 'Double Machine Gun · Rafale',
    low: 'Double Machine Gun · Tir bas',
    prolonged: 'Double Machine Gun · Rafale prolongée',
  }
  let selected: Mode = 'burst',
    side: FightSide = 'player',
    viewer: FightSide = 'player'
  let state = fresh(side),
    generation = 0,
    running = false,
    ready = false,
    queued = false
  let comfort = defaultFightComfort()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const root = this.getObjectByName(`franklin-accents:${side}`)
    if (!root) return
    const flashes: string[] = []
    this.traverse((node) => {
      if (node.name === 'franklin-muzzle-flash' && node.visible)
        flashes.push(node.parent?.name ?? '')
    })
    audit = { events: root.userData.events, visible: root.visible, flashes }
  }
  function fresh(place: FightSide): FightState {
    const initial = beginFight(
      createFight(
        place === 'player' ? 'franklin' : 'benjamin',
        place === 'opponent' ? 'franklin' : 'benjamin',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        },
      ),
    )
    return {
      ...initial,
      player: { ...initial.player, x: 26, aura: 100 },
      opponent: { ...initial.opponent, x: 74, aura: 100 },
    }
  }
  export async function reset(mode: Mode = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    viewer = place
    running = false
    ready = false
    queued = false
    state = fresh(place)
    generation++
    await tick()
  }
  export async function act() {
    state =
      selected === 'short'
        ? performAttack(state, side, 'ranged')
        : performAuraAttack({
            state,
            side,
            kind: 'special',
            moveId: `franklin:${{ burst: 'neutralSpecial', low: 'downSpecial', prolonged: 'finisher' }[selected]}`,
            auraCharged: false,
          })
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
  }
  export function snapshot() {
    return state
  }
  export function diagnostics() {
    return audit
  }
  export async function settings(flashes: boolean) {
    comfort = { ...comfort, flashes }
    await tick()
  }
  export async function conceal(hidden: boolean, gyo = false) {
    const other = side === 'player' ? 'opponent' : 'player'
    state = {
      ...state,
      [side]: { ...state[side], nen: { ...state[side].nen, in: hidden } },
      [other]: { ...state[other], nen: { ...state[other].nen, gyo } },
    }
    await tick()
  }
  export async function view(place: FightSide) {
    viewer = place
    await tick()
  }
  export async function interrupt() {
    state = { ...state, [side]: { ...state[side], attack: null, hitStun: 20 } }
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
    <span>CLASH / FRANKLIN</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Départ bref, puis alternance des dix doigts au rythme des tirs.</p>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        stageId="heavens-arena"
        {viewer}
        onSceneReady={sceneReady}
      />{/key}
    <FightHud {state} language="fr" />
  </div>
  <footer>
    <label
      >Technique <select bind:value={selected} on:change={() => reset(selected, side)}
        >{#each Object.entries(names) as [mode, name] (mode)}<option value={mode}>{name}</option
          >{/each}</select
      ></label
    >
    <button on:click={play}>Rejouer</button><button on:click={() => (running = !running)}
      >{running ? 'Pause' : 'Continuer'}</button
    ><span>Départ : 0,3 s · Cadence réelle des projectiles</span>
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
  label,
  footer span {
    color: #bbb8ac;
    font-size: 12px;
  }
  button,
  select {
    padding: 10px 14px;
    border: 1px solid #58546a;
    border-radius: 6px;
    background: #181c29;
    color: #e5cd8f;
  }
</style>
