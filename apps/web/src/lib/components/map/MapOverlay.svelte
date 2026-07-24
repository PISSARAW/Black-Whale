<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import CharacterMarker from './CharacterMarker.svelte';
  import { page } from '$app/stores';
  
  // Calculate marker positions from presences
  let presences = $derived($page.data.worldState?.presences || []);
  let characters = $derived($page.data.worldState?.characters || []);
  let locations = $derived($page.data.worldState?.locations || []);

  let dynamicCharacters = $derived(
    presences.map(p => {
      const char = characters.find(c => c.id === p.entityId);
      const loc = locations.find(l => l.id === p.locationId);
      
      // Try to determine the Tier from location hierarchy
      let tierId = null;
      if (loc) {
        if (loc.type === 'TIER') tierId = loc.slug;
        else if (loc.slug.startsWith('tier-1')) tierId = 'tier-1';
        else if (loc.slug.startsWith('tier-2')) tierId = 'tier-2';
        else if (loc.slug.startsWith('tier-3')) tierId = 'tier-3';
        else if (loc.slug.startsWith('tier-4')) tierId = 'tier-4';
        else if (loc.slug.startsWith('tier-5')) tierId = 'tier-5';
      }

      // Very rough positional mockup since we don't have true SVG anchors yet
      // In production, we'd lookup SVG coordinates for `loc.slug`
      const randomOffset = Math.random() * 20; 
      const x = 300 + randomOffset;
      const y = 300 + randomOffset;

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
    dynamicCharacters.filter(c => {
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
