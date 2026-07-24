<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  let character = $derived(data.character as any);
  let presences = $derived(data.presences);
  let states = $derived(data.states);
</script>

<svelte:head><title>{character.canonicalName} — Black Whale</title></svelte:head>

<div class="p-6 max-w-4xl mx-auto">
  <div class="mb-6">
    <a href="/characters" class="text-bw-gold hover:underline">← Retour aux personnages</a>
  </div>

  <header class="bg-[#111] border border-[#333] rounded-lg p-6 mb-8">
    <h1 class="text-4xl font-bold text-white mb-2">{character.canonicalName}</h1>
    <div class="flex flex-wrap gap-3">
      <span class="px-3 py-1 bg-bw-gold/10 text-bw-gold rounded-full text-sm border border-bw-gold/30">Apparu Ch. {character.firstVisibleEvent.chapter.number}</span>
    </div>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    
    <!-- Timeline des déplacements -->
    <section>
      <h2 class="text-2xl font-bold text-gray-100 mb-6 border-b border-[#333] pb-2">Historique des déplacements</h2>
      
      {#if presences.length > 0}
        <div class="relative border-l border-[#333] ml-3 space-y-6">
          {#each presences as presence}
            <div class="relative pl-6">
              <!-- Point de la timeline -->
              <div class="absolute w-3 h-3 bg-bw-gold rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#050505]"></div>
              
              <div class="bg-[#111] border border-[#222] p-4 rounded-lg">
                <div class="text-xs text-gray-400 mb-1">
                  Ch. {presence.fromEvent.chapter.number} — Séquence {presence.fromEvent.sequence}
                </div>
                <h3 class="font-bold text-white mb-1">Position: {presence.location?.name || 'Inconnue'}</h3>
                <p class="text-sm text-gray-400">
                  Certitude: <span class="text-gray-300">{presence.certainty}</span>
                </p>
                {#if presence.untilEvent}
                  <div class="mt-2 text-xs text-gray-500 border-t border-[#333] pt-2">
                    Jusqu'au Ch. {presence.untilEvent.chapter.number}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 italic">Aucun déplacement connu.</p>
      {/if}
    </section>

    <!-- Timeline des états biologiques (Blessures, etc) -->
    <section>
      <h2 class="text-2xl font-bold text-gray-100 mb-6 border-b border-[#333] pb-2">États biologiques & Statut</h2>
      
      {#if states.length > 0}
        <div class="relative border-l border-[#333] ml-3 space-y-6">
          {#each states as state}
            <div class="relative pl-6">
              <div class="absolute w-3 h-3 bg-red-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#050505]"></div>
              
              <div class="bg-[#111] border border-red-900/30 p-4 rounded-lg">
                <div class="text-xs text-gray-400 mb-1">
                  Ch. {state.fromEvent.chapter.number}
                </div>
                <h3 class="font-bold text-white mb-1">{state.state}</h3>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 italic">Aucun état particulier enregistré.</p>
      {/if}
    </section>
  </div>
</div>
