<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { interactWithPreparation } from '$lib/fighting/preparationSimulation'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
  const names = {
    anchor: 'Luini · Ancrage',
    depart: 'Luini · Départ',
    return: 'Luini · Retour',
    invalid: 'Luini · Ancrage condamné',
    link: 'Voconte · Liaison',
    transit: 'Voconte · Franchissement',
    close: 'Voconte · Fermeture',
    denied: 'Luini · Ancrage refusé',
  }
  type Mode = keyof typeof names
  const isLuini = (mode: Mode) => ['anchor', 'depart', 'return', 'invalid', 'denied'].includes(mode)
  let selected: Mode = 'anchor',
    side: FightSide = 'player',
    viewer: FightSide = 'player',
    walking = false
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
    const root = this.getObjectByName('passage-type-one')
    if (!root) return
    const physical = this.getObjectByName('voconte:physical-frames')
    const door = this.getObjectByName('voconte:frame:A')
    audit = {
      events: root.userData.events,
      visible: root.visible ? root.children.filter((n) => n.visible).length : 0,
      physical: physical?.visible ?? false,
      threshold: Boolean(physical?.visible && door?.children[3].visible),
      poses: root.children.map((n) => n.children.map((p) => p.scale.toArray())),
    }
  }
  function frames(s: FightState, n: number, move = false) {
    for (let i = 0; i < n; i++) {
      const input = {
        ...EMPTY_INPUT,
        right: move && side === 'player',
        left: move && side === 'opponent',
      }
      const previous = s.voconteDoors?.lastTransit?.[side]?.frame
      s = tickFight(s, side === 'player' ? input : EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: side === 'opponent' ? input : EMPTY_INPUT,
      })
      if (s.voconteDoors?.lastTransit?.[side]?.frame !== previous) {
        move = false
        walking = false
      }
    }
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const id = isLuini(mode) ? 'luini' : 'voconte'
    let s = beginFight(
      createFight(place === 'player' ? id : 'hisoka', place === 'opponent' ? id : 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: 'heavens-arena',
          preparation: {
            mode: id === 'luini' ? 'scenario' : 'duel',
            resources: id === 'luini' ? ['rooms'] : [],
            cohorts: [],
          },
        },
      }),
    )
    s = {
      ...s,
      player: { ...s.player, x: id === 'luini' ? 20 : 22, aura: 100 },
      opponent: { ...s.opponent, x: id === 'luini' ? 80 : 86, aura: 100 },
    }
    if (['depart', 'return', 'invalid'].includes(mode))
      s = frames(performAttack(s, place, 'special'), 18)
    if (mode === 'return') s = frames(performAttack(s, place, 'special'), 18)
    if (mode === 'transit' || mode === 'close') s = frames(performAttack(s, place, 'special'), 45)
    if (mode === 'transit')
      s = { ...s, [place]: { ...s[place], x: place === 'player' ? 29.8 : 70.2 } }
    if (mode === 'denied') s = { ...s, [place]: { ...s[place], x: 50 } }
    return s
  }
  export async function reset(mode: Mode = selected, place: FightSide = 'player') {
    selected = mode
    side = place
    viewer = place
    walking = false
    running = false
    ready = false
    queued = false
    state = fresh(mode, place)
    generation++
    await tick()
  }
  export async function act() {
    if (selected === 'transit') walking = true
    else
      state =
        selected === 'invalid'
          ? interactWithPreparation(state, side)
          : performAttack(state, side, 'special')
    await tick()
  }
  export async function advance(n: number) {
    state = frames(state, n, walking)
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
    <span>CLASH / LUINI · VOCONTE</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Ancrage, liaison, franchissement et fermeture.</p>
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
