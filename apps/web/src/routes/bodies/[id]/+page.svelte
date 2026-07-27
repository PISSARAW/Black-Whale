<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'

  let id = $derived(
    ($page.params as Record<string, string | undefined>).id ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  const history = [
    { event: '389-11', label: 'Body observed on Tier 1', status: 'active' },
    { event: '389-17', label: 'Behavioral anomaly reported', status: 'suspected' },
    { event: '389-22', label: 'Recalculated consciousness occupancy', status: 'transfer' },
  ]
</script>

<Seo
  title={`Body ${id}`}
  description={`Continuity record for body ${id}: observed positions, reported states and suspected identity swaps aboard the Black Whale.`}
  noindex
/>

<div class="max-w-4xl mx-auto p-6 space-y-4">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">Body history: {id}</h1>
    <p class="text-sm text-slate-300 mt-2">
      Biological timeline, consciousness occupancy, and public appearance.
    </p>
  </header>

  <section class="bw-panel p-4">
    <ol class="space-y-3">
      {#each history as entry}
        <li class="border border-slate-700 rounded p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">Event {entry.event}</p>
          <p class="text-sm text-slate-100">{entry.label}</p>
          <p class="text-xs text-slate-400 mt-1">State: {entry.status}</p>
        </li>
      {/each}
    </ol>
  </section>
</div>
