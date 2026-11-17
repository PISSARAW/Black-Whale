<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performMove, tickFight } from '$lib/fighting/engine'
  import { recordFightInjuries } from '$lib/fighting/feitanPain'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightSide, type FightState } from '$lib/fighting/types'

  let state = fresh()
  let generation = 0
  let running = false
  let side: FightSide = 'player'
  let comfort = defaultFightComfort()
  let audit: Record<string, unknown> = {}
  const previousAfterRender = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previousAfterRender?.apply(this, args)
    const armour = this.getObjectByName(`pain-packer:${side}`)
    const sun = this.getObjectByName(`rising-sun:${side}`)
    if (!armour || !sun) return
    audit = {
      armourVisible: armour.visible,
      reveal: armour.userData.reveal,
      entryFrame: armour.userData.entryFrame,
      sunVisible: sun.visible,
      sunScale: sun.scale.x,
      sunPosition: sun.position.toArray(),
      boundaryScale: this.getObjectByName(`solar-heat:${side}`)?.scale.toArray(),
    }
  }
  function fresh(place: FightSide = 'player'): FightState {
    const initial = beginFight(
      createFight(
        place === 'player' ? 'feitan' : 'hisoka',
        place === 'opponent' ? 'feitan' : 'hisoka',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: { stageId: 'heavens-arena' },
        },
      ),
    )
    const base = {
      ...initial,
      player: { ...initial.player, x: 44 },
      opponent: { ...initial.opponent, x: 62 },
    }
    return recordFightInjuries(base, {
      ...base,
      [place]: { ...base[place], health: base[place].health - 60 },
    })
  }
  export async function reset(place: FightSide = 'player') {
    running = false
    side = place
    state = fresh(place)
    generation++
    await tick()
  }
  export async function cast(kind: 'armour' | 'sun') {
    state = performMove({ state, side, action: kind === 'armour' ? 'special' : 'finisher' })
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
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
  async function play(kind: 'armour' | 'sun') {
    await cast(kind)
    running = true
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
    <span>CLASH / FEITAN</span>
    <h1>Pain Packer · Rising Sun</h1>
    <p>La douleur prend forme. L’armure se referme. Le soleil s’embrase.</p>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        stageId="heavens-arena"
        viewer={side}
      />{/key}
    <FightHud {state} language="fr" />
  </div>
  <footer>
    <button
      on:click={() => play('armour')}
      disabled={Boolean(state[side].hatsuEffects.painPacker?.armour)}>Apparition de l’armure</button
    >
    <button
      on:click={() => play('sun')}
      disabled={!state[side].hatsuEffects.painPacker?.armour ||
        Boolean(state[side].hatsuEffects.painPacker?.sun)}>Rising Sun</button
    >
    <button on:click={() => (running = !running)}>{running ? 'Pause' : 'Continuer'}</button>
    <button on:click={() => reset(side)}>Recommencer</button>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0d090e;
    color: #efe7df;
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
    color: #c697ad;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    margin: 4px 0;
    font-size: 26px;
  }
  p {
    margin: 0;
    color: #bdb0b3;
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
    gap: 14px;
    padding: 18px 28px;
  }
  button {
    padding: 10px 16px;
    border: 1px solid #674153;
    border-radius: 6px;
    background: #25151e;
    color: #f6c388;
  }
  button:disabled {
    opacity: 0.45;
  }
</style>
