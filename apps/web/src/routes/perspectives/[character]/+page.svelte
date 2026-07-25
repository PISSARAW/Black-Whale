<script lang="ts">
  import { page } from '$app/stores';
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte';
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte';

  let character = $derived(($page.params as Record<string, string | undefined>).character || ($page.params as Record<string, string | undefined>).slug || 'unknown');

  const rows = [
    { state: 'confirmed' as const, label: 'Position', details: 'chambre 1014 (observation directe)' },
    { state: 'suspected' as const, label: 'Identite de Shikaku', details: 'comportement inhabituel' },
    { state: 'outdated' as const, label: 'Statut de Kacho', details: 'non confirme depuis 8 evenements' }
  ];

  const points = {
    reality: [{ id: '1', label: 'Evenement reel', index: 1 }],
    body: [{ id: '2', label: 'Mouvement du corps', index: 1 }],
    consciousness: [{ id: '3', label: 'Transfert detecte', index: 1, emphasis: true }],
    knowledge: [{ id: '4', label: "Acquisition de l'information", index: 1 }]
  };
</script>

<svelte:head>
  <title>Perspective {character} - Black Whale</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 space-y-5">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl text-[#e5c57a]">Perspective de {character}</h1>
    <p class="text-sm text-slate-300 mt-2">Carte et chronologie subjectives: ce que ce personnage sait, croit, soupconne ou ignore.</p>
  </header>

  <section class="grid lg:grid-cols-[1.2fr_1fr] gap-4">
    <article class="bw-panel p-4 min-h-[18rem]">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Carte subjective</h2>
      <p class="text-sm text-slate-200">Memes geometries SVG, mais calques de connaissance adaptes a la perspective selectionnee.</p>
      <ul class="mt-3 text-sm text-slate-300 space-y-2">
        <li>● Position confirmee</li>
        <li>◐ Position probable</li>
        <li>○ Derniere position connue</li>
      </ul>
    </article>

    <article class="bw-panel p-4">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Connaissances actives</h2>
      <div class="space-y-2">
        {#each rows as row}
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
