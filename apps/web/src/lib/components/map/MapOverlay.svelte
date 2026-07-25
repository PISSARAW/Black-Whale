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

  // Calculate marker positions from presences
  let presences = $derived($page.data.worldState?.presences || []);
  let characters = $derived($page.data.worldState?.characters || []);
  let bodies = $derived($page.data.worldState?.bodies || []);
  let locations = $derived($page.data.worldState?.locations || []);
  let perspective = $derived($page.data.perspective || null);

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
      
      // Get coordinates based on location slug
      let x = 500;
      let y = 300;
      
      if (loc && tierId && locationCoordinates[tierId]) {
        const coords = locationCoordinates[tierId][loc.slug];
        if (coords) {
          x = coords.x;
          y = coords.y;
        } else {
          if (loc.parentLocationId) {
            const parent: any = locationsById.get(loc.parentLocationId);
            const parentCoords = parent ? locationCoordinates[tierId][parent.slug] : undefined;
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

      const mapped: MarkerIdentityState & { tierId: string | null; locationId?: string } = {
        id: p.entityId,
        tierId,
        locationId: loc?.slug,
        x,
        y,
        body: bodyName,
        consciousness,
        appearance: bodyName,
        perceivedIdentity,
        transferFlag,
        suspicionLabel,
        knowledgeState,
        sourceLabel,
        sinceLabel: p.fromEventId ? `depuis ${p.fromEventId}` : 'evenement inconnu'
      };

      return mapped;
    })
  );

  let visibleCharacters = $derived(
    dynamicCharacters.filter((c: any) => {
      if (mapState.currentZoomLevel === 'OVERVIEW') return false;
      if (mapState.selectedTier && c.tierId !== mapState.selectedTier) return false;
      return true;
    })
  );
</script>

<div class="absolute inset-0 pointer-events-none">
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} />
  {/each}
</div>
