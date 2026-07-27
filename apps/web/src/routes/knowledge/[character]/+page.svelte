<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte'

  let character = $derived(
    ($page.params as Record<string, string | undefined>).character ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  const entries = [
    { state: 'known' as const, label: 'Kacho', details: 'visible identity appears alive' },
    { state: 'suspected' as const, label: 'Shikaku anomaly', details: 'behavioral evidence' },
    { state: 'reported' as const, label: 'Tier 3', details: 'report received from Melody' },
    { state: 'outdated' as const, label: 'Target status', details: 'outdated information' },
  ]
</script>

<Seo
  title={`Knowledge — ${character}`}
  description={`What ${character} knows, believes and has not yet learned about the events aboard the Black Whale.`}
  noindex
/>

<div class="max-w-5xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">Knowledge Map: {character}</h1>
    <p class="text-sm text-slate-300 mt-2">
      An archive of knowledge, suspicions, rumors, and outdated information.
    </p>
  </header>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Information state</h2>
    <div class="grid sm:grid-cols-2 gap-2">
      {#each entries as entry, entryIndex (entryIndex)}
        <KnowledgeStatus state={entry.state} label={entry.label} details={entry.details} />
      {/each}
    </div>
  </section>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
      Knowledge graph (optional)
    </h2>
    <pre
      class="text-xs bg-slate-950/70 border border-slate-700 rounded p-3 overflow-x-auto">[Fugetsu] --believes--> [Kacho]
[Fugetsu] --ignores--> [Without You]
[Melody] --suspects--> [Identity anomaly]</pre>
  </section>
</div>
