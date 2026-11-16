<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightPreparationStatus from '$lib/components/fighting/FightPreparationStatus.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
  import { preparedActionReady } from '$lib/fighting/preparationActions'
  import { luiniPhasePresentation } from '$lib/fighting/luiniPresentation'
  import { interactWithPreparation } from '$lib/fighting/preparationSimulation'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'

  let language: 'fr' | 'en' = 'fr'
  let side: FightSide = 'player'
  function fresh() {
    const environment = createFightEnvironment({
      preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
    })
    const state = beginFight(createFight('luini', 'luini', { mode: 'versus-local', environment }))
    return {
      ...state,
      player: { ...state.player, aura: 100 },
      opponent: { ...state.opponent, aura: 100 },
    }
  }
  let state = fresh()
  $: phase = luiniPhasePresentation(state, side, language)
  $: ready = preparedActionReady(state, side)

  export async function reset(nextLanguage: 'fr' | 'en', nextSide: FightSide) {
    language = nextLanguage
    side = nextSide
    state = fresh()
    await tick()
  }
  export async function advance(frames = 18) {
    for (let frame = 0; frame < frames; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
  }
  export async function position(x: number) {
    state = { ...state, [side]: { ...state[side], x } }
    await tick()
  }
  export async function openDoor() {
    const other = side === 'player' ? 'opponent' : 'player'
    const atDoor = { ...state, [other]: { ...state[other], x: side === 'player' ? 20 : 80 } }
    state = interactWithPreparation(atDoor, other)
    await tick()
  }
  export function snapshot() {
    return { x: state[side].x, phase, ready, anchor: state.battlefield?.luiniAnchors?.[side] }
  }
  function use() {
    state = performAttack(state, side, 'special')
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'l') use()
  }}
/>
<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  <section>
    <h1>Luini · {side === 'player' ? 'P1' : 'P2'}</h1>
    <FightPreparationStatus {state} {side} {language} />
    <button type="button" aria-label="L" disabled={!ready} onclick={use}>{phase.label} · L</button>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080e14;
    color: #e0eaf2;
    font: 500 0.85rem/1.5 sans-serif;
  }
  main {
    max-width: 1100px;
    margin: auto;
  }
  .arena {
    height: 400px;
    position: relative;
  }
  section {
    padding: 1rem;
    display: grid;
    gap: 0.6rem;
    overflow-wrap: anywhere;
  }
  button {
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #7894a0;
    background: #18303a;
    color: inherit;
    font: inherit;
  }
  button:disabled {
    opacity: 0.5;
  }
</style>
