<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { page } from '$app/stores'
  import { t } from '$lib/i18n'

  let id = $derived(
    ($page.params as Record<string, string | undefined>).id ||
      ($page.params as Record<string, string | undefined>).slug ||
      'unknown',
  )

  let transfers = $derived([
    {
      event: '389-12',
      from: $t.consciousnessDetail.bodyA,
      to: $t.consciousnessDetail.bodyB,
      confidence: $t.consciousnessDetail.confidence.confirmed,
    },
    {
      event: '389-18',
      from: $t.consciousnessDetail.bodyB,
      to: $t.consciousnessDetail.bodyB,
      confidence: $t.consciousnessDetail.confidence.stable,
    },
    {
      event: '390-03',
      from: $t.consciousnessDetail.bodyB,
      to: $t.consciousnessDetail.unknownBody,
      confidence: $t.consciousnessDetail.confidence.uncertain,
    },
  ])
</script>

<Seo
  title={$t.consciousnessDetail.seoTitle(id)}
  description={$t.consciousnessDetail.seoDescription(id)}
  noindex
/>

<div class="max-w-4xl mx-auto p-6 space-y-4">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">{$t.consciousnessDetail.title(id)}</h1>
    <p class="text-sm text-slate-300 mt-2">{$t.consciousnessDetail.intro}</p>
  </header>

  <section class="bw-panel p-4">
    <ol class="space-y-3">
      {#each transfers as step, stepIndex (stepIndex)}
        <li class="border border-slate-700 rounded p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">
            {$t.consciousnessDetail.event(step.event)}
          </p>
          <p class="text-sm text-slate-100">{step.from} -> {step.to}</p>
          <p class="text-xs text-slate-400 mt-1">
            {$t.consciousnessDetail.certainty(step.confidence)}
          </p>
        </li>
      {/each}
    </ol>
  </section>
</div>
