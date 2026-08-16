<script lang="ts">
  import { untrack } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'
  import PerspectiveDifference from '$lib/components/perspective/PerspectiveDifference.svelte'
  import CompareTierMap from '$lib/components/perspective/CompareTierMap.svelte'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { displayName, eventTitle } from '$lib/utils/displayNames'
  import { link, locale, t } from '$lib/i18n'

  let { data }: { data: PageData } = $props()
  type WorldState = NonNullable<PageData['worldState']>
  type Location = WorldState['locations'][number]
  type Difference = PageData['comparison'][number]
  type Perspective = NonNullable<PageData['leftPerspective']>
  interface MapMarker {
    id: string
    bodyId: string
    subjectId: string
    name: string
    tier: string | null
    zone: string
    x: number
    y: number
    certainty: string
  }

  let selectedEventId = $state(untrack(() => data.selectedEventId || ''))
  let selectedLeft = $state(untrack(() => data.selectedLeft || ''))
  let selectedRight = $state(untrack(() => data.selectedRight || ''))
  let compareCanonical = $state(untrack(() => Boolean(data.compareCanonical)))
  let differencesOnly = $state(Boolean($page.url.searchParams.get('diffOnly') === '1'))
  let zoom = $state(untrack(() => data.sync.zoom || 1))
  let tier = $state(untrack(() => data.sync.tier || 'tier-1'))
  let zone = $state(untrack(() => data.sync.zone || ''))
  let selectedSubject = $state(untrack(() => data.sync.subject || ''))
  let snapKey = $state(0)
  let lastSnapSubject = $state('')

  const tiers = ['tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5']
  // The id drives the dimension lookup; only the label is translated.
  let filters = $derived([
    { id: 'all', label: $t.compare.filters.all },
    { id: 'identities', label: $t.compare.filters.identities },
    { id: 'positions', label: $t.compare.filters.positions },
    { id: 'statuses', label: $t.compare.filters.statuses },
    { id: 'abilities', label: $t.compare.filters.abilities },
    { id: 'affiliations', label: $t.compare.filters.affiliations },
    { id: 'events', label: $t.compare.filters.events },
  ])
  let activeFilter = $state('all')

  let locations = $derived(data.worldState?.locations || [])
  let presences = $derived(data.worldState?.presences || [])
  let bodies = $derived(data.worldState?.bodies || [])
  let characters = $derived(data.worldState?.characters || [])
  let differences = $derived(data.comparison || [])
  let canonicalTruth = $derived(data.canonicalTruth || { facts: [], positions: {} })

  let eventLabel = $derived(data.events.find((event) => event.id === selectedEventId))

  const locationCoordinates: Record<string, Record<string, { x: number; y: number }>> = {
    'tier-1': {
      'king-quarters': { x: 475, y: 160 },
      'princes-burial-chamber': { x: 475, y: 110 },
      'banquet-hall': { x: 475, y: 260 },
      'vvip-living-quarters': { x: 290, y: 380 },
      'queens-living-quarters': { x: 290, y: 470 },
      'soldiers-living-quarters': { x: 290, y: 530 },
      casino: { x: 400, y: 400 },
      cineplex: { x: 600, y: 350 },
      'central-dining-hall': { x: 600, y: 450 },
      'observation-deck': { x: 700, y: 200 },
      'royal-army-office': { x: 700, y: 400 },
      'general-cabins': { x: 700, y: 500 },
      'central-police-station': { x: 500, y: 500 },
      'central-courthouse': { x: 500, y: 450 },
      'heilly-processing': { x: 350, y: 500 },
    },
    'tier-2': {
      'vip-guest-rooms': { x: 300, y: 200 },
      'entertainment-district': { x: 500, y: 250 },
      'shopping-arcade': { x: 700, y: 200 },
      'restaurant-row': { x: 500, y: 350 },
      'military-barracks': { x: 200, y: 400 },
      'security-center': { x: 400, y: 450 },
      'detention-facility': { x: 200, y: 500 },
    },
    'tier-3': {
      'medical-district': { x: 300, y: 250 },
      'tier-3-medical-district': { x: 300, y: 250 },
      'research-labs': { x: 500, y: 200 },
      'processing-plants': { x: 700, y: 200 },
      'waste-management': { x: 200, y: 400 },
      'power-station': { x: 400, y: 400 },
      'water-treatment': { x: 600, y: 400 },
      'storage-warehouses': { x: 500, y: 500 },
    },
    'tier-4': {
      'crew-quarters': { x: 250, y: 150 },
      'maintenance-bays': { x: 450, y: 200 },
      'cargo-holds': { x: 700, y: 250 },
      'engineering-section': { x: 400, y: 350 },
      'propulsion-systems': { x: 600, y: 350 },
      'life-support': { x: 300, y: 450 },
      'navigation-center': { x: 500, y: 450 },
      'communication-hub': { x: 700, y: 450 },
    },
    'tier-5': {
      'lower-decks': { x: 300, y: 200 },
      'storage-tanks': { x: 500, y: 150 },
      'waste-holding': { x: 200, y: 300 },
      'recycling-facility': { x: 400, y: 300 },
      'emergency-generators': { x: 600, y: 300 },
      'structural-support': { x: 300, y: 400 },
      'ballast-tanks': { x: 500, y: 400 },
      'docking-bays': { x: 700, y: 400 },
    },
  }

  function hashToUnit(input: string) {
    let hash = 0
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash % 1000) / 1000
  }

  let entitiesInView = $derived.by(() => {
    const byLocation = new Map<string, Location>(
      locations.map((location) => [location.id, location]),
    )

    function resolveTier(location: Location) {
      let current: Location | null | undefined = location
      let depth = 0
      while (current && depth < 8) {
        if (current.type === 'TIER') return current.slug
        current = current.parentLocationId ? byLocation.get(current.parentLocationId) : null
        depth += 1
      }
      return null
    }

    return presences
      .map((presence) => {
        const body = bodies.find((item) => item.id === presence.entityId)
        const owner = body ? characters.find((item) => item.id === body.originalCharacterId) : null
        const location = presence.locationId ? byLocation.get(presence.locationId) : undefined
        return {
          id: presence.entityId,
          subjectId: owner?.id || body?.id || presence.entityId,
          name: displayName(owner?.canonicalName || body?.label, $locale) || presence.entityId,
          locationName: location?.name || $t.compare.unknownLocation,
          tier: location ? resolveTier(location) : null,
          zone: location?.slug || '',
        }
      })
      .filter((item) => (!tier || item.tier === tier) && (!zone || item.zone === zone))
  })

  let zonesInTier = $derived(
    locations.filter((location) => location.slug?.startsWith(tier) && location.type !== 'TIER'),
  )

  let baseMarkers = $derived.by(() => {
    const byLocation = new Map<string, Location>(
      locations.map((location) => [location.id, location]),
    )

    function resolveTier(location: Location) {
      let current: Location | null | undefined = location
      let depth = 0
      while (current && depth < 8) {
        if (current.type === 'TIER') return current.slug
        current = current.parentLocationId ? byLocation.get(current.parentLocationId) : null
        depth += 1
      }
      return null
    }

    return presences.map((presence): MapMarker => {
      const body = bodies.find((item) => item.id === presence.entityId)
      const owner = body ? characters.find((item) => item.id === body.originalCharacterId) : null
      const location = presence.locationId ? byLocation.get(presence.locationId) : undefined
      const markerTier = location ? resolveTier(location) : null

      let x = 500
      let y = 300
      if (location && markerTier && locationCoordinates[markerTier]?.[location.slug]) {
        const coords = locationCoordinates[markerTier][location.slug]
        x = coords.x
        y = coords.y
      } else {
        const base = hashToUnit(presence.entityId || 'unknown')
        x = 220 + base * 560
        y = 160 + (1 - base) * 280
      }

      return {
        id: presence.entityId,
        bodyId: body?.id || presence.entityId,
        subjectId: owner?.id || body?.id || presence.entityId,
        name: displayName(owner?.canonicalName || body?.label, $locale) || presence.entityId,
        tier: markerTier,
        zone: location?.slug || '',
        x,
        y,
        certainty: presence.certainty || 'UNKNOWN',
      }
    })
  })

  let scopedMarkers = $derived(
    baseMarkers.filter((marker) => marker.tier === tier && (!zone || marker.zone === zone)),
  )

  function codeWeight(code: '=' | '←' | '→' | '≠' | '~' | '⏱') {
    if (code === '≠') return 5
    if (code === '⏱') return 4
    if (code === '←' || code === '→') return 3
    if (code === '~') return 2
    return 1
  }

  function differenceCode(diff: Difference): '=' | '←' | '→' | '≠' | '~' | '⏱' {
    if (diff.dimension === 'EVENT') return '⏱'
    return pickCode(diff)
  }

  let subjectCodeMap = $derived.by(() => {
    // Local lookup built and consumed inside this function.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const map = new Map<string, '=' | '←' | '→' | '≠' | '~' | '⏱'>()

    for (const diff of differences) {
      const subjectId = diff.subjectId
      if (!subjectId) continue

      const code = differenceCode(diff)
      const existing = map.get(subjectId) || '='

      if (codeWeight(code) > codeWeight(existing)) {
        map.set(subjectId, code)
      }
    }

    return map
  })

  function markerLabel(
    marker: MapMarker,
    perspective: Perspective | null,
    mode: 'left' | 'right' | 'reader',
  ) {
    if (mode === 'reader') return marker.name
    if (!perspective) return marker.name

    const observerId = perspective.observer?.characterId
    if (observerId && marker.subjectId === observerId) return marker.name

    const facts = (perspective.knownFacts || []).filter(
      (fact) => fact.subjectId === marker.subjectId || fact.subjectId === marker.bodyId,
    )
    const beliefs = (perspective.beliefs || []).filter(
      (belief) => belief.subjectId === marker.subjectId || belief.subjectId === marker.bodyId,
    )

    if (facts.length > 0) return marker.name
    if (beliefs.length > 0) return $t.compare.assumedIdentity
    return $t.compare.unknownIndividual
  }

  let leftMapMarkers = $derived(
    scopedMarkers.map((marker) => ({
      ...marker,
      label: markerLabel(marker, data.leftPerspective, 'left'),
      code: subjectCodeMap.get(marker.subjectId) || '=',
      selected: marker.subjectId === selectedSubject,
    })),
  )

  let rightMapMarkers = $derived(
    scopedMarkers.map((marker) => ({
      ...marker,
      label: markerLabel(marker, data.rightPerspective, 'right'),
      code: subjectCodeMap.get(marker.subjectId) || '=',
      selected: marker.subjectId === selectedSubject,
    })),
  )

  let readerMapMarkers = $derived(
    scopedMarkers.map((marker) => ({
      ...marker,
      label: markerLabel(marker, null, 'reader'),
      code: subjectCodeMap.get(marker.subjectId) || '=',
      selected: marker.subjectId === selectedSubject,
    })),
  )

  let focusMarker = $derived(
    scopedMarkers.find((marker) => marker.subjectId === selectedSubject) ||
      scopedMarkers[0] || { x: 500, y: 300 },
  )

  let canonicalRows = $derived.by(() => {
    if (!compareCanonical) return []
    const facts = (canonicalTruth.facts || []).filter((fact) => fact.subjectId === selectedSubject)
    const objectivePosition = canonicalTruth.positions?.[selectedSubject]
    const rows = facts.map((fact) => ({
      type: $t.compare.rowTypes.canonicalFact,
      key: fact.predicate,
      value: formatValue(fact.value),
    }))

    if (objectivePosition) {
      rows.unshift({
        type: $t.compare.rowTypes.actualPosition,
        key: 'locationId',
        value: objectivePosition.locationId || $t.compare.unknownValue,
      })
    }

    return rows
  })

  $effect(() => {
    if (!selectedSubject && entitiesInView.length > 0) {
      selectedSubject = entitiesInView[0].subjectId
    }
  })

  $effect(() => {
    if (!selectedSubject || selectedSubject === lastSnapSubject) return
    lastSnapSubject = selectedSubject
    snapKey += 1
  })

  function getCharacterName(id: string) {
    return (
      displayName(
        data.characters.find((character) => character.id === id)?.canonicalName,
        $locale,
      ) || id
    )
  }

  function buildUrl() {
    const url = new URL($page.url)
    if (selectedEventId) url.searchParams.set('eventId', selectedEventId)
    if (selectedLeft) url.searchParams.set('left', selectedLeft)
    if (selectedRight) url.searchParams.set('right', selectedRight)
    url.searchParams.set('zoom', String(zoom))
    url.searchParams.set('tier', tier)
    if (zone) url.searchParams.set('zone', zone)
    else url.searchParams.delete('zone')
    if (selectedSubject) url.searchParams.set('subject', selectedSubject)
    else url.searchParams.delete('subject')
    if (compareCanonical) url.searchParams.set('canonical', '1')
    else url.searchParams.delete('canonical')
    if (differencesOnly) url.searchParams.set('diffOnly', '1')
    else url.searchParams.delete('diffOnly')
    return url
  }

  function submitFetch() {
    goto(buildUrl().toString(), { keepFocus: true })
  }

  function syncState(replaceState = true) {
    goto(buildUrl().toString(), { keepFocus: true, replaceState })
  }

  function selectEntity(subjectId: string) {
    selectedSubject = subjectId
    syncState(true)
  }

  function pickCode(diff: Difference): '=' | '←' | '→' | '≠' | '~' | '⏱' {
    if (diff.differenceType === 'LEFT_ONLY') return '←'
    if (diff.differenceType === 'RIGHT_ONLY') return '→'
    if (diff.differenceType === 'CONTRADICTION') return '≠'
    if (diff.differenceType === 'CONFIDENCE_GAP') return '~'
    return '='
  }

  function formatValue(value: unknown) {
    if (value === undefined || value === null) return $t.compare.unknownValue
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }

  function matchesFilter(diff: Difference) {
    if (activeFilter === 'all') return true
    const byFilter: Record<string, string[]> = {
      identities: ['IDENTITY', 'EXISTENCE'],
      positions: ['POSITION'],
      statuses: ['BIOLOGICAL_STATE', 'BELIEF'],
      abilities: ['ABILITY'],
      affiliations: ['AFFILIATION'],
      events: ['EVENT'],
    }
    return (byFilter[activeFilter] || []).includes(diff.dimension)
  }

  let filteredDifferences = $derived(differences.filter((diff) => matchesFilter(diff)))

  function perspectiveRows(perspective: Perspective | null) {
    const facts = (perspective?.knownFacts || []).filter(
      (fact) => !selectedSubject || fact.subjectId === selectedSubject,
    )
    const beliefs = (perspective?.beliefs || []).filter(
      (belief) => !selectedSubject || belief.subjectId === selectedSubject,
    )
    return [
      ...facts.map((fact) => ({
        type:
          fact.truthStatus === 'CONTESTED'
            ? $t.compare.rowTypes.contestedBelief
            : $t.compare.rowTypes.fact,
        key: fact.predicate,
        value: formatValue(fact.value),
      })),
      ...beliefs.map((belief) => ({
        type: $t.compare.rowTypes.belief,
        key: belief.predicate,
        value: formatValue(belief.believedValue),
      })),
    ]
  }

  let canonicalBlockedBySpoiler = $derived(
    Boolean(data.spoilerLimit && eventLabel && eventLabel.chapter.number > data.spoilerLimit),
  )
