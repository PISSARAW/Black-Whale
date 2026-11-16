<script lang="ts">
  import { hatsuFor } from '$lib/fighting/hatsu/registry'
  import type { ArcadeFighter } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'

  $: ability = hatsuFor(fighter.id).stealableOutsideDuel
</script>

{#if ability}
  <div class="outside-duel-status">
    <strong>{language === 'fr' ? ability.nameFr : ability.nameEn}</strong>
    <span>{language === 'fr' ? ability.reasonFr : ability.reasonEn}</span>
  </div>
{/if}

<style>
  .outside-duel-status {
    display: grid;
    gap: 0.15rem;
    color: #b9d9e5;
    overflow-wrap: anywhere;
  }
</style>
