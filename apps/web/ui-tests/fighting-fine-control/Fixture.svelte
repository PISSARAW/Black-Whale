<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import { commandMary } from '$lib/fighting/bloodyMaryAction'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from '$lib/fighting/types'
  const names = {
    thread: 'Machi · Fils de Nen',
    bind: 'Machi · Ligature',
    suture: 'Machi · Suture',
    paper: 'Kalluto · Fragments de papier',
    stream: 'Kalluto · Flux de papier',
    blood: 'Zakuro · Fil de sang',
    scout: 'Zakuro · Gouttes de sang',
    recall: 'Zakuro · Rappel du sang',
  }
  type Mode = keyof typeof names
  function source(mode: Mode): FighterId {
    return ['thread', 'bind', 'suture'].includes(mode)
      ? 'machi'
      : ['paper', 'stream'].includes(mode)
        ? 'kalluto'
        : 'zakuro'
  }
  let selected: Mode = 'thread',
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
    const other = side === 'player' ? 'opponent' : 'player'
    const line = this.getObjectByName(`machi-thread:${other}`)
    const paper = this.getObjectByName('kalluto-paper')
    const blood = this.getObjectByName(`bloody-mary:${side}`)
    if (!line || !paper || !blood) return
    const id = source(selected)
    audit = {
      events:
        id === 'machi'
          ? line.userData.events?.[side]
          : id === 'kalluto'
            ? paper.userData.events?.[side]
            : blood.userData.events,
      lineVisible: line.visible,
      pieces: paper.children.length,
      bloodVisible: blood.visible,
      drops: [0, 1, 2].map((i) => this.getObjectByName(`bloody-mary-scout:${side}:${i}`)?.visible),
    }
  }
  function cast(s: FightState, place: FightSide, moveId: string) {
    return performAuraAttack({
      state: s,
      side: place,
      kind: 'special',
      moveId,
      auraCharged: false,
    })
  }
  function mary(s: FightState, place: FightSide, command: 'bleed' | 'bind' | 'scout' | 'recall') {
    return commandMary({ state: s, side: place, command }, performAuraAttack)
  }
  function frames(s: FightState, n: number) {
    for (let i = 0; i < n; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const id = source(mode),
      initial = beginFight(
        createFight(place === 'player' ? id : 'hisoka', place === 'opponent' ? id : 'hisoka', {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        }),
      )
    const x = id === 'kalluto' ? 30 : 42,
      otherX = id === 'zakuro' ? 51 : 48
    let s: FightState = {
      ...initial,
      player: { ...initial.player, x, aura: 100 },
      opponent: { ...initial.opponent, x: otherX, aura: 100 },
    }
    if (mode === 'suture') s = { ...s, [place]: { ...s[place], health: s[place].health - 30 } }
    if (mode === 'stream') s = frames(cast(s, place, 'kalluto:neutralSpecial'), 70)
    if (id === 'zakuro') s = mary(s, place, 'bleed')
    if (mode === 'recall') s = frames(mary(s, place, 'scout'), 20)
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
    if (source(selected) === 'zakuro')
      state = mary(
        state,
        side,
        selected === 'blood' ? 'bind' : selected === 'scout' ? 'scout' : 'recall',
      )
    else
      state = cast(
        state,
        side,
        `${source(selected)}:${
          {
            thread: 'forwardSpecial',
            bind: 'downSpecial',
            suture: 'neutralSpecial',
            paper: 'neutralSpecial',
            stream: 'forwardSpecial',
          }[selected as 'thread' | 'bind' | 'suture' | 'paper' | 'stream']
        }`,
      )
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
    <span>CLASH / MACHI · KALLUTO · ZAKURO</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Accents de 0,3 seconde sur la matière réellement manipulée.</p>
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
    ><span>Fils · Papier · Sang manipulé</span>
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
