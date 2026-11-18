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
  import { designateBlinkyTarget } from '$lib/fighting/blinky'
  import { performArenaAction } from '$lib/fighting/arenaActions'
  import { attackData } from '$lib/fighting/frameData'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
  const names = {
    objects: 'Shizuku · Aspiration d’objet',
    arena: 'Shizuku · Aspiration du décor',
    blood: 'Shizuku · Aspiration du sang',
    covered: 'Shizuku · Plaies bouchées',
    empty: 'Shizuku · Aspiration à vide',
  }
  type Mode = keyof typeof names
  let selected: Mode = 'objects',
    side: FightSide = 'player',
    viewer: FightSide = 'player'
  let state = fresh(selected, side),
    generation = 0,
    running = false,
    ready = false,
    queued = false
  let comfort = defaultFightComfort(),
    audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const group = this.getObjectByName(`blinky-suction:${side}`)
    if (!group) return
    const captures = this.children.filter((n) => n.name.startsWith(`blinky-capture:${side}:`))
    audit = {
      events: group.userData.events,
      wind: group.visible,
      captures: captures.length,
      poses: captures.map((n) => n.children.map((p) => p.position.toArray())),
    }
  }
  function cast(s: FightState, place: FightSide, slot: string) {
    return performAuraAttack({
      state: s,
      side: place,
      kind: 'special',
      moveId: `shizuku:${slot}`,
      auraCharged: false,
    })
  }
  function frames(s: FightState, n: number, covered = false) {
    const other = side === 'player' ? 'opponent' : 'player'
    for (let i = 0; i < n; i++) {
      const input = { ...EMPTY_INPUT, plugWounds: covered }
      s = tickFight(s, other === 'player' ? input : EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: other === 'opponent' ? input : EMPTY_INPUT,
      })
    }
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    let s = beginFight(
      createFight(
        place === 'player' ? 'shizuku' : 'hisoka',
        place === 'opponent' ? 'shizuku' : 'hisoka',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena', arenaInteractions: mode === 'arena' },
        },
      ),
    )
    const other = place === 'player' ? 'opponent' : 'player'
    s = {
      ...s,
      player: { ...s.player, x: 30, aura: 100 },
      opponent: { ...s.opponent, x: 60, aura: 100 },
    }
    if (mode === 'arena')
      return {
        ...s,
        player: { ...s.player, x: place === 'player' ? 27 : 15 },
        opponent: { ...s.opponent, x: place === 'opponent' ? 73 : 85 },
      }
    if (mode === 'objects') {
      s = designateBlinkyTarget(s, place, 'card')
      s = performAttack(s, other, 'ranged')
      return frames(s, attackData('ranged', s[other]).startup)
    }
    if (mode === 'blood' || mode === 'covered') {
      s = { ...s, [other]: { ...s[other], x: s[place].x + s[place].facing * 7 } }
      s = frames(performAttack(s, place, 'heavy'), 70)
    }
    return s
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
    state =
      selected === 'arena'
        ? performArenaAction(state, side, performAuraAttack)
        : cast(
            state,
            side,
            selected === 'blood' || selected === 'covered' ? 'finisher' : 'neutralSpecial',
          )
    await tick()
  }
  export async function advance(n: number) {
    state = frames(state, n, selected === 'covered')
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
  export async function conceal(hidden: boolean) {
    state = { ...state, [side]: { ...state[side], nen: { ...state[side].nen, in: hidden } } }
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
    <span>CLASH / SHIZUKU · BLINKY</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Objets et sang convergent vers la bouche de Blinky.</p>
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
