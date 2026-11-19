<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import { beginFight, createFight, tickFight, performAuraAttack } from '$lib/fighting/engine'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'
  let side: FightSide = 'player'
  let state = beginFight(createFight('hisoka', 'theta', { mode: 'versus-local' }))
  export async function prepare(nextSide: FightSide, historical = false) {
    side = nextSide
    state = beginFight(
      createFight(
        side === 'player' ? 'hisoka' : 'theta',
        side === 'opponent' ? 'hisoka' : 'theta',
        {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: historical
            ? { preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] } }
            : {},
        },
      ),
    )
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
  }
  export function snapshot() {
    return {
      actor: state[side],
      sequence: state.gumResuscitation,
      phase: state.phase,
      score: state.score,
      rounds: state.roundsWon,
    }
  }
</script>

<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  <p>
    Scène du chapitre 357 : ordre donné avant la mort, asphyxie, organes viables et air rétabli. Les
    blessures de l’explosion restent présentes.
  </p>
  <FightRetrospectiveArsenal
    {state}
    language="fr"
    onUse={(caster, command) => {
      state = performArsenalAction({ state, side: caster, command }, performAuraAttack)
    }}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080e14;
    color: #e0eaf2;
    font: 500 0.8rem/1.5 var(--font-mono);
  }
  main {
    max-width: 1100px;
    margin: auto;
    padding: 12px;
  }
  .arena {
    position: relative;
    overflow: hidden;
    height: 380px;
  }
</style>
