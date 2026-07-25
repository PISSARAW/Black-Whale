<script lang="ts">
  import { page } from '$app/stores';
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte';

  let character = $derived(($page.params as Record<string, string | undefined>).character || ($page.params as Record<string, string | undefined>).slug || 'unknown');

  const entries = [
    { state: 'known' as const, label: 'Kacho', details: 'identite visible comme vivante' },
    { state: 'suspected' as const, label: 'Anomalie de Shikaku', details: 'indices comportementaux' },
    { state: 'reported' as const, label: 'Tier 3', details: 'rapport recu de Melody' },
    { state: 'outdated' as const, label: 'Statut de cible', details: 'information ancienne' }
  ];
</script>

<svelte:head>
  <title>Knowledge {character} - Black Whale</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">Knowledge Map: {character}</h1>
    <p class="text-sm text-slate-300 mt-2">Encyclopedie de connaissances, soupcons, rumeurs et informations obsoletes.</p>
  </header>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Etat des informations</h2>
    <div class="grid sm:grid-cols-2 gap-2">
      {#each entries as entry}
        <KnowledgeStatus state={entry.state} label={entry.label} details={entry.details} />
      {/each}
    </div>
  </section>

  <section class="bw-panel p-4">
    <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Graphe de connaissance (optionnel)</h2>
    <pre class="text-xs bg-slate-950/70 border border-slate-700 rounded p-3 overflow-x-auto">[Fugetsu] --croit--> [Kacho]
[Fugetsu] --ignore--> [Without You]
[Melody] --soupconne--> [Anomalie d'identite]</pre>
  </section>
</div>
