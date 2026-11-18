<script lang="ts">
  import { rihanPlan } from '$lib/fighting/victory/rihanPlan'
  import type { FighterId } from '$lib/fighting/types'
  export let target: FighterId
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: plan = rihanPlan(target)
  $: fr = language === 'fr'
</script>

{#if elapsed < 1.3}
  <div class="predator-status">
    <b>PREDATOR</b><span
      >{plan.prey
        ? `${plan.name} · ${fr ? 'Analyse personnelle achevée' : 'Personal analysis completed'}`
        : fr
          ? 'Analyse incomplète'
          : 'Incomplete analysis'}</span
    >
  </div>
{:else if plan.prey && elapsed >= 5.7 && elapsed < 8}
  <div class="predator-status sealed">
    <b>{fr ? 'NEN DE RIHAN SCELLÉ' : 'RIHAN’S NEN SEALED'}</b><span>48:00:00</span>
  </div>
{/if}

<style>
  .predator-status {
    position: absolute;
    left: 5%;
    right: 5%;
    bottom: 13%;
    display: grid;
    gap: 0.45rem;
    text-align: center;
    color: #d9c6a4;
    text-shadow: 0 2px 8px #000;
  }
  b {
    font-size: clamp(11px, 1.4vw, 22px);
    letter-spacing: 0.16em;
  }
  span {
    font-size: clamp(10px, 1.15vw, 18px);
  }
  .sealed {
    color: #b6c4d1;
  }
</style>
