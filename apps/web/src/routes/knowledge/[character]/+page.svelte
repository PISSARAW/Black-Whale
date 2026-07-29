<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte'
  import { t } from '$lib/i18n'

  let character = $derived(
    ($page.params as Record<string, string | undefined>).character ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  let entries = $derived([
    { state: 'known' as const, ...$t.knowledgeDetail.entries.kacho },
    { state: 'suspected' as const, ...$t.knowledgeDetail.entries.shikaku },
    { state: 'reported' as const, ...$t.knowledgeDetail.entries.tier3 },
    { state: 'outdated' as const, ...$t.knowledgeDetail.entries.target },
  ])
</script>

<Seo
  title={$t.knowledgeDetail.seoTitle(character)}
  description={$t.knowledgeDetail.seoDescription(character)}
  noindex
/>

<div class="max-w-5xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{$t.knowledgeDetail.title(character)}</h1>
    <p class="text-sm text-slate-300 mt-2">{$t.knowledgeDetail.intro}</p>
  </header>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
      {$t.knowledgeDetail.informationState}
    </h2>
    <div class="grid sm:grid-cols-2 gap-2">
      {#each entries as entry, entryIndex (entryIndex)}
        <KnowledgeStatus state={entry.state} label={entry.label} details={entry.details} />
      {/each}
    </div>
  </section>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
      {$t.knowledgeDetail.graphTitle}
    </h2>
    <pre
      class="text-xs bg-slate-950/70 border border-slate-700 rounded p-3 overflow-x-auto">[Fugetsu] --believes--> [Kacho]
[Fugetsu] --ignores--> [Without You]
[Melody] --suspects--> [Identity anomaly]</pre>
  </section>
</div>
