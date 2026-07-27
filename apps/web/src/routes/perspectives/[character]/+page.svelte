<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte'
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte'

  let character = $derived(
    ($page.params as Record<string, string | undefined>).character ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  const rows = [
    { state: 'confirmed' as const, label: 'Position', details: 'room 1014 (direct observation)' },
    { state: 'suspected' as const, label: 'Shikaku identity', details: 'unusual behavior' },
    { state: 'outdated' as const, label: 'Kacho status', details: 'unconfirmed for 8 events' },
  ]

  const points = {
    reality: [{ id: '1', label: 'Canonical event', index: 1 }],
    body: [{ id: '2', label: 'Body movement', index: 1 }],
    consciousness: [{ id: '3', label: 'Transfer detected', index: 1, emphasis: true }],
    knowledge: [{ id: '4', label: 'Information acquired', index: 1 }],
  }
</script>

<Seo
  title={`Perspective — ${character}`}
  description={`The Black Whale as ${character} understands it: their timeline, their sources, and where their information has gone stale.`}
  noindex
/>

<div class="max-w-6xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{character}'s perspective</h1>
    <p class="text-sm text-slate-300 mt-2">
      Subjective map and timeline: what this character knows, believes, suspects, or ignores.
    </p>
  </header>

  <section class="grid lg:grid-cols-[1.2fr_1fr] gap-4">
    <article class="bw-panel p-4 min-h-[18rem]">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Subjective map</h2>
      <p class="text-sm text-slate-200">
        The same SVG geometry, with knowledge layers adapted to the selected perspective.
      </p>
      <ul class="mt-3 text-sm text-slate-300 space-y-2">
        <li>● Confirmed position</li>
        <li>◐ Likely position</li>
        <li>○ Last known position</li>
      </ul>
    </article>

    <article class="bw-panel p-4">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Active knowledge</h2>
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
