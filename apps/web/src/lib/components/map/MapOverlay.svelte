<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import CharacterMarker from './CharacterMarker.svelte'
  import type { MarkerIdentityState } from '$lib/components/perspective/types'
  import { page } from '$app/stores'
  import { toEnglishDisplayName } from '$lib/utils/displayNames'
  import { activeHatsu, parallelFutureVisible } from '$lib/nen/hatsuState.js'

  // Mapping between location slugs and SVG coordinates for each tier
  // These coordinates are based on the SVG viewBox (0 0 1000 600)
  const locationCoordinates: Record<string, Record<string, { x: number; y: number }>> = {
    'tier-1': {
      'tier-1': { x: 500, y: 285 },
      'king-quarters': { x: 475, y: 160 },
      'king-living-quarters': { x: 475, y: 160 },
      'princes-burial-chamber': { x: 475, y: 110 },
      'banquet-hall': { x: 475, y: 255 },
      'vvip-living-quarters': { x: 290, y: 385 },
      'queens-living-quarters': { x: 422, y: 385 },
      'royal-residential-sector': { x: 530, y: 385 },
      'soldiers-living-quarters': { x: 652, y: 385 },
      casino: { x: 360, y: 385 },
      'vip-jail': { x: 790, y: 320 },
      'vvip-prison-beyond': { x: 790, y: 270 },
      'supreme-court': { x: 790, y: 410 },
      lifeboats: { x: 865, y: 300 },
    },
    'tier-2': {
      'tier-2': { x: 500, y: 300 },
      'heilly-secret-hideout': { x: 400, y: 225 },
      'vip-guest-rooms': { x: 400, y: 225 },
      'ministry-of-justice': { x: 660, y: 385 },
      'vip-witness-protection-area': { x: 660, y: 385 },
      bulkhead: { x: 500, y: 498 },
    },
    'tier-3': {
      'tier-3': { x: 500, y: 285 },
      'residential-units': { x: 270, y: 360 },
      'residential-room-3101': { x: 220, y: 195 },
      'central-hospital': { x: 500, y: 190 },
      'central-police-station': { x: 450, y: 385 },
      'central-courthouse': { x: 550, y: 385 },
      'political-ward': { x: 500, y: 385 },
      'heilly-family-office': { x: 715, y: 420 },
      cineplex: { x: 715, y: 160 },
      'observation-deck': { x: 715, y: 295 },
    },
    'tier-4': {
      'tier-4': { x: 485, y: 300 },
      'central-passage': { x: 500, y: 525 },
      'recycling-sewage-facilities': { x: 500, y: 525 },
      'xi-yu-family-office': { x: 400, y: 300 },
      'royal-army-conference-room': { x: 575, y: 155 },
    },
    'tier-5': {
      'tier-5': { x: 450, y: 285 },
      'central-dining-hall': { x: 585, y: 370 },
      'standard-cabins': { x: 270, y: 290 },
      'recycling-facility': { x: 400, y: 300 },
      'medical-clinic': { x: 685, y: 375 },
      'cha-r-family-office': { x: 460, y: 375 },
      warehouse: { x: 560, y: 240 },
    },
  }

  const tierVisuals: Record<string, { label: string; overviewY: number }> = {
    'tier-1': { label: 'Tier 1', overviewY: 21 },
    'tier-2': { label: 'Tier 2', overviewY: 31 },
    'tier-3': { label: 'Tier 3', overviewY: 46 },
    'tier-4': { label: 'Tier 4', overviewY: 63 },
    'tier-5': { label: 'Tier 5', overviewY: 78 },
  }

  // Calculate marker positions from presences
  let presences = $derived($page.data.worldState?.presences || [])
  let characters = $derived($page.data.worldState?.characters || [])
  let bodies = $derived($page.data.worldState?.bodies || [])
  let consciousnesses = $derived($page.data.worldState?.consciousnesses || [])
  let occupancies = $derived($page.data.worldState?.occupancies || [])
  let appearances = $derived($page.data.worldState?.appearances || [])
  let locations = $derived($page.data.worldState?.locations || [])
  let perspective = $derived($page.data.perspective || null)
  let events = $derived($page.data.events || [])
  let currentEvent = $derived(events.find((event: any) => event.id === $page.data.selectedEventId))
  let currentSequence = $derived(currentEvent?.sequence || 0)
  let nextChapterState = $derived($page.data.nextChapterState || null)
  let futureMode = $derived($activeHatsu?.id === 'parallel-future' && $parallelFutureVisible)

  function resolveTierSlug(location: any, byId: Map<string, any>) {
    let current = location
    let depth = 0

    while (current && depth < 8) {
      if (current.type === 'TIER') {
        return current.slug
      }
      const prefixedTier = current.slug?.match(/^(tier-[1-5])(?:-|$)/)?.[1]
      if (prefixedTier) return prefixedTier
      current = current.parentLocationId ? byId.get(current.parentLocationId) : null
      depth += 1
    }

    return null
  }

  function belongsToLocation(location: any, targetSlug: string, byId: Map<string, any>) {
    let current = location
    let depth = 0
    while (current && depth < 8) {
      if (current.slug === targetSlug || current.slug.endsWith(`-${targetSlug}`)) return true
      current = current.parentLocationId ? byId.get(current.parentLocationId) : null
      depth += 1
    }
    return false
  }

  function getExactTierCoordinates(tierId: string, locationSlug: string) {
    const tierCoordinates = locationCoordinates[tierId] || {}
    const coordinateKey = Object.keys(tierCoordinates)
      .sort((left, right) => right.length - left.length)
      .find((key) => locationSlug === key || locationSlug.endsWith(`-${key}`))
    const directCoordinates = coordinateKey ? tierCoordinates[coordinateKey] : undefined
    if (directCoordinates) return { ...directCoordinates, isSmallRoom: false }

    // Tier 1 rooms 1001–1014 are drawn as two vertical columns in tier-1.svelte.
    // Odd rooms are on the right, even rooms on the left.
    const princeRoomMatch =
      tierId === 'tier-1' ? locationSlug.match(/room-10(0[1-9]|1[0-4])$/) : null
    if (princeRoomMatch) {
      const roomNumber = Number(princeRoomMatch[1])
      const row = Math.floor((roomNumber - 1) / 2)
      return {
        x: roomNumber % 2 === 0 ? 477.5 : 582.5,
        y: 320.7 + row * 21.4,
        isSmallRoom: true,
      }
    }

    return null
  }

  function spreadAroundAnchor(
    anchor: { x: number; y: number; isSmallRoom?: boolean },
    index: number,
    count: number,
  ) {
    if (count <= 1) return { x: anchor.x, y: anchor.y }

    const columns = Math.min(anchor.isSmallRoom ? 2 : 6, Math.ceil(Math.sqrt(count)))
    const rows = Math.ceil(count / columns)
    const column = index % columns
    const row = Math.floor(index / columns)
    const spacingX = anchor.isSmallRoom ? 12 : 24
    const spacingY = anchor.isSmallRoom ? 8 : 20

    return {
      x: anchor.x + (column - (columns - 1) / 2) * spacingX,
      y: anchor.y + (row - (rows - 1) / 2) * spacingY,
    }
  }

  function getTemporalVisual(presence: any) {
    if (presence.certainty === 'PROBABLE') {
      return { color: '#f0b75e', label: 'Assumed position', detail: 'Likely presence, unconfirmed' }
    }
    if (presence.certainty === 'LAST_KNOWN') {
      return {
        color: '#e47f61',
        label: 'Last known position',
        detail: 'Potentially outdated information',
      }
    }
    if (presence.certainty !== 'CONFIRMED') {
      return { color: '#8a9798', label: 'Unknown status', detail: 'Certainty level not provided' }
    }

    const fromSequence = presence.fromEvent?.sequence
    const untilSequence = presence.untilEvent?.sequence

    if (untilSequence !== undefined && untilSequence !== null) {
      return {
        color: '#ad8bea',
        label: 'Confirmed over a period',
        detail: `Events ${fromSequence ?? '?'} to ${untilSequence}`,
      }
    }
    if (presence.fromEventId === currentEvent?.id) {
      return {
        color: '#55d1e2',
        label: 'Confirmed at this event',
        detail: `Event ${currentSequence}`,
      }
    }
    if (presence.fromEvent?.chapterId && presence.fromEvent.chapterId === currentEvent?.chapterId) {
      return {
        color: '#6ac890',
        label: 'Confirmed during this chapter',
        detail: `Since event ${fromSequence ?? '?'}`,
      }
    }
    return {
      color: '#5bb9ad',
      label: 'Confirmed presence',
      detail: `Since event ${fromSequence ?? '?'}`,
    }
  }

  function calculatePresencePosition(p: any, sourcePresences: any[], sourceLocations: any[]) {
    const locationsById = new Map<string, any>(
      sourceLocations.map((location: any) => [location.id, location]),
    )
    const loc = sourceLocations.find((location: any) => location.id === p.locationId)
    const tierId = loc ? resolveTierSlug(loc, locationsById) : null
    let x = 500
    let y = 300

    if (loc && tierId && locationCoordinates[tierId]) {
      const coords = getExactTierCoordinates(tierId, loc.slug)
      if (coords) {
        const colocatedEntityIds = sourcePresences
          .filter((candidate: any) => candidate.locationId === p.locationId)
          .map((candidate: any) => candidate.entityId)
          .sort()
        const colocatedIndex = Math.max(0, colocatedEntityIds.indexOf(p.entityId))
        const colocatedCount = colocatedEntityIds.length

        ;({ x, y } = spreadAroundAnchor(coords, colocatedIndex, colocatedCount))
      } else if (loc.parentLocationId) {
        const parent: any = locationsById.get(loc.parentLocationId)
        const parentCoords = parent ? getExactTierCoordinates(tierId, parent.slug) : undefined
        if (parentCoords) {
          const siblings = sourcePresences
            .filter((candidate: any) => {
              const candidateLocation = locationsById.get(candidate.locationId)
              return candidateLocation?.parentLocationId === loc.parentLocationId
            })
            .map((candidate: any) => candidate.entityId)
            .sort()
          ;({ x, y } = spreadAroundAnchor(
            parentCoords,
            Math.max(0, siblings.indexOf(p.entityId)),
            siblings.length,
          ))
        } else {
          const tierAnchor = getExactTierCoordinates(tierId, tierId) || { x: 500, y: 300 }
          const tierEntities = sourcePresences
            .filter((candidate: any) => {
              const candidateLocation = locationsById.get(candidate.locationId)
              return (
                candidateLocation && resolveTierSlug(candidateLocation, locationsById) === tierId
              )
            })
            .map((candidate: any) => candidate.entityId)
            .sort()
          ;({ x, y } = spreadAroundAnchor(
            tierAnchor,
            Math.max(0, tierEntities.indexOf(p.entityId)),
            tierEntities.length,
          ))
        }
      } else {
        const tierAnchor = getExactTierCoordinates(tierId, tierId) || { x: 500, y: 300 }
        const tierEntities = sourcePresences
          .filter((candidate: any) => {
            const candidateLocation = locationsById.get(candidate.locationId)
            return candidateLocation && resolveTierSlug(candidateLocation, locationsById) === tierId
          })
          .map((candidate: any) => candidate.entityId)
          .sort()
        ;({ x, y } = spreadAroundAnchor(
          tierAnchor,
          Math.max(0, tierEntities.indexOf(p.entityId)),
          tierEntities.length,
        ))
      }
    }

    return { x, y, loc, tierId }
  }

  let dynamicCharacters = $derived(
    presences
      .map((p: any) => {
        const facts = perspective?.knownFacts || []
        const beliefs = perspective?.beliefs || []
        const observer = perspective?.observer

        const body = bodies.find((candidate: any) => candidate.id === p.entityId)
        const appearanceState = appearances.find(
          (candidate: any) => candidate.entityId === p.entityId,
        )
        const structuralApparentCharacter = appearanceState
          ? characters.find(
              (candidate: any) => candidate.id === appearanceState.appearanceCharacterId,
            )
          : null
        const biologicalOwner = body
          ? characters.find((candidate: any) => candidate.id === body.originalCharacterId)
          : null
        const ownerCharacter = biologicalOwner || structuralApparentCharacter
        const occupancy = occupancies.find((candidate: any) => candidate.bodyId === p.entityId)
        const activeConsciousness = occupancy
          ? consciousnesses.find((candidate: any) => candidate.id === occupancy.consciousnessId)
          : null
        const consciousnessOwner = activeConsciousness?.originCharacterId
          ? characters.find(
              (candidate: any) => candidate.id === activeConsciousness.originCharacterId,
            )
          : null
        const { x, y, loc, tierId } = calculatePresencePosition(
          p,
          presences as any[],
          locations as any[],
        )

        // Unknown positions belong in the dedicated manifest instead of being
        // drawn at arbitrary fallback coordinates on a tier.
        if (!body || !ownerCharacter || !loc || loc.type === 'UNKNOWN') return null

        const bodyName =
          toEnglishDisplayName(biologicalOwner?.canonicalName || body?.label) || 'Unknown body'
        const structuralConsciousnessName = toEnglishDisplayName(
          consciousnessOwner?.canonicalName || activeConsciousness?.label || bodyName,
        )
        const structuralAppearanceName = toEnglishDisplayName(
          structuralApparentCharacter?.canonicalName || bodyName,
        )
        const perspectiveIsReader = mapState.selectedPerspectiveKind === 'reader'
        const observerCharacter = characters.find((char: any) => char.id === observer?.characterId)
        const observerApparentCharacter = characters.find(
          (char: any) => char.id === observer?.apparentCharacterId,
        )
        const knownCharacterIds = new Set<string>(perspective?.knownCharacters || [])
        const isObserverBody = Boolean(
          observer?.currentBodyId && observer.currentBodyId === p.entityId,
        )

        const relatedFacts = facts.filter(
          (fact: any) =>
            fact.subjectId === p.entityId || fact.subjectId === body?.originalCharacterId,
        )
        const relatedBeliefs = beliefs.filter(
          (belief: any) =>
            belief.subjectId === p.entityId || belief.subjectId === body?.originalCharacterId,
        )

        const hasConfirmedKnowledge =
          isObserverBody ||
          knownCharacterIds.has(body?.originalCharacterId) ||
          relatedFacts.length > 0
        const hasBeliefOnly = !hasConfirmedKnowledge && relatedBeliefs.length > 0

        const shouldMaskIdentity = !perspectiveIsReader && !hasConfirmedKnowledge
        const consciousness = isObserverBody
          ? observerCharacter?.canonicalName ||
            observer?.consciousnessId ||
            structuralConsciousnessName
          : structuralConsciousnessName
        const appearance = isObserverBody
          ? observerApparentCharacter?.canonicalName || structuralAppearanceName
          : structuralAppearanceName
        const followedIdentity =
          mapState.followMode === 'body'
            ? bodyName
            : mapState.followMode === 'appearance'
              ? appearance
              : consciousness

        const perceivedIdentity = perspectiveIsReader
          ? followedIdentity
          : isObserverBody
            ? followedIdentity
            : shouldMaskIdentity
              ? hasBeliefOnly
                ? 'Assumed identity'
                : 'Unknown individual'
              : appearance

        const suspicionLabel =
          !perspectiveIsReader && hasBeliefOnly ? 'Active suspicion' : undefined

        const contested = relatedFacts.some((fact: any) => fact.truthStatus === 'CONTESTED')
        const knowledgeState = contested
          ? 'contradicted'
          : hasConfirmedKnowledge
            ? 'confirmed'
            : hasBeliefOnly
              ? 'believed'
              : p.certainty === 'CONFIRMED'
                ? 'confirmed'
                : p.certainty === 'PROBABLE'
                  ? 'suspected'
                  : p.certainty === 'LAST_KNOWN'
                    ? 'outdated'
                    : 'unknown'

        const structuralTransfer = Boolean(
          activeConsciousness?.originCharacterId &&
          body.originalCharacterId !== activeConsciousness.originCharacterId,
        )
        const transferFlag =
          structuralTransfer || (isObserverBody && Boolean(observer?.isDissonant))

        const sourceFromFact = relatedFacts[0]?.predicate || relatedBeliefs[0]?.predicate
        const sourceLabel = hasConfirmedKnowledge
          ? `Fact: ${sourceFromFact}`
          : hasBeliefOnly
            ? `Belief: ${sourceFromFact}`
            : 'Structural presence'

        const visual = tierId ? tierVisuals[tierId] : undefined
        const temporalVisual = getTemporalVisual(p)
        const overviewX = 50
        const overviewY = visual?.overviewY ?? 46

        const mapped: MarkerIdentityState & {
          tierId: string | null
          locationId?: string
          location?: any
          overviewX: number
          overviewY: number
        } = {
          id: p.entityId,
          tierId,
          locationId: loc?.slug,
          location: loc,
          overviewX,
          overviewY,
          x: x / 10,
          y: y / 6,
          body: bodyName,
          consciousness,
          appearance,
          perceivedIdentity,
          transferFlag,
          suspicionLabel,
          knowledgeState,
          sourceLabel,
          sinceLabel: p.fromEventId ? `since ${p.fromEventId}` : 'unknown event',
          positionColor: temporalVisual.color,
          tierLabel: visual?.label || 'Outside tier',
          locationLabel: loc?.name || 'Unknown position',
          temporalLabel: temporalVisual.label,
          temporalDetail: temporalVisual.detail,
          factionTags: ownerCharacter?.factionTags || [],
          isFollowTarget: isObserverBody,
        }

        const nextPresence = nextChapterState?.presences?.find(
          (candidate: any) => candidate.entityId === p.entityId,
        )
        const nextBiologicalState = nextChapterState?.bodyStates?.[p.entityId]
        const followedCharacter =
          mapState.followMode === 'consciousness'
            ? consciousnessOwner
            : mapState.followMode === 'appearance'
              ? structuralApparentCharacter || biologicalOwner
              : biologicalOwner
        mapped.originalCharacterId = followedCharacter?.id || ownerCharacter.id
        mapped.hatsuNames = ownerCharacter.hatsuNames || []
        mapped.futureChange =
          nextBiologicalState === 'DEAD' || nextBiologicalState === 'DESTROYED'
            ? 'dead'
            : nextPresence && nextPresence.locationId !== p.locationId
              ? 'moved'
              : 'stable'

        return mapped
      })
      .filter(Boolean),
  )

  let futureCharacters = $derived.by(() => {
    if (!futureMode || !nextChapterState) return []
    const nextPresences = nextChapterState.presences || []
    const nextLocations = nextChapterState.locations || locations
    const nextBodies = nextChapterState.bodies || []
    const nextCharacters = nextChapterState.characters || []

    const mappedFuture = nextPresences
      .map((presence: any) => {
        const body = nextBodies.find((candidate: any) => candidate.id === presence.entityId)
        const character = body
          ? nextCharacters.find((candidate: any) => candidate.id === body.originalCharacterId)
          : null
        const biologicalState = nextChapterState.bodyStates?.[presence.entityId]
        if (!body || !character || biologicalState === 'DEAD' || biologicalState === 'DESTROYED')
          return null

        const { x, y, loc, tierId } = calculatePresencePosition(
          presence,
          nextPresences,
          nextLocations,
        )
        const visual = tierId ? tierVisuals[tierId] : undefined
        return {
          id: presence.entityId,
          x: x / 10,
          y: y / 6,
          body: toEnglishDisplayName(character.canonicalName),
          consciousness: toEnglishDisplayName(character.canonicalName),
          appearance: toEnglishDisplayName(character.canonicalName),
          perceivedIdentity: `${toEnglishDisplayName(character.canonicalName)} · Ch. ${nextChapterState.chapterNumber}`,
          knowledgeState: 'confirmed' as const,
          positionColor: '#d598ff',
          tierLabel: visual?.label || 'Outside tier',
          locationLabel: loc?.name || 'Unknown future position',
          temporalLabel: 'Parallel future',
          temporalDetail: `Position in chapter ${nextChapterState.chapterNumber}`,
          tierId,
          location: loc,
          overviewX: 50,
          overviewY: visual?.overviewY ?? 46,
          hatsuNames: character.hatsuNames || [],
        }
      })
      .filter(Boolean)
      .filter((character: any) => {
        if (
          mapState.currentZoomLevel !== 'OVERVIEW' &&
          mapState.selectedTier &&
          character.tierId !== mapState.selectedTier
        )
          return false
        if (mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId) {
          const byId = new Map<string, any>(
            nextLocations.map((location: any) => [location.id, location]),
          )
          return belongsToLocation(character.location, mapState.selectedLocationId, byId)
        }
        return true
      })

    // Local grouping, discarded at the end of the block; never rendered from.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const tierGroups = new Map<string, any[]>()
    for (const character of mappedFuture) {
      const group = tierGroups.get(character.tierId || 'outside') || []
      group.push(character)
      tierGroups.set(character.tierId || 'outside', group)
    }
    for (const group of tierGroups.values())
      group.sort((left, right) => left.id.localeCompare(right.id))

    return mappedFuture.map((character: any, localIndex: number) => {
      if (mapState.currentZoomLevel === 'OVERVIEW') {
        const group = tierGroups.get(character.tierId || 'outside') || [character]
        const index = Math.max(
          0,
          group.findIndex((candidate: any) => candidate.id === character.id),
        )
        const columns = Math.min(12, group.length)
        const rows = Math.ceil(group.length / columns)
        const column = index % columns
        const row = Math.floor(index / columns)
        return {
          ...character,
          x: 38 + (column + 0.5) * (24 / columns),
          y: character.overviewY + (row - (rows - 1) / 2) * 1.8,
        }
      }
      if (mapState.currentZoomLevel === 'LOCAL') {
        const columns = Math.min(6, Math.ceil(Math.sqrt(mappedFuture.length)))
        const rows = Math.ceil(mappedFuture.length / columns)
        const column = localIndex % columns
        const row = Math.floor(localIndex / columns)
        return {
          ...character,
          x: 50 + (column - (columns - 1) / 2) * 3,
          y: 50 + (row - (rows - 1) / 2) * 3,
        }
      }
      return character
    })
  })

  let visibleCharacters = $derived.by(() => {
    const locationsById = new Map<string, any>(
      (locations as any[]).map((location: any) => [location.id, location] as [string, any]),
    )

    const filteredCharacters = dynamicCharacters.filter((character: any) => {
      if (
        mapState.selectedPerspectiveKind !== 'reader' &&
        Array.isArray(perspective?.visibleBodies)
      ) {
        const visibleBodyIds = new Set<string>(perspective.visibleBodies)
        if (!visibleBodyIds.has(character.id)) return false
      }

      let matchesMapScope = true
      if (mapState.currentZoomLevel !== 'OVERVIEW') {
        if (mapState.selectedTier && character.tierId !== mapState.selectedTier)
          matchesMapScope = false
        if (
          matchesMapScope &&
          mapState.currentZoomLevel === 'LOCAL' &&
          mapState.selectedLocationId
        ) {
          matchesMapScope = belongsToLocation(
            character.location,
            mapState.selectedLocationId,
            locationsById,
          )
        }
      }

      if (!matchesMapScope) return false
      const selectedFactions = mapState.filters.factions
      return (
        selectedFactions.length === 0 ||
        selectedFactions.some((faction) => character.factionTags?.includes(faction))
      )
    })

    // Local grouping, discarded at the end of the block; never rendered from.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const tierGroups = new Map<string, any[]>()
    for (const character of filteredCharacters) {
      const group = tierGroups.get(character.tierId || 'outside') || []
      group.push(character)
      tierGroups.set(character.tierId || 'outside', group)
    }
    for (const group of tierGroups.values())
      group.sort((left, right) => left.id.localeCompare(right.id))

    return filteredCharacters.map((character: any, localIndex: number) => {
      if (mapState.currentZoomLevel === 'OVERVIEW') {
        const group = tierGroups.get(character.tierId || 'outside') || [character]
        const index = Math.max(
          0,
          group.findIndex((candidate: any) => candidate.id === character.id),
        )
        const columns = Math.min(12, group.length)
        const rows = Math.ceil(group.length / columns)
        const column = index % columns
        const row = Math.floor(index / columns)
        return {
          ...character,
          x: 38 + (column + 0.5) * (24 / columns),
          y: character.overviewY + (row - (rows - 1) / 2) * 1.8,
        }
      }
      if (mapState.currentZoomLevel === 'LOCAL') {
        const columns = Math.min(6, Math.ceil(Math.sqrt(filteredCharacters.length)))
        const rows = Math.ceil(filteredCharacters.length / columns)
        const column = localIndex % columns
        const row = Math.floor(localIndex / columns)
        return {
          ...character,
          x: 50 + (column - (columns - 1) / 2) * 3,
          y: 50 + (row - (rows - 1) / 2) * 3,
        }
      }
      return character
    })
  })

  let presenceLayer: HTMLDivElement | undefined = $state()
  let layerStyle = $state('inset: 0;')

  $effect(() => {
    // Bare reads: this is how a rune effect registers its dependencies.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    ;(mapState.currentZoomLevel, mapState.selectedTier, mapState.selectedLocationId)

    const layer = presenceLayer
    const parent = layer?.parentElement
    if (!layer || !parent) return

    const alignWithSvg = () => {
      const svg = parent.querySelector(':scope > svg') as SVGSVGElement | null
      if (!svg?.viewBox?.baseVal?.width || !svg.viewBox.baseVal.height) {
        layerStyle = 'inset: 0;'
        return
      }

      const width = parent.clientWidth
      const height = parent.clientHeight
      const viewBox = svg.viewBox.baseVal
      const scale = Math.min(width / viewBox.width, height / viewBox.height)
      const renderedWidth = viewBox.width * scale
      const renderedHeight = viewBox.height * scale
      const left = (width - renderedWidth) / 2
      const top = (height - renderedHeight) / 2
      layerStyle = `left:${left}px;top:${top}px;width:${renderedWidth}px;height:${renderedHeight}px;`
    }

    alignWithSvg()
    const observer = new ResizeObserver(alignWithSvg)
    observer.observe(parent)
    return () => observer.disconnect()
  })
</script>

<div
  bind:this={presenceLayer}
  class="presence-layer absolute pointer-events-none"
  style={layerStyle}
  aria-label={`${visibleCharacters.length} visible characters`}
>
  {#each futureCharacters as char (char.id)}
    <CharacterMarker character={char} future={true} />
  {/each}
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} {futureMode} />
  {/each}
</div>

<style>
  .presence-layer {
    z-index: 5;
  }
</style>
