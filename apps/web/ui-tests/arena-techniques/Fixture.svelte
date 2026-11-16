<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightArenaStatus from '$lib/components/fighting/FightArenaStatus.svelte'
  import FightPreparationStatus from '$lib/components/fighting/FightPreparationStatus.svelte'
  import FightArenaSetup from '$lib/components/fighting/FightArenaSetup.svelte'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import { EMPTY_INPUT, type FightInput, type FightSide, type FighterId } from '$lib/fighting/types'
  import { movementKeys, opponentMovementKeys } from '../../src/routes/fighting/fightingKeys'
  let environment = { arenaInteractions: true }
  let state = beginFight(createFight('hisoka', 'machi', { mode: 'versus-local', environment }))
  let inputs = { player: { ...EMPTY_INPUT }, opponent: { ...EMPTY_INPUT } }
  function control(side: FightSide, key: keyof FightInput, active: boolean) {
    inputs = { ...inputs, [side]: { ...inputs[side], [key]: active } }
    advance(1)
  }
  export function advance(frames: number) {
    for (let i = 0; i < frames; i++)
      state = tickFight(state, inputs.player, { dt: 1 / 60, opponentInput: inputs.opponent })
  }
  export async function setCharacter(id: FighterId) {
    const fresh = beginFight(createFight(id, 'hisoka', { mode: 'versus-local', environment }))
    state = {
      ...fresh,
      player: { ...fresh.player, x: 27, aura: 100 },
      opponent: { ...fresh.opponent, x: 73, aura: 100 },
    }
    inputs = { player: { ...EMPTY_INPUT }, opponent: { ...EMPTY_INPUT } }
    await tick()
  }
  export function snapshot() {
    return JSON.parse(JSON.stringify(state))
  }
</script>

<svelte:window
  onkeydown={(event) => {
    const p1 = movementKeys[event.key]
    const p2 = opponentMovementKeys[event.key]
    if (p1 === 'arena' || p1 === 'interact') control('player', p1, true)
    if (p2 === 'arena' || p2 === 'interact') control('opponent', p2, true)
  }}
  onkeyup={(event) => {
    const p1 = movementKeys[event.key]
    const p2 = opponentMovementKeys[event.key]
    if (p1 === 'arena' || p1 === 'interact') control('player', p1, false)
    if (p2 === 'arena' || p2 === 'interact') control('opponent', p2, false)
  }}
/>
<main>
  <h1>Capacités d’arène</h1>
  <FightArenaSetup {environment} language="fr" onEnvironment={(next) => (environment = next)} />
  <div class="scene"><FightScene {state} stageId="heavens-arena" /></div>
  <div class="players">
    {#each ['player', 'opponent'] as side (side)}
      <section aria-label={side}>
        <h2>{side === 'player' ? 'P1' : 'P2'}</h2>
        <FightArenaStatus
          {state}
          side={side as FightSide}
          language="fr"
          onControl={(key, active) => control(side as FightSide, key, active)}
        />
        <FightPreparationStatus
          {state}
          side={side as FightSide}
          language="fr"
          onControl={(key, active) => control(side as FightSide, key, active)}
        />
      </section>
    {/each}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080e14;
    color: #e0eaf2;
    font: 500 0.85rem/1.5 monospace;
  }
  main {
    max-width: 1100px;
    margin: auto;
    padding: 12px;
  }
  .scene {
    position: relative;
    height: 400px;
  }
  .players {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  section {
    min-width: 0;
  }
  @media (max-width: 600px) {
    .players {
      grid-template-columns: 1fr;
    }
    .scene {
      height: 280px;
    }
  }
</style>
