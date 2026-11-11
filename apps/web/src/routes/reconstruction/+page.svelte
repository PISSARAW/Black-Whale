<script lang="ts">
  import type { PageData } from './$types'
  import { onDestroy, onMount, tick, untrack } from 'svelte'
  import { browser } from '$app/environment'
  import { replaceState } from '$app/navigation'
  import { page } from '$app/stores'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import ReconstructionHeader from '$lib/components/reconstruction/ReconstructionHeader.svelte'
  import ReconstructionWorkspace from '$lib/components/reconstruction/ReconstructionWorkspace.svelte'
  import ReconstructionViewport from '$lib/components/reconstruction/ReconstructionViewport.svelte'
  import ReconstructionTimeline from '$lib/components/reconstruction/ReconstructionTimeline.svelte'
  import ReconstructionInspector from '$lib/components/reconstruction/ReconstructionInspector.svelte'
  import ReconstructionFilters from '$lib/components/reconstruction/ReconstructionFilters.svelte'
  import type { DisplayPresence, SceneTarget } from '$lib/reconstruction/workspaceTypes'
  import { diffPresences } from '$lib/reconstruction/presenceChanges'
  import ReconstructionOverview from '$lib/components/reconstruction/ReconstructionOverview.svelte'
  import { activeHatsu, hatsuPanelOpen } from '$lib/nen/hatsuState'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { theShip } from '$lib/tour/blueprint'
  import { flashFor, type Apparition, type TourFlash } from '$lib/tour/apparitions'
  import { EMPTY_WORLD, type TourReport, type TourWorld } from '$lib/tour/hatsu'
  import { TourHatsuView } from '$lib/tour/pageHatsuView.svelte'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import { TourCastController } from '$lib/tour/pageCastController'
  import type { CastHand } from '$lib/tour/pageCasting'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { displayName, eventTitle } from '$lib/utils/displayNames'
  import { evidenceForEvent } from '$lib/reconstruction/evidence'
  import { observedBy } from '$lib/reconstruction/perspective'
  import { PerspectiveLoader } from '$lib/reconstruction/perspectiveLoader.svelte'
  import { mainSceneSpace } from '$lib/reconstruction/sceneEntry'
  import { reconstructAt } from '$lib/reconstruction/reconstructAt'
  import {
    resolveInitialReconstructionParams,
    sortChronologicalEvents,
    writeReconstructionUrl,
  } from '$lib/reconstruction/urlState'
  import { shipHourOf } from '$lib/tour/hour'
  import { stationIn } from '$lib/tour/cast/stations'
  import type { Space, Vec2 } from '$lib/tour/types'

  let { data }: { data: PageData } = $props()
  const ship = theShip()

  const chronologicalEvents = $derived(sortChronologicalEvents(data.chapters))
  const initialParams = untrack(() =>
    resolveInitialReconstructionParams(
      data.chapters,
      browser ? new URLSearchParams(window.location.search) : $page.url.searchParams,
    ),
  )

  let currentIndex = $state(initialParams.index)
  let isPlaying = $state(false)
  let playbackTimer: ReturnType<typeof setTimeout> | undefined
  let extras = $state<Apparition[]>([])
  let viewMode = $state<'overview' | 'scene'>(initialParams.view)
  let selectedBodyId = $state<string | null>(null)
  let followedBodyId = $state<string | null>(initialParams.follow)
  let eventQuery = $state('')
  let changeFilter = $state<'all' | 'changed'>(initialParams.changeFilter)
  let certaintyFilter = $state<'all' | DisplayPresence['certainty']>(
    initialParams.certaintyFilter as 'all' | DisplayPresence['certainty'],
  )
  let perspectiveCharacterId = $state(initialParams.observer)
  const lens = new PerspectiveLoader()
  const perspective = $derived(lens.projection)
  const perspectiveLoading = $derived(lens.loading)
  const perspectiveError = $derived(lens.error)
  let mounted = $state(false)
  onMount(async () => {
    // SvelteKit assigns its root component after the initial mount flush.
    // Waiting one tick keeps URL synchronisation from calling replaceState
    // while that root is still undefined.
    await tick()
    mounted = true
  })

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

  // A character's point of view hides, in the scene as on the map, every body
  // their projection does not name — and everybody while it is still loading.
  const observerView = $derived({ observer: perspectiveCharacterId, projection: perspective })
  const visibleExtras = $derived(
    observedBy(extras, observerView, (shown) => shown.id.slice('avatar-'.length)),
  )
  let sceneCharacters = $derived(
    observedBy(
      data.sceneCharacters
        .filter((character) => character.eventId === chronologicalEvents[currentIndex]?.event.id)
        .map((character) => ({
          ...character,
          name: displayName(character.canonicalName, $locale),
          shown: visibleExtras.find((extra) => extra.id === `avatar-${character.bodyId}`) ?? null,
        })),
      observerView,
      (character) => character.bodyId,
    ).sort((left, right) => left.name.localeCompare(right.name, $locale)),
  )

  let activeBodyIds = $derived(new Set(sceneCharacters.map((character) => character.bodyId)))
  let presenceChanges = $derived(diffPresences(previousPresences, currentPresences))
  let visiblePresenceChanges = $derived(
    observedBy(presenceChanges, observerView, (presence) => presence.entityId),
  )

  let changedPresences = $derived(
    visiblePresenceChanges.filter((presence) => presence.change !== 'unchanged'),
  )
  let overviewMarkers = $derived(
    visiblePresenceChanges
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
  const visibleCurrentPresences = $derived(
    observedBy(currentPresences, observerView, (presence) => presence.entityId),
  )
  let perspectiveCharacters = $derived.by(() => {
    const characters: Record<string, string> = {}
    const eventId = chronologicalEvents[currentIndex]?.event.id
    for (const character of data.sceneCharacters) {
      if (character.eventId !== eventId && character.characterId !== perspectiveCharacterId)
        continue
      characters[character.characterId] = displayName(character.canonicalName, $locale)
    }
    return Object.entries(characters)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, $locale))
  })
  let unknownPresences = $derived(visibleCurrentPresences.filter((presence) => !presence.tierId))
  let filteredEvents = $derived(
    chronologicalEvents
      .map((entry, index) => ({ ...entry, index }))
      .filter((entry) => {
        const query = eventQuery.trim().toLocaleLowerCase($locale)
        return (
          !query ||
          eventTitle(entry.event.title, $locale).toLocaleLowerCase($locale).includes(query) ||
          entry.event.summary.toLocaleLowerCase($locale).includes(query) ||
          String(entry.chapter.number).includes(query)
        )
      }),
  )
  let selectedEvent = $derived(chronologicalEvents[currentIndex])
  let selectedHour = $derived(shipHourOf(selectedEvent?.event ?? {}))
  let selectedEvidence = $derived.by(() => {
    if (!selectedEvent) return []
    const { chapter, event } = selectedEvent
    return evidenceForEvent({
      chapterNumber: chapter.number,
      eventId: event.id,
      occurredAtBasis: event.occurredAtBasis,
      occurredAtSource: event.occurredAtSource,
      sourceIds: data.sourceIdsByEvent[event.id] ?? [],
      sources: data.sources,
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

  let hatsuMomentId: string | null = null
  $effect(() => {
    const eventId = selectedEvent?.event.id ?? null
    if (eventId === hatsuMomentId) return
    hatsuMomentId = eventId
    hatsuWorld = EMPTY_WORLD
    hatsuReport = null
    hatsuFlash = null
  })

  $effect(() => {
    if (!mounted) return
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

  function presenceName(entityId: string): string {
    const legacy = data.presences.find((presence) => presence.entityId === entityId)
    const canonicalName =
      legacy?.body?.character?.canonicalName ??
      legacy?.body?.label ??
      $t.reconstruction.unknownCharacter
    return displayName(canonicalName, $locale)
  }

  function momentAt(index: number) {
    return reconstructAt({
      index,
      chronologicalEvents,
      worldEvents: data.worldEvents,
      presences: data.presences,
      sceneCharacters: data.sceneCharacters,
      locations: data.locations,
      locationSlugs: data.locationSlugs,
      ship,
      nameOf: presenceName,
    })
  }

  $effect(() => {
    const current = momentAt(currentIndex)
    const previous = momentAt(currentIndex - 1)
    extras = current.extras
    currentPresences = current.presences
    previousPresences = previous.presences

    // When the moment or the followed person changes, stay on the visitor's deck
    // if it has a known presence, else go to a populated one. The deck is read
    // untracked: a visitor walking to an empty deck is not sent back.
    const deck = untrack(() => tierId)
    const followed = followedBodyId
      ? current.extras.find((shown) => shown.id === `avatar-${followedBodyId}`)
      : null
    const focus =
      followed ?? current.extras.find((shown) => shown.tierId === deck) ?? current.extras[0]
    if (focus && focus.tierId !== deck) {
      tierId = focus.tierId
      jumpTo = focus.spaceId
      jumpAt = focus.at
    }
  })

  function stopPlayback() {
    isPlaying = false
    if (playbackTimer) clearTimeout(playbackTimer)
    playbackTimer = undefined
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
    const next = momentAt(currentIndex + 1)
    const nextChanges = diffPresences(currentPresences, next.presences)
    const delay = Math.min(
      5000,
      1200 + nextChanges.filter((change) => change.change !== 'unchanged').length * 240,
    )
    playbackTimer = setTimeout(() => {
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
    const participantBodyIds = new Set(
      data.sceneCharacters
        .filter((character) => character.eventId === event.id)
        .map((character) => character.bodyId),
    )
    const shownParticipants = extras.filter((shown) =>
      participantBodyIds.has(shown.id.slice('avatar-'.length)),
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
    // The cast spaces let an inferred room settle once the extras are replaced;
    // sorted, so the language's name order never reads as a new scene.
    const spaces = extras.map((shown) => shown.spaceId).toSorted()
    const sceneKey = `${eventId}:${selectedEvent?.event.locationId ?? ''}:${spaces.join('|')}`
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
        title: eventTitle(selectedEvent.event.title, $locale),
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
              extras={visibleExtras}
              touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
              soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
              hour={selectedHour}
              loadingLabel={$t.tour.loading}
              unsupportedLabel={$t.tour.unsupported}
            />
            {#if hatsuReport}
              <output class="scene-hatsu-report" aria-live="polite">
                <strong>{activeTechnique?.name ?? $t.reconstruction.hatsuLens}</strong>
                <span>{$t.reconstruction.hatsuApplied}</span>
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
            title: eventTitle(selectedEvent.event.title, $locale),
            summary: selectedEvent.event.summary,
            time: selectedEvent.event.occurredAtLabel,
            evidence: selectedEvidence,
          }}
          changes={changedPresences}
          people={{
            initialDeck: deck,
            cast: sceneCharacters,
            avatars: visibleExtras,
            presences: visibleCurrentPresences,
            selectedId: selectedBodyId,
            followedId: followedBodyId,
            onSelect: selectOverviewCharacter,
            onWatch: watchCharacter,
            onFollow: toggleFollow,
            onDone: dismiss,
          }}
          statistics={{
            total: visibleCurrentPresences.length,
            exact: visibleExtras.length,
            approximate: visibleCurrentPresences.filter(
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
