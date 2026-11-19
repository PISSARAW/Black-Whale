<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import {
    stitchingSetup,
    stitchingBookSetup,
    stitchingDolphinSetup,
    stitchingFrames,
  } from '$lib/fighting/machiReattachmentTestSetup'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { performAuraAttack } from '$lib/fighting/engine'
  import type { FightSide } from '$lib/fighting/types'
  let side: FightSide = 'player'
  let state = stitchingSetup()
  export async function prepare(mode: 'native' | 'book' | 'dolphin', nextSide: FightSide) {
    side = nextSide
    state =
      mode === 'book'
        ? stitchingBookSetup(side)
        : mode === 'dolphin'
          ? stitchingDolphinSetup(side)
          : stitchingSetup(side)
    await tick()
  }
  export async function advance(frames: number) {
    state = stitchingFrames(state, side, frames)
    await tick()
  }
  export function snapshot() {
    const target = side === 'player' ? 'opponent' : 'player'
    return {
      caster: state[side],
      patient: state[target],
      parts: state.battlefield!.entities,
      score: state.score,
    }
  }
</script>

<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  <p role="status">Le patient consent et maintient Zetsu. Ses avant-bras originaux sont au sol.</p>
  {#if state[side].machiReattachment}<p role="status">
      Nen Stitches · Connexion des tissus en cours
    </p>{/if}
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
