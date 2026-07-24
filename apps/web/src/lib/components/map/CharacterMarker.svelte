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
      status: string; // 'EXACT' | 'ZONE' | 'LAST_KNOWN'
    }
  } = $props();

  // Status-based styling
  let markerClass = $derived(() => {
    if (character.status === 'ZONE') return 'bg-purple-500 opacity-60 w-6 h-6 -ml-3 -mt-3';
    if (character.status === 'LAST_KNOWN') return 'border-2 border-gray-400 bg-transparent w-4 h-4 -ml-2 -mt-2';
    return 'bg-blue-500 w-3 h-3 -ml-1.5 -mt-1.5'; // EXACT
  });

  // Calculate position string
  let styleString = $derived(`left: ${character.x}px; top: ${character.y}px;`);
</script>

<!-- The marker itself -->
<div 
  class="absolute rounded-full shadow-lg transition-all duration-300 pointer-events-auto cursor-help group"
  style={styleString}
  class:bg-blue-500={character.status === 'EXACT'}
  class:bg-purple-500={character.status === 'ZONE'}
  class:border-2={character.status === 'LAST_KNOWN'}
  class:border-gray-400={character.status === 'LAST_KNOWN'}
  class:bg-transparent={character.status === 'LAST_KNOWN'}
  class:opacity-60={character.status === 'ZONE'}
  style:width={character.status === 'ZONE' ? '24px' : character.status === 'LAST_KNOWN' ? '16px' : '12px'}
  style:height={character.status === 'ZONE' ? '24px' : character.status === 'LAST_KNOWN' ? '16px' : '12px'}
  style:transform="translate(-50%, -50%)"
>
  <!-- Tooltip on hover -->
  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-[#1a1a1a] text-[#FFFFF0] text-xs border border-[#FFD700] p-1 rounded z-50">
    <span class="font-bold">{character.name}</span>
    {#if character.status === 'ZONE'}
      <br/><span class="text-gray-400">Position de zone</span>
    {/if}
  </div>
</div>
