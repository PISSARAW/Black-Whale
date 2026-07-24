<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import CharacterMarker from './CharacterMarker.svelte';
  
  // Mock data for V1 character positions
  // Typically this would come from @black-whale/domain or an API endpoint
  const mockCharacters = [
    { id: 'c1', name: 'Kurapika', tierId: 'tier-1', locationId: 'room-1014', x: 325, y: 225, status: 'EXACT' },
    { id: 'c2', name: 'Oito', tierId: 'tier-1', locationId: 'room-1014', x: 300, y: 200, status: 'EXACT' },
    { id: 'c3', name: 'Woble', tierId: 'tier-1', locationId: 'room-1014', x: 275, y: 250, status: 'EXACT' },
    { id: 'c4', name: 'Bill', tierId: 'tier-1', locationId: 'room-1014', x: 350, y: 200, status: 'EXACT' },
    { id: 'c5', name: 'Tserriednich', tierId: 'tier-1', locationId: 'room-1004', x: 725, y: 225, status: 'EXACT' },
    { id: 'c6', name: 'Hisoka', tierId: 'tier-3', locationId: 'zone-unknown', x: 500, y: 500, status: 'ZONE' }, // Just an example
  ];

  let visibleCharacters = $derived(
    mockCharacters.filter(c => {
      // If we are in OVERVIEW, maybe don't show individual markers, or show aggregated bubbles
      if (mapState.currentZoomLevel === 'OVERVIEW') return false;
      // If a tier is selected, show characters in that tier
      if (mapState.selectedTier && c.tierId !== mapState.selectedTier) return false;
      return true;
    })
  );
</script>

<!-- The overlay container spans the entire panzoom element -->
<div class="absolute inset-0 pointer-events-none">
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} />
  {/each}
</div>
