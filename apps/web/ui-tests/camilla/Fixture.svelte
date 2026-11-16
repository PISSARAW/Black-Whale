<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightCatsName from '$lib/components/fighting/FightCatsName.svelte'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import { recordFightDeath } from '$lib/fighting/fightDeaths'
  import { resolveFightOutcome } from '$lib/fighting/fightOutcome'
  import { catsNamePhase } from '$lib/fighting/camillaCat'
  import { EMPTY_INPUT } from '$lib/fighting/types'

  let state = beginFight(
    createFight('camilla', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  export async function renderFrame(frame: number) {
    const fresh = beginFight(
      createFight('camilla', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const killed = {
      ...fresh,
      player: { ...fresh.player, health: 0, x: 35 },
      opponent: { ...fresh.opponent, x: 65 },
    }
    let current = resolveFightOutcome(
      recordFightDeath(killed, {
        victimSide: 'player',
        killerSide: 'opponent',
        cause: 'projectile',
      }),
    )
    for (let count = 0; count < frame; count++)
      current = tickFight(current, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    state = current
    await tick()
    return {
      initialTime: fresh.time,
      phase: state.phase,
      catPhase: state.catsName ? catsNamePhase(state.catsName.frame) : null,
      winner: state.winner,
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      killerHealth: state.opponent.health,
      consumed: state.catsNameConsumed,
      time: state.time,
    }
  }
</script>

<main>
  <h1>Cat’s Name</h1>
  <div class="arena">
    <FightScene {state} stageId="heavens-arena" /><FightCatsName {state} language="fr" />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
    color: #eadab1;
  }
  main {
    max-width: 1200px;
    margin: auto;
    padding: 1rem;
  }
  h1 {
    font: 700 1rem var(--font-mono);
    margin: 0 0 0.7rem;
  }
  .arena {
    position: relative;
    height: min(70vh, 650px);
    min-height: 400px;
    width: 100%;
    overflow: hidden;
    border: 1px solid #625475;
  }
</style>
