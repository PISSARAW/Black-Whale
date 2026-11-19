<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightRetrospectiveArsenal from '$lib/components/fighting/FightRetrospectiveArsenal.svelte'
  import { ghostwriterSetup, fortuneFrames, fortuneSheet } from '$lib/fighting/ghostwriterTestSetup'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { performAuraAttack } from '$lib/fighting/engine'
  import type { FightSide } from '$lib/fighting/types'
  let side: FightSide = 'player'
  let state = ghostwriterSetup()
  export async function prepare(mode: 'person' | 'portrait', nextSide: FightSide) {
    side = nextSide
    state = ghostwriterSetup(side)
    state = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) => {
          if (mode === 'person' && entry.document?.fortunePortrait)
            return { ...entry, present: false }
          if (mode === 'portrait' && entry.fortunePerson) return { ...entry, present: false }
          return entry
        }),
      },
    }
    await tick()
  }
  export async function advance(frames: number) {
    state = fortuneFrames(state, frames)
    await tick()
  }
  export function snapshot() {
    return {
      caster: state[side],
      sheet: fortuneSheet(state),
      health: [state.player.health, state.opponent.health],
      score: state.score,
    }
  }
</script>

<main>
  <div class="arena"><FightScene {state} stageId="heavens-arena" /></div>
  <p>
    Participant fictif : Naël Deren. Son identité manuscrite et son mois de scénario sont définis.
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
