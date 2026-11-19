<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { benjaminNenActive } from '$lib/fighting/benjaminBaton'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false

  $: fighter = state[side]
  $: baton = fighter.hatsuEffects.baton
  $: active = benjaminNenActive(fighter)
  $: cardKey = side === 'player' ? $bindings.playerFinisher : $bindings.opponentFinisher
</script>

{#if fighter.id === 'benjamin' && baton}
  <div class="baton-status">
    <span
      >Benjamin Baton · {'★'.repeat(baton.inherited.length)} · {language === 'fr'
        ? 'héritages connus'
        : 'known inheritances'}</span
    >
    {#if detailed}<span>Air Blow · Secret Window · Culdcept</span>{/if}
    {#if !active}
      <span>{language === 'fr' ? 'Héritages suspendus' : 'Inherited abilities suspended'}</span>
    {:else}
      <span
        >Culdcept · {baton.card
          ? language === 'fr'
            ? `carte prête [${cardKey}]`
            : `card ready [${cardKey}]`
          : language === 'fr'
            ? 'sans carte'
            : 'no card'}</span
      >
    {/if}
  </div>
{/if}

<style>
  .baton-status {
    display: grid;
    gap: 0.12rem;
    color: #f1d36d;
    font: 600 0.58rem/1.4 var(--font-mono);
    margin-top: 0.3rem;
  }
</style>
