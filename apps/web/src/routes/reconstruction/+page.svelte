<script lang="ts">
  /* eslint-disable max-lines -- The route keeps its state machine, three coordinated panes and responsive shell together. */
  import type { PageData } from './$types'
  import { onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { createEmptyWorld, reduceWorld } from '@black-whale/canon-engine'
  import type { StoryCursor, WorldEvent } from '@black-whale/canon-engine'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import ReconstructionOverview from '$lib/components/reconstruction/ReconstructionOverview.svelte'
  import { activeHatsu, hatsuPanelOpen } from '$lib/nen/hatsuState'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { floorOf, spaceForLocation, theShip } from '$lib/tour/blueprint'
  import { AVATAR, flashFor, type Apparition, type TourFlash } from '$lib/tour/apparitions'
  import { EMPTY_WORLD, centroid, type TourReport, type TourWorld } from '$lib/tour/hatsu'
  import { TourHatsuView } from '$lib/tour/pageHatsuView.svelte'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import { TourCastController } from '$lib/tour/pageCastController'
  import type { CastHand } from '$lib/tour/pageCasting'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { displayName } from '$lib/utils/displayNames'
  import { claimLevel, evidenceForEvent } from '$lib/reconstruction/evidence'
  import { visibleInPerspective, type PerspectiveProjection } from '$lib/reconstruction/perspective'
  import { readReconstructionUrl, writeReconstructionUrl } from '$lib/reconstruction/urlState'
  import type { Space, Vec2 } from '$lib/tour/types'

  let { data }: { data: PageData } = $props()
  const ship = theShip()

  const chronologicalEvents = $derived(
    data.chapters
      .flatMap((chapter) => chapter.events.map((event) => ({ event, chapter })))
      .sort(
        (a, b) =>
          (a.event.ordinal ?? Number.MAX_SAFE_INTEGER) -
            (b.event.ordinal ?? Number.MAX_SAFE_INTEGER) ||
          a.chapter.number - b.chapter.number ||
          a.event.sequence - b.event.sequence,
      ),
  )

  const engineEvents = $derived(
    data.worldEvents.map((record) => ({
      id: record.id,
      type: record.type,
      schemaVersion: record.schemaVersion,
      branchId: record.branchId,
      cursor: {
        branchId: record.branchId,
        ordinal: record.ordinal,
        chapterNumber: record.chapterNumber,
        localSequence: record.localSequence,
        eventId: record.id,
      },
      payload: record.payload,
      sourceIds: record.sourceIds,
      revealedAtChapter: record.revealedAtChapter ?? undefined,
    })) as unknown as WorldEvent[],
  )

  let currentIndex = $state(0)
  let isPlaying = $state(false)
  let playbackInterval: ReturnType<typeof setInterval> | undefined
  let extras = $state<Apparition[]>([])
  let viewMode = $state<'overview' | 'scene'>('overview')
  let selectedBodyId = $state<string | null>(null)
  let followedBodyId = $state<string | null>(null)
  let eventQuery = $state('')
  let changeFilter = $state<'all' | 'changed'>('all')
  let certaintyFilter = $state<'all' | DisplayPresence['certainty']>('all')
  let perspectiveCharacterId = $state('canon')
  let perspective = $state<PerspectiveProjection | null>(null)
  let perspectiveLoading = $state(false)
  let perspectiveError = $state(false)
  let urlHydrated = $state(false)

  type DisplayPresence = {
    entityId: string
    locationId: string | null
    locationLabel: string | null
    precision: 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'
    certainty: 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'
    tierId: string | null
    name: string
  }

  let currentPresences = $state<DisplayPresence[]>([])
  let previousPresences = $state<DisplayPresence[]>([])

  let tierId = $state(ship.tiers[0].id)
  let currentSpace = $state<Space | null>(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(0)
  let engaged = $state(false)
  let jumpTo = $state<string | null>(null)
  let jumpAt = $state<Vec2 | null>(null)
  let aimedAt = $state<Space | null>(null)
  let aimedSolidAt = $state<import('$lib/tour/types').Structure | null>(null)
  let hatsuWorld = $state<TourWorld>(EMPTY_WORLD)
  let hatsuReport = $state<TourReport | null>(null)
  let hatsuFlash = $state<(TourFlash & { seq: number }) | null>(null)
  let hatsuFlashSequence = 0
  let nextHand = $state<Record<CastHand, 'sun' | 'moon'>>({
    first: 'sun',
    second: 'sun',
    third: 'sun',
  })

  const hatsuView = new TourHatsuView({
    active: () => $activeHatsu,
    world: () => hatsuWorld,
    locale: () => $locale,
    tuneName: (air) => $t.tour.hatsu.tunes[air],
  })
  let sceneTechnique = $derived(hatsuView.technique)
  let hatsuHands = $derived(hatsuView.hands)
  let hatsuTunes = $derived(hatsuView.tunes)

  function showHatsuReport(report: TourReport) {
    hatsuReport = report
    const flash = flashFor({ report, from: position }, ship, hatsuWorld)
    if (flash) hatsuFlash = { ...flash, seq: ++hatsuFlashSequence }
  }

  function goToHatsuSpace(space: Space, landing?: Vec2 | null) {
    tierId = space.tierId
    jumpTo = space.id
    jumpAt = landing ?? null
  }

  const hatsuCasting = new TourCastController({
    read: () => ({
      world: hatsuWorld,
      ship,
      activeKind: sceneTechnique?.kind ?? null,
      pages: hatsuView.openPages,
      hands: nextHand,
      currentSpace,
      aimedAt,
      aimedSolidAt,
      position,
      heading,
    }),
    updateWorld: (next) => (hatsuWorld = next),
    updateReport: (next) => (hatsuReport = next),
    updateHands: (next) => (nextHand = next),
    show: showHatsuReport,
    goToSpace: goToHatsuSpace,
  })

  const hatsuSession = new TourHatsuSession({
    readActivation: () => ({
      ship,
      activeKind: sceneTechnique?.kind ?? null,
      hasAura: Boolean($activeHatsu),
      position,
      spaceId: currentSpace?.id ?? null,
    }),
    read: () => ({
      world: hatsuWorld,
      ship,
      activeKind: sceneTechnique?.kind ?? null,
      hasAura: Boolean($activeHatsu),
      position,
      spaceId: currentSpace?.id ?? null,
    }),
    updateWorld: (next) => (hatsuWorld = next),
    updateReport: (next) => (hatsuReport = next),
    resetHands: () => (nextHand = { first: 'sun', second: 'sun', third: 'sun' }),
    show: showHatsuReport,
    goToSpace: (spaceId) => {
      const space = ship.spaces.get(spaceId)
      if (space) goToHatsuSpace(space)
    },
    reboundText: () => $t.tour.hatsu.reports.snakesRebound,
    vowText: (spaceId) => $t.tour.hatsu.reports.vowBroken(spaceId),
  })
  hatsuSession.watchActivation()
  hatsuSession.watchFuture()

  let sceneCharacters = $derived(
    data.sceneCharacters
      .filter((character) => character.eventId === chronologicalEvents[currentIndex]?.event.id)
      .map((character) => ({
        ...character,
        name: displayName(character.canonicalName, $locale),
        shown: extras.find((extra) => extra.id === `avatar-${character.bodyId}`) ?? null,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, $locale)),
  )

  let activeBodyIds = $derived(new Set(sceneCharacters.map((character) => character.bodyId)))
  type PresenceChange = DisplayPresence & {
    change: 'arrived' | 'moved' | 'departed' | 'unchanged'
    previousLocationLabel: string | null
    previousTierId: string | null
  }

  let presenceChanges = $derived.by(() => {
    const previousById = new Map(previousPresences.map((presence) => [presence.entityId, presence]))
    const currentById = new Map(currentPresences.map((presence) => [presence.entityId, presence]))
    const changes: PresenceChange[] = currentPresences.map((presence) => {
      const previous = previousById.get(presence.entityId)
      const moved =
        previous &&
        (previous.locationId !== presence.locationId || previous.precision !== presence.precision)
      return {
        ...presence,
        change: previous ? (moved ? 'moved' : 'unchanged') : 'arrived',
        previousLocationLabel: previous?.locationLabel ?? null,
        previousTierId: previous?.tierId ?? null,
      }
    })
    for (const previous of previousPresences) {
      if (currentById.has(previous.entityId)) continue
      changes.push({
        ...previous,
        change: 'departed',
        previousLocationLabel: previous.locationLabel,
        previousTierId: previous.tierId,
      })
    }
    return changes
  })

  let changedPresences = $derived(
    presenceChanges.filter((presence) => presence.change !== 'unchanged'),
  )
  let overviewMarkers = $derived(
    visibleInPerspective(presenceChanges, perspectiveCharacterId === 'canon' ? null : perspective)
      .filter((presence) => presence.tierId)
      .filter((presence) => changeFilter === 'all' || presence.change !== 'unchanged')
      .filter((presence) => certaintyFilter === 'all' || presence.certainty === certaintyFilter)
      .map((presence) => ({
        id: presence.entityId,
        label: presence.name,
        tierId: presence.tierId!,
        locationLabel: presence.locationLabel,
        certainty: presence.certainty,
        precision: presence.precision,
        active: activeBodyIds.has(presence.entityId),
        change: presence.change,
        previousLocationLabel: presence.previousLocationLabel,
        previousTierId: presence.previousTierId,
      })),
  )
  let perspectiveCharacters = $derived.by(() => {
    const characters: Record<string, string> = {}
    for (const character of data.sceneCharacters) {
      characters[character.characterId] = displayName(character.canonicalName, $locale)
    }
    return Object.entries(characters)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, $locale))
  })
  let unknownPresences = $derived(currentPresences.filter((presence) => !presence.tierId))
  let filteredEvents = $derived(
    chronologicalEvents
      .map((entry, index) => ({ ...entry, index }))
      .filter((entry) => {
        const query = eventQuery.trim().toLocaleLowerCase($locale)
        return (
          !query ||
          entry.event.title.toLocaleLowerCase($locale).includes(query) ||
          entry.event.summary.toLocaleLowerCase($locale).includes(query) ||
          String(entry.chapter.number).includes(query)
        )
      }),
  )
  let selectedEvent = $derived(chronologicalEvents[currentIndex])
  let selectedEvidence = $derived.by(() => {
    if (!selectedEvent) return []
    const sourceIds = data.worldEvents
      .filter(
        (record) =>
          record.chapterNumber === selectedEvent.chapter.number &&
          record.localSequence === selectedEvent.event.sequence,
      )
      .flatMap((record) => record.sourceIds)
    return evidenceForEvent({
      chapterNumber: selectedEvent.chapter.number,
      eventId: selectedEvent.event.id,
      occurredAtBasis: selectedEvent.event.occurredAtBasis,
      occurredAtSource: selectedEvent.event.occurredAtSource,
      sourceIds,
    })
  })
  let followedName = $derived(followedBodyId ? presenceName(followedBodyId) : null)
  let followedEventIndexes = $derived.by(() => {
    if (!followedBodyId) return [] as number[]
    const indexes: number[] = []
    chronologicalEvents.forEach((entry, index) => {
      if (
        data.sceneCharacters.some(
          (character) =>
            character.eventId === entry.event.id && character.bodyId === followedBodyId,
        ) ||
        data.presences.some(
          (presence) =>
            presence.entityId === followedBodyId &&
            (presence.fromEvent.id === entry.event.id ||
              presence.untilEvent?.id === entry.event.id),
        )
      ) {
        indexes.push(index)
      }
    })
    return indexes
  })
  let activeTechnique = $derived($activeHatsu ? localizeHatsu($activeHatsu, $locale) : null)

  $effect(() => {
    if (urlHydrated) return
    const requested = readReconstructionUrl($page.url.searchParams)
    const eventIndex = chronologicalEvents.findIndex(
      (entry) => entry.event.id === requested.eventId,
    )
    if (eventIndex >= 0) currentIndex = eventIndex
    viewMode = requested.view
    followedBodyId = requested.follow
    changeFilter = requested.changesOnly ? 'changed' : 'all'
    if (['all', 'CONFIRMED', 'PROBABLE', 'LAST_KNOWN'].includes(requested.certainty)) {
      certaintyFilter = requested.certainty as typeof certaintyFilter
    }
    if (
      requested.observer === 'canon' ||
      perspectiveCharacters.some((character) => character.id === requested.observer)
    ) {
      perspectiveCharacterId = requested.observer
    }
    urlHydrated = true
  })

  $effect(() => {
    if (!urlHydrated) return
    const query = writeReconstructionUrl({
      eventId: selectedEvent?.event.id ?? null,
      view: viewMode,
      follow: followedBodyId,
      changesOnly: changeFilter === 'changed',
      certainty: certaintyFilter,
      observer: perspectiveCharacterId,
    })
    if ($page.url.search.slice(1) === query) return
    void goto(`${$page.url.pathname}${query ? `?${query}` : ''}`, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    })
  })

  $effect(() => {
    const observer = perspectiveCharacterId
    const event = selectedEvent?.event.id
    if (observer === 'canon' || !event) {
      perspective = null
      perspectiveLoading = false
      perspectiveError = false
      return
    }
    const controller = new AbortController()
    perspectiveLoading = true
    perspectiveError = false
    const query = `observer=${encodeURIComponent(observer)}&event=${encodeURIComponent(event)}${
      data.spoilerLimit ? `&spoiler=${data.spoilerLimit}` : ''
    }`
    fetch(`/reconstruction/perspective?${query}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<PerspectiveProjection>
      })
      .then((projection) => (perspective = projection))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        perspective = null
        perspectiveError = true
      })
      .finally(() => (perspectiveLoading = false))
    return () => controller.abort()
  })
  let hatsuReading = $derived.by(() => {
    if (!$activeHatsu) return null
    const selected = selectedBodyId
      ? presenceChanges.find((presence) => presence.entityId === selectedBodyId)
      : null
    switch ($activeHatsu.kind) {
      case 'future':
      case 'divination':
      case 'prophecy':
        return $t.reconstruction.hatsuReadings.future(changedPresences.length)
      case 'scout':
      case 'surveillance':
      case 'dowsing':
      case 'blood-search':
        return selected
          ? $t.reconstruction.hatsuReadings.trace(selected.name, selected.change)
          : $t.reconstruction.hatsuReadings.chooseTarget
      case 'chain-bind':
      case 'chain-rule':
      case 'curse':
      case 'ability-loan':
      case 'inherit':
      case 'elastic':
        return $t.reconstruction.hatsuReadings.characterTarget
      default:
        return $t.reconstruction.hatsuReadings.sceneTarget
    }
  })

  type NarrativePosition = {
    id: string
    ordinal: number | null
    sequence: number
    chapter: { number: number }
  }

  function comparePosition(left: NarrativePosition, right: NarrativePosition): number {
    if (left.ordinal !== null && right.ordinal !== null) return left.ordinal - right.ordinal
    return left.chapter.number - right.chapter.number || left.sequence - right.sequence
  }

  function isLegacyPresenceActive(
    presence: PageData['presences'][number],
    event: NarrativePosition,
  ): boolean {
    return (
      comparePosition(presence.fromEvent, event) <= 0 &&
      (!presence.untilEvent || comparePosition(event, presence.untilEvent) < 0)
    )
  }

  function avatar(entityId: string, locationId: string): Apparition | null {
    const space = spaceForLocation(
      ship,
      (data.locationSlugs as Record<string, string>)[locationId] ?? locationId,
    )
    if (!space) return null
    const plan = ship.plans.get(space.tierId)
    if (!plan) return null
    return {
      id: `avatar-${entityId}`,
      kind: 'avatar',
      spaceId: space.id,
      tierId: space.tierId,
      at: centroid(space),
      y: floorOf(space, plan.tier),
      colour: AVATAR,
      size: 0.9,
      stage: 0,
      hidden: false,
    }
  }

  function presenceName(entityId: string): string {
    const legacy = data.presences.find((presence) => presence.entityId === entityId)
    const canonicalName = legacy?.body?.character?.canonicalName ?? legacy?.body?.label ?? entityId
    return displayName(canonicalName, $locale)
  }

  function displayPresence(
    entityId: string,
    presence: {
      locationId?: string | null
      precision: string
      certainty: string
    },
  ): DisplayPresence {
    const location =
      data.locations.find((candidate) => candidate.id === presence.locationId) ?? null
    const locationsById = new Map(data.locations.map((candidate) => [candidate.id, candidate]))
    let cursor = location
    let resolvedTier: string | null = null
    for (let depth = 0; cursor && depth < 8; depth += 1) {
      const preciseSpace = presence.locationId
        ? spaceForLocation(
            ship,
            (data.locationSlugs as Record<string, string>)[presence.locationId] ??
              presence.locationId,
          )
        : null
      if (preciseSpace) {
        resolvedTier = preciseSpace.tierId
        break
      }
      const tier = cursor.slug.match(/^(tier-[1-5])(?:-|$)/)?.[1]
      if (tier) {
        resolvedTier = tier
        break
      }
      cursor = cursor.parentLocationId ? (locationsById.get(cursor.parentLocationId) ?? null) : null
    }
    return {
      entityId,
      locationId: presence.locationId ?? null,
      locationLabel: location?.name ?? null,
      precision: presence.precision as DisplayPresence['precision'],
      certainty: presence.certainty as DisplayPresence['certainty'],
      tierId: resolvedTier,
      name: presenceName(entityId),
    }
  }

  function reconstructAt(index: number): { extras: Apparition[]; presences: DisplayPresence[] } {
    const currentMangaEvent = chronologicalEvents[index]
    if (!currentMangaEvent) {
      return { extras: [], presences: [] }
    }

    const target = currentMangaEvent.event
    const targetPosition: NarrativePosition = {
      id: target.id,
      ordinal: target.ordinal,
      sequence: target.sequence,
      chapter: { number: currentMangaEvent.chapter.number },
    }
    const eventsToApply = engineEvents.filter((event) =>
      target.ordinal !== null
        ? event.cursor.ordinal <= target.ordinal
        : event.cursor.chapterNumber < currentMangaEvent.chapter.number ||
          (event.cursor.chapterNumber === currentMangaEvent.chapter.number &&
            event.cursor.localSequence <= target.sequence),
    )

    const firstCursor = eventsToApply[0]?.cursor
    const initialCursor: StoryCursor = {
      branchId: firstCursor?.branchId ?? 'canon',
      ordinal: (firstCursor?.ordinal ?? 0) - 1,
      eventId: 'reconstruction-origin',
      chapterNumber: firstCursor?.chapterNumber ?? 0,
      localSequence: (firstCursor?.localSequence ?? 0) - 1,
    }
    let state = createEmptyWorld(initialCursor)
    for (const event of eventsToApply) {
      try {
        state = reduceWorld(state, event)
      } catch (error) {
        console.warn('Failed to reduce world event', event.id, error)
      }
    }

    // Temporal Presence rows establish the canonical baseline. A backfilled
    // world event for the same entity takes precedence over that baseline.
    const byEntity: Record<string, Apparition> = {}
    const presenceByEntity: Record<string, DisplayPresence> = {}
    for (const presence of data.presences) {
      if (!isLegacyPresenceActive(presence, targetPosition)) continue
      presenceByEntity[presence.entityId] = displayPresence(presence.entityId, presence)
      if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) continue
      const shown = avatar(presence.entityId, presence.locationId)
      if (shown) byEntity[presence.entityId] = shown
    }
    for (const [entityId, presence] of Object.entries(state.presences)) {
      presenceByEntity[entityId] = displayPresence(entityId, presence)
      if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) {
        delete byEntity[entityId]
        continue
      }
      const shown = avatar(entityId, presence.locationId)
      if (shown) byEntity[entityId] = shown
    }

    return {
      extras: Object.values(byEntity),
      presences: Object.values(presenceByEntity).sort((left, right) =>
        left.name.localeCompare(right.name, $locale),
      ),
    }
  }

  $effect(() => {
    const current = reconstructAt(currentIndex)
    const previous = reconstructAt(currentIndex - 1)
    extras = current.extras
    currentPresences = current.presences
    previousPresences = previous.presences

    // Stay on the visitor's chosen deck while it has a known presence. If it
    // does not, follow the timeline to a populated deck instead of showing an
    // apparently empty reconstruction.
    const followed = followedBodyId
      ? current.extras.find((shown) => shown.id === `avatar-${followedBodyId}`)
      : null
    const focus =
      followed ?? current.extras.find((shown) => shown.tierId === tierId) ?? current.extras[0]
    if (focus && focus.tierId !== tierId) {
      tierId = focus.tierId
      jumpTo = focus.spaceId
      jumpAt = focus.at
    }
  })

  function stopPlayback() {
    isPlaying = false
    if (playbackInterval) clearInterval(playbackInterval)
    playbackInterval = undefined
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlayback()
      return
    }
    if (chronologicalEvents.length < 2) return
    isPlaying = true
    schedulePlayback()
  }

  function schedulePlayback() {
    const delay = Math.min(5000, 1200 + changedPresences.length * 240)
    playbackInterval = setTimeout(() => {
      if (currentIndex < chronologicalEvents.length - 1) currentIndex++
      else stopPlayback()
      if (isPlaying) schedulePlayback()
    }, delay)
  }

  function chooseScene(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= chronologicalEvents.length) return
    stopPlayback()
    currentIndex = index
  }

  function watchCharacter(character: (typeof sceneCharacters)[number]) {
    if (!character.shown) return
    selectedBodyId = character.bodyId
    viewMode = 'scene'
    tierId = character.shown.tierId
    jumpTo = character.shown.spaceId
    jumpAt = character.shown.at
  }

  function selectOverviewCharacter(entityId: string) {
    selectedBodyId = entityId
  }

  function toggleFollow(entityId: string) {
    followedBodyId = followedBodyId === entityId ? null : entityId
    selectedBodyId = entityId
  }

  function jumpFollow(direction: -1 | 1) {
    const candidates = followedEventIndexes.toSorted((a, b) => a - b)
    const destination =
      direction < 0
        ? candidates.filter((index) => index < currentIndex).at(-1)
        : candidates.find((index) => index > currentIndex)
    if (destination !== undefined) chooseScene(destination)
  }

  onDestroy(() => {
    stopPlayback()
    hatsuSession.dispose()
  })
</script>

<Seo
  title={$t.reconstruction.seoTitle}
  description={$t.reconstruction.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.reconstruction.breadcrumb, path: $link('/reconstruction') },
  ])}
/>

<main class="reconstruction-shell">
  <header class="masthead" data-hatsu-pass>
    <div>
      <p class="eyebrow">{$t.reconstruction.eyebrow}</p>
      <h1>{$t.reconstruction.title}</h1>
      <p>{$t.reconstruction.intro}</p>
    </div>
    <div class="mode-switch" aria-label={$t.reconstruction.viewLabel}>
      <a href={$link('/reconstruction/v3')}>V3 · Et si…</a>
      <button
        class:active={viewMode === 'overview'}
        type="button"
        onclick={() => (viewMode = 'overview')}
      >
        {$t.reconstruction.overview}
      </button>
      <button
        class:active={viewMode === 'scene'}
        type="button"
        onclick={() => (viewMode = 'scene')}
      >
        {$t.reconstruction.scene}
      </button>
    </div>
  </header>

  {#if data.error}
    <section class="error-state" role="alert" aria-labelledby="reconstruction-error-title">
      <p class="eyebrow">{$t.reconstruction.loadErrorEyebrow}</p>
      <h2 id="reconstruction-error-title">{$t.reconstruction.loadErrorTitle}</h2>
      <p>{$t.reconstruction.loadErrorBody}</p>
      <button type="button" onclick={() => location.reload()}>{$t.reconstruction.retry}</button>
      <details>
        <summary>{$t.reconstruction.technicalDetails}</summary>
        <code>{data.error}</code>
      </details>
    </section>
  {:else if chronologicalEvents.length === 0}
    <section class="empty-state"><p>{$t.reconstruction.empty}</p></section>
  {:else}
    <div class="workspace">
      {#if viewMode === 'scene'}
        <TourModeFullscreen />
      {/if}
      <aside class="timeline-panel" data-hatsu-pass>
        <label class="search">
          <span>{$t.reconstruction.searchEvents}</span>
          <input
            type="search"
            bind:value={eventQuery}
            placeholder={$t.reconstruction.searchPlaceholder}
          />
        </label>
        <nav aria-label={$t.reconstruction.timeline}>
          {#each filteredEvents as entry (entry.event.id)}
            <button
              type="button"
              class:current={entry.index === currentIndex}
              class:followed={followedEventIndexes.includes(entry.index)}
              aria-current={entry.index === currentIndex ? 'step' : undefined}
              onclick={() => chooseScene(entry.index)}
            >
              <span class="event-index">{String(entry.index + 1).padStart(3, '0')}</span>
              <span>
                <small
                  >{$t.common.chapterShort(entry.chapter.number)}{entry.event.occurredAtLabel
                    ? ` · ${entry.event.occurredAtLabel}`
                    : ''}</small
                >
                <strong>{entry.event.title}</strong>
              </span>
            </button>
          {/each}
        </nav>
      </aside>

      <section class="stage" aria-label={$t.reconstruction.currentState}>
        {#if viewMode === 'overview'}
          <ReconstructionOverview
            markers={overviewMarkers}
            selectedId={selectedBodyId}
            onSelect={selectOverviewCharacter}
          />
          <div class="map-filters" aria-label={$t.reconstruction.filters} data-hatsu-pass>
            <label class="perspective-select">
              <span>{$t.reconstruction.perspective}</span>
              <select bind:value={perspectiveCharacterId}>
                <option value="canon">{$t.reconstruction.canonicalPerspective}</option>
                {#each perspectiveCharacters as character (character.id)}
                  <option value={character.id}>{character.name}</option>
                {/each}
              </select>
            </label>
            <button
              class:active={changeFilter === 'all'}
              type="button"
              onclick={() => (changeFilter = 'all')}>{$t.reconstruction.allPresences}</button
            >
            <button
              class:active={changeFilter === 'changed'}
              type="button"
              onclick={() => (changeFilter = 'changed')}>{$t.reconstruction.changesOnly}</button
            >
            <select bind:value={certaintyFilter} aria-label={$t.reconstruction.certaintyFilter}>
              <option value="all">{$t.reconstruction.allCertainties}</option>
              <option value="CONFIRMED">{$t.reconstruction.legendKnown}</option>
              <option value="PROBABLE">{$t.reconstruction.legendProbable}</option>
              <option value="LAST_KNOWN">{$t.reconstruction.legendLastKnown}</option>
            </select>
          </div>
          {#if perspectiveCharacterId !== 'canon'}
            <div class="perspective-status" aria-live="polite" data-hatsu-pass>
              {#if perspectiveLoading}
                {$t.reconstruction.loadingPerspective}
              {:else if perspectiveError}
                {$t.reconstruction.perspectiveUnavailable}
              {:else if perspective}
                {$t.reconstruction.perspectiveSummary(
                  perspective.visibleBodyIds.length,
                  perspective.knownFactCount,
                  perspective.beliefCount,
                )}
              {/if}
            </div>
          {/if}
          <div class="map-legend" data-hatsu-pass>
            <span><i class="active-dot"></i>{$t.reconstruction.legendActive}</span>
            <span><i></i>{$t.reconstruction.legendKnown}</span>
            <span><i class="probable"></i>{$t.reconstruction.legendProbable}</span>
            <span><i class="last-known"></i>{$t.reconstruction.legendLastKnown}</span>
            <span><i class="arrived"></i>{$t.reconstruction.arrived}</span>
            <span><i class="departed"></i>{$t.reconstruction.departed}</span>
          </div>
          <aside
            class="hatsu-lens"
            class:active={Boolean(activeTechnique)}
            style:--hatsu={activeTechnique?.color ?? '#6faeb2'}
            data-hatsu-pass
          >
            {#if activeTechnique}
              <span>{$t.reconstruction.hatsuLens}</span>
              <strong>{activeTechnique.name}</strong>
              <p>{hatsuReading}</p>
            {:else}
              <span>{$t.reconstruction.hatsuLens}</span>
              <p>{$t.reconstruction.noHatsu}</p>
              <button type="button" onclick={() => hatsuPanelOpen.set(true)}>
                {$t.reconstruction.chooseHatsu}
              </button>
            {/if}
          </aside>
        {:else}
          <div class="tour-stage">
            <TourScene
              {ship}
              bind:tierId
              bind:currentSpace
              bind:position
              bind:heading
              bind:engaged
              bind:jumpTo
              bind:jumpAt
              world={hatsuWorld}
              auraColour={sceneTechnique?.color ?? null}
              flash={hatsuFlash}
              aiming={Boolean(sceneTechnique)}
              selfCastable={hatsuView.selfCastable}
              hands={hatsuHands}
              tunes={hatsuTunes}
              twoHanded={hatsuView.twoHanded}
              bind:aimedAt
              bind:aimedSolidAt
              onCast={hatsuCasting.castOn}
              onHatsu={hatsuCasting.castOn}
              nen={hatsuSession.nen}
              onNenChange={hatsuSession.useNen}
              onArrive={hatsuSession.arrived}
              {extras}
              touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
              soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
              loadingLabel={$t.tour.loading}
              unsupportedLabel={$t.tour.unsupported}
            />
            {#if hatsuReport}
              <output class="scene-hatsu-report" aria-live="polite">
                <strong>{activeTechnique?.name ?? $t.reconstruction.hatsuLens}</strong>
                <span>{hatsuReport.kind}</span>
              </output>
            {/if}
          </div>
        {/if}
      </section>

      <aside class="event-panel">
        <p class="eyebrow">{$t.reconstruction.event}</p>
        <p class="event-time">
          {$t.common.chapterShort(selectedEvent.chapter.number)}
          {#if selectedEvent.event.occurredAtLabel}<span>{selectedEvent.event.occurredAtLabel}</span
            >{/if}
        </p>
        <h2>{selectedEvent.event.title}</h2>
        <p class="summary">{selectedEvent.event.summary}</p>

        <section aria-labelledby="scene-cast">
          <div class="section-heading">
            <h3 id="scene-cast">{$t.reconstruction.characters}</h3>
            <span>{sceneCharacters.length}</span>
          </div>
          {#if sceneCharacters.length}
            <div class="cast">
              {#each sceneCharacters as character (character.characterId)}
                <div class="cast-row">
                  <button
                    type="button"
                    class:selected={selectedBodyId === character.bodyId}
                    disabled={!character.shown}
                    title={character.shown
                      ? $t.reconstruction.watchCharacter(character.name)
                      : $t.reconstruction.unknownPosition}
                    onclick={() => watchCharacter(character)}
                    data-hatsu-character={character.bodyId}
                    data-hatsu-character-name={character.name}
                    data-hatsu-uncertain={!character.shown ? 'true' : undefined}
                  >
                    <span
                      ><strong>{character.name}</strong><small
                        >{$t.reconstruction.roles[character.participationType]}</small
                      ></span
                    >
                    <b>{character.shown ? '→' : '?'}</b>
                  </button>
                  <button
                    class="follow"
                    class:active={followedBodyId === character.bodyId}
                    type="button"
                    data-hatsu-pass
                    aria-label={$t.reconstruction.followCharacter(character.name)}
                    onclick={() => toggleFollow(character.bodyId)}>◎</button
                  >
                </div>
              {/each}
            </div>
          {:else}
            <p class="muted">{$t.reconstruction.noCharacters}</p>
          {/if}
        </section>

        <section>
          <div class="section-heading">
            <h3>{$t.reconstruction.changes}</h3>
            <span>{changedPresences.length}</span>
          </div>
          {#if changedPresences.length}
            <ul class="change-list">
              {#each changedPresences.slice(0, 8) as presence (presence.entityId)}
                <li data-change={presence.change}>
                  <strong>{presence.name}</strong>
                  <span>
                    {#if presence.change === 'moved'}
                      {presence.previousLocationLabel ?? $t.common.unknown} → {presence.locationLabel ??
                        $t.common.unknown}
                    {:else}
                      {$t.reconstruction.changeLabels[presence.change]}
                      {#if presence.locationLabel}
                        · {presence.locationLabel}{/if}
                    {/if}
                  </span>
                  <small data-evidence={claimLevel(presence.certainty, presence.precision)}>
                    {$t.reconstruction.evidenceLevels[
                      claimLevel(presence.certainty, presence.precision)
                    ]}
                  </small>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">{$t.reconstruction.noChanges}</p>
          {/if}
        </section>

        <section class="evidence-panel">
          <div class="section-heading">
            <h3>{$t.reconstruction.sources}</h3>
            <span>{selectedEvidence.length}</span>
          </div>
          <ul>
            {#each selectedEvidence as evidence (evidence.id)}
              <li data-evidence={evidence.level}>
                <span>{$t.reconstruction.evidenceLevels[evidence.level]}</span>
                <strong>{evidence.label}</strong>
                {#if evidence.detail}<code>{evidence.detail}</code>{/if}
              </li>
            {/each}
          </ul>
        </section>

        {#if followedBodyId && followedName}
          <section class="follow-panel">
            <div class="section-heading">
              <h3>{$t.reconstruction.following}</h3>
              <button type="button" onclick={() => (followedBodyId = null)}>×</button>
            </div>
            <strong>{followedName}</strong>
            <p>{$t.reconstruction.followCount(followedEventIndexes.length)}</p>
            <div>
              <button type="button" onclick={() => jumpFollow(-1)}
                >← {$t.reconstruction.previousTrace}</button
              >
              <button type="button" onclick={() => jumpFollow(1)}
                >{$t.reconstruction.nextTrace} →</button
              >
            </div>
          </section>
        {/if}

        <section>
          <div class="section-heading">
            <h3>{$t.reconstruction.shipState}</h3>
            <span>{currentPresences.length}</span>
          </div>
          <dl class="state-stats">
            <div>
              <dt>{$t.reconstruction.exact}</dt>
              <dd>{extras.length}</dd>
            </div>
            <div>
              <dt>{$t.reconstruction.approximate}</dt>
              <dd>
                {currentPresences.filter(
                  (presence) => presence.tierId && presence.precision !== 'EXACT_ROOM',
                ).length}
              </dd>
            </div>
            <div>
              <dt>{$t.reconstruction.unlocated}</dt>
              <dd>{unknownPresences.length}</dd>
            </div>
          </dl>
          {#if unknownPresences.length}
            <details>
              <summary>{$t.reconstruction.showUnlocated(unknownPresences.length)}</summary>
              <ul>
                {#each unknownPresences as presence (presence.entityId)}<li>
                    {presence.name}
                  </li>{/each}
              </ul>
            </details>
          {/if}
        </section>

        <p class="method-note">{$t.reconstruction.methodNote}</p>
      </aside>
    </div>

    <footer class="transport" data-hatsu-pass>
      <button
        aria-label={$t.reconstruction.previous}
        disabled={currentIndex === 0}
        onclick={() => chooseScene(currentIndex - 1)}>←</button
      >
      <button
        class="play"
        aria-label={isPlaying ? $t.reconstruction.pause : $t.reconstruction.play}
        onclick={togglePlay}>{isPlaying ? 'Ⅱ' : '▶'}</button
      >
      <button
        aria-label={$t.reconstruction.next}
        disabled={currentIndex >= chronologicalEvents.length - 1}
        onclick={() => chooseScene(currentIndex + 1)}>→</button
      >
      <input
        aria-label={$t.reconstruction.timeline}
        type="range"
        min="0"
        max={Math.max(0, chronologicalEvents.length - 1)}
        value={currentIndex}
        oninput={(event) => chooseScene(Number(event.currentTarget.value))}
      />
      <span>{currentIndex + 1} / {chronologicalEvents.length}</span>
    </footer>
  {/if}
</main>

<style>
  :global(body) {
    background: #030608;
  }
  .reconstruction-shell {
    min-height: 100vh;
    background: #030608;
    color: #edf1ee;
    padding: 6rem 1.25rem 5.5rem;
  }
  .error-state {
    max-width: 46rem;
    margin: 5rem auto;
    padding: 2rem;
    border: 1px solid rgba(207, 128, 108, 0.55);
    background: rgba(39, 17, 16, 0.72);
  }
  .error-state h2 {
    margin: 0.35rem 0 0.7rem;
  }
  .error-state button {
    margin-top: 1rem;
    border: 1px solid #e5c57a;
    background: transparent;
    padding: 0.55rem 0.9rem;
    color: #e5c57a;
    cursor: pointer;
  }
  .error-state details {
    margin-top: 1.25rem;
    color: rgba(237, 241, 238, 0.65);
  }
  .error-state code {
    display: block;
    margin-top: 0.6rem;
    overflow-wrap: anywhere;
  }
  .evidence-panel ul {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .evidence-panel li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.2rem 0.55rem;
    border-left: 2px solid #6faeb2;
    padding-left: 0.65rem;
  }
  .evidence-panel li[data-evidence='derived'] {
    border-left-style: dashed;
    border-left-color: #e5c57a;
  }
  .evidence-panel li[data-evidence='inferred'] {
    border-left-style: dotted;
    border-left-color: #cf806c;
  }
  .evidence-panel li span,
  .change-list small[data-evidence] {
    color: rgba(237, 241, 238, 0.55);
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .evidence-panel li code {
    grid-column: 2;
    overflow-wrap: anywhere;
    color: rgba(237, 241, 238, 0.48);
    font-size: 0.66rem;
  }
  .perspective-select {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .perspective-select span {
    font-size: 0.66rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .perspective-status {
    border-top: 1px solid rgba(111, 174, 178, 0.35);
    background: rgba(5, 15, 19, 0.9);
    padding: 0.55rem 0.8rem;
    color: rgba(237, 241, 238, 0.7);
    font-size: 0.72rem;
  }
  .scene-hatsu-report {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    z-index: 5;
    display: grid;
    gap: 0.2rem;
    border: 1px solid color-mix(in srgb, var(--hatsu, #6faeb2) 65%, transparent);
    background: rgba(3, 8, 10, 0.9);
    padding: 0.65rem 0.85rem;
    color: #edf1ee;
  }
  .scene-hatsu-report span {
    color: rgba(237, 241, 238, 0.58);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .masthead {
    max-width: 1600px;
    margin: 0 auto 1.2rem;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 2rem;
  }
  .masthead h1 {
    margin: 0.15rem 0 0.35rem;
    font-family: Georgia, serif;
    font-size: clamp(2rem, 4vw, 4.2rem);
    font-weight: 400;
    line-height: 1;
  }
  .masthead > div > p:last-child {
    max-width: 48rem;
    margin: 0;
    color: rgba(237, 241, 238, 0.62);
  }
  .eyebrow {
    margin: 0;
    color: #d5b86e;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .mode-switch {
    display: flex;
    border: 1px solid rgba(237, 241, 238, 0.16);
    padding: 0.2rem;
  }
  .mode-switch button {
    border: 0;
    background: transparent;
    padding: 0.65rem 0.9rem;
    color: rgba(237, 241, 238, 0.58);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .mode-switch button.active {
    background: rgba(229, 197, 122, 0.13);
    color: #f2ddb0;
  }
  .workspace {
    max-width: 1600px;
    height: min(70vh, 760px);
    min-height: 36rem;
    margin: auto;
    display: grid;
    grid-template-columns: minmax(15rem, 0.7fr) minmax(32rem, 2.2fr) minmax(18rem, 0.9fr);
    border: 1px solid rgba(237, 241, 238, 0.15);
    background: #071014;
  }
  .timeline-panel,
  .event-panel {
    min-width: 0;
    background: rgba(5, 10, 13, 0.96);
  }
  .timeline-panel {
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(237, 241, 238, 0.12);
  }
  .search {
    padding: 1rem;
    border-bottom: 1px solid rgba(237, 241, 238, 0.1);
  }
  .search span {
    display: block;
    margin-bottom: 0.4rem;
    color: rgba(237, 241, 238, 0.48);
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .search input {
    width: 100%;
    border: 1px solid rgba(237, 241, 238, 0.14);
    background: #020506;
    padding: 0.65rem 0.75rem;
    color: inherit;
  }
  .timeline-panel nav {
    overflow-y: auto;
  }
  .timeline-panel nav button {
    width: 100%;
    display: grid;
    grid-template-columns: 2.5rem 1fr;
    gap: 0.65rem;
    border: 0;
    border-bottom: 1px solid rgba(237, 241, 238, 0.07);
    background: transparent;
    padding: 0.8rem;
    color: rgba(237, 241, 238, 0.65);
    text-align: left;
  }
  .timeline-panel nav button:hover,
  .timeline-panel nav button.current {
    background: rgba(229, 197, 122, 0.08);
    color: #f2e5c9;
  }
  .timeline-panel nav button.current {
    box-shadow: inset 2px 0 #d5b86e;
  }
  .timeline-panel nav button.followed:not(.current) {
    box-shadow: inset 2px 0 rgba(111, 174, 178, 0.65);
  }
  .event-index,
  .timeline-panel small {
    color: rgba(237, 241, 238, 0.35);
    font-size: 0.6rem;
  }
  .timeline-panel strong {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  .stage {
    position: relative;
    min-width: 0;
    overflow: hidden;
    background: #030608;
  }
  .tour-stage {
    position: absolute;
    inset: 0;
  }
  .map-filters {
    position: absolute;
    z-index: 5;
    top: 1rem;
    left: 1rem;
    display: flex;
    gap: 0.3rem;
    border: 1px solid rgba(237, 241, 238, 0.13);
    background: rgba(3, 8, 10, 0.9);
    padding: 0.3rem;
  }
  .map-filters button,
  .map-filters select {
    border: 0;
    background: transparent;
    padding: 0.45rem 0.55rem;
    color: rgba(237, 241, 238, 0.58);
    font-size: 0.62rem;
  }
  .hatsu-lens {
    position: absolute;
    z-index: 6;
    top: 1rem;
    right: 1rem;
    width: min(16rem, 42%);
    border: 1px solid rgba(237, 241, 238, 0.14);
    background: rgba(3, 8, 10, 0.92);
    padding: 0.75rem;
    color: rgba(237, 241, 238, 0.58);
    box-shadow: 0 0.6rem 2rem rgba(0, 0, 0, 0.35);
  }
  .hatsu-lens.active {
    border-color: color-mix(in srgb, var(--hatsu) 58%, rgba(237, 241, 238, 0.16));
    box-shadow: 0 0 1.5rem color-mix(in srgb, var(--hatsu) 14%, transparent);
  }
  .hatsu-lens > span {
    display: block;
    color: color-mix(in srgb, var(--hatsu) 75%, #fff 25%);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .hatsu-lens strong {
    display: block;
    margin-top: 0.25rem;
    font-family: Georgia, serif;
    color: #edf1ee;
  }
  .hatsu-lens p {
    margin: 0.35rem 0 0;
    font-size: 0.62rem;
    line-height: 1.45;
  }
  .hatsu-lens button {
    margin-top: 0.55rem;
    border: 1px solid rgba(229, 197, 122, 0.45);
    background: rgba(229, 197, 122, 0.08);
    padding: 0.4rem 0.55rem;
    color: #f2ddb0;
    font-size: 0.6rem;
  }
  .map-filters button.active {
    background: rgba(229, 197, 122, 0.14);
    color: #f2ddb0;
  }
  .map-filters select {
    border-left: 1px solid rgba(237, 241, 238, 0.12);
    color-scheme: dark;
  }
  .map-legend {
    position: absolute;
    left: 1rem;
    bottom: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    border: 1px solid rgba(237, 241, 238, 0.13);
    background: rgba(3, 8, 10, 0.88);
    padding: 0.55rem 0.7rem;
    font-size: 0.62rem;
    color: rgba(237, 241, 238, 0.65);
  }
  .map-legend span {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .map-legend i {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #6faeb2;
  }
  .map-legend i.active-dot {
    background: #e5c57a;
  }
  .map-legend i.probable {
    border: 1px dashed #d5b86e;
    background: transparent;
  }
  .map-legend i.last-known {
    border: 1px dotted #cf806c;
    background: transparent;
    opacity: 0.7;
  }
  .map-legend i.arrived {
    background: #78c6a3;
  }
  .map-legend i.departed {
    border: 1px solid #cf806c;
    background: transparent;
    opacity: 0.55;
  }
  .event-panel {
    overflow-y: auto;
    border-left: 1px solid rgba(237, 241, 238, 0.12);
    padding: 1.15rem;
  }
  .event-panel h2 {
    margin: 0.4rem 0 0.75rem;
    font-family: Georgia, serif;
    font-size: 1.55rem;
    font-weight: 400;
    line-height: 1.15;
  }
  .event-time {
    display: flex;
    justify-content: space-between;
    margin: 1.1rem 0 0;
    color: rgba(237, 241, 238, 0.5);
    font-size: 0.68rem;
  }
  .summary {
    color: rgba(237, 241, 238, 0.68);
    font-size: 0.78rem;
    line-height: 1.6;
  }
  .event-panel section {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(237, 241, 238, 0.1);
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.65rem;
  }
  .section-heading h3 {
    margin: 0;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }
  .section-heading span {
    color: #d5b86e;
    font-size: 0.7rem;
  }
  .cast {
    display: grid;
    gap: 0.35rem;
  }
  .cast-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.3rem;
  }
  .cast-row > button:first-child {
    width: 100%;
  }
  .cast-row button.follow {
    width: 2.25rem;
    justify-content: center;
    color: rgba(237, 241, 238, 0.45);
  }
  .cast-row button.follow.active {
    border-color: #6faeb2;
    color: #9bd3d5;
    background: rgba(111, 174, 178, 0.12);
  }
  .cast button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(237, 241, 238, 0.1);
    background: rgba(255, 255, 255, 0.025);
    padding: 0.55rem 0.65rem;
    color: inherit;
    text-align: left;
  }
  .cast button:hover:not(:disabled),
  .cast button.selected {
    border-color: rgba(229, 197, 122, 0.55);
  }
  .cast button:disabled {
    opacity: 0.45;
  }
  .cast strong,
  .cast small {
    display: block;
  }
  .cast strong {
    font-size: 0.72rem;
  }
  .cast small {
    margin-top: 0.15rem;
    color: rgba(237, 241, 238, 0.38);
    font-size: 0.58rem;
    text-transform: uppercase;
  }
  .state-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.35rem;
    margin: 0;
  }
  .state-stats div {
    background: rgba(255, 255, 255, 0.035);
    padding: 0.55rem;
  }
  .state-stats dt {
    color: rgba(237, 241, 238, 0.42);
    font-size: 0.58rem;
  }
  .state-stats dd {
    margin: 0.2rem 0 0;
    color: #e5c57a;
    font-family: Georgia, serif;
    font-size: 1.25rem;
  }
  details {
    margin-top: 0.65rem;
    color: rgba(237, 241, 238, 0.55);
    font-size: 0.68rem;
  }
  details ul {
    padding-left: 1.2rem;
  }
  .method-note {
    margin-top: 1.2rem;
    border-left: 2px solid rgba(229, 197, 122, 0.45);
    padding-left: 0.7rem;
    color: rgba(237, 241, 238, 0.45);
    font-size: 0.66rem;
    line-height: 1.5;
  }
  .muted {
    color: rgba(237, 241, 238, 0.42);
    font-size: 0.7rem;
  }
  .change-list {
    display: grid;
    gap: 0.42rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .change-list li {
    border-left: 2px solid rgba(237, 241, 238, 0.2);
    padding-left: 0.55rem;
  }
  .change-list li[data-change='arrived'] {
    border-color: #78c6a3;
  }
  .change-list li[data-change='moved'] {
    border-color: #e5c57a;
  }
  .change-list li[data-change='departed'] {
    border-color: #cf806c;
  }
  .change-list strong,
  .change-list span {
    display: block;
  }
  .change-list strong {
    font-size: 0.68rem;
  }
  .change-list span {
    margin-top: 0.1rem;
    color: rgba(237, 241, 238, 0.46);
    font-size: 0.6rem;
  }
  .follow-panel > strong {
    color: #9bd3d5;
    font-family: Georgia, serif;
    font-size: 1.05rem;
  }
  .follow-panel p {
    color: rgba(237, 241, 238, 0.48);
    font-size: 0.65rem;
  }
  .follow-panel .section-heading button {
    border: 0;
    background: transparent;
    color: inherit;
  }
  .follow-panel > div:last-child {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem;
  }
  .follow-panel > div:last-child button {
    border: 1px solid rgba(237, 241, 238, 0.12);
    background: transparent;
    padding: 0.45rem;
    color: rgba(237, 241, 238, 0.62);
    font-size: 0.6rem;
  }
  .transport {
    position: fixed;
    z-index: 60;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: auto auto auto minmax(8rem, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid rgba(237, 241, 238, 0.14);
    background: rgba(3, 6, 8, 0.94);
    padding: 0.75rem max(1rem, calc((100vw - 1600px) / 2));
    backdrop-filter: blur(12px);
  }
  .transport button {
    width: 2rem;
    height: 2rem;
    border: 1px solid rgba(237, 241, 238, 0.15);
    background: transparent;
    color: inherit;
  }
  .transport button.play {
    border-color: rgba(229, 197, 122, 0.5);
    color: #e5c57a;
  }
  .transport button:disabled {
    opacity: 0.25;
  }
  .transport input {
    width: 100%;
    accent-color: #d5b86e;
  }
  .transport span {
    min-width: 4rem;
    text-align: right;
    color: rgba(237, 241, 238, 0.5);
    font-size: 0.7rem;
  }
  :global(.hatsu-dock) {
    bottom: 4.6rem;
  }
  .empty-state {
    max-width: 60rem;
    margin: 5rem auto;
    text-align: center;
    color: rgba(237, 241, 238, 0.55);
  }
  @media (max-width: 1100px) {
    .workspace {
      height: auto;
      min-height: 0;
      grid-template-columns: 14rem 1fr;
    }
    .event-panel {
      grid-column: 1 / -1;
      border-top: 1px solid rgba(237, 241, 238, 0.12);
      border-left: 0;
    }
    .stage {
      min-height: 30rem;
    }
    .hatsu-lens {
      top: auto;
      right: 0.6rem;
      bottom: 3.4rem;
      width: min(15rem, 58%);
    }
  }
  @media (max-width: 700px) {
    .reconstruction-shell {
      padding: 5rem 0.7rem 6rem;
    }
    .masthead {
      display: block;
    }
    .mode-switch {
      margin-top: 1rem;
      width: max-content;
    }
    .workspace {
      display: flex;
      flex-direction: column;
    }
    .timeline-panel {
      max-height: 15rem;
      border-right: 0;
    }
    .stage {
      min-height: 23rem;
      order: -1;
    }
    .event-panel {
      overflow: visible;
    }
    .transport {
      grid-template-columns: auto auto auto 1fr;
    }
    .transport span {
      display: none;
    }
  }
</style>
