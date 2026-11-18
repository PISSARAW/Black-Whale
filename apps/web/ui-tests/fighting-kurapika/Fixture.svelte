<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performMove, tickFight } from '$lib/fighting/engine'
  import { toggleEmperorTime } from '$lib/fighting/kurapikaActions'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'

  type Mode = 'chains' | 'emperor-time' | 'chain-jail' | 'steal-chain' | 'judgment-chain'
  const names: Record<Mode, string> = {
    chains: 'Chaînes · Type 1',
    'emperor-time': 'Emperor Time',
    'chain-jail': 'Chain Jail',
    'steal-chain': 'Steal Chain',
    'judgment-chain': 'Judgment Chain',
  }
  let selected: Mode = 'emperor-time'
  let side: FightSide = 'player'
  let state = fresh(selected, side)
  let generation = 0
  let running = false
  let ready = false
  let queued = false
  let comfort = defaultFightComfort()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const major = this.getObjectByName(`kurapika-major:${side}`)
    const chains = this.getObjectByName(`kurapika-chains:${side}`)
    if (!major || !chains) return
    audit = {
      events: major.userData.events,
      visible: major.visible,
      chainsVisible: chains.visible,
      tips: chains.children
        .filter((node) => node.name.startsWith('kurapika-chain-tip:') && node.visible)
        .map((node) => node.name),
    }
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const initial = beginFight(
      createFight(
        place === 'player' ? 'kurapika' : 'chrollo',
        place === 'opponent' ? 'kurapika' : 'chrollo',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        },
      ),
    )
    let prepared: FightState = {
      ...initial,
      player: { ...initial.player, x: 44 },
      opponent: { ...initial.opponent, x: 50 },
    }
    const other = place === 'player' ? 'opponent' : 'player'
    if (mode === 'chains')
      prepared = {
        ...prepared,
        [place]: { ...prepared[place], health: prepared[place].health - 40 },
      }
    if (mode === 'steal-chain')
      prepared = { ...prepared, [other]: { ...prepared[other], aura: 24 } }
    if (mode === 'judgment-chain')
      prepared = toggleEmperorTime(
        { ...prepared, [place]: { ...prepared[place], judgmentPreset: 'nen-contact' } },
        place,
      )
    return prepared
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
  function special(kind: 'heal' | 'steal' | 'dowsing' | 'jail') {
    const input = {
      ...EMPTY_INPUT,
      down: kind === 'heal',
      left: kind === 'steal',
      right: kind === 'dowsing',
    }
    if (side === 'opponent') [input.left, input.right] = [input.right, input.left]
    state = performMove({ state, side, action: 'special', input })
  }
  export async function act() {
    if (selected === 'emperor-time') state = toggleEmperorTime(state, side)
    else if (selected === 'judgment-chain') state = performMove({ state, side, action: 'finisher' })
    else if (selected === 'chains') special('heal')
    else special(selected === 'steal-chain' ? 'steal' : 'jail')
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++) {
      if (selected === 'chains' && state.frame === 66) special('dowsing')
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    }
    await tick()
  }
  export async function settings(flashes: boolean) {
    comfort = { ...comfort, flashes }
    await tick()
  }
  export function snapshot() {
    return state
  }
  export function diagnostics() {
    return audit
  }
  export async function emperorOff() {
    state = toggleEmperorTime(state, side)
    await tick()
  }
  async function play() {
    await reset(selected, side)
    queued = true
    if (ready) sceneReady()
  }
  function sceneReady() {
    ready = true
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
    <span>CLASH / KURAPIKA</span>
    <h1>{names[selected]}</h1>
    <p>
      {selected === 'chains'
        ? 'Accents brefs sur les gestes des chaînes.'
        : 'Une mise en scène déclenchée par l’effet réel du pouvoir.'}
    </p>
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
    <span>Type 1 : 0,3 s · Type 2 : 1,4 s</span>
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
