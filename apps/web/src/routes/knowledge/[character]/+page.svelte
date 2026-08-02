<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte'
  import { displayName } from '$lib/utils/displayNames'
  import { link, locale, t } from '$lib/i18n'
  import type { PageData } from './$types'
  import { PUBLIC_FEATURES } from '$lib/config/features'

  let { data }: { data: PageData } = $props()
  let name = $derived(displayName(data.character.canonicalName, $locale))

  type Entry = PageData['entries'][number]

  /** The chapter span of a row, so a chip says when it held, not only that it did. */
  function span(entry: Entry) {
    return entry.untilChapter === null
      ? $t.knowledgeDetail.since(entry.fromChapter)
      : $t.knowledgeDetail.between(entry.fromChapter, entry.untilChapter)
  }

  function details(entry: Entry) {
    const parts = [span(entry)]
    if (entry.source) parts.push($t.knowledgeDetail.toldBy(entry.source.label))
    else if (entry.acquisitionMethod)
      parts.push(
        $t.identity.enums.acquisitionMethod[entry.acquisitionMethod] ?? entry.acquisitionMethod,
      )
    if (entry.confidence !== null)
      parts.push($t.knowledgeDetail.confidence(Math.round(entry.confidence * 100)))
    return parts.join(' · ')
  }
</script>

<Seo
  title={$t.knowledgeDetail.seoTitle(name)}
  description={$t.knowledgeDetail.seoDescription(name)}
  noindex
/>

<div class="max-w-5xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{$t.knowledgeDetail.title(name)}</h1>
    <p class="text-sm text-slate-300 mt-2">{$t.knowledgeDetail.intro}</p>
    <div class="mt-4 flex flex-wrap gap-2 text-xs">
      {#if PUBLIC_FEATURES.perspectives}
        <a
          class="border border-slate-700 rounded px-3 py-1 hover:border-[#e5c57a]"
          href={$link(`/perspectives/${data.character.slug}`)}>{$t.knowledgeDetail.openPerspective}</a
        >
      {/if}
      <a
        class="border border-slate-700 rounded px-3 py-1 hover:border-[#e5c57a]"
        href={$link(`/characters/${data.character.slug}`)}>{$t.knowledgeDetail.openProfile}</a
      >
    </div>
  </header>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
      {$t.knowledgeDetail.informationState}
    </h2>

    {#if data.entries.length}
      <div class="grid sm:grid-cols-2 gap-2">
        {#each data.entries as entry (entry.id)}
          <KnowledgeStatus
            state={entry.state}
            label={`${entry.subject.label} — ${entry.predicate}`}
            details={details(entry)}
          />
        {/each}
      </div>
    {:else}
      <p class="text-sm text-slate-400 italic">{$t.knowledgeDetail.noKnowledge(name)}</p>
    {/if}
  </section>

  {#if data.edges.length}
    <section class="bw-panel p-4">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
        {$t.knowledgeDetail.graphTitle}
      </h2>
      <ul class="space-y-1 font-mono text-xs">
        {#each data.edges as edge (edge.id)}
          <li class="flex flex-wrap items-center gap-2">
            <span class="text-slate-100">[{edge.from}]</span>
            <span class="text-slate-500"
              >--{$t.identity.enums.epistemicRelation[edge.relation] ?? edge.relation}--&gt;</span
            >
            <span class="text-[#e5c57a]">[{edge.to}]</span>
            <span class="text-slate-500">{edge.predicate}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
