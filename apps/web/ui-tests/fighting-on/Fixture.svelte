<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene, Mesh, MeshBasicMaterial } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, tickFight, performAttack } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { EMPTY_INPUT, type FighterId, type FightSide } from '$lib/fighting/types'

  let selected: FighterId = 'hisoka'
  let state = fresh()
  let generation = 0
  let running = false
  let ready = false
  let queued = false
  let comfort = defaultFightComfort()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const root = this.getObjectByName('on-awakening:player')
    if (!root) return
    const eyeColours = (name: string) => {
      const values: number[] = []
      this.traverse((node) => {
        if (
          node.name === name &&
          node instanceof Mesh &&
          node.material instanceof MeshBasicMaterial
        )
          values.push(node.material.color.getHex())
      })
      return values
    }
    audit = {
      entryFrame: root.userData.entryFrame,
      visible: root.visible,
      opponentVisible: this.getObjectByName('on-awakening:opponent')?.visible,
      irises: eyeColours('eye-pupil'),
      sclera: eyeColours('eye-sclera'),
    }
  }
  function fresh(): ReturnType<typeof createFight> {
    const duel = beginFight(
      createFight(selected, 'kurapika', {
        mode: 'versus-local',
        environment: { stageId: 'heavens-arena' },
      }),
    )
    return {
      ...duel,
      player: { ...duel.player, x: 43, on: { grudge: 100, sealFrames: 0 } },
      opponent: { ...duel.opponent, x: 59, on: { grudge: 100, sealFrames: 0 } },
    }
  }
  export async function reset(id: FighterId = selected) {
    selected = id
    running = false
    ready = false
    queued = false
    state = fresh()
    generation++
    await tick()
  }
  export async function awaken(side: FightSide = 'player') {
    const oath = { ...EMPTY_INPUT, aura: true, hatsu: true }
    state = tickFight(state, side === 'player' ? oath : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: side === 'opponent' ? oath : EMPTY_INPUT,
    })
    await tick()
  }
  export async function advance(count: number, attack = false) {
    if (attack) state = performAttack(state, 'player', 'light')
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: EMPTY_INPUT,
      })
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
  async function play() {
    await reset()
    queued = true
    if (ready) sceneReady()
  }
  function sceneReady() {
    ready = true
    if (!queued) return
    queued = false
    void awaken().then(() => {
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
    <span>CLASH / PRÉSENTATION DU NEN</span>
    <h1>Éveil du On</h1>
    <p>Le ressentiment se rassemble, l’ombre s’élève, les yeux deviennent dorés.</p>
  </header>
  <div class="arena">
    {#key generation}
      <FightLiveScene {state} {comfort} stageId="heavens-arena" onSceneReady={sceneReady} />
    {/key}
    <FightHud {state} language="fr" />
  </div>
  <footer>
    <label
      >Combattant <select bind:value={selected} on:change={() => reset()}>
        {#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
            >{fighter.name}</option
          >{/each}
      </select></label
    >
    <button on:click={play}>Rejouer l’éveil</button>
    <button on:click={() => (running = !running)}>{running ? 'Pause' : 'Continuer'}</button>
    <span>Yeux dorés maintenus pendant tout le On.</span>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080a12;
    color: #e9e5df;
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
    color: #b7a9e0;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    margin: 4px 0;
    font-size: 26px;
  }
  p {
    margin: 0;
    color: #b2b5c5;
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
    gap: 16px;
    padding: 18px 28px;
  }
  label,
  footer span {
    font-size: 12px;
    color: #bebbc8;
  }
  button,
  select {
    padding: 9px 14px;
    border: 1px solid #46425d;
    border-radius: 6px;
    background: #1b1929;
    color: #f5df82;
  }
</style>
