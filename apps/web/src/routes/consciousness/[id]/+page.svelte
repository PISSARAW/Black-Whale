<script lang="ts">
  import { page } from '$app/stores';

  let id = $derived(($page.params as Record<string, string | undefined>).id || ($page.params as Record<string, string | undefined>).slug || 'unknown');

  const transfers = [
    { event: '389-12', from: 'Corps A', to: 'Corps B', confidence: 'confirme' },
    { event: '389-18', from: 'Corps B', to: 'Corps B', confidence: 'stable' },
    { event: '390-03', from: 'Corps B', to: 'Inconnu', confidence: 'incertain' }
  ];
</script>

<svelte:head>
  <title>Consciousness {id} - Black Whale</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6 space-y-4">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">Historique de conscience: {id}</h1>
    <p class="text-sm text-slate-300 mt-2">Suivi des transferts, suppressions et ancrages mentaux.</p>
  </header>

  <section class="bw-panel p-4">
    <ol class="space-y-3">
      {#each transfers as step}
        <li class="border border-slate-700 rounded p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">Evenement {step.event}</p>
          <p class="text-sm text-slate-100">{step.from} -> {step.to}</p>
          <p class="text-xs text-slate-400 mt-1">Certitude: {step.confidence}</p>
        </li>
      {/each}
    </ol>
  </section>
</div>
