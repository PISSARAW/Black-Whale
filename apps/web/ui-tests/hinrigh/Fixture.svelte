<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightBiohazardStatus from '$lib/components/fighting/FightBiohazardStatus.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { EMPTY_INPUT } from '$lib/fighting/types'
  let state = beginFight(
    createFight('hinrigh', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  export async function renderFrame(frame: number) {
    const fresh = beginFight(
      createFight('hinrigh', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    let current = performAttack(
      {
        ...fresh,
        player: { ...fresh.player, x: 32, aura: 100 },
        opponent: { ...fresh.opponent, x: 68 },
      },
      'player',
      'special',
    )
    for (let n = 0; n < frame; n++)
      current = tickFight(current, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    state = current
    await tick()
    return {
      phases: state.player.biohazard!.objects.map((o) => o.phase),
      captured: Boolean(state.opponent.biohazardRestraint),
      health: state.opponent.health,
      initialHealth: fresh.opponent.health,
      nen: state.opponent.nen.mode,
      score: state.score,
    }
  }
</script>

<main>
  <h1>Hinrigh · Biohazard</h1>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  <div class="resources">
    <FightBiohazardStatus {state} side="player" language="fr" />
    <FightBiohazardStatus {state} side="opponent" language="fr" />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080f15;
    color: #c9e0d3;
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
    height: min(60vh, 600px);
    min-height: 360px;
    border: 1px solid #355047;
    overflow: hidden;
    position: relative;
  }
  .resources {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    padding: 1rem 0;
  }
  @media (max-width: 600px) {
    .resources {
      grid-template-columns: 1fr;
    }
  }
</style>
