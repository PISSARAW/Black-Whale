<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import { beginFight, createFight, tickFight, performAuraAttack } from '$lib/fighting/engine'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'
  let side: FightSide = 'player'
  let state = beginFight(createFight('chrollo', 'theta', { mode: 'versus-local' }))
  export async function prepare(nextSide: FightSide, moon = false) {
    side = nextSide
    const fresh = beginFight(
      createFight(
        side === 'player' ? 'chrollo' : 'theta',
        side === 'opponent' ? 'chrollo' : 'theta',
        {
          mode: 'versus-local',
          environment: { arenaInteractions: true },
        },
      ),
    )
    const other = side === 'player' ? 'opponent' : 'player'
    state = {
      ...fresh,
      [other]: { ...fresh[other], x: 78 },
      [side]: {
        ...fresh[side],
        x: 27,
        facing: 1,
        aura: 100,
        chrolloBook: {
          ...fresh[side].chrolloBook!,
          open: !moon,
          bookmark: moon ? 'sun-and-moon' : null,
        },
      },
    }
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
      pending: state.arena?.pending[side],
      crate: state.battlefield?.entities.find((e) => e.id === 'arena:crate:34'),
    }
  }
</script>

<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
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
