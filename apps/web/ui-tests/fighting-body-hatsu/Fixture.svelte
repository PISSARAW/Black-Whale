<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from '$lib/fighting/types'
  const names = {
    gel: 'Gel · Bras transformé',
    hammer: 'Padaille · Marteau',
    drill: 'Padaille · Foret',
    axe: 'Padaille · Hache',
    restore: 'Padaille · Main normale',
    leorio: 'Leorio · Transmission du poing',
  }
  type Mode = keyof typeof names
  const moves = {
    gel: 'gel:neutralSpecial',
    hammer: 'padaille:neutralSpecial',
    drill: 'padaille:forwardSpecial',
    axe: 'padaille:downSpecial',
    restore: 'padaille:backSpecial',
    leorio: 'leorio:neutralSpecial',
  }
  const source = (m: Mode): FighterId =>
    m === 'gel' ? 'gel' : m === 'leorio' ? 'leorio' : 'padaille'
  let selected: Mode = 'gel',
    side: FightSide = 'player',
    viewer: FightSide = 'player'
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
    const accent = this.getObjectByName(`body-hatsu:${side}`)
    if (!accent) return
    const arm = this.getObjectByName(`gel-snake-arm:${side}`)
    const tool = state[side].padailleTool
    const toolModel = tool ? this.getObjectByName(`padaille-${tool}-right-hand`) : undefined
    const shot = state.projectiles.find((p) => p.remotePunch && p.owner === side)
    const path = shot ? this.getObjectByName(`remote-punch-path:${shot.id}`) : undefined
    const fist = shot ? this.getObjectByName(`remote-punch:${shot.id}`) : undefined
    audit = {
      events: accent.userData.events,
      accent: accent.visible,
      arm: arm?.visible ?? false,
      extension: arm?.userData.extension,
      tool,
      toolVisible: toolModel?.visible ?? false,
      toolScale: toolModel?.scale.x,
      toolTurn: toolModel?.rotation.y,
      stage: path?.userData.stage,
      path: Boolean(path),
      fist: fist?.visible ?? false,
      entry: path?.getObjectByName('remote-punch-entry')?.visible ?? false,
      pulse: path?.getObjectByName('remote-punch-transmission')?.visible ?? false,
    }
  }
  function cast(s: FightState, place: FightSide, moveId: string) {
    return performAuraAttack({ state: s, side: place, kind: 'special', moveId, auraCharged: false })
  }
  function frames(s: FightState, n: number) {
    for (let i = 0; i < n; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const id = source(mode)
    const s = beginFight(
      createFight(place === 'player' ? id : 'hisoka', place === 'opponent' ? id : 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { stageId: 'heavens-arena' },
      }),
    )
    const positioned = {
      ...s,
      player: { ...s.player, x: 40, aura: 100 },
      opponent: { ...s.opponent, x: id === 'leorio' ? 64 : 48, aura: 100 },
    }
    return mode === 'restore'
      ? frames(cast(positioned, place, 'padaille:neutralSpecial'), 65)
      : positioned
  }
  export async function reset(mode: Mode = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    viewer = place
    running = false
    ready = false
    queued = false
    state = fresh(mode, place)
    generation++
    await tick()
  }
  export async function act() {
    state = cast(state, side, moves[selected])
    await tick()
  }
  export async function advance(n: number) {
    state = frames(state, n)
    await tick()
  }
  export async function launch() {
    for (let i = 0; i < 60; i++) {
      state = frames(state, 1)
      if (state.projectiles.some((p) => p.owner === side && p.remotePunch)) break
    }
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
  export async function conceal(hidden: boolean, gyo = false) {
    const other = side === 'player' ? 'opponent' : 'player'
    state = {
      ...state,
      [side]: { ...state[side], nen: { ...state[side].nen, in: hidden } },
      [other]: { ...state[other], nen: { ...state[other].nen, gyo } },
    }
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
    <span>CLASH / GEL · PADAILLE · LEORIO</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Accents de transformation et transmission dans la vue de combat.</p>
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
