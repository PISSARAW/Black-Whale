<script lang="ts">
  import type { PageData } from './$types'
  import { onDestroy, untrack } from 'svelte'
  import { replaceState } from '$app/navigation'
  import { page } from '$app/stores'
  import { createEmptyWorld, reduceWorld } from '@black-whale/canon-engine'
  import type { StoryCursor, WorldEvent } from '@black-whale/canon-engine'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import ReconstructionHeader from '$lib/components/reconstruction/ReconstructionHeader.svelte'
  import ReconstructionWorkspace from '$lib/components/reconstruction/ReconstructionWorkspace.svelte'
  import ReconstructionViewport from '$lib/components/reconstruction/ReconstructionViewport.svelte'
  import ReconstructionTimeline from '$lib/components/reconstruction/ReconstructionTimeline.svelte'
  import ReconstructionInspector from '$lib/components/reconstruction/ReconstructionInspector.svelte'
  import ReconstructionFilters from '$lib/components/reconstruction/ReconstructionFilters.svelte'
  import type {
    DisplayPresence,
    PresenceChange,
    SceneTarget,
  } from '$lib/reconstruction/workspaceTypes'
  import ReconstructionOverview from '$lib/components/reconstruction/ReconstructionOverview.svelte'
  import { activeHatsu, hatsuPanelOpen } from '$lib/nen/hatsuState'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { floorOf, spaceForLocation, theShip } from '$lib/tour/blueprint'
  import { AVATAR, flashFor, type Apparition, type TourFlash } from '$lib/tour/apparitions'
  import { EMPTY_WORLD, type TourReport, type TourWorld } from '$lib/tour/hatsu'
  import { TourHatsuView } from '$lib/tour/pageHatsuView.svelte'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import { TourCastController } from '$lib/tour/pageCastController'
  import type { CastHand } from '$lib/tour/pageCasting'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { displayName } from '$lib/utils/displayNames'
  import { evidenceForEvent } from '$lib/reconstruction/evidence'
  import { visibleInPerspective } from '$lib/reconstruction/perspective'
  import { PerspectiveLoader } from '$lib/reconstruction/perspectiveLoader.svelte'
  import { mainSceneSpace } from '$lib/reconstruction/sceneEntry'
  import { readReconstructionUrl, writeReconstructionUrl } from '$lib/reconstruction/urlState'
  import { shipHourOf } from '$lib/tour/hour'
  import { stationIn } from '$lib/tour/cast/stations'
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
  const lens = new PerspectiveLoader()
  const perspective = $derived(lens.projection)
  const perspectiveLoading = $derived(lens.loading)
  const perspectiveError = $derived(lens.error)
  let urlHydrated = $state(false)

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
    vowRules: (subjectId) => {
      const subjectName =
        subjectId === 'self'
          ? $t.tour.hatsu.vow.self
          : displayName(ship.spaces.get(subjectId)?.name)
      return [$t.tour.hatsu.vow.ruleA(subjectName), $t.tour.hatsu.vow.ruleB(subjectName)]
    },
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
  let selectedHour = $derived(shipHourOf(selectedEvent?.event ?? {}))
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
    if (window.location.search.slice(1) === query) return
    untrack(() =>
      replaceState(`${window.location.pathname}${query ? `?${query}` : ''}`, $page.state),
    )
  })

  $effect(() =>
    lens.request({
      observer: perspectiveCharacterId,
      event: selectedEvent?.event.id ?? null,
      spoiler: data.spoilerLimit,
    }),
  )
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

  function avatar(
    entityId: string,
    locationId: string,
    event: { id: string; locationId: string | null },
  ): Apparition | null {
    const locationSlug = (data.locationSlugs as Record<string, string>)[locationId] ?? locationId
    const eventLocationSlug = event.locationId
      ? ((data.locationSlugs as Record<string, string>)[event.locationId] ?? event.locationId)
      : null
    const space =
      locationId === event.locationId
        ? mainSceneSpace(ship, eventLocationSlug)
        : spaceForLocation(ship, locationSlug)
    if (!space) return null
    const plan = ship.plans.get(space.tierId)
    if (!plan) return null
    const station = stationIn(space, `${event.id}:${entityId}`)
    return {
      id: `avatar-${entityId}`,
      kind: 'avatar',
      spaceId: space.id,
      tierId: space.tierId,
      at: station.at,
      heading: station.heading,
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

    // Older events do not all have their main room backfilled on the event
    // itself. Their participating bodies still carry exact presences, so the
    // room shared by the largest part of the cast is the best available scene
    // location. A tie deliberately keeps source order instead of inventing a
    // more precise claim.
    const exactLocationByEntity: Record<string, string> = {}
    for (const presence of data.presences) {
      if (
        isLegacyPresenceActive(presence, targetPosition) &&
        presence.precision === 'EXACT_ROOM' &&
        presence.locationId
      ) {
        exactLocationByEntity[presence.entityId] = presence.locationId
      }
    }
    for (const [entityId, presence] of Object.entries(state.presences)) {
      if (presence.precision === 'EXACT_ROOM' && presence.locationId) {
        exactLocationByEntity[entityId] = presence.locationId
      } else {
        delete exactLocationByEntity[entityId]
      }
    }
    const participantBodyIds = new Set(
      data.sceneCharacters
        .filter((character) => character.eventId === target.id)
        .map((character) => character.bodyId),
    )
    const locationCounts: Record<string, number> = {}
    for (const bodyId of participantBodyIds) {
      const locationId = exactLocationByEntity[bodyId]
      if (locationId) locationCounts[locationId] = (locationCounts[locationId] ?? 0) + 1
    }
    const inferredEventLocationId = Object.entries(locationCounts).reduce<string | null>(
      (best, [locationId, count]) => (!best || count > locationCounts[best]! ? locationId : best),
      null,
    )
    const sceneLocationId = target.locationId ?? inferredEventLocationId

    // Temporal Presence rows establish the canonical baseline. A backfilled
    // world event for the same entity takes precedence over that baseline.
    const byEntity: Record<string, Apparition> = {}
    const presenceByEntity: Record<string, DisplayPresence> = {}
    for (const presence of data.presences) {
      if (!isLegacyPresenceActive(presence, targetPosition)) continue
      presenceByEntity[presence.entityId] = displayPresence(presence.entityId, presence)
      if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) continue
      const shown = avatar(presence.entityId, presence.locationId, {
        id: target.id,
        locationId: sceneLocationId,
      })
      if (shown) byEntity[presence.entityId] = shown
    }
    for (const [entityId, presence] of Object.entries(state.presences)) {
      presenceByEntity[entityId] = displayPresence(entityId, presence)
      if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) {
        delete byEntity[entityId]
        continue
      }
      const shown = avatar(entityId, presence.locationId, {
        id: target.id,
        locationId: sceneLocationId,
      })
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

  function enterSelectedScene() {
    viewMode = 'scene'
    const event = selectedEvent?.event
    if (!event) return
    const locationSlug = event.locationId
      ? ((data.locationSlugs as Record<string, string>)[event.locationId] ?? event.locationId)
      : null
    const primary = mainSceneSpace(ship, locationSlug)
    const shownParticipants = sceneCharacters.flatMap((character) =>
      character.shown ? [character.shown] : [],
    )
    const countsBySpace: Record<string, number> = {}
    for (const shown of shownParticipants) {
      countsBySpace[shown.spaceId] = (countsBySpace[shown.spaceId] ?? 0) + 1
    }
    const participant = shownParticipants.reduce<Apparition | null>(
      (best, shown) =>
        !best || (countsBySpace[shown.spaceId] ?? 0) > (countsBySpace[best.spaceId] ?? 0)
          ? shown
          : best,
      null,
    )
    const destination = primary ?? participant
    if (!destination) return
    tierId = destination.tierId
    jumpTo = 'footprint' in destination ? destination.id : destination.spaceId
    jumpAt =
      'footprint' in destination ? stationIn(destination, `visitor:${event.id}`).at : destination.at
  }

  let lastAutomaticallyEnteredSceneKey: string | null = null
  $effect(() => {
    const eventId = viewMode === 'scene' ? (selectedEvent?.event.id ?? null) : null
    if (!eventId) return
    // Include the resolved cast spaces so an older event whose room is inferred
    // can settle once reconstruction has replaced the previous event's extras.
    const sceneKey = `${eventId}:${selectedEvent?.event.locationId ?? ''}:${sceneCharacters
      .map((character) => character.shown?.spaceId ?? '')
      .join('|')}`
    if (sceneKey === lastAutomaticallyEnteredSceneKey) return
    lastAutomaticallyEnteredSceneKey = sceneKey
    enterSelectedScene()
  })

  function watchCharacter(character: SceneTarget) {
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

<div class="reconstruction-page">
  <ReconstructionHeader />
  {#if data.error}
    <section class="error-state" role="alert" aria-labelledby="reconstruction-error-title">
      <p class="eyebrow">{$t.reconstruction.loadErrorEyebrow}</p>
      <h2 id="reconstruction-error-title">{$t.reconstruction.loadErrorTitle}</h2>
      <p>{$t.reconstruction.loadErrorBody}</p>
      <button type="button" onclick={() => location.reload()}>{$t.reconstruction.retry}</button>
    </section>
  {:else if chronologicalEvents.length === 0}
    <section class="empty-state"><p>{$t.reconstruction.empty}</p></section>
  {:else}
    <ReconstructionWorkspace
      bind:viewMode
      bind:observer={perspectiveCharacterId}
      bind:selectedId={selectedBodyId}
      observers={perspectiveCharacters}
      event={{
        chapter: selectedEvent.chapter.number,
        title: selectedEvent.event.title,
        time: selectedEvent.event.occurredAtLabel,
      }}
      index={currentIndex}
      count={chronologicalEvents.length}
      {isPlaying}
      filtered={changeFilter !== 'all' || certaintyFilter !== 'all'}
      loading={perspectiveLoading}
      error={perspectiveError}
      activeTechnique={activeTechnique?.name ?? null}
      follow={followedBodyId && followedName
        ? {
            name: followedName,
            count: followedEventIndexes.length,
            onPrevious: () => jumpFollow(-1),
            onNext: () => jumpFollow(1),
            onStop: () => (followedBodyId = null),
          }
        : null}
      onEnter={enterSelectedScene}
      onChoose={chooseScene}
      onPlay={togglePlay}
    >
      {#snippet children(showNames, inspect, inspectDeck)}
        {#if viewMode === 'overview'}
          <ReconstructionViewport>
            <ReconstructionOverview
              markers={overviewMarkers}
              selectedId={selectedBodyId}
              onSelect={inspect}
              {showNames}
              detailed={showNames || Boolean(activeTechnique)}
              onGroup={inspectDeck}
              loading={perspectiveLoading}
            />
          </ReconstructionViewport>
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
              hour={selectedHour}
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
      {/snippet}
      {#snippet timeline(dismiss)}
        <ReconstructionTimeline
          entries={filteredEvents}
          bind:query={eventQuery}
          {currentIndex}
          followed={followedEventIndexes}
          onChoose={chooseScene}
          onDone={dismiss}
        />
      {/snippet}
      {#snippet inspector(initial, dismiss, deck)}
        <ReconstructionInspector
          {initial}
          event={{
            chapter: selectedEvent.chapter.number,
            title: selectedEvent.event.title,
            summary: selectedEvent.event.summary,
            time: selectedEvent.event.occurredAtLabel,
            evidence: selectedEvidence,
          }}
          changes={changedPresences}
          people={{
            initialDeck: deck,
            cast: sceneCharacters,
            avatars: extras,
            presences: visibleInPerspective(
              currentPresences,
              perspectiveCharacterId === 'canon' ? null : perspective,
            ),
            selectedId: selectedBodyId,
            followedId: followedBodyId,
            onSelect: selectOverviewCharacter,
            onWatch: watchCharacter,
            onFollow: toggleFollow,
            onDone: dismiss,
          }}
          statistics={{
            total: currentPresences.length,
            exact: extras.length,
            approximate: currentPresences.filter(
              (presence) => presence.tierId && presence.precision !== 'EXACT_ROOM',
            ).length,
            unlocated: unknownPresences,
          }}
        />
      {/snippet}
      {#snippet filters(showNames, onNames, dismiss)}
        <ReconstructionFilters
          bind:changeFilter
          bind:certaintyFilter
          {showNames}
          {onNames}
          onDone={dismiss}
          hatsu={{
            name: activeTechnique?.name ?? null,
            reading: hatsuReading,
            color: activeTechnique?.color ?? null,
            onChoose: () => hatsuPanelOpen.set(true),
          }}
          status={{
            loading: perspectiveLoading,
            error: perspectiveError,
            summary: perspective
              ? $t.reconstruction.perspectiveSummary(
                  perspective.visibleBodyIds.length,
                  perspective.knownFactCount,
                  perspective.beliefCount,
                )
              : null,
          }}
        />
      {/snippet}
    </ReconstructionWorkspace>
  {/if}
</div>

<style>
  .reconstruction-page {
    min-height: 100vh;
    background: #03080b;
    color: #edf1ee;
  }
  .tour-stage {
    position: absolute;
    inset: 0;
  }
  .scene-hatsu-report {
    position: absolute;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 5;
    display: grid;
    gap: 0.25rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid #6faeb2;
    background: #0c161dee;
    font-size: 0.8rem;
  }
  .scene-hatsu-report span {
    color: #99adb5;
    font-size: 0.7rem;
  }
  .error-state,
  .empty-state {
    max-width: 46rem;
    margin: 4rem auto;
    padding: 2rem;
    color: #bac9cf;
    line-height: 1.7;
  }
  .error-state {
    border: 1px solid #86574c;
    background: #271110;
  }
  .error-state h2 {
    margin: 0.5rem 0;
    font-size: 1.4rem;
  }
  .error-state button {
    min-height: 44px;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e5c57a;
    color: #e5c57a;
  }
  .eyebrow {
    color: #d5b86e;
    font-size: 0.7rem;
  }
</style>
