<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import PerspectiveDifference from '$lib/components/perspective/PerspectiveDifference.svelte';
  import CompareTierMap from '$lib/components/perspective/CompareTierMap.svelte';

  let { data }: { data: PageData } = $props();

  let selectedEventId = $state(data.selectedEventId || '');
  let selectedLeft = $state(data.selectedLeft || '');
  let selectedRight = $state(data.selectedRight || '');
  let compareCanonical = $state(Boolean(data.compareCanonical));
  let differencesOnly = $state(Boolean($page.url.searchParams.get('diffOnly') === '1'));
  let zoom = $state(data.sync.zoom || 1);
  let tier = $state(data.sync.tier || 'tier-1');
  let zone = $state(data.sync.zone || '');
  let selectedSubject = $state(data.sync.subject || '');
  let snapKey = $state(0);
  let lastSnapSubject = $state('');

  const tiers = ['tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];
  const filters = ['Tous', 'Identites', 'Positions', 'Statuts', 'Capacites', 'Affiliations', 'Evenements'];
  let activeFilter = $state('Tous');

  let locations = $derived(data.worldState?.locations || []);
  let presences = $derived(data.worldState?.presences || []);
  let bodies = $derived(data.worldState?.bodies || []);
  let characters = $derived(data.worldState?.characters || []);
  let differences = $derived(data.comparison || []);
  let canonicalTruth = $derived(data.canonicalTruth || { facts: [], positions: {} });

  let eventLabel = $derived(data.events.find((event) => event.id === selectedEventId));

  const locationCoordinates: Record<string, Record<string, { x: number; y: number }>> = {
    'tier-1': {
      'king-quarters': { x: 475, y: 160 },
      'princes-burial-chamber': { x: 475, y: 110 },
      'banquet-hall': { x: 475, y: 260 },
      'vvip-living-quarters': { x: 290, y: 380 },
      'queens-living-quarters': { x: 290, y: 470 },
      'soldiers-living-quarters': { x: 290, y: 530 },
      'casino': { x: 400, y: 400 },
      'cineplex': { x: 600, y: 350 },
      'central-dining-hall': { x: 600, y: 450 },
      'observation-deck': { x: 700, y: 200 },
      'royal-army-office': { x: 700, y: 400 },
      'general-cabins': { x: 700, y: 500 },
      'central-police-station': { x: 500, y: 500 },
      'central-courthouse': { x: 500, y: 450 },
      'heilly-processing': { x: 350, y: 500 }
    },
    'tier-2': {
      'vip-guest-rooms': { x: 300, y: 200 },
      'entertainment-district': { x: 500, y: 250 },
      'shopping-arcade': { x: 700, y: 200 },
      'restaurant-row': { x: 500, y: 350 },
      'military-barracks': { x: 200, y: 400 },
      'security-center': { x: 400, y: 450 },
      'detention-facility': { x: 200, y: 500 }
    },
    'tier-3': {
      'medical-district': { x: 300, y: 250 },
      'tier-3-medical-district': { x: 300, y: 250 },
      'research-labs': { x: 500, y: 200 },
      'processing-plants': { x: 700, y: 200 },
      'waste-management': { x: 200, y: 400 },
      'power-station': { x: 400, y: 400 },
      'water-treatment': { x: 600, y: 400 },
      'storage-warehouses': { x: 500, y: 500 }
    },
    'tier-4': {
      'crew-quarters': { x: 250, y: 150 },
      'maintenance-bays': { x: 450, y: 200 },
      'cargo-holds': { x: 700, y: 250 },
      'engineering-section': { x: 400, y: 350 },
      'propulsion-systems': { x: 600, y: 350 },
      'life-support': { x: 300, y: 450 },
      'navigation-center': { x: 500, y: 450 },
      'communication-hub': { x: 700, y: 450 }
    },
    'tier-5': {
      'lower-decks': { x: 300, y: 200 },
      'storage-tanks': { x: 500, y: 150 },
      'waste-holding': { x: 200, y: 300 },
      'recycling-facility': { x: 400, y: 300 },
      'emergency-generators': { x: 600, y: 300 },
      'structural-support': { x: 300, y: 400 },
      'ballast-tanks': { x: 500, y: 400 },
      'docking-bays': { x: 700, y: 400 }
    }
  };

  function hashToUnit(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 1000) / 1000;
  }

  let entitiesInView = $derived.by(() => {
    const byLocation = new Map<string, any>(locations.map((location: any) => [location.id, location] as [string, any]));

    function resolveTier(location: any) {
      let current = location;
      let depth = 0;
      while (current && depth < 8) {
        if (current.type === 'TIER') return current.slug;
        current = current.parentLocationId ? byLocation.get(current.parentLocationId) : null;
        depth += 1;
      }
      return null;
    }

    return presences
      .map((presence: any) => {
        const body = bodies.find((item: any) => item.id === presence.entityId);
        const owner = body ? characters.find((item: any) => item.id === body.originalCharacterId) : null;
        const location = byLocation.get(presence.locationId);
        return {
          id: presence.entityId,
          subjectId: owner?.id || body?.id || presence.entityId,
          name: owner?.canonicalName || body?.label || presence.entityId,
          locationName: location?.name || 'Localisation inconnue',
          tier: location ? resolveTier(location) : null,
          zone: location?.slug || ''
        };
      })
      .filter((item: any) => (!tier || item.tier === tier) && (!zone || item.zone === zone));
  });

  let zonesInTier = $derived(
    locations.filter((location: any) => location.slug?.startsWith(tier) && location.type !== 'TIER')
  );

  let baseMarkers = $derived.by(() => {
    const byLocation = new Map<string, any>(locations.map((location: any) => [location.id, location] as [string, any]));

    function resolveTier(location: any) {
      let current = location;
      let depth = 0;
      while (current && depth < 8) {
        if (current.type === 'TIER') return current.slug;
        current = current.parentLocationId ? byLocation.get(current.parentLocationId) : null;
        depth += 1;
      }
      return null;
    }

    return presences.map((presence: any) => {
      const body = bodies.find((item: any) => item.id === presence.entityId);
      const owner = body ? characters.find((item: any) => item.id === body.originalCharacterId) : null;
      const location = byLocation.get(presence.locationId);
      const markerTier = location ? resolveTier(location) : null;

      let x = 500;
      let y = 300;
      if (location && markerTier && locationCoordinates[markerTier]?.[location.slug]) {
        const coords = locationCoordinates[markerTier][location.slug];
        x = coords.x;
        y = coords.y;
      } else {
        const base = hashToUnit(presence.entityId || 'unknown');
        x = 220 + base * 560;
        y = 160 + (1 - base) * 280;
      }

      return {
        id: presence.entityId,
        bodyId: body?.id || presence.entityId,
        subjectId: owner?.id || body?.id || presence.entityId,
        name: owner?.canonicalName || body?.label || presence.entityId,
        tier: markerTier,
        zone: location?.slug || '',
        x,
        y,
        certainty: presence.certainty || 'UNKNOWN'
      };
    });
  });

  let scopedMarkers = $derived(
    baseMarkers.filter((marker: any) => marker.tier === tier && (!zone || marker.zone === zone))
  );

  function codeWeight(code: '=' | '←' | '→' | '≠' | '~' | '⏱') {
    if (code === '≠') return 5;
    if (code === '⏱') return 4;
    if (code === '←' || code === '→') return 3;
    if (code === '~') return 2;
    return 1;
  }

  function differenceCode(diff: any): '=' | '←' | '→' | '≠' | '~' | '⏱' {
    if (diff.dimension === 'EVENT') return '⏱';
    return pickCode(diff);
  }

  let subjectCodeMap = $derived.by(() => {
    const map = new Map<string, '=' | '←' | '→' | '≠' | '~' | '⏱'>();

    for (const diff of differences as any[]) {
      const subjectId = diff.subjectId;
      if (!subjectId) continue;

      const code = differenceCode(diff);
      const existing = map.get(subjectId) || '=';

      if (codeWeight(code) > codeWeight(existing)) {
        map.set(subjectId, code);
      }
    }

    return map;
  });

  function markerLabel(marker: any, perspective: any, mode: 'left' | 'right' | 'reader') {
    if (mode === 'reader') return marker.name;
    if (!perspective) return marker.name;

    const observerId = perspective.observer?.characterId;
    if (observerId && marker.subjectId === observerId) return marker.name;

    const facts = (perspective.knownFacts || []).filter((fact: any) =>
      fact.subjectId === marker.subjectId || fact.subjectId === marker.bodyId
    );
    const beliefs = (perspective.beliefs || []).filter((belief: any) =>
      belief.subjectId === marker.subjectId || belief.subjectId === marker.bodyId
    );

    if (facts.length > 0) return marker.name;
    if (beliefs.length > 0) return 'Identite supposee';
    return 'Individu inconnu';
  }

  let leftMapMarkers = $derived(scopedMarkers.map((marker: any) => ({
    ...marker,
    label: markerLabel(marker, data.leftPerspective, 'left'),
    code: subjectCodeMap.get(marker.subjectId) || '=',
    selected: marker.subjectId === selectedSubject
  })));

  let rightMapMarkers = $derived(scopedMarkers.map((marker: any) => ({
    ...marker,
    label: markerLabel(marker, data.rightPerspective, 'right'),
    code: subjectCodeMap.get(marker.subjectId) || '=',
    selected: marker.subjectId === selectedSubject
  })));

  let readerMapMarkers = $derived(scopedMarkers.map((marker: any) => ({
    ...marker,
    label: markerLabel(marker, null, 'reader'),
    code: subjectCodeMap.get(marker.subjectId) || '=',
    selected: marker.subjectId === selectedSubject
  })));

  let focusMarker = $derived(
    scopedMarkers.find((marker: any) => marker.subjectId === selectedSubject) || scopedMarkers[0] || { x: 500, y: 300 }
  );

  let canonicalRows = $derived.by(() => {
    if (!compareCanonical) return [];
    const facts = (canonicalTruth.facts || []).filter((fact: any) => fact.subjectId === selectedSubject);
    const objectivePosition = canonicalTruth.positions?.[selectedSubject];
    const rows = facts.map((fact: any) => ({
      type: 'fait canonique',
      key: fact.predicate,
      value: formatValue(fact.value)
    }));

    if (objectivePosition) {
      rows.unshift({
        type: 'position reelle',
        key: 'locationId',
        value: objectivePosition.locationId || 'inconnue'
      });
    }

    return rows;
  });

  $effect(() => {
    if (!selectedSubject && entitiesInView.length > 0) {
      selectedSubject = entitiesInView[0].subjectId;
    }
  });

  $effect(() => {
    if (!selectedSubject || selectedSubject === lastSnapSubject) return;
    lastSnapSubject = selectedSubject;
    snapKey += 1;
  });

  function getCharacterName(id: string) {
    return data.characters.find((character) => character.id === id)?.canonicalName || id;
  }

  function buildUrl() {
    const url = new URL($page.url);
    if (selectedEventId) url.searchParams.set('eventId', selectedEventId);
    if (selectedLeft) url.searchParams.set('left', selectedLeft);
    if (selectedRight) url.searchParams.set('right', selectedRight);
    url.searchParams.set('zoom', String(zoom));
    url.searchParams.set('tier', tier);
    if (zone) url.searchParams.set('zone', zone);
    else url.searchParams.delete('zone');
    if (selectedSubject) url.searchParams.set('subject', selectedSubject);
    else url.searchParams.delete('subject');
    if (compareCanonical) url.searchParams.set('canonical', '1');
    else url.searchParams.delete('canonical');
    if (differencesOnly) url.searchParams.set('diffOnly', '1');
    else url.searchParams.delete('diffOnly');
    return url;
  }

  function submitFetch() {
    goto(buildUrl().toString(), { keepFocus: true });
  }

  function syncState(replaceState = true) {
    goto(buildUrl().toString(), { keepFocus: true, replaceState });
  }

  function selectEntity(subjectId: string) {
    selectedSubject = subjectId;
    syncState(true);
  }

  function pickCode(diff: any): '=' | '←' | '→' | '≠' | '~' | '⏱' {
    if (diff.differenceType === 'LEFT_ONLY') return '←';
    if (diff.differenceType === 'RIGHT_ONLY') return '→';
    if (diff.differenceType === 'CONTRADICTION') return '≠';
    if (diff.differenceType === 'CONFIDENCE_GAP') return '~';
    return '=';
  }

  function formatValue(value: unknown) {
    if (value === undefined || value === null) return 'inconnu';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  function matchesFilter(diff: any) {
    if (activeFilter === 'Tous') return true;
    const byFilter: Record<string, string[]> = {
      Identites: ['IDENTITY', 'EXISTENCE'],
      Positions: ['POSITION'],
      Statuts: ['BIOLOGICAL_STATE', 'BELIEF'],
      Capacites: ['ABILITY'],
      Affiliations: ['AFFILIATION'],
      Evenements: ['EVENT']
    };
    return (byFilter[activeFilter] || []).includes(diff.dimension);
  }

  let filteredDifferences = $derived(differences.filter((diff: any) => matchesFilter(diff)));

  function perspectiveRows(perspective: any) {
    const facts = (perspective?.knownFacts || []).filter((fact: any) => !selectedSubject || fact.subjectId === selectedSubject);
    const beliefs = (perspective?.beliefs || []).filter((belief: any) => !selectedSubject || belief.subjectId === selectedSubject);
    return [
      ...facts.map((fact: any) => ({
        type: fact.truthStatus === 'CONTESTED' ? 'croyance contestee' : 'fait',
        key: fact.predicate,
        value: formatValue(fact.value)
      })),
      ...beliefs.map((belief: any) => ({
        type: 'croyance',
        key: belief.predicate,
        value: formatValue(belief.believedValue)
      }))
    ];
  }

  let canonicalBlockedBySpoiler = $derived(
    Boolean(data.spoilerLimit && eventLabel && eventLabel.chapter.number > data.spoilerLimit)
  );
</script>

<svelte:head>
  <title>Perspective Comparison - Black Whale</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <header class="bw-panel p-5">
    <h1 class="font-condensed text-3xl tracking-wide text-[#e7ca87]">Perspective Comparison</h1>
    <p class="text-sm text-slate-300 mt-2">Meme tier, meme zoom, meme zone, meme sujet selectionne: deux verites synchronisees.</p>
    <div class="mt-3 flex flex-wrap gap-2 items-center">
      <button
        type="button"
        class="text-xs border rounded px-3 py-2"
        class:border-amber-300={compareCanonical}
        class:bg-amber-300/10={compareCanonical}
        class:border-slate-700={!compareCanonical}
        onclick={() => {
          if (canonicalBlockedBySpoiler) return;
          compareCanonical = !compareCanonical;
          syncState(true);
        }}
      >
        {compareCanonical ? 'Masquer colonne Reader truth' : 'Comparer a la realite canonique'}
      </button>
      {#if compareCanonical}
        <p class="text-xs text-amber-200/80 border border-amber-300/40 rounded px-3 py-2">
          Attention: cette comparaison revele les erreurs et illusions de la perspective selectionnee.
        </p>
      {/if}
      {#if canonicalBlockedBySpoiler}
        <p class="text-xs text-red-200 border border-red-400/40 rounded px-3 py-2">
          Vue canonique indisponible au-dela de la limite spoiler autorisee.
        </p>
      {/if}
    </div>
  </header>

  <section class="bw-panel p-4 grid lg:grid-cols-4 gap-3">
    <label class="grid gap-1 lg:col-span-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">Evenement</span>
      <select bind:value={selectedEventId} onchange={submitFetch} class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
        {#each data.events as event}
          <option value={event.id}>Ch.{event.chapter.number} - {event.title}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1 lg:col-span-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">Perspective A</span>
      <select bind:value={selectedLeft} onchange={submitFetch} class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
        {#each data.characters as char}
          <option value={char.id}>{char.canonicalName}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1 lg:col-span-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">Perspective B</span>
      <select bind:value={selectedRight} onchange={submitFetch} class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
        {#each data.characters as char}
          {#if char.id !== selectedLeft}
            <option value={char.id}>{char.canonicalName}</option>
          {/if}
        {/each}
      </select>
    </label>

    <button
      type="button"
      class="bw-panel px-4 py-3 text-sm hover:bg-slate-800 lg:col-span-1"
      onclick={() => {
        differencesOnly = !differencesOnly;
        syncState(true);
      }}
    >
      {differencesOnly ? 'Voir cartes synchronisees' : 'Mode differences seulement'}
    </button>
  </section>

  <section class="bw-panel p-4 grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
    <label class="grid gap-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">Zoom synchronise</span>
      <input type="range" min="1" max="5" step="1" bind:value={zoom} oninput={() => syncState(true)} />
    </label>

    <label class="grid gap-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">Tier synchronise</span>
      <select bind:value={tier} onchange={() => { zone = ''; syncState(true); }} class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
        {#each tiers as tierOption}
          <option value={tierOption}>{tierOption.toUpperCase()}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1 lg:col-span-2">
      <span class="text-xs uppercase tracking-wider text-slate-400">Zone synchronisee</span>
      <select bind:value={zone} onchange={() => syncState(true)} class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
        <option value="">Toutes les zones du tier</option>
        {#each zonesInTier as location}
          <option value={location.slug}>{location.name}</option>
        {/each}
      </select>
    </label>

    <p class="text-xs text-slate-400">{eventLabel ? `Ch.${eventLabel.chapter.number} / ${eventLabel.title}` : 'Evenement non selectionne'}</p>
  </section>

  {#if !differencesOnly}
    <section class={`grid grid-cols-1 ${compareCanonical ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
      <article class="bw-panel p-4">
        <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-2">Perspective A - {getCharacterName(selectedLeft)}</h2>
        <p class="text-xs text-slate-400 mb-3">Zoom {zoom} · {tier} · {zone || 'toutes zones'}</p>
        <ul class="space-y-1 max-h-48 overflow-y-auto pr-1">
          {#each entitiesInView as entity}
            <li>
              <button
                type="button"
                class="w-full text-left text-sm rounded border px-2 py-1"
                class:border-emerald-300={selectedSubject === entity.subjectId}
                class:bg-emerald-300/10={selectedSubject === entity.subjectId}
                class:border-slate-700={selectedSubject !== entity.subjectId}
                onclick={() => selectEntity(entity.subjectId)}
              >
                {entity.name} · {entity.locationName}
              </button>
            </li>
          {/each}
        </ul>

        <CompareTierMap
          title={`Perspective A · ${tier.toUpperCase()}`}
          tier={tier}
          zoom={zoom}
          focusX={focusMarker.x}
          focusY={focusMarker.y}
          {snapKey}
          markers={leftMapMarkers}
          onSelect={selectEntity}
        />

        <div class="mt-4 space-y-2">
          {#each perspectiveRows(data.leftPerspective) as row}
            <div class="text-xs border border-slate-700 rounded px-2 py-2">
              <span class="uppercase tracking-wider text-slate-400">{row.type}</span>
              <p class="text-slate-100 mt-1">{row.key}: {row.value}</p>
            </div>
          {/each}
        </div>
      </article>

      <article class="bw-panel p-4">
        <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-2">Perspective B - {getCharacterName(selectedRight)}</h2>
        <p class="text-xs text-slate-400 mb-3">Synchronisee avec A (tier/zoom/zone/sujet)</p>
        <ul class="space-y-1 max-h-48 overflow-y-auto pr-1">
          {#each entitiesInView as entity}
            <li>
              <button
                type="button"
                class="w-full text-left text-sm rounded border px-2 py-1"
                class:border-emerald-300={selectedSubject === entity.subjectId}
                class:bg-emerald-300/10={selectedSubject === entity.subjectId}
                class:border-slate-700={selectedSubject !== entity.subjectId}
                onclick={() => selectEntity(entity.subjectId)}
              >
                {entity.name} · {entity.locationName}
              </button>
            </li>
          {/each}
        </ul>

        <CompareTierMap
          title={`Perspective B · ${tier.toUpperCase()}`}
          tier={tier}
          zoom={zoom}
          focusX={focusMarker.x}
          focusY={focusMarker.y}
          {snapKey}
          markers={rightMapMarkers}
          onSelect={selectEntity}
        />

        <div class="mt-4 space-y-2">
          {#each perspectiveRows(data.rightPerspective) as row}
            <div class="text-xs border border-slate-700 rounded px-2 py-2">
              <span class="uppercase tracking-wider text-slate-400">{row.type}</span>
              <p class="text-slate-100 mt-1">{row.key}: {row.value}</p>
            </div>
          {/each}
        </div>
      </article>

      {#if compareCanonical}
        <article class="bw-panel p-4">
          <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-2">Reader truth - Realite canonique</h2>
          <p class="text-xs text-slate-400 mb-3">Contrainte spoiler: chapitre {data.spoilerLimit ?? 'illimite'}</p>

          <CompareTierMap
            title={`Reader truth · ${tier.toUpperCase()}`}
            tier={tier}
            zoom={zoom}
            focusX={focusMarker.x}
            focusY={focusMarker.y}
            {snapKey}
            markers={readerMapMarkers}
            onSelect={selectEntity}
          />

          <div class="mt-4 space-y-2">
            {#each canonicalRows as row}
              <div class="text-xs border border-slate-700 rounded px-2 py-2">
                <span class="uppercase tracking-wider text-slate-400">{row.type}</span>
                <p class="text-slate-100 mt-1">{row.key}: {row.value}</p>
              </div>
            {/each}
            {#if canonicalRows.length === 0}
              <p class="text-xs text-slate-400">Aucune information canonique specifique pour ce sujet a cet instant.</p>
            {/if}
          </div>
        </article>
      {/if}
    </section>
  {/if}

  {#if differencesOnly}
    <section class="bw-panel p-4 md:hidden">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">Differences seulement (mobile)</h2>
      <div class="space-y-2">
        {#each filteredDifferences as diff}
          <article class="border border-slate-700 rounded p-3">
            <p class="text-xs uppercase tracking-wider text-slate-400">{diff.dimension}</p>
            <p class="text-sm text-slate-100 mt-1">{diff.subjectId}</p>
            <p class="text-xs text-slate-300 mt-2">{getCharacterName(selectedLeft)}: {formatValue(diff.leftValue)}</p>
            <p class="text-xs text-slate-300">{getCharacterName(selectedRight)}: {formatValue(diff.rightValue)}</p>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  <section class="bw-panel p-4" class:hidden={differencesOnly && filteredDifferences.length > 0}>
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
      {#each filteredDifferences as diff}
        <PerspectiveDifference
          title={`${diff.subjectId} · ${diff.dimension}`}
          leftLabel={getCharacterName(selectedLeft)}
          leftValue={formatValue(diff.leftValue)}
          rightLabel={getCharacterName(selectedRight)}
          rightValue={formatValue(diff.rightValue)}
          code={pickCode(diff)}
        />
      {/each}

      {#if filteredDifferences.length === 0}
        <p class="text-sm text-slate-400">Aucune difference sur ce filtre.</p>
      {/if}
    </div>
  </section>
</div>
