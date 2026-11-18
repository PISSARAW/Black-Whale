<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import { attackPhase } from '$lib/fighting/frameData'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import {
    EMPTY_INPUT,
    type FightState,
    type FightSide,
    type FightProjectile,
  } from '$lib/fighting/types'
  type Mode = 'air' | 'capture' | 'release'
  const names: Record<Mode, string> = {
    air: 'Air Blow · Paume gauche',
    capture: 'Culdcept · Capture',
    release: 'Culdcept · Restitution',
  }
  let selected: Mode = 'air',
    side: FightSide = 'player'
  let state = fresh(selected, side),
    generation = 0,
    running = false,
    ready = false,
    queued = false,
    injected = false
  let comfort = defaultFightComfort()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const accents = this.getObjectByName(`benjamin-accents:${side}`)
    const card = this.getObjectByName(
      side === 'player' ? 'benjamin-culdcept-card' : `benjamin-culdcept-card:${side}`,
    )
    if (!accents || !card) return
    audit = {
      events: accents.userData.events,
      visible: accents.visible,
      cardVisible: card.visible,
      cardScale: card.scale.x,
    }
  }
  function cast(s: FightState, place: FightSide, slot: string) {
    return performAuraAttack({
      state: s,
      side: place,
      kind: 'special',
      moveId: `benjamin:${slot}`,
      auraCharged: false,
    })
  }
  function incoming(s: FightState, place: FightSide): FightState {
    const f = s[place]
    const shot: FightProjectile = {
      id: s.nextProjectileId,
      owner: place === 'player' ? 'opponent' : 'player',
      fighterId: 'franklin',
      x: f.x + f.facing * 2,
      y: 6.1,
      velocityX: -f.facing * 70,
      width: 0.6,
      height: 0.24,
      damage: 11,
      hitstun: 13,
      blockstun: 9,
      hitstop: 5,
      knockback: 2.2,
      targetZone: 'torso',
      shape: 'bullet',
      colour: '#ffffff',
      age: 0,
      lifetime: 120,
      matter: 'nen',
    }
    return { ...s, projectiles: [...s.projectiles, shot], nextProjectileId: s.nextProjectileId + 1 }
  }
  function step(s: FightState) {
    return tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const initial = beginFight(
      createFight(
        place === 'player' ? 'benjamin' : 'franklin',
        place === 'opponent' ? 'benjamin' : 'franklin',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        },
      ),
    )
    let s = {
      ...initial,
      player: { ...initial.player, x: 42, aura: 100 },
      opponent: { ...initial.opponent, x: 48, aura: 100 },
    }
    if (mode !== 'air') {
      const other = place === 'player' ? 'opponent' : 'player'
      s = { ...s, [other]: { ...s[other], x: s[place].x + s[place].facing * 20 } }
    }
    if (mode === 'release') {
      s = cast(s, place, 'downSpecial')
      for (let i = 0; i < 50 && attackPhase(s[place]) !== 'active'; i++) s = step(s)
      s = step(incoming(s, place))
      for (let i = 0; i < 50; i++) s = step(s)
    }
    return s
  }
  export async function reset(mode: Mode = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    running = false
    ready = false
    queued = false
    injected = false
    viewer = null
    state = fresh(mode, place)
    generation++
    await tick()
  }
  export async function act() {
    state = cast(
      state,
      side,
      { air: 'neutralSpecial', capture: 'downSpecial', release: 'finisher' }[selected],
    )
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++) {
      if (selected === 'capture' && !injected && attackPhase(state[side]) === 'active') {
        state = incoming(state, side)
        injected = true
      }
      state = step(state)
    }
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
  let viewer: FightSide | null = null
  export async function view(place: FightSide) {
    viewer = place
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
    <span>CLASH / BENJAMIN</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Accents de 0,3 seconde dans le combat.</p>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        stageId="heavens-arena"
        viewer={viewer ?? side}
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
    ><span>Air Blow · Culdcept</span>
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
