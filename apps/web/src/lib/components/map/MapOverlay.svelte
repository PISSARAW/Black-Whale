<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import CharacterMarker from './CharacterMarker.svelte';
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
  let locations = $derived($page.data.worldState?.locations || []);

  let dynamicCharacters = $derived(
    presences.map((p: any) => {
      const char = characters.find((c: any) => c.id === p.entityId);
      const loc = locations.find((l: any) => l.id === p.locationId);
      
      // Try to determine the Tier from location hierarchy
      let tierId = null;
      if (loc) {
        if (loc.type === 'TIER') tierId = loc.slug;
        else if (loc.slug.startsWith('tier-1') || (loc.parentLocationId && loc.parentLocationId.startsWith('tier-1'))) tierId = 'tier-1';
        else if (loc.slug.startsWith('tier-2') || (loc.parentLocationId && loc.parentLocationId.startsWith('tier-2'))) tierId = 'tier-2';
        else if (loc.slug.startsWith('tier-3') || (loc.parentLocationId && loc.parentLocationId.startsWith('tier-3'))) tierId = 'tier-3';
        else if (loc.slug.startsWith('tier-4') || (loc.parentLocationId && loc.parentLocationId.startsWith('tier-4'))) tierId = 'tier-4';
        else if (loc.slug.startsWith('tier-5') || (loc.parentLocationId && loc.parentLocationId.startsWith('tier-5'))) tierId = 'tier-5';
      }

      // Get coordinates based on location slug
      let x = 500;
      let y = 300;
      
      if (loc && tierId && locationCoordinates[tierId]) {
        const coords = locationCoordinates[tierId][loc.slug];
        if (coords) {
          x = coords.x;
          y = coords.y;
        } else {
          // Fallback: use parent location coordinates if available
          if (loc.parentLocationId && locationCoordinates[tierId][loc.parentLocationId]) {
            const parentCoords = locationCoordinates[tierId][loc.parentLocationId];
            x = parentCoords.x + (Math.random() * 100 - 50);
            y = parentCoords.y + (Math.random() * 100 - 50);
          } else {
            // Random offset within tier
            x = 300 + (Math.random() * 400);
            y = 200 + (Math.random() * 200);
          }
        }
      } else {
        // Fallback to random position
        x = 300 + (Math.random() * 200);
        y = 300 + (Math.random() * 200);
      }

      return {
        id: p.entityId,
        name: char?.canonicalName || 'Unknown',
        tierId: tierId,
        locationId: loc?.slug,
        x,
        y,
        status: p.certainty
      };
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
