<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import CharacterMarker from './CharacterMarker.svelte';
  
  const mockCharacters = [
    { id: 'c1', name: 'Kurapika', tierId: 'tier-1', locationId: 'room-1014', x: 275, y: 325, status: 'EXACT' },
    { id: 'c2', name: 'Oito', tierId: 'tier-1', locationId: 'room-1014', x: 260, y: 310, status: 'EXACT' },
    { id: 'c3', name: 'Woble', tierId: 'tier-1', locationId: 'room-1014', x: 275, y: 340, status: 'EXACT' },
    { id: 'c4', name: 'Bill', tierId: 'tier-1', locationId: 'room-1014', x: 290, y: 325, status: 'EXACT' },
    { id: 'c5', name: 'Tserriednich', tierId: 'tier-1', locationId: 'room-1004', x: 725, y: 325, status: 'EXACT' },
    { id: 'c6', name: 'Hisoka', tierId: 'tier-3', locationId: 't3-public', x: 300, y: 500, status: 'SECTOR_CONFIRMED' },
  ];

  let visibleCharacters = $derived(
    mockCharacters.filter(c => {
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
