<script lang="ts">
  import { padailleToolLabel } from '$lib/fighting/padaillePresentation'
  import type { ArcadeFighter } from '$lib/fighting/types'
  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
</script>

{#if fighter.id === 'padaille' || fighter.padailleTool}
  <div class="weapon-status" role="status">{padailleToolLabel(fighter, language)}</div>
{/if}

<style>
  .weapon-status {
    color: #efc590;
    overflow-wrap: anywhere;
  }
</style>
