import { goto } from '$app/navigation'
import { untrack } from 'svelte'
import type { PageData } from './$types'
import { mapState } from '$lib/state/mapState.svelte'
import type {
  FollowMode,
  PerspectiveContext,
  PerspectiveOption,
} from '$lib/components/perspective/types'
import { displayName } from '$lib/utils/displayNames'
import type { Locale, Messages } from '$lib/i18n'
import type { TrackedObjectSnapshot } from '$lib/importantObjects'
import { resolveTierSlug } from '$lib/components/map/markerProjection'
import type { Location } from '@black-whale/domain'

interface ShipSource {
  data: () => PageData
  copy: () => Messages
  locale: () => Locale
  url: () => URL
}

function observerLabels(data: PageData, fallback: string) {
  const observer = data.perspective?.observer
  if (!observer) return { name: fallback, body: fallback, apparent: undefined, anomaly: false }
  const characters = data.worldState.characters
  const character = characters.find((candidate) => candidate.id === observer.characterId)
  const body = data.worldState.bodies.find((candidate) => candidate.id === observer.currentBodyId)
  const name = character?.canonicalName || fallback
  return {
    name,
    body: body?.label || body?.id || name,
    apparent: characters.find((candidate) => candidate.id === observer.apparentCharacterId)
      ?.canonicalName,
    anomaly: Boolean(observer.isDissonant),
  }
}

function buildContext(options: {
  data: PageData
  currentEvt: PageData['events'][number] | undefined
  perspectiveName: string
}): PerspectiveContext {
  const labels = observerLabels(options.data, options.perspectiveName)
  return {
    chapter: options.currentEvt?.chapter.number || 0,
    eventLabel: `${options.currentEvt?.sequence ?? 0}`,
    spoilerLimit: options.data.spoilerLimit ?? null,
    perspectiveName: labels.name,
    followedConsciousness: labels.name,
    occupiedBody: labels.body,
    apparentIdentity: labels.apparent || labels.body,
    followMode: mapState.followMode,
    hasAnomaly: labels.anomaly,
  }
}

