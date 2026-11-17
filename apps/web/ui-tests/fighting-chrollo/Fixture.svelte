<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import FightVictoryOverlay from '$lib/components/fighting/FightVictoryOverlay.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import {
    CHROLLO_TURN,
    CHROLLO_USE,
    CHROLLO_BOOKMARK,
    CHROLLO_SECONDARY,
  } from '$lib/fighting/chrolloBook'
  import { performArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
  import { triggerHatsu } from '$lib/fighting/hatsu'
  import { performHunterInterview } from '$lib/fighting/skillHunterAcquisition'
  import { createVictoryPlayback } from '$lib/fighting/victory/playback'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'

  type Mode =
    | 'book'
    | 'acquisition'
    | 'copy'
    | 'puppet'
    | 'appearance'
    | 'cloth'
    | 'fish'
    | 'control'
    | 'detonation'
    | 'decisive'
  const names: Record<Mode, string> = {
    book: 'Bandit’s Secret · Livre et pages',
    acquisition: 'Skill Hunter · Acquisition',
    copy: 'Gallery Fake · Copie',
    puppet: 'Order Stamp · Marionnette',
    appearance: 'Convert Hands',
    cloth: 'Fun Fun Cloth · Capture',
    fish: 'Indoor Fish',
    control: 'Black Voice',
    detonation: 'Sun and Moon · Détonation',
    decisive: 'Sun and Moon · Détonation décisive',
  }
  let selected: Mode = 'acquisition'
  let side: FightSide = 'player'
  let state = fresh(selected, side)
  let generation = 0,
    running = false,
    ready = false,
    queued = false
  let comfort = defaultFightComfort()
  let playback = createVictoryPlayback()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const root = this.getObjectByName(`chrollo-reveals:${side}`)
    if (!root) return
    audit = {
      visible: root.visible,
      objects: root.children.filter((n) => n.visible).map((n) => n.name),
      victory: this.userData.victory,
    }
  }
  function move(s: FightState, moveId: string, place = side) {
    return performAuraAttack({ state: s, side: place, kind: 'special', moveId, auraCharged: false })
  }
  function frames(s: FightState, n: number) {
    for (let i = 0; i < n; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return s
  }
  function page(s: FightState, target: string, place: FightSide) {
    return frames(performArsenalCommand(s, place, { action: 'history-page', target }), 13)
  }
  function close(s: FightState, place: FightSide) {
    return frames(move(s, CHROLLO_BOOKMARK, place), 20)
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const other = place === 'player' ? 'opponent' : 'player'
    const initial = beginFight(
      createFight(
        place === 'player' ? 'chrollo' : 'illumi',
        place === 'opponent' ? 'chrollo' : 'illumi',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: {
            stageId: 'heavens-arena',
            preparation: { mode: 'scenario', resources: ['rooms', 'objects'], cohorts: [] },
          },
        },
      ),
    )
    let s: FightState = {
      ...initial,
      [place]: { ...initial[place], x: 18, aura: 100, facing: 1 },
      [other]: { ...initial[other], x: 23, aura: 100, facing: -1 },
    }
    if (mode === 'copy' || mode === 'puppet') s = close(page(s, 'gallery-fake', place), place)
    if (mode === 'puppet') {
      s = frames(performArsenalCommand(s, place, { action: 'history-use', target: other }), 19)
      s = page(s, 'order-stamp', place)
    }
    if (mode === 'appearance') s = close(page(s, 'convert-hands', place), place)
    if (mode === 'cloth') s = close(page(s, 'fun-fun-cloth', place), place)
    if (mode === 'fish') s = page(s, 'indoor-fish', place)
    if (mode === 'control') s = frames(move(s, CHROLLO_TURN, place), 20)
    if (mode === 'detonation' || mode === 'decisive') {
      s = frames(move(s, CHROLLO_USE, place), 50)
      s = close(s, place)
      if (mode === 'decisive') s = { ...s, [other]: { ...s[other], health: 20 } }
    }
    if (mode === 'acquisition') {
      s = triggerHatsu(s, other, 'illumi')
      s = performHunterInterview(s, place, { action: 'hunter-ask' })
      s = performHunterInterview(s, other, { action: 'hunter-answer' })
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
    playback = createVictoryPlayback()
    playback.observe(state)
    generation++
    await tick()
  }
  export async function act() {
    const other = side === 'player' ? 'opponent' : 'player'
    if (selected === 'book') state = move(state, CHROLLO_TURN)
    else if (selected === 'acquisition')
      state = performHunterInterview(state, other, { action: 'hunter-palm' })
    else if (selected === 'control') state = move(state, CHROLLO_USE)
    else if (selected === 'decisive' || selected === 'detonation')
      state = move(state, CHROLLO_SECONDARY)
    else if (selected === 'appearance')
      state = performArsenalCommand(state, side, { action: 'history-shape-swap' })
    else {
      const target =
        selected === 'puppet' ? state.battlefield?.entities.find((e) => e.copy)?.id : other
      state = performArsenalCommand(state, side, { action: 'history-use', target })
    }
    playback.observe(state)
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++) {
      if (selected === 'book' && state.frame === 32) state = move(state, CHROLLO_BOOKMARK)
      if (selected === 'book' && state.frame === 64) state = move(state, CHROLLO_BOOKMARK)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      playback.observe(state)
      playback.advance(1 / 60)
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
  async function play() {
    await reset(selected, side)
    queued = true
    if (ready) sceneReady()
  }
  function sceneReady() {
    ready = true
    playback.sceneReady()
    if (!queued) return
    queued = false
    void act().then(() => {
      running = true
    })
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
    <span>CLASH / CHROLLO</span>
    <h1>{names[selected]}</h1>
    <p>
      {selected === 'book'
        ? 'Accents du livre et des pages · Type 1'
        : selected === 'decisive'
          ? 'Conclusion après une détonation victorieuse · Type 3'
          : 'Manifestation effective du pouvoir · Type 2'}
    </p>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        stageId="heavens-arena"
        viewer={side}
        onSceneReady={sceneReady}
        victoryFrame={$playback}
      />{/key}
    <FightHud {state} language="fr" />
    <FightVictoryOverlay {state} frame={$playback} language="fr" onSkip={() => playback.skip()} />
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
    <span>Type 1 : 0,3 s · Type 2 : 1,4 s · Type 3 : 3 s</span>
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
