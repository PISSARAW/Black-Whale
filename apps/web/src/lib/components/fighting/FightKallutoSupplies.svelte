<script lang="ts">
  import { ownedPaperScatters } from '$lib/fighting/kallutoScatter'
  import { activePaperOwner } from '$lib/fighting/kallutoSurveillance'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: kit = state[side].paperKit
  $: visible = side === 'player' || state.mode === 'versus-local' || state.mode === 'training'
  $: loose = ownedPaperScatters(state, activePaperOwner(state, side)).filter(
    (entry) => entry.present && entry.health > 0,
  ).length
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
{#if visible && loose}
  <p class="paper-loose">
    {language === 'fr' ? 'Papier dispersé réutilisable' : 'Reusable loose paper'} · {loose}
  </p>
{/if}

<style>
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
</style>
