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
    performMove,
    tickFight,
  } from '$lib/fighting/engine'
  import { observeComboMaster } from '$lib/fighting/comboMaster'
  import { askLynchQuestion } from '$lib/fighting/lynchAction'
  import { IN_CHARGE_FRAMES } from '$lib/fighting/nen'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from '$lib/fighting/types'
  const names = {
    contact: 'Musse · Surveillance de contact',
    listen: 'Musse · Observation reçue',
    scout: 'Sayird · Little Eye',
    console: 'Furykov · Console',
    alert: 'Furykov · Alerte',
    read: 'Furykov · Signature lisible',
    reply: 'Lynch · Réponse obtenue',
    missing: 'Sayird · Aucun animal disponible',
    unanswered: 'Lynch · Question sans contact',
  }
  type Mode = keyof typeof names
  const source = (mode: Mode): FighterId =>
    ['contact', 'listen'].includes(mode)
      ? 'musse'
      : ['scout', 'missing'].includes(mode)
        ? 'sayird'
        : ['console', 'alert', 'read'].includes(mode)
          ? 'furykov'
          : 'lynch'
  let selected: Mode = 'contact',
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
    const root = this.getObjectByName('perception-type-one')
    if (!root) return
    audit = {
      events: root.userData.events,
      visible: root.visible ? root.children.length : 0,
      poses: root.children.map((n) => [n.position.toArray(), n.scale.toArray()]),
      owl: this.getObjectByName(`secret-window-${side}`)?.visible ?? false,
      console: this.getObjectByName(`combo-master:${side}`)?.visible ?? false,
    }
  }
  function frames(s: FightState, n: number) {
    const input = { ...EMPTY_INPUT, gyo: selected === 'read' }
    for (let i = 0; i < n; i++)
      s = tickFight(s, side === 'player' ? input : EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: side === 'opponent' ? input : EMPTY_INPUT,
      })
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const id = source(mode),
      animals = mode === 'scout'
    let s = beginFight(
      createFight(place === 'player' ? id : 'hisoka', place === 'opponent' ? id : 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: 'heavens-arena',
          preparation: {
            mode: animals ? 'scenario' : 'duel',
            resources: animals ? ['animals'] : [],
            cohorts: [],
          },
        },
      }),
    )
    s = {
      ...s,
      player: { ...s.player, x: animals ? 25 : 42, aura: 100 },
      opponent: { ...s.opponent, x: animals ? 75 : 48, aura: 100 },
    }
    if (mode === 'listen') s = frames(performAttack(s, place, 'special'), 60)
    if (mode === 'alert' || mode === 'read') s = frames(performAttack(s, place, 'special'), 45)
    if (mode === 'reply')
      s = askLynchQuestion({ state: s, side: place, question: 'identity' }, performAuraAttack)
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
    const other = side === 'player' ? 'opponent' : 'player'
    if (selected === 'listen') state = frames(performAttack(state, other, 'light'), 1)
    else if (selected === 'alert' || selected === 'read') {
      state = {
        ...state,
        [other]: { ...state[other], hatsuChargeFrames: IN_CHARGE_FRAMES, aura: 100 },
      }
      if (selected === 'read')
        state = { ...state, [side]: { ...state[side], nen: { ...state[side].nen, gyo: true } } }
      state = observeComboMaster(performMove({ state, side: other, action: 'special' }))
    } else if (selected === 'unanswered')
      state = askLynchQuestion({ state, side, question: 'identity' }, performAuraAttack)
    else state = performAttack(state, side, selected === 'reply' ? 'light' : 'special')
    await tick()
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
    <span>CLASH / MUSSE · SAYIRD · FURYKOV · LYNCH</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Accents discrets sur les informations réellement obtenues.</p>
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
