<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import { soulDuel } from '$lib/fighting/halkenburgSoulTestSetup'
  import { tickFight, performAuraAttack } from '$lib/fighting/engine'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { halkenburgMindBody } from '$lib/fighting/halkenburgMindAccess'
  import { readyCohort } from '$lib/fighting/preparationWorld'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'
  let side: FightSide = 'player'
  let state = soulDuel()
  export async function prepare(mode: 'supporter' | 'halkenburg', nextSide: FightSide) {
    side = nextSide
    state = soulDuel(side, mode === 'supporter' ? 0 : 1)
    await tick()
  }
  export async function advance(frames: number) {
    for (let frame = 0; frame < frames; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
  }
  export function snapshot() {
    const target = side === 'player' ? 'opponent' : 'player'
    const soul = state[target].halkenburgSoul
    const origin = soul
      ? halkenburgMindBody(state, { host: target, role: 'victim', soul })
      : undefined
    return {
      source: { x: state[side].x, id: state[side].id, sleeping: state[side].halkenburgSleeping },
      host: {
        x: state[target].x,
        id: state[target].id,
        health: state[target].health,
        soul: state[target].halkenburgSoul,
        sleeping: state[target].halkenburgSleeping,
      },
      origin: origin
        ? {
            x: origin.x,
            health: origin.health,
            sleeping: origin.halkenburgSleeping,
            passenger: origin.halkenburgPassenger,
          }
        : undefined,
      cohortAvailable: readyCohort(state, side).length,
      sleepers: state.battlefield!.entities.filter((entry) => entry.halkenburgSleeping),
    }
  }
</script>

<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  <button
    on:click={() => {
      state = performAuraAttack({
        state,
        side,
        kind: 'special',
        moveId: 'halkenburg:neutralSpecial',
        auraCharged: false,
      })
    }}>Tirer la flèche</button
  >
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