</script>

<Seo
  title={$t.compare.seoTitle}
  description={$t.compare.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.compare.breadcrumb, path: $link('/compare') },
  ])}
/>

<div class="compare-page">
  <header class="compare-hero">
    <div class="hero-copy">
      <p class="eyebrow">{$t.compare.eyebrow}</p>
      <h1>{$t.compare.titleLine1}<br />{$t.compare.titleLine2}</h1>
      <p>{$t.compare.intro}</p>
    </div>
    <dl class="hero-metrics">
      <div>
        <dt>{$t.compare.activeEvent}</dt>
        <dd>{$t.characterDetail.chapterUpper(eventLabel?.chapter.number ?? '—')}</dd>
      </div>
      <div>
        <dt>{$t.compare.detectedGaps}</dt>
        <dd>{differences.length}</dd>
      </div>
      <div>
        <dt>{$t.compare.subjectsInView}</dt>
        <dd>{entitiesInView.length}</dd>
      </div>
    </dl>
    <div class="truth-control">
      <button
        type="button"
        class:active={compareCanonical}
        onclick={() => {
          if (canonicalBlockedBySpoiler) return
          compareCanonical = !compareCanonical
          syncState(true)
        }}
      >
        {compareCanonical ? $t.compare.hideCanonical : $t.compare.showCanonical}
      </button>
      {#if compareCanonical}
        <p class="text-xs text-amber-200/80 border border-amber-300/40 rounded px-3 py-2">
          {$t.compare.canonicalWarning}
        </p>
      {/if}
      {#if canonicalBlockedBySpoiler}
        <p class="text-xs text-red-200 border border-red-400/40 rounded px-3 py-2">
          {$t.compare.canonicalBlocked}
        </p>
      {/if}
      <nav aria-label={$t.compare.relatedViews}>
        <a href={$link('/perspectives')}>{$t.compare.perspectiveSetup}</a><a href={$link('/ship')}
          >{$t.compare.returnToMap}</a
        >
      </nav>
    </div>
  </header>

  <section class="control-panel primary-controls">
    <label class="grid gap-1 lg:col-span-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">{$t.compare.event}</span>
      <select
        bind:value={selectedEventId}
        onchange={submitFetch}
        class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
      >
        {#each data.events as event (event.id)}
          <option value={event.id}
            >{$t.compare.eventOption(
              event.chapter.number,
              eventTitle(event.title, $locale),
            )}</option
          >
        {/each}
      </select>
    </label>

    <label class="grid gap-1 lg:col-span-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">{$t.compare.perspectiveA}</span>
      <select
        bind:value={selectedLeft}
        onchange={submitFetch}
        class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
      >
        {#each data.characters as char (char.id)}
          <option value={char.id}>{displayName(char.canonicalName, $locale)}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1 lg:col-span-1">
      <span class="text-xs uppercase tracking-wider text-slate-400">{$t.compare.perspectiveB}</span>
      <select
        bind:value={selectedRight}
        onchange={submitFetch}
        class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
      >
        {#each data.characters as char (char.id)}
          {#if char.id !== selectedLeft}
            <option value={char.id}>{displayName(char.canonicalName, $locale)}</option>
          {/if}
        {/each}
      </select>
    </label>

    <button
      type="button"
      class="bw-panel px-4 py-3 text-sm hover:bg-slate-800 lg:col-span-1"
      onclick={() => {
        differencesOnly = !differencesOnly
        syncState(true)
      }}
    >
      {differencesOnly ? $t.compare.viewSynchronized : $t.compare.differencesOnly}
    </button>
  </section>

  <section class="control-panel sync-controls">
    <label class="grid gap-1">
      <span class="text-xs uppercase tracking-wider text-slate-400"
        >{$t.compare.synchronizedZoom}</span
      >
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        bind:value={zoom}
        oninput={() => syncState(true)}
      />
    </label>

    <label class="grid gap-1">
      <span class="text-xs uppercase tracking-wider text-slate-400"
        >{$t.compare.synchronizedTier}</span
      >
      <select
        bind:value={tier}
        onchange={() => {
          zone = ''
          syncState(true)
        }}
        class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
      >
        {#each tiers as tierOption (tierOption)}
          <option value={tierOption}>{tierOption.toUpperCase()}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1 lg:col-span-2">
      <span class="text-xs uppercase tracking-wider text-slate-400"
        >{$t.compare.synchronizedZone}</span
      >
      <select
        bind:value={zone}
        onchange={() => syncState(true)}
        class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
      >
        <option value="">{$t.compare.allZonesInTier}</option>
        {#each zonesInTier as location (location.id)}
          <option value={location.slug}>{location.name}</option>
        {/each}
      </select>
    </label>

    <p class="event-readout">
      {eventLabel
        ? $t.compare.eventReadout(eventLabel.chapter.number, eventTitle(eventLabel.title, $locale))
        : $t.compare.noEventSelected}
    </p>
  </section>

  <div class="comparison-title" aria-label={$t.compare.activeComparison}>
    <div><span>A</span><strong>{getCharacterName(selectedLeft)}</strong></div>
    <i>{$t.compare.versus}</i>
    <div><span>B</span><strong>{getCharacterName(selectedRight)}</strong></div>
  </div>

  {#if !differencesOnly}
    <section class={`comparison-grid ${compareCanonical ? 'with-canon' : ''}`}>
      <article class="comparison-column side-a">
        <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-2">
          {$t.compare.columnA(getCharacterName(selectedLeft))}
        </h2>
        <p class="text-xs text-slate-400 mb-3">
          {$t.compare.scopeReadout(zoom, tier, zone || $t.compare.allZones)}
        </p>
        <ul class="space-y-1 max-h-48 overflow-y-auto pr-1">
          {#each entitiesInView as entity (entity.id)}
            <li>
              <button
                type="button"
                class={`w-full text-left text-sm rounded border px-2 py-1 ${selectedSubject === entity.subjectId ? 'border-emerald-300 bg-emerald-300/10' : 'border-slate-700'}`}
                onclick={() => selectEntity(entity.subjectId)}
              >
                {entity.name} · {entity.locationName}
              </button>
            </li>
          {/each}
        </ul>

        <CompareTierMap
          title={$t.compare.mapTitleA(tier.toUpperCase())}
          {tier}
          {zoom}
          focusX={focusMarker.x}
          focusY={focusMarker.y}
          {snapKey}
          markers={leftMapMarkers}
          onSelect={selectEntity}
        />

        <div class="mt-4 space-y-2">
          {#each perspectiveRows(data.leftPerspective) as row, rowIndex (rowIndex)}
            <div class="text-xs border border-slate-700 rounded px-2 py-2">
              <span class="uppercase tracking-wider text-slate-400">{row.type}</span>
              <p class="text-slate-100 mt-1">{row.key}: {row.value}</p>
            </div>
          {/each}
        </div>
      </article>

      <article class="comparison-column side-b">
        <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-2">
          {$t.compare.columnB(getCharacterName(selectedRight))}
        </h2>
        <p class="text-xs text-slate-400 mb-3">{$t.compare.syncedWithA}</p>
        <ul class="space-y-1 max-h-48 overflow-y-auto pr-1">
          {#each entitiesInView as entity (entity.id)}
            <li>
              <button
                type="button"
                class={`w-full text-left text-sm rounded border px-2 py-1 ${selectedSubject === entity.subjectId ? 'border-emerald-300 bg-emerald-300/10' : 'border-slate-700'}`}
                onclick={() => selectEntity(entity.subjectId)}
              >
                {entity.name} · {entity.locationName}
              </button>
            </li>
          {/each}
        </ul>

        <CompareTierMap
          title={$t.compare.mapTitleB(tier.toUpperCase())}
          {tier}
          {zoom}
          focusX={focusMarker.x}
          focusY={focusMarker.y}
          {snapKey}
          markers={rightMapMarkers}
          onSelect={selectEntity}
        />

        <div class="mt-4 space-y-2">
          {#each perspectiveRows(data.rightPerspective) as row, rowIndex (rowIndex)}
            <div class="text-xs border border-slate-700 rounded px-2 py-2">
              <span class="uppercase tracking-wider text-slate-400">{row.type}</span>
              <p class="text-slate-100 mt-1">{row.key}: {row.value}</p>
            </div>
          {/each}
        </div>
      </article>

      {#if compareCanonical}
        <article class="comparison-column canonical-column">
          <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-2">
            {$t.compare.readerTruthTitle}
          </h2>
          <p class="text-xs text-slate-400 mb-3">
            {$t.compare.spoilerLimit(data.spoilerLimit ?? $t.compare.unlimited)}
          </p>

          <CompareTierMap
            title={$t.compare.mapTitleReader(tier.toUpperCase())}
            {tier}
            {zoom}
            focusX={focusMarker.x}
            focusY={focusMarker.y}
            {snapKey}
            markers={readerMapMarkers}
            onSelect={selectEntity}
          />

          <div class="mt-4 space-y-2">
            {#each canonicalRows as row, rowIndex (rowIndex)}
              <div class="text-xs border border-slate-700 rounded px-2 py-2">
                <span class="uppercase tracking-wider text-slate-400">{row.type}</span>
                <p class="text-slate-100 mt-1">{row.key}: {row.value}</p>
              </div>
            {/each}
            {#if canonicalRows.length === 0}
              <p class="text-xs text-slate-400">{$t.compare.noCanonicalInfo}</p>
            {/if}
          </div>
        </article>
      {/if}
    </section>
  {/if}

  {#if differencesOnly}
    <section class="difference-mobile md:hidden">
      <h2 class="text-sm uppercase tracking-widest text-slate-400 mb-3">
        {$t.compare.differencesMobile}
      </h2>
      <div class="space-y-2">
        {#each filteredDifferences as diff, diffIndex (diffIndex)}
          <article class="border border-slate-700 rounded p-3">
            <p class="text-xs uppercase tracking-wider text-slate-400">{diff.dimension}</p>
            <p class="text-sm text-slate-100 mt-1">{diff.subjectId}</p>
            <p class="text-xs text-slate-300 mt-2">
              {getCharacterName(selectedLeft)}: {formatValue(diff.leftValue)}
            </p>
            <p class="text-xs text-slate-300">
              {getCharacterName(selectedRight)}: {formatValue(diff.rightValue)}
            </p>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  <section
    class="difference-panel"
    class:hidden={differencesOnly && filteredDifferences.length > 0}
  >
    <div class="flex flex-wrap gap-2 mb-4">
      {#each filters as filter (filter.id)}
        <button
          type="button"
          class={`px-3 py-1 text-xs border rounded ${activeFilter === filter.id ? 'border-emerald-300 bg-emerald-300/10' : 'border-slate-700'}`}
          onclick={() => (activeFilter = filter.id)}
        >
          {filter.label}
        </button>
      {/each}
    </div>

    <div class="grid gap-3">
      {#each filteredDifferences as diff, diffIndex (diffIndex)}
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
        <p class="text-sm text-slate-400">{$t.compare.noDifferencesForFilter}</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .compare-page {
    max-width: 100rem;
    margin: auto;
    padding: clamp(2rem, 5vw, 5rem) var(--page-gutter) 7rem;
  }
  .compare-hero {
    display: grid;
    grid-template-columns: 1fr auto minmax(15rem, 0.4fr);
    align-items: end;
    gap: clamp(2rem, 5vw, 5rem);
    margin-bottom: 2.5rem;
  }
  .hero-copy h1 {
    margin: 0.7rem 0 1rem;
    font-size: clamp(4rem, 8vw, 7.5rem);
    font-weight: 500;
    letter-spacing: -0.06em;
    line-height: 0.72;
    text-transform: uppercase;
  }
  .hero-copy > p:last-child {
    max-width: 42rem;
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.7;
  }
  .hero-metrics {
    display: flex;
    margin: 0;
    border: 1px solid var(--line-default);
    border-radius: 0.55rem;
  }
  .hero-metrics div {
    min-width: 7rem;
    padding: 0.8rem;
    border-right: 1px solid var(--line-subtle);
  }
  .hero-metrics div:last-child {
    border: 0;
  }
  .hero-metrics dt {
    color: var(--text-faint);
    font: 0.46rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .hero-metrics dd {
    margin: 0.35rem 0 0;
    color: var(--accent-gold-bright);
    font: 500 1.2rem/1 var(--font-display);
  }
  .truth-control {
    display: grid;
    gap: 0.6rem;
  }
  .truth-control button {
    padding: 0.8rem 1rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.4rem;
    background: rgba(200, 169, 86, 0.07);
    color: var(--accent-gold-bright);
    font-size: 0.65rem;
    cursor: pointer;
  }
  .truth-control button.active {
    background: var(--accent-gold);
    color: var(--surface-void);
  }
  .truth-control p {
    margin: 0 !important;
    padding: 0.65rem !important;
    border-radius: 0.35rem;
    font-size: 0.58rem !important;
    line-height: 1.45;
  }
  .truth-control nav {
    display: flex;
    gap: 0.8rem;
  }
  .truth-control nav a {
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--line-default);
    color: var(--text-muted);
    font-size: 0.52rem;
    text-decoration: none;
    text-transform: uppercase;
  }
  .truth-control nav a:hover {
    border-color: var(--accent-gold);
    color: var(--accent-gold-bright);
  }
  .control-panel {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.7rem;
    padding: 0.75rem;
    border: 1px solid var(--line-default);
    border-radius: 0.65rem;
    background: rgba(11, 18, 24, 0.84);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  }
  .primary-controls {
    grid-template-columns: repeat(4, 1fr);
  }
  .sync-controls {
    grid-template-columns: 1fr 1fr 2fr 1fr;
    align-items: end;
  }
  .control-panel label {
    display: grid;
    gap: 0.4rem;
  }
  .control-panel label > span {
    color: var(--text-faint) !important;
    font: 0.48rem/1 var(--font-mono) !important;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .control-panel select {
    min-width: 0;
    border: 1px solid var(--line-default) !important;
    border-radius: 0.35rem !important;
    background: #091117 !important;
    color: var(--text-primary) !important;
    font-size: 0.66rem !important;
  }
  .control-panel > button {
    border: 1px solid var(--line-default) !important;
    border-radius: 0.35rem !important;
    background: #101a21 !important;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .control-panel > button:hover {
    border-color: var(--line-strong) !important;
    color: var(--accent-gold-bright);
  }
  .event-readout {
    overflow: hidden;
    margin: 0;
    padding: 0.7rem;
    color: var(--text-muted);
    font: 0.52rem/1.35 var(--font-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .comparison-title {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1.5rem;
    margin: 2.5rem 0 1rem;
  }
  .comparison-title > div {
    display: grid;
    grid-template-columns: 2rem 1fr;
    align-items: center;
    gap: 0.8rem;
    padding: 0.85rem 1rem;
    border-block: 1px solid var(--line-default);
  }
  .comparison-title > div:last-child {
    text-align: right;
  }
  .comparison-title span {
    display: grid;
    width: 1.8rem;
    height: 1.8rem;
    place-items: center;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    color: var(--accent-gold);
    font: 0.55rem/1 var(--font-mono);
  }
  .comparison-title > div:last-child span {
    grid-column: 2;
  }
  .comparison-title > div:last-child strong {
    grid-column: 1;
    grid-row: 1;
  }
  .comparison-title strong {
    font: 500 1.15rem/1 var(--font-display);
  }
  .comparison-title i {
    color: var(--text-faint);
    font: normal 0.48rem/1 var(--font-mono);
    letter-spacing: 0.12em;
  }
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }
  .comparison-grid.with-canon {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .comparison-column {
    min-width: 0;
    padding: 1rem;
    border: 1px solid var(--line-default);
    border-radius: 0.6rem;
    background: linear-gradient(150deg, rgba(17, 28, 35, 0.94), rgba(8, 14, 18, 0.94));
  }
  .comparison-column.side-a {
    box-shadow: inset 2px 0 #5bb9ad;
  }
  .comparison-column.side-b {
    box-shadow: inset -2px 0 #ad8bea;
  }
  .canonical-column {
    border-color: rgba(200, 169, 86, 0.35);
    box-shadow: inset 0 2px var(--accent-gold);
  }
  .comparison-column h2 {
    color: var(--text-secondary) !important;
    font: 0.52rem/1 var(--font-mono) !important;
  }
  .difference-panel,
  .difference-mobile {
    margin-top: 0.8rem;
    padding: 1rem;
    border: 1px solid var(--line-default);
    border-radius: 0.6rem;
    background: rgba(11, 18, 24, 0.84);
  }
  .difference-panel > div:first-child button {
    border-color: var(--line-default) !important;
    border-radius: 999px !important;
    color: var(--text-muted);
  }
  .difference-panel > div:first-child button:hover {
    color: var(--text-primary);
  }
  @media (max-width: 1100px) {
    .compare-hero {
      grid-template-columns: 1fr 1fr;
    }
    .truth-control {
      grid-column: 1/-1;
    }
    .comparison-grid.with-canon {
      grid-template-columns: 1fr 1fr;
    }
    .canonical-column {
      grid-column: 1/-1;
    }
    .sync-controls {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 760px) {
    .compare-page {
      padding-inline: 1rem;
    }
    .compare-hero {
      grid-template-columns: 1fr;
    }
    .hero-metrics {
      width: 100%;
      overflow-x: auto;
    }
    .hero-metrics div {
      min-width: 0;
      flex: 1;
    }
    .primary-controls,
    .sync-controls {
      grid-template-columns: 1fr;
    }
    .comparison-title {
      grid-template-columns: 1fr;
      gap: 0.45rem;
    }
    .comparison-title i {
      text-align: center;
    }
    .comparison-grid,
    .comparison-grid.with-canon {
      grid-template-columns: 1fr;
    }
    .canonical-column {
      grid-column: auto;
    }
  }
</style>
