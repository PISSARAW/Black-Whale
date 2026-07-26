<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import CharacterMarker from './CharacterMarker.svelte';
  import type { MarkerIdentityState } from '$lib/components/perspective/types';
  import { page } from '$app/stores';
  import { toEnglishDisplayName } from '$lib/utils/displayNames';
  import { activeHatsu, parallelFutureVisible } from '$lib/nen/hatsuState.js';
  
  // Mapping between location slugs and SVG coordinates for each tier
  // These coordinates are based on the SVG viewBox (0 0 1000 600)
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
      'vip-jail': { x: 790, y: 320 },
      'vvip-prison-beyond': { x: 790, y: 275 },
      'heilly-processing': { x: 350, y: 500 }
    },
    'tier-2': {
	  'heilly-secret-hideout': { x: 400, y: 225 },
      'vip-guest-rooms': { x: 300, y: 200 },
      'entertainment-district': { x: 500, y: 250 },
      'shopping-arcade': { x: 700, y: 200 },
      'restaurant-row': { x: 500, y: 350 },
      'military-barracks': { x: 200, y: 400 },
      'security-center': { x: 400, y: 450 },
      'detention-facility': { x: 200, y: 500 }
    },
    'tier-3': {
      'residential-units': { x: 270, y: 360 },
      'medical-district': { x: 300, y: 250 },
      'tier-3-medical-district': { x: 300, y: 250 },
      'central-hospital': { x: 500, y: 190 },
      'central-police-station': { x: 450, y: 385 },
      'central-courthouse': { x: 550, y: 427 },
      'royal-army-office': { x: 550, y: 342 },
      'research-labs': { x: 500, y: 200 },
      'processing-plants': { x: 700, y: 200 },
      'waste-management': { x: 200, y: 400 },
      'power-station': { x: 400, y: 400 },
      'water-treatment': { x: 600, y: 400 },
      'storage-warehouses': { x: 500, y: 500 }
    },
    'tier-4': {
      'central-passage': { x: 500, y: 525 },
      'recycling-sewage-facilities': { x: 500, y: 525 },
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
      'central-dining-hall': { x: 585, y: 370 },
      'standard-cabins': { x: 270, y: 290 },
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

  const tierVisuals: Record<string, { label: string; overviewY: number }> = {
    'tier-1': { label: 'Tier 1', overviewY: 21 },
    'tier-2': { label: 'Tier 2', overviewY: 31 },
    'tier-3': { label: 'Tier 3', overviewY: 46 },
    'tier-4': { label: 'Tier 4', overviewY: 63 },
    'tier-5': { label: 'Tier 5', overviewY: 78 }
  };

  // Calculate marker positions from presences
  let presences = $derived($page.data.worldState?.presences || []);
  let characters = $derived($page.data.worldState?.characters || []);
  let bodies = $derived($page.data.worldState?.bodies || []);
  let locations = $derived($page.data.worldState?.locations || []);
  let perspective = $derived($page.data.perspective || null);
  let events = $derived($page.data.events || []);
  let currentEvent = $derived(events.find((event: any) => event.id === $page.data.selectedEventId));
  let currentSequence = $derived(currentEvent?.sequence || 0);
  let nextChapterState = $derived($page.data.nextChapterState || null);
  let futureMode = $derived($activeHatsu?.id === 'parallel-future' && $parallelFutureVisible);

  function hashToUnit(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 1000) / 1000;
  }

  function resolveTierSlug(location: any, byId: Map<string, any>) {
    let current = location;
    let depth = 0;

    while (current && depth < 8) {
      if (current.type === 'TIER') {
        return current.slug;
      }
      current = current.parentLocationId ? byId.get(current.parentLocationId) : null;
      depth += 1;
    }

    return null;
  }

  function belongsToLocation(location: any, targetSlug: string, byId: Map<string, any>) {
    let current = location;
    let depth = 0;
    while (current && depth < 8) {
      if (current.slug === targetSlug || current.slug.endsWith(`-${targetSlug}`)) return true;
      current = current.parentLocationId ? byId.get(current.parentLocationId) : null;
      depth += 1;
    }
    return false;
  }

  function getExactTierCoordinates(tierId: string, locationSlug: string) {
    const tierCoordinates = locationCoordinates[tierId] || {};
    const coordinateKey = Object.keys(tierCoordinates)
      .sort((left, right) => right.length - left.length)
      .find((key) => locationSlug === key || locationSlug.endsWith(`-${key}`));
    const directCoordinates = coordinateKey ? tierCoordinates[coordinateKey] : undefined;
    if (directCoordinates) return { ...directCoordinates, isSmallRoom: false };

    // Tier 1 rooms 1001–1014 are drawn as two vertical columns in tier-1.svelte.
    // Odd rooms are on the right, even rooms on the left.
    const princeRoomMatch = tierId === 'tier-1' ? locationSlug.match(/room-10(0[1-9]|1[0-4])$/) : null;
    if (princeRoomMatch) {
      const roomNumber = Number(princeRoomMatch[1]);
      const row = Math.floor((roomNumber - 1) / 2);
      return {
        x: roomNumber % 2 === 0 ? 477.5 : 582.5,
        y: 320.7 + row * 21.4,
        isSmallRoom: true
      };
    }

    return null;
  }

  function getTemporalVisual(presence: any) {
    if (presence.certainty === 'PROBABLE') {
      return { color: '#f0b75e', label: 'Assumed position', detail: 'Likely presence, unconfirmed' };
    }
    if (presence.certainty === 'LAST_KNOWN') {
      return { color: '#e47f61', label: 'Last known position', detail: 'Potentially outdated information' };
    }
    if (presence.certainty !== 'CONFIRMED') {
      return { color: '#8a9798', label: 'Unknown status', detail: 'Certainty level not provided' };
    }

    const fromSequence = presence.fromEvent?.sequence;
    const untilSequence = presence.untilEvent?.sequence;

    if (untilSequence !== undefined && untilSequence !== null) {
      return {
        color: '#ad8bea',
        label: 'Confirmed over a period',
        detail: `Events ${fromSequence ?? '?'} to ${untilSequence}`
      };
    }
    if (presence.fromEventId === currentEvent?.id) {
      return { color: '#55d1e2', label: 'Confirmed at this event', detail: `Event ${currentSequence}` };
    }
    if (presence.fromEvent?.chapterId && presence.fromEvent.chapterId === currentEvent?.chapterId) {
      return { color: '#6ac890', label: 'Confirmed during this chapter', detail: `Since event ${fromSequence ?? '?'}` };
    }
    return { color: '#5bb9ad', label: 'Confirmed presence', detail: `Since event ${fromSequence ?? '?'}` };
  }

  function calculatePresencePosition(p: any, sourcePresences: any[], sourceLocations: any[]) {
    const locationsById = new Map<string, any>(sourceLocations.map((location: any) => [location.id, location]));
    const loc = sourceLocations.find((location: any) => location.id === p.locationId);
    const tierId = loc ? resolveTierSlug(loc, locationsById) : null;
    let x = 500;
    let y = 300;

    if (loc && tierId && locationCoordinates[tierId]) {
      const coords = getExactTierCoordinates(tierId, loc.slug);
      if (coords) {
        const colocatedEntityIds = sourcePresences
          .filter((candidate: any) => candidate.locationId === p.locationId)
          .map((candidate: any) => candidate.entityId)
          .sort();
        const colocatedIndex = Math.max(0, colocatedEntityIds.indexOf(p.entityId));
        const colocatedCount = colocatedEntityIds.length;

        if (colocatedCount > 1 && coords.isSmallRoom) {
          const columns = Math.min(2, colocatedCount);
          const rows = Math.ceil(colocatedCount / columns);
          const column = colocatedIndex % columns;
          const row = Math.floor(colocatedIndex / columns);
          x = coords.x + (column - (columns - 1) / 2) * 12;
          y = coords.y + (row - (rows - 1) / 2) * 8;
        } else if (colocatedCount > 1) {
          const angle = (colocatedIndex / colocatedCount) * Math.PI * 2;
          x = coords.x + Math.cos(angle) * 15;
          y = coords.y + Math.sin(angle) * 10;
        } else {
          x = coords.x;
          y = coords.y;
        }
      } else if (loc.parentLocationId) {
        const parent: any = locationsById.get(loc.parentLocationId);
        const parentCoords = parent ? getExactTierCoordinates(tierId, parent.slug) : undefined;
        if (parentCoords) {
          const base = hashToUnit(p.entityId);
          x = parentCoords.x + (base * 80 - 40);
          y = parentCoords.y + ((1 - base) * 80 - 40);
        } else {
          const base = hashToUnit(p.entityId);
          x = 250 + base * 520;
          y = 170 + base * 250;
        }
      } else {
        const base = hashToUnit(p.entityId);
        x = 250 + base * 520;
        y = 170 + base * 250;
      }
    } else {
      const base = hashToUnit(p.entityId);
      x = 300 + base * 320;
      y = 220 + base * 180;
    }

    return { x, y, loc, tierId };
  }

  let dynamicCharacters = $derived(
    presences.map((p: any) => {
      const locationsById = new Map<string, any>((locations as any[]).map((location: any) => [location.id, location] as [string, any]));
      const facts = perspective?.knownFacts || [];
      const beliefs = perspective?.beliefs || [];
      const observer = perspective?.observer;

      const body = bodies.find((candidate: any) => candidate.id === p.entityId);
      const ownerCharacter = body ? characters.find((candidate: any) => candidate.id === body.originalCharacterId) : null;
      const { x, y, loc, tierId } = calculatePresencePosition(p, presences as any[], locations as any[]);
      
      if (!body || !ownerCharacter) return null;

      const bodyName = toEnglishDisplayName(ownerCharacter?.canonicalName || body?.label) || 'Unknown body';
      const perspectiveIsReader = mapState.selectedPerspectiveKind === 'reader';
      const observerCharacter = characters.find((char: any) => char.id === observer?.characterId);
      const apparentCharacter = characters.find((char: any) => char.id === observer?.apparentCharacterId);
      const knownCharacterIds = new Set<string>(perspective?.knownCharacters || []);
      const isObserverBody = Boolean(observer?.currentBodyId && observer.currentBodyId === p.entityId);

      const relatedFacts = facts.filter((fact: any) =>
        fact.subjectId === p.entityId || fact.subjectId === body?.originalCharacterId
      );
      const relatedBeliefs = beliefs.filter((belief: any) =>
        belief.subjectId === p.entityId || belief.subjectId === body?.originalCharacterId
      );

      const hasConfirmedKnowledge = isObserverBody
        || knownCharacterIds.has(body?.originalCharacterId)
        || relatedFacts.length > 0;
      const hasBeliefOnly = !hasConfirmedKnowledge && relatedBeliefs.length > 0;

      const shouldMaskIdentity = !perspectiveIsReader && !hasConfirmedKnowledge;
      const consciousness = isObserverBody
        ? (observerCharacter?.canonicalName || observer?.consciousnessId || bodyName)
        : bodyName;
      const appearance = isObserverBody
        ? (apparentCharacter?.canonicalName || bodyName)
        : bodyName;
      const followedIdentity = mapState.followMode === 'body'
        ? bodyName
        : mapState.followMode === 'appearance'
          ? appearance
          : consciousness;

      const perceivedIdentity = isObserverBody
        ? followedIdentity
        : shouldMaskIdentity
          ? (hasBeliefOnly ? 'Assumed identity' : 'Unknown individual')
          : bodyName;

      const suspicionLabel = !perspectiveIsReader && hasBeliefOnly
        ? 'Active suspicion'
        : undefined;

      const contested = relatedFacts.some((fact: any) => fact.truthStatus === 'CONTESTED');
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
                  : 'unknown';

      const transferFlag = isObserverBody && Boolean(observer?.isDissonant);

      const sourceFromFact = relatedFacts[0]?.predicate || relatedBeliefs[0]?.predicate;
      const sourceLabel = hasConfirmedKnowledge
        ? `Fact: ${sourceFromFact}`
        : hasBeliefOnly
          ? `Belief: ${sourceFromFact}`
          : 'Structural presence';

      const visual = tierId ? tierVisuals[tierId] : undefined;
      const temporalVisual = getTemporalVisual(p);
      const offsetSeed = hashToUnit(`${p.entityId}-offset`);
      const overviewX = 39 + offsetSeed * 22;
      const overviewY = (visual?.overviewY ?? 46) + (hashToUnit(`${p.entityId}-row`) * 4 - 2);

      const mapped: MarkerIdentityState & { tierId: string | null; locationId?: string; location?: any; overviewX: number; overviewY: number } = {
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
        isFollowTarget: isObserverBody
      };

      const nextPresence = nextChapterState?.presences?.find((candidate: any) => candidate.entityId === p.entityId);
      const nextBiologicalState = nextChapterState?.bodyStates?.[p.entityId];
      mapped.originalCharacterId = ownerCharacter.id;
      mapped.hatsuNames = ownerCharacter.hatsuNames || [];
      mapped.futureChange = nextBiologicalState === 'DEAD' || nextBiologicalState === 'DESTROYED'
        ? 'dead'
        : nextPresence && nextPresence.locationId !== p.locationId
          ? 'moved'
          : 'stable';

      return mapped;
    }).filter(Boolean)
  );

  let futureCharacters = $derived.by(() => {
    if (!futureMode || !nextChapterState) return [];
    const nextPresences = nextChapterState.presences || [];
    const nextLocations = nextChapterState.locations || locations;
    const nextBodies = nextChapterState.bodies || [];
    const nextCharacters = nextChapterState.characters || [];

    return nextPresences.map((presence: any) => {
      const body = nextBodies.find((candidate: any) => candidate.id === presence.entityId);
      const character = body ? nextCharacters.find((candidate: any) => candidate.id === body.originalCharacterId) : null;
      const biologicalState = nextChapterState.bodyStates?.[presence.entityId];
      if (!body || !character || biologicalState === 'DEAD' || biologicalState === 'DESTROYED') return null;

      const { x, y, loc, tierId } = calculatePresencePosition(presence, nextPresences, nextLocations);
      const visual = tierId ? tierVisuals[tierId] : undefined;
      const overviewX = 39 + hashToUnit(`${presence.entityId}-offset`) * 22;
      const overviewY = (visual?.overviewY ?? 46) + (hashToUnit(`${presence.entityId}-row`) * 4 - 2);
      const localSeed = hashToUnit(`${presence.entityId}-local`);
      const displayX = mapState.currentZoomLevel === 'OVERVIEW'
        ? overviewX
        : mapState.currentZoomLevel === 'LOCAL'
          ? 38 + localSeed * 24
          : x / 10;
      const displayY = mapState.currentZoomLevel === 'OVERVIEW'
        ? overviewY
        : mapState.currentZoomLevel === 'LOCAL'
          ? 38 + hashToUnit(`${presence.entityId}-local-y`) * 24
          : y / 6;
      return {
        id: presence.entityId,
        x: displayX,
        y: displayY,
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
        overviewX,
        overviewY,
        hatsuNames: character.hatsuNames || []
      };
    }).filter(Boolean).filter((character: any) => {
      if (mapState.currentZoomLevel !== 'OVERVIEW' && mapState.selectedTier && character.tierId !== mapState.selectedTier) return false;
      if (mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId) {
        const byId = new Map<string, any>(nextLocations.map((location: any) => [location.id, location]));
        return belongsToLocation(character.location, mapState.selectedLocationId, byId);
      }
      return true;
    });
  });

  let visibleCharacters = $derived.by(() => {
    const locationsById = new Map<string, any>((locations as any[]).map((location: any) => [location.id, location] as [string, any]));

    return dynamicCharacters
      .filter((character: any) => {
        if (mapState.selectedPerspectiveKind !== 'reader' && Array.isArray(perspective?.visibleBodies)) {
          const visibleBodyIds = new Set<string>(perspective.visibleBodies);
          if (!visibleBodyIds.has(character.id)) return false;
        }

        let matchesMapScope = true;
        if (mapState.currentZoomLevel !== 'OVERVIEW') {
          if (mapState.selectedTier && character.tierId !== mapState.selectedTier) matchesMapScope = false;
          if (matchesMapScope && mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId) {
            matchesMapScope = belongsToLocation(character.location, mapState.selectedLocationId, locationsById);
          }
        }

        if (!matchesMapScope) return false;
        const selectedFactions = mapState.filters.factions;
        return selectedFactions.length === 0
          || selectedFactions.some((faction) => character.factionTags?.includes(faction));
      })
      .map((character: any) => {
        if (mapState.currentZoomLevel === 'OVERVIEW') {
          return { ...character, x: character.overviewX, y: character.overviewY };
        }
        if (mapState.currentZoomLevel === 'LOCAL') {
          const localSeed = hashToUnit(`${character.id}-local`);
          return { ...character, x: 38 + localSeed * 24, y: 38 + hashToUnit(`${character.id}-local-y`) * 24 };
        }
        return character;
      });
  });
</script>

<div class="presence-layer absolute inset-0 pointer-events-none" aria-label={`${visibleCharacters.length} visible characters`}>
  {#each futureCharacters as char (char.id)}
    <CharacterMarker character={char} future={true} />
  {/each}
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} {futureMode} />
  {/each}
</div>

<style>
  .presence-layer { z-index: 5; }
</style>