export function createShipController(source: ShipSource) {
  const data = $derived(source.data())
  const copy = $derived(source.copy())
  const language = $derived(source.locale())
  const perspectiveOptions = $derived.by(() => {
    const fromCharacters: PerspectiveOption[] = (data.worldState?.characters || []).map((char) => ({
      id: char.id,
      label: displayName(char.canonicalName, language),
      kind: 'character',
    }))

    return [
      { id: 'reader', label: copy.ship.readerView, kind: 'reader' as const },
      ...fromCharacters,
    ]
  })

  const currentEvt = $derived(
    data.events.find((event) => event.id === data.selectedEventId) ||
      data.events[data.events.length - 1],
  )

  const selectedPerspective = $derived(
    perspectiveOptions.find((opt) => opt.id === mapState.selectedPerspectiveId) ||
      perspectiveOptions[0],
  )

  const contextState = $derived(
    buildContext({
      data,
      currentEvt,
      perspectiveName: selectedPerspective?.label || copy.ship.readerView,
    }),
  )

  const currentDeckLabel = $derived.by(() => {
    if (mapState.currentZoomLevel === 'OVERVIEW') return copy.ship.overview
    if (mapState.currentZoomLevel === 'LOCAL')
      return (mapState.selectedLocationId || copy.ship.localArea).replaceAll('-', ' ')
    return copy.ship.tierLabel(mapState.selectedTier?.replace('tier-', '') || '')
  })

  const importantObjects = $derived(data.importantObjects as TrackedObjectSnapshot[])
  const trackingValue = $derived(
    mapState.trackedTargetKind === 'reader'
      ? 'reader'
      : `${mapState.trackedTargetKind}:${mapState.trackedTargetId}`,
  )
  const trackedObject = $derived(
    mapState.trackedTargetKind === 'object'
      ? importantObjects.find((object) => object.id === mapState.trackedTargetId) || null
      : null,
  )

  function tierForObject(object: TrackedObjectSnapshot): string | null {
    if (!object.location) return null
    const worldLocations = (data.locations ||
      data.worldState?.locations ||
      []) as unknown as Location[]
    const locations = new Map<string, Location>(
      worldLocations.map((location) => [location.id, location]),
    )
    return resolveTierSlug(object.location, locations)
  }

  function syncTrackingTarget(target: string) {
    if (target.startsWith('object:')) {
      const objectId = target.slice('object:'.length)
      mapState.setTrackedTarget(objectId, 'object')
      const object = importantObjects.find((candidate) => candidate.id === objectId)
      const tier = object ? tierForObject(object) : null
      if (!tier) mapState.selectTier(null)
      else if (mapState.currentZoomLevel !== 'OVERVIEW' && mapState.selectedTier !== tier) {
        mapState.selectTier(tier)
      }
    } else if (target.startsWith('character:')) {
      mapState.setTrackedTarget(target.slice('character:'.length), 'character')
    } else {
      mapState.setTrackedTarget('reader', 'reader')
    }
  }

  $effect(() => {
    mapState.setFollowMode((data.followMode as FollowMode) || 'consciousness')

    const selectedByUrl = perspectiveOptions.find(
      (option) => option.id === data.selectedPerspectiveId,
    )
    if (selectedByUrl) {
      mapState.setPerspective(selectedByUrl.id, selectedByUrl.label, selectedByUrl.kind)
    }

    const target = data.selectedTrackingTarget || 'reader'
    // URL changes may follow a target; browsing another deck must stay a local choice.
    untrack(() => syncTrackingTarget(target))

    if (!selectedPerspective) {
      return
    }

    mapState.setPerspective(
      selectedPerspective.id,
      selectedPerspective.label,
      selectedPerspective.kind,
    )
  })

  // Timeline slider change
  function selectEventIndex(eventIndex: number) {
    const selectedEvent = data.events[eventIndex]
    if (!selectedEvent) return

    const url = new URL(source.url())
    url.searchParams.set('eventId', selectedEvent.id)
    url.searchParams.delete('sequence')
    return goto(url.toString(), { keepFocus: true, replaceState: true, noScroll: true })
  }

  function handlePerspectiveSelect(id: string) {
    const found = perspectiveOptions.find((option) => option.id === id)
    if (!found) return

    mapState.setPerspective(found.id, found.label, found.kind)
    mapState.setTrackedTarget(found.id, found.kind === 'reader' ? 'reader' : 'character')

    const url = new URL(source.url())
    url.searchParams.set('perspective', found.id)
    url.searchParams.set('target', found.kind === 'reader' ? 'reader' : `character:${found.id}`)
    url.searchParams.set('follow', mapState.followMode)
    goto(url.toString(), { keepFocus: true })
  }

  function handleTrackingSelect(value: string) {
    if (value === 'reader') {
      handlePerspectiveSelect('reader')
      return
    }
    if (value.startsWith('character:')) {
      handlePerspectiveSelect(value.slice('character:'.length))
      return
    }
    if (!value.startsWith('object:')) return

    const id = value.slice('object:'.length)
    const object = importantObjects.find((candidate) => candidate.id === id)
    if (!object) return
    mapState.setTrackedTarget(id, 'object')

    if (object.location) {
      const tier = tierForObject(object)
      if (tier) mapState.selectTier(tier)
    } else {
      mapState.selectTier(null)
    }

    const url = new URL(source.url())
    url.searchParams.set('target', value)
    goto(url.toString(), { keepFocus: true, replaceState: true })
  }

  function handleFollowModeSelect(mode: FollowMode) {
    mapState.setFollowMode(mode)

    const url = new URL(source.url())
    url.searchParams.set('perspective', mapState.selectedPerspectiveId)
    url.searchParams.set('follow', mode)
    goto(url.toString(), { keepFocus: true, replaceState: true })
  }

  return {
    get perspectiveOptions() {
      return perspectiveOptions
    },
    get currentEvt() {
      return currentEvt
    },
    get contextState() {
      return contextState
    },
    get currentDeckLabel() {
      return currentDeckLabel
    },
    get importantObjects() {
      return importantObjects
    },
    get trackingValue() {
      return trackingValue
    },
    get trackedObject() {
      return trackedObject
    },
    selectEventIndex,
    handlePerspectiveSelect,
    handleTrackingSelect,
    handleFollowModeSelect,
  }
}

export type ShipController = ReturnType<typeof createShipController>
