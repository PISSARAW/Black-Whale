<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'
  import { t } from '$lib/i18n'

  let id = $derived(
    ($page.params as Record<string, string | undefined>).id ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  let history = $derived([
    { event: '389-11', ...$t.bodyDetail.history.observed },
    { event: '389-17', ...$t.bodyDetail.history.anomaly },
    { event: '389-22', ...$t.bodyDetail.history.recalculated },
  ])
</script>

<Seo title={$t.bodyDetail.seoTitle(id)} description={$t.bodyDetail.seoDescription(id)} noindex />

<div class="max-w-4xl mx-auto p-6 space-y-4">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{$t.bodyDetail.title(id)}</h1>
    <p class="text-sm text-slate-300 mt-2">{$t.bodyDetail.intro}</p>
  </header>

  <section class="bw-panel p-4">
    <ol class="space-y-3">
      {#each history as entry, entryIndex (entryIndex)}
        <li class="border border-slate-700 rounded p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">
            {$t.bodyDetail.event(entry.event)}
          </p>
          <p class="text-sm text-slate-100">{entry.label}</p>
          <p class="text-xs text-slate-400 mt-1">{$t.bodyDetail.state(entry.status)}</p>
        </li>
      {/each}
    </ol>
  </section>
</div>
