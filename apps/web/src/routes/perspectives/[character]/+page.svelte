<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte'
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte'
  import { t } from '$lib/i18n'

  let character = $derived(
    ($page.params as Record<string, string | undefined>).character ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  let rows = $derived([
    { state: 'confirmed' as const, ...$t.perspectiveDetail.rows.position },
    { state: 'suspected' as const, ...$t.perspectiveDetail.rows.shikaku },
    { state: 'outdated' as const, ...$t.perspectiveDetail.rows.kacho },
  ])

  let points = $derived({
    reality: [{ id: '1', label: $t.perspectiveDetail.points.reality, index: 1 }],
    body: [{ id: '2', label: $t.perspectiveDetail.points.body, index: 1 }],
    consciousness: [
      { id: '3', label: $t.perspectiveDetail.points.consciousness, index: 1, emphasis: true },
    ],
    knowledge: [{ id: '4', label: $t.perspectiveDetail.points.knowledge, index: 1 }],
  })
</script>

<Seo
  title={$t.perspectiveDetail.seoTitle(character)}
  description={$t.perspectiveDetail.seoDescription(character)}
  noindex
/>

<div class="max-w-6xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">
      {$t.perspectiveDetail.title(character)}
    </h1>
    <p class="text-sm text-slate-300 mt-2">{$t.perspectiveDetail.intro}</p>
  </header>

  <section class="grid lg:grid-cols-[1.2fr_1fr] gap-4">
    <article class="bw-panel p-4 min-h-[18rem]">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
        {$t.perspectiveDetail.subjectiveMap}
      </h2>
      <p class="text-sm text-slate-200">{$t.perspectiveDetail.subjectiveMapCopy}</p>
      <ul class="mt-3 text-sm text-slate-300 space-y-2">
        <li>● {$t.perspectiveDetail.confirmedPosition}</li>
        <li>◐ {$t.perspectiveDetail.likelyPosition}</li>
        <li>○ {$t.perspectiveDetail.lastKnownPosition}</li>
      </ul>
    </article>

    <article class="bw-panel p-4">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
        {$t.perspectiveDetail.activeKnowledge}
      </h2>
      <div class="space-y-2">
        {#each rows as row, rowIndex (rowIndex)}
          <KnowledgeStatus state={row.state} label={row.label} details={row.details} />
        {/each}
      </div>
    </article>
  </section>

  <PerspectiveTimeline
    reality={points.reality}
    body={points.body}
    consciousness={points.consciousness}
    knowledge={points.knowledge}
    currentIndex={1}
  />
</div>
