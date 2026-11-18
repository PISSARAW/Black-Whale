<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { cinematicStep } from '$lib/fighting/cinematicFixtures'
  import { PREDATOR_ANALYSIS_FRAMES } from '$lib/fighting/predatorTuning'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from '$lib/fighting/types'
  const names = {
    music: 'Melody · Interprétation',
    writing: 'Basho · Écriture',
    observation: 'Rihan · Observation',
    ready: 'Rihan · Analyse acquise',
    empty: 'Rihan · Aucune manifestation visible',
    missing: 'Melody · Sans flûte',
    interrupted: 'Basho · Écriture interrompue',
    stopped: 'Melody · Fin de l’interprétation',
  }
  type Mode = keyof typeof names
  const source = (mode: Mode): FighterId =>
    ['music', 'missing', 'stopped'].includes(mode)
      ? 'melody'
      : ['writing', 'interrupted'].includes(mode)
        ? 'basho'
        : 'rihan'
  let selected: Mode = 'music',
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
    const root = this.getObjectByName('performance-type-one')
    if (!root) return
    const focus = this.getObjectByName('rihan-private-focus'),
      music = this.getObjectByName(`melody-phrasing:${side}`)
    const poem = this.getObjectByName(`basho-poem:${side}`),
      pen = this.getObjectByName(`basho-pen:${side}`)
    audit = {
      events: root.userData.events,
      observedFrames: root.userData.observedFrames,
      ornament: root.visible,
      focus: root.visible && focus?.visible,
      music: root.visible && music?.visible,
      paper: poem?.visible,
      pen: poem?.visible && pen?.visible,
      progress: poem?.userData.inkProgress ?? 0,
      poses: [
        focus?.position.toArray(),
        focus?.scale.toArray(),
        music?.position.toArray(),
        music?.children.map((n) => n.scale.toArray()),
        poem?.visible ? poem.position.toArray() : [],
        pen?.visible ? pen.position.toArray() : [],
      ],
    }
  }
  function frames(s: FightState, n: number) {
    for (let i = 0; i < n; i++) s = cinematicStep(s)
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const id = source(mode)
    let s = beginFight(
      createFight(place === 'player' ? id : 'hisoka', place === 'opponent' ? id : 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { stageId: 'heavens-arena' },
      }),
    )
    s = {
      ...s,
      player: { ...s.player, x: 42, aura: 100 },
      opponent: { ...s.opponent, x: 54, aura: 100 },
    }
    if (mode === 'observation' || mode === 'ready') s = prepareObservation(s, mode, place)
    if (mode === 'missing') s = { ...s, [place]: { ...s[place], equipment: [] } }
    if (mode === 'interrupted' || mode === 'stopped')
      s = frames(performAttack(s, place, 'special'), 30)
    return s
  }
  function prepareObservation(s: FightState, mode: Mode, place: FightSide): FightState {
    const other = place === 'player' ? 'opponent' : 'player'
    s = {
      ...s,
      [place]: { ...s[place], x: 48 },
      [other]: { ...s[other], x: place === 'player' ? 53 : 43 },
    }
    s = frames(performAttack(s, other, 'special'), 45)
    for (let i = 0; i < 120 && (s[place].hitStun > 0 || s[place].knockdownFrames > 0); i++)
      s = frames(s, 1)
    return mode === 'ready'
      ? frames(performAttack(s, place, 'special'), PREDATOR_ANALYSIS_FRAMES - 1)
      : s
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
    if (selected === 'ready') state = frames(state, 1)
    else if (selected === 'interrupted') state = interrupt(state)
    else state = performAttack(state, side, 'special')
    await tick()
  }
  function interrupt(s: FightState) {
    const move = { ...EMPTY_INPUT, right: true }
    return tickFight(s, side === 'player' ? move : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: side === 'opponent' ? move : EMPTY_INPUT,
    })
  }
  export async function advance(n: number) {
    state = frames(state, n)
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
  export async function stop() {
    state = source(selected) === 'basho' ? interrupt(state) : performAttack(state, side, 'special')
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
    <span>CLASH / MELODY · BASHO · RIHAN</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Interprétation, écriture et observation · Type 1.</p>
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
