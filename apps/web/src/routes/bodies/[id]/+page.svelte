<script lang="ts">
  import { page } from '$app/stores';

  let id = $derived(($page.params as Record<string, string | undefined>).id || ($page.params as Record<string, string | undefined>).slug || 'unknown');

  const history = [
    { event: '389-11', label: 'Corps observe en Tier 1', status: 'actif' },
    { event: '389-17', label: 'Anomalie comportementale signalee', status: 'suspect' },
    { event: '389-22', label: 'Occupation de conscience recalculee', status: 'transfert' }
  ];
</script>

<svelte:head>
  <title>Body {id} - Black Whale</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6 space-y-4">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">Historique du corps: {id}</h1>
    <p class="text-sm text-slate-300 mt-2">Chronologie biologique, occupations de conscience et apparence publique.</p>
  </header>

  <section class="bw-panel p-4">
    <ol class="space-y-3">
      {#each history as entry}
        <li class="border border-slate-700 rounded p-3">
          <p class="text-xs uppercase tracking-wider text-slate-400">Evenement {entry.event}</p>
          <p class="text-sm text-slate-100">{entry.label}</p>
          <p class="text-xs text-slate-400 mt-1">Etat: {entry.status}</p>
        </li>
      {/each}
    </ol>
  </section>
</div>
