<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import FightChrolloLiveBook from '$lib/components/fighting/FightChrolloLiveBook.svelte'
  import {
    bookCorpseSetup,
    corpseLoanSetup,
    corpseEntry,
  } from '$lib/fighting/illumiCorpseTestSetup'
  import { tickFight, performAuraAttack } from '$lib/fighting/engine'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { applyReplayCommand } from '$lib/fighting/fightReplayCommands'
  import { equippedDolphin } from '$lib/fighting/dolphinBorrowing'
  import type { LiveBookActions } from '$lib/fighting/chrolloLiveBook'
  import { EMPTY_INPUT, type FightSide } from '$lib/fighting/types'
  let side: FightSide = 'player'
  let state = bookCorpseSetup()
  const actions: LiveBookActions = {
    queueAction: (run) => {
      state = run(state)
    },
    queueCommand: (command) => {
      state = applyReplayCommand(state, command)
    },
  }
  export async function prepare(mode: 'book' | 'loan', nextSide: FightSide) {
    side = nextSide
    state = mode === 'book' ? bookCorpseSetup(side) : corpseLoanSetup(30, side)
    await tick()
  }
  export async function advance(frames: number) {
    for (let frame = 0; frame < frames; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
  }
  export function snapshot() {
    return {
      actor: {
        id: state[side].id,
        aura: state[side].aura,
        health: state[side].health,
        preparation: state[side].corpsePreparation,
        loan: equippedDolphin(state[side]),
      },
      corpse: corpseEntry(state, `${side}:corpse`),
      piles: state.battlefield!.entities.filter((entry) => entry.corpsePinBundle),
    }
  }
</script>

<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  {#if state[side].chrolloBook}<FightChrolloLiveBook {state} {side} language="fr" {actions} />{/if}
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
