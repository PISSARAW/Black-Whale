<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  let { character }: {
    character: {
      id: string;
      name: string;
      tierId: string;
      locationId: string;
      x: number;
      y: number;
      status: string; // 'EXACT' | 'SECTOR_CONFIRMED' | 'TIER_ONLY' | 'EXISTENCE_ONLY' | 'UNKNOWN'
    }
  } = $props();

  // 'TIER_ONLY', 'EXISTENCE_ONLY', 'UNKNOWN' should ideally not be rendered as specific map points
  // But if they are, they are hidden
  let isVisible = $derived(
    character.status === 'EXACT' || character.status === 'SECTOR_CONFIRMED'
  );

  // Status-based styling
  let styleString = $derived(`left: ${character.x}px; top: ${character.y}px;`);
</script>

{#if isVisible}
  <div 
    class="absolute rounded-full shadow-lg transition-all duration-300 pointer-events-auto cursor-help group"
    style={styleString}
    class:bg-blue-500={character.status === 'EXACT'}
    class:bg-purple-500={character.status === 'SECTOR_CONFIRMED'}
    class:opacity-60={character.status === 'SECTOR_CONFIRMED'}
    style:width={character.status === 'SECTOR_CONFIRMED' ? '32px' : '12px'}
    style:height={character.status === 'SECTOR_CONFIRMED' ? '32px' : '12px'}
    style:transform="translate(-50%, -50%)"
  >
    <!-- Tooltip on hover -->
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-[#1a1a1a] text-[#FFFFF0] text-xs border border-[#FFD700] p-1 rounded z-50">
      <span class="font-bold">{character.name}</span>
      {#if character.status === 'SECTOR_CONFIRMED'}
        <br/><span class="text-gray-400">Position de secteur</span>
      {/if}
    </div>
  </div>
{/if}
