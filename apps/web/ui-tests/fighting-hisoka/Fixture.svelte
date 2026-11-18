<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
  type Mode = 'attach' | 'pull' | 'rebound' | 'texture'
  const names: Record<Mode, string> = {
    attach: 'Bungee Gum · Attachement',
    pull: 'Bungee Gum · Rétraction',
    rebound: 'Bungee Gum · Propulsion',
    texture: 'Texture Surprise',
  }
  let selected: Mode = 'attach',
    side: FightSide = 'player'
  let state = fresh(selected, side),
    generation = 0,
    running = false,
    ready = false,
    queued = false
  let comfort = defaultFightComfort()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const gum = this.getObjectByName('hisoka-bungee-gum')
    const accent = this.getObjectByName('hisoka-gum-accent')
    const texture = this.getObjectByName(`hisoka-texture-accent:${side}`)
    if (!gum || !texture || !accent) return
    audit = {
      events: gum.userData.accents,
      gumVisible: gum.visible,
      accentVisible: accent.visible,
      textureVisible: texture.visible,
      textureFrame: texture.userData.frame,
    }
  }
  function cast(s: FightState, place: FightSide, slot: string) {
    return performAuraAttack({
      state: s,
      side: place,
      kind: 'special',
      moveId: `hisoka:${slot}`,
      auraCharged: false,
    })
  }
  function frames(s: FightState, n: number) {
    for (let i = 0; i < n; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const initial = beginFight(
      createFight(
        place === 'player' ? 'hisoka' : 'illumi',
        place === 'opponent' ? 'hisoka' : 'illumi',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        },
      ),
    )
    let s = {
      ...initial,
      player: { ...initial.player, x: 44, aura: 100 },
      opponent: { ...initial.opponent, x: 54, aura: 100 },
    }
    if (mode === 'pull' || mode === 'rebound') {
      s = frames(cast(s, place, 'neutralSpecial'), 55)
      const other = place === 'player' ? 'opponent' : 'player'
      s = { ...s, [other]: { ...s[other], x: s[place].x + s[place].facing * 28 } }
    }
    return s
  }
  export async function reset(mode: Mode = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    running = false
    ready = false
    queued = false
    state = fresh(mode, place)
    generation++
    await tick()
  }
  export async function act() {
    const slots = {
      attach: 'neutralSpecial',
      pull: 'forwardSpecial',
      rebound: 'backSpecial',
      texture: 'downSpecial',
    }
    state = cast(state, side, slots[selected])
    await tick()
  }
  export async function advance(count: number) {
    state = frames(state, count)
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
    if (state.bungeeGum)
      state = {
        ...state,
        bungeeGum: { ...state.bungeeGum, hidden },
        player: { ...state.player, nen: { ...state.player.nen, gyo } },
      }
    await tick()
  }
  export async function view(place: FightSide) {
    side = place
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
    <span>CLASH / HISOKA</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Accents de 0,3 seconde dans le combat.</p>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        stageId="heavens-arena"
        viewer={side}
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
    >
    <span>Bungee Gum · Texture Surprise</span>
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
