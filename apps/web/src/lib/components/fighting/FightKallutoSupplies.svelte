<script lang="ts">
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: kit = state[side].paperKit
  $: visible = side === 'player' || state.mode === 'versus-local' || state.mode === 'training'
</script>

{#if visible && kit}
  <p class="paper-supplies">
    {language === 'fr' ? 'Papier disponible' : 'Available paper'} ·
    {kit.markers}
    {language === 'fr' ? 'marques' : 'markers'} ·
    {kit.salvos}
    {language === 'fr' ? 'salves' : 'salvos'} ·
    {kit.sheets}
    {language === 'fr' ? 'feuilles' : 'sheets'}
  </p>
{/if}

<style>
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
</style>
