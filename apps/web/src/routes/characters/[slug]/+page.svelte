<script lang="ts">
  import type { PageData } from './$types'
  export let data: PageData
</script>
<svelte:head><title>{data.character?.canonicalName ?? 'Character'} — Black Whale</title></svelte:head>
<div class="p-6">
  <h1 class="text-3xl font-bold text-bw-gold mb-2">{data.character?.canonicalName ?? 'Unknown'}</h1>
  <!-- TODO: full character profile -->
</div>
