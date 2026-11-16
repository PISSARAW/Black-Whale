<script lang="ts">
  import { doorNetworkBusy } from '$lib/fighting/voconteDoorState'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: visible = state[side].id === 'voconte' || doorNetworkBusy(state, side)
  $: network = state.voconteDoors?.networks[side]
  $: transit = state.voconteDoors?.lastTransit?.[side]
</script>

{#if visible}
  <div class="door-status" data-door-status={side} aria-live="polite">
    <strong
      >Door · {language === 'fr'
        ? network?.pending
          ? 'liaison en préparation'
          : network?.active
            ? 'seuils reliés'
            : 'seuils inactifs'
        : network?.pending
          ? 'preparing link'
          : network?.active
            ? 'frames linked'
            : 'frames inactive'}</strong
    >
    <span
      >{language === 'fr'
        ? 'A → B : franchir vers la droite · B → A : franchir vers la gauche. Tout combattant peut passer.'
        : 'A → B: cross rightwards · B → A: cross leftwards. Either fighter can pass.'}</span
    >
    {#if transit}<span
        >{language === 'fr' ? 'Dernier passage' : 'Last passage'} : {transit.from} → {transit.to}</span
      >{/if}
    <small
      >{language === 'fr'
        ? 'Duel : deux huisseries fournies, 20 aura et préparation de 18 frames. Limites d’installation canoniques inconnues.'
        : 'Duel: two supplied frames, 20 aura and 18-frame setup. Canon installation limits remain unknown.'}</small
    >
  </div>
{/if}

<style>
  .door-status {
    display: grid;
    gap: 0.25rem;
    border-left: 2px solid #7ec8b6;
    padding: 0.5rem 0.65rem;
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }
  strong {
    color: #b4e4d8;
  }
  small {
    opacity: 0.7;
  }
</style>
