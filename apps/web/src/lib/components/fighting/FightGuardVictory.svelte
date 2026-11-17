<script lang="ts">
  import { furykovCounterPlan } from '$lib/fighting/victory/furykovCounterPlan'
  import type { FighterId } from '$lib/fighting/types'
  export let target: FighterId = 'hisoka'
  $: counter = furykovCounterPlan(target)
  export let fighter: 'longhi' | 'furykov'
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
</script>

{#if fighter === 'longhi' && elapsed < 2.5}
  <div class="guard-terms">
    <b>MOONLIGHT ACT</b>
    <span
      >{fr
        ? 'Trêve : 5 secondes · Accord libre des deux parties'
        : 'Truce: 5 seconds · Both parties sign freely'}</span
    >
    <span
      >{fr
        ? 'Respect : un usage de Moonlight Act · Rupture : une semaine de Zetsu'
        : 'Fulfilment: one use of Moonlight Act · Breach: one week of Zetsu'}</span
    >
  </div>
{:else if fighter === 'longhi' && elapsed >= 3.2 && elapsed < 3.8}
  <div class="guard-terms">
    <b>{fr ? 'CONTRAT ROMPU' : 'CONTRACT BREACHED'}</b><span
      >ZETSU · {fr ? 'UNE SEMAINE' : 'ONE WEEK'}</span
    >
  </div>
{:else if fighter === 'furykov' && elapsed < 3}
  <div class="guard-terms alert">
    <b>COMBO MASTER · WEAPON</b><span
      >{fr
        ? 'Déchiffrage et fabrication achevés avant le combat'
        : 'Analysis and fabrication completed before the fight'}</span
    >
  </div>
{:else if fighter === 'furykov' && elapsed < 7}
  <div class="guard-terms alert">
    <b>{fr ? counter.nameFr : counter.nameEn}</b><span
      >{counter.targetName} · {fr ? counter.tacticFr : counter.tacticEn}</span
    >
  </div>
{/if}

<style>
  .guard-terms {
    position: absolute;
    left: 5%;
    right: 5%;
    bottom: 13%;
    display: grid;
    gap: 0.4rem;
    text-align: center;
    color: #d4e4f7;
    text-shadow: 0 2px 6px #000;
    font-size: clamp(10px, 1.3vw, 20px);
  }
  .guard-terms b {
    letter-spacing: 0.2em;
  }
  .guard-terms span {
    font-size: 0.85em;
  }
  .alert {
    color: #f0b1a8;
  }
</style>
