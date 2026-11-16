<script lang="ts">
  import { GUARD_LABELS } from '$lib/fighting/combatProperties'
  import { moveById } from '$lib/fighting/movesets'
  import type { FighterMove } from '$lib/fighting/movesetTypes'
  export let move: FighterMove
  export let language: 'fr' | 'en'
  $: guard = GUARD_LABELS[move.guard][language === 'fr' ? 0 : 1]
  $: blockRoutes = move.cancelOnBlockInto
    .map((id) => {
      const target = moveById(id)
      return language === 'fr' ? target?.nameFr : target?.nameEn
    })
    .join(' → ')
</script>

{#if move.tuning.damage > 0 || move.category === 'throw'}
  <small class="move-properties">
    {guard}
    {#if move.canHitDowned}
      · {language === 'fr' ? 'Touche au sol' : 'Hits downed targets'}{/if}
    {#if blockRoutes}
      · {language === 'fr' ? 'Cancel sur garde' : 'Block cancel'} : {blockRoutes}{/if}
  </small>
{/if}

<style>
  .move-properties {
    grid-column: 1 / -1;
    color: #a8bac5;
    font-size: 0.72rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
</style>
