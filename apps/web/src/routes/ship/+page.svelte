<script lang="ts">
  import type { PageData } from './$types'
  export let data: PageData
</script>

<svelte:head><title>Ship Map — Black Whale</title></svelte:head>

<div class="p-6">
  <h1 class="text-3xl font-bold text-bw-gold mb-4">Black Whale — Ship Map</h1>
  <p class="text-gray-400">2D interactive map of the ship. Select a deck to explore.</p>
  <!-- TODO: render ShipMap component with real data -->
</div>
