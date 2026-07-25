<script lang="ts">
  import PerspectiveDifference from '$lib/components/perspective/PerspectiveDifference.svelte';
  import SplitMap from '$lib/components/perspective/SplitMap.svelte';

  let leftPerspective = $state('Kurapika');
  let rightPerspective = $state('Babimyna');
  let differencesOnly = $state(false);

  const differenceRows = [
    {
      title: 'Shikaku',
      leftLabel: 'Kurapika',
      leftValue: 'Identite reelle inconnue',
      rightLabel: 'Babimyna',
      rightValue: 'Identite publique confirmee',
      code: '←' as const
    },
    {
      title: 'Position de Halkenburg',
      leftLabel: 'Kurapika',
      leftValue: 'Derniere position connue',
      rightLabel: 'Babimyna',
      rightValue: 'Position actuelle connue',
      code: '⏱' as const
    },
    {
      title: 'Nature de Kacho',
      leftLabel: 'Kurapika',
      leftValue: 'Vivante',
      rightLabel: 'Vue du lecteur',
      rightValue: 'Entite ressemblante / bete gardienne',
      code: '≠' as const
    }
  ];

  const filters = ['Tous', 'Identites', 'Positions', 'Statuts', 'Capacites', 'Affiliations', 'Evenements'];
  let activeFilter = $state('Tous');
</script>

<svelte:head>
  <title>Perspective Comparison - Black Whale</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl tracking-wide text-[#e7ca87]">Perspective Comparison</h1>
    <p class="text-sm text-slate-300 mt-2">Une meme carte, plusieurs verites selon la conscience suivie et le niveau de connaissance.</p>
    <p class="text-xs text-amber-200/80 mt-3 border border-amber-300/40 rounded px-3 py-2 inline-block">
      Cette comparaison revele les erreurs et illusions de la perspective selectionnee.
    </p>
  </header>

  <section class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
    <div class="bw-panel p-4 grid sm:grid-cols-2 gap-3">
      <label class="grid gap-1">
        <span class="text-xs uppercase tracking-wider text-slate-400">Perspective A</span>
        <input bind:value={leftPerspective} class="bg-slate-900 border border-slate-700 rounded px-3 py-2" />
      </label>
      <label class="grid gap-1">
        <span class="text-xs uppercase tracking-wider text-slate-400">Perspective B</span>
        <input bind:value={rightPerspective} class="bg-slate-900 border border-slate-700 rounded px-3 py-2" />
      </label>
    </div>

    <button
      type="button"
      class="bw-panel px-4 py-3 text-sm hover:bg-slate-800"
      onclick={() => (differencesOnly = !differencesOnly)}
    >
      {differencesOnly ? 'Voir cote a cote' : 'Mode differences seulement'}
    </button>
  </section>

  {#if !differencesOnly}
    <SplitMap
      leftTitle={`Perspective A - ${leftPerspective}`}
      rightTitle={`Perspective B - ${rightPerspective}`}
      leftContent={'Carte synchronisee. Position: ● connue, ? identite suspectee, ○ derniere position.'}
      rightContent={'Carte synchronisee. Meme zone, meme zoom, meme moment; confiance differente selon les preuves.'}
    />
  {/if}

  <section class="bw-panel p-4">
    <div class="flex flex-wrap gap-2 mb-4">
      {#each filters as filter}
        <button
          type="button"
          class={`px-3 py-1 text-xs border rounded ${activeFilter === filter ? 'border-emerald-300 bg-emerald-300/10' : 'border-slate-700'}`}
          onclick={() => (activeFilter = filter)}
        >
          {filter}
        </button>
      {/each}
    </div>

    <div class="grid gap-3">
      {#each differenceRows as row}
        <PerspectiveDifference
          title={row.title}
          leftLabel={row.leftLabel}
          leftValue={row.leftValue}
          rightLabel={row.rightLabel}
          rightValue={row.rightValue}
          code={row.code}
        />
      {/each}
    </div>
  </section>
</div>
