<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import CharacterMarker from './CharacterMarker.svelte';
  import type { MarkerIdentityState } from '$lib/components/perspective/types';
  import { page } from '$app/stores';
  
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
      if (current.slug === targetSlug) return true;
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
      return { color: '#f0b75e', label: 'Position supposée', detail: 'Présence probable, non confirmée' };
    }
    if (presence.certainty === 'LAST_KNOWN') {
      return { color: '#e47f61', label: 'Dernière position connue', detail: 'Information potentiellement obsolète' };
    }
    if (presence.certainty !== 'CONFIRMED') {
      return { color: '#8a9798', label: 'Statut inconnu', detail: 'Niveau de certitude non renseigné' };
    }

    const fromSequence = presence.fromEvent?.sequence;
    const untilSequence = presence.untilEvent?.sequence;

    if (untilSequence !== undefined && untilSequence !== null) {
      return {
        color: '#ad8bea',
        label: 'Confirmé sur une période',
        detail: `Événements ${fromSequence ?? '?'} à ${untilSequence}`
      };
    }
    if (presence.fromEventId === currentEvent?.id) {
      return { color: '#55d1e2', label: 'Confirmé à cet événement', detail: `Événement ${currentSequence}` };
    }
    if (presence.fromEvent?.chapterId && presence.fromEvent.chapterId === currentEvent?.chapterId) {
      return { color: '#6ac890', label: 'Confirmé durant ce chapitre', detail: `Depuis l’événement ${fromSequence ?? '?'}` };
    }
    return { color: '#5bb9ad', label: 'Présence confirmée', detail: `Depuis l’événement ${fromSequence ?? '?'}` };
  }

  let dynamicCharacters = $derived(
    presences.map((p: any) => {
      const locationsById = new Map<string, any>((locations as any[]).map((location: any) => [location.id, location] as [string, any]));
      const facts = perspective?.knownFacts || [];
      const beliefs = perspective?.beliefs || [];
      const observer = perspective?.observer;

      const body = bodies.find((candidate: any) => candidate.id === p.entityId);
      const ownerCharacter = body ? characters.find((candidate: any) => candidate.id === body.originalCharacterId) : null;
      const loc = locations.find((l: any) => l.id === p.locationId);
      const tierId = loc ? resolveTierSlug(loc, locationsById) : null;
      
      if (!body || !ownerCharacter) return null;

      // Get coordinates based on location slug
      let x = 500;
      let y = 300;
      
      if (loc && tierId && locationCoordinates[tierId]) {
        const coords = getExactTierCoordinates(tierId, loc.slug);
        if (coords) {
          const colocatedEntityIds = (presences as any[])
            .filter((candidate) => candidate.locationId === p.locationId)
            .map((candidate) => candidate.entityId)
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
        } else {
          if (loc.parentLocationId) {
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
        }
      } else {
        const base = hashToUnit(p.entityId);
        x = 300 + base * 320;
        y = 220 + base * 180;
      }

      const bodyName = ownerCharacter?.canonicalName || body?.label || 'Corps inconnu';
      const perspectiveIsReader = mapState.selectedPerspectiveKind === 'reader';
      const observerCharacter = characters.find((char: any) => char.id === observer?.characterId);

      const relatedFacts = facts.filter((fact: any) =>
        fact.subjectId === p.entityId || fact.subjectId === body?.originalCharacterId
      );
      const relatedBeliefs = beliefs.filter((belief: any) =>
        belief.subjectId === p.entityId || belief.subjectId === body?.originalCharacterId
      );

      const hasConfirmedKnowledge = relatedFacts.length > 0;
      const hasBeliefOnly = !hasConfirmedKnowledge && relatedBeliefs.length > 0;

      const shouldMaskIdentity = !perspectiveIsReader && !hasConfirmedKnowledge;
      const consciousness = observer?.currentBodyId === p.entityId
        ? (observerCharacter?.canonicalName || observer?.consciousnessId || bodyName)
        : bodyName;

      const perceivedIdentity = shouldMaskIdentity
        ? (hasBeliefOnly ? 'Identite supposee' : 'Individu inconnu')
        : bodyName;

      const suspicionLabel = !perspectiveIsReader && hasBeliefOnly
        ? 'Soupcon actif'
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

      const transferFlag = observer?.currentBodyId === p.entityId && observer?.consciousnessId !== observer?.currentBodyId;

      const sourceFromFact = relatedFacts[0]?.predicate || relatedBeliefs[0]?.predicate;
      const sourceLabel = hasConfirmedKnowledge
        ? `Fait: ${sourceFromFact}`
        : hasBeliefOnly
          ? `Croyance: ${sourceFromFact}`
          : 'Presence structurelle';

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
        appearance: bodyName,
        perceivedIdentity,
        transferFlag,
        suspicionLabel,
        knowledgeState,
        sourceLabel,
        sinceLabel: p.fromEventId ? `depuis ${p.fromEventId}` : 'evenement inconnu',
        positionColor: temporalVisual.color,
        tierLabel: visual?.label || 'Hors tier',
        locationLabel: loc?.name || 'Position inconnue',
        temporalLabel: temporalVisual.label,
        temporalDetail: temporalVisual.detail
      };

      return mapped;
    }).filter(Boolean)
  );

  let visibleCharacters = $derived.by(() => {
    const locationsById = new Map<string, any>((locations as any[]).map((location: any) => [location.id, location] as [string, any]));

    return dynamicCharacters
      .filter((character: any) => {
        if (mapState.currentZoomLevel === 'OVERVIEW') return true;
        if (mapState.selectedTier && character.tierId !== mapState.selectedTier) return false;
        if (mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId) {
          return belongsToLocation(character.location, mapState.selectedLocationId, locationsById);
        }
        return true;
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

<div class="presence-layer absolute inset-0 pointer-events-none" aria-label={`${visibleCharacters.length} personnages visibles`}>
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} />
  {/each}
</div>

<style>
  .presence-layer { z-index: 5; }
</style>
