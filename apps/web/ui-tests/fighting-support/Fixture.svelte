<script lang="ts">
  import { tick, onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { performArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { BIRD_WINGS, BIRD_TETHER } from '$lib/tour/apparitionBasicView'
  import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from '$lib/fighting/types'
  const names = {
    growth: 'Bill · Erigeron',
    mission: 'Cluck · Pigeon en mission',
    delivery: 'Cluck · Livraison confirmée',
    massage: 'Biscuit · Cookie, massage',
    piano: 'Biscuit · Cookie, Piano Massage',
    'missing-seed': 'Bill · Aucune graine disponible',
    'missing-bird': 'Cluck · Aucun pigeon disponible',
    denied: 'Cookie · Partenaire sans consentement',
  }
  type Mode = keyof typeof names
  const source = (mode: Mode): FighterId =>
    ['growth', 'missing-seed'].includes(mode)
      ? 'bill'
      : ['mission', 'delivery', 'missing-bird'].includes(mode)
        ? 'cluck'
        : 'biscuit'
  let selected: Mode = 'growth',
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
    const root = this.getObjectByName('support-type-one')
    if (!root) return
    const seed = this.getObjectByName(`prepared:${side}:seed`)
    const bird = this.getObjectByName(`prepared:${side}:bird`)
    const cookie = this.getObjectByName(`cookie-treatment:${side}`)
    audit = {
      events: root.userData.events,
      visible: root.visible ? root.children.filter((n) => n.visible).length : 0,
      plant: seed?.getObjectByName('growth')?.scale.toArray(),
      bird: bird?.visible ?? false,
      wings: bird?.getObjectByName(BIRD_WINGS)?.children.map((n) => n.rotation.z),
      tether: bird?.getObjectByName(BIRD_TETHER)?.visible ?? false,
      cookie: cookie?.visible ?? false,
      cookiePose: cookie
        ? [
            cookie.position.toArray(),
            cookie.scale.toArray(),
            ...[-1, 1].map((sign) =>
              cookie.getObjectByName(`cookie-shoulder:${sign}`)?.quaternion.toArray(),
            ),
          ]
        : [],
    }
  }
  function frames(s: FightState, n: number) {
    for (let i = 0; i < n; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return s
  }
  function fresh(mode: Mode, place: FightSide): FightState {
    const id = source(mode),
      resources =
        mode === 'growth'
          ? ['plants' as const]
          : ['mission', 'delivery'].includes(mode)
            ? ['birds' as const]
            : []
    let s = beginFight(
      createFight(place === 'player' ? id : 'hisoka', place === 'opponent' ? id : 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: 'heavens-arena',
          preparation: { mode: resources.length ? 'scenario' : 'duel', resources, cohorts: [] },
        },
      }),
    )
    s = {
      ...s,
      player: { ...s.player, x: resources.length ? 25 : 44, aura: 75 },
      opponent: { ...s.opponent, x: resources.length ? 75 : 49, aura: 75 },
    }
    if (mode === 'delivery') {
      s = performAttack(s, place, 'special')
      const destination = s.battlefield!.entities.find(
        (e) => e.kind === 'delivery' && e.owner === place,
      )!
      for (let i = 0; i < 200; i++) {
        const bird = s.battlefield!.entities.find((e) => e.id === `${place}:bird`)!
        if (Math.abs(bird.x - destination.x) <= 0.41) break
        s = frames(s, 1)
      }
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
    if (selected === 'delivery') state = frames(state, 1)
    else if (source(selected) === 'biscuit')
      state = performArsenalCommand(state, side, {
        action: selected === 'piano' ? 'cookie-piano' : 'cookie-massage',
        target: selected === 'denied' ? (side === 'player' ? 'opponent' : 'player') : side,
      })
    else state = performAttack(state, side, 'special')
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
  export async function conceal(value: boolean) {
    state = { ...state, [side]: { ...state[side], nen: { ...state[side].nen, in: value } } }
    await tick()
  }
  export async function gyo(place: FightSide, value: boolean) {
    state = { ...state, [place]: { ...state[place], nen: { ...state[place].nen, gyo: value } } }
    await tick()
  }
  export async function stop() {
    state =
      source(selected) === 'biscuit'
        ? performArsenalCommand(state, side, { action: 'cookie-stop' })
        : performAttack(state, side, 'special')
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
    <span>CLASH / BILL · CLUCK · BISCUIT</span>
    <h1>{names[selected]}</h1>
    <p>Type 1 · Croissance, mission du pigeon et traitement réel de Cookie.</p>
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
