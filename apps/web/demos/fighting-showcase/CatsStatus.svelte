<script lang="ts">
  import type { FightState } from '../../src/lib/fighting/types'
  import { catsNamePhase } from '../../src/lib/fighting/camillaCat'
  export let state: FightState
  const labels = {
    summon: 'LE NEN SURVIT À LA MORT',
    capture: 'LE MEURTRIER EST SAISI',
    absorb: 'SA VIE EST ABSORBÉE',
    revive: 'CAMILLA RESSUSCITE',
  }
</script>

{#if state.catsName}
  <aside><b>CAT’S NAME</b><span>{labels[catsNamePhase(state.catsName.frame)]}</span></aside>
{/if}

<style>
  aside {
    position: absolute;
    left: 50%;
    top: 150px;
    transform: translateX(-50%);
    z-index: 18;
    text-align: center;
    padding: 14px 28px;
    background: #130d20ed;
    border: 1px solid #e6c988;
  }
  b {
    display: block;
    font-size: 28px;
    letter-spacing: 5px;
    color: #ffe4a4;
  }
  span {
    display: block;
    font-size: 15px;
    margin-top: 8px;
    letter-spacing: 3px;
  }
</style>
