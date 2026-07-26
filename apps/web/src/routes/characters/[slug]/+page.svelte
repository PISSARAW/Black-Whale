<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  let character = $derived(data.character as any);
  let presences = $derived(data.presences);
  let states = $derived(data.states);

  const appearanceLabels: Record<string, string> = {
    debut: 'Début',
    appears: 'Apparaît',
    mentioned: 'Mentionné',
    pictured: 'Illustré',
    death: 'Mort',
    corpse: 'Cadavre',
    flashback: 'Flashback',
    vision: 'Vision',
    voice: 'Voix',
    soul: 'Âme',
    clone: 'Clone',
    impersonated: 'Usurpation',
    disguised: 'Déguisé',
    absent: 'Absent'
  };

  const appearanceClasses: Record<string, string> = {
    debut: 'border-bw-gold/50 bg-bw-gold/15 text-bw-gold',
    appears: 'border-emerald-700/50 bg-emerald-950/40 text-emerald-300',
    mentioned: 'border-sky-700/50 bg-sky-950/40 text-sky-300',
    pictured: 'border-violet-700/50 bg-violet-950/40 text-violet-300',
    death: 'border-red-700/60 bg-red-950/50 text-red-300',
    corpse: 'border-rose-950 bg-rose-950/30 text-rose-400',
    flashback: 'border-amber-700/50 bg-amber-950/40 text-amber-300',
    vision: 'border-fuchsia-700/50 bg-fuchsia-950/40 text-fuchsia-300',
    voice: 'border-cyan-700/50 bg-cyan-950/40 text-cyan-300',
    soul: 'border-indigo-500/50 bg-indigo-950/50 text-indigo-200',
    clone: 'border-teal-500/50 bg-teal-950/50 text-teal-200',
    impersonated: 'border-orange-600/50 bg-orange-950/40 text-orange-200',
    disguised: 'border-lime-600/50 bg-lime-950/40 text-lime-200',
    absent: 'border-gray-800 bg-black/20 text-gray-600'
  };
</script>

<svelte:head><title>{character.canonicalName} — Black Whale</title></svelte:head>

<div class="p-6 max-w-5xl mx-auto">
  <div class="mb-6">
    <a href="/characters" class="text-bw-gold hover:underline">← Retour aux personnages</a>
  </div>

  <header class="bg-[#111] border border-[#333] rounded-lg p-6 mb-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-4xl font-bold text-white mb-2">{character.canonicalName}</h1>
        {#if character.description}
          <p class="max-w-3xl text-gray-400 leading-relaxed">{character.description}</p>
        {/if}
      </div>
      <div class="flex flex-wrap gap-3">
        <span class="px-3 py-1 bg-bw-gold/10 text-bw-gold rounded-full text-sm border border-bw-gold/30">Apparu Ch. {character.firstVisibleEvent.chapter.number}</span>
        {#if character.nen}
          <span class="px-3 py-1 bg-red-950/40 text-red-300 rounded-full text-sm border border-red-800/40">
            Nen · {character.nen.typeLabel}{character.nen.secondaryTypeLabels?.length ? ` / ${character.nen.secondaryTypeLabels.join(' / ')}` : ''}
          </span>
        {/if}
        {#if character.suspectedAllegiance}
          <span class="px-3 py-1 bg-amber-950/40 text-amber-300 rounded-full text-sm border border-amber-800/40">Allégeance suspectée · {character.suspectedAllegiance}</span>
        {/if}
      </div>
    </div>
  </header>

  {#if character.identity}
    <section class="mb-8 rounded-xl border border-amber-700/40 bg-amber-950/20 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-amber-400">{character.identity.status}</p>
          <p class="mt-2 text-sm leading-relaxed text-amber-100">{character.identity.description}</p>
        </div>
        <a class="shrink-0 rounded-lg border border-amber-600/40 px-3 py-2 text-sm text-amber-300 hover:bg-amber-900/30" href={`/characters/${character.identity.counterpartId}`}>
          Voir {character.identity.counterpartLabel}
        </a>
      </div>
    </section>
  {/if}

  {#if character.biography?.length}
    <section class="bg-[#0b0b0b] border border-[#2a2a2a] rounded-xl p-6 mb-8">
      <h2 class="text-2xl font-bold text-gray-100 border-b border-[#2a2a2a] pb-4 mb-4">Parcours</h2>
      <div class="space-y-4 text-sm text-gray-300 leading-relaxed">
        {#each character.biography as paragraph}
          <p>{paragraph}</p>
        {/each}
      </div>
    </section>
  {/if}

  {#if character.abilitiesAndPowers}
    <section class="bg-[#0b0b0b] border border-[#2a2a2a] rounded-xl p-6 mb-8">
      <h2 class="text-2xl font-bold text-gray-100 border-b border-[#2a2a2a] pb-4 mb-4">Aptitudes et pouvoirs</h2>
      <p class="text-sm text-gray-300 leading-relaxed">{character.abilitiesAndPowers}</p>
    </section>
  {/if}

  {#if character.equipment?.length}
    <section class="bg-[#0b0b0b] border border-[#2a2a2a] rounded-xl p-6 mb-8">
      <h2 class="text-2xl font-bold text-gray-100 border-b border-[#2a2a2a] pb-4 mb-4">Équipement</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each character.equipment as item}
          <article class="rounded-lg border border-[#303030] bg-[#111] p-4">
            <h3 class="font-semibold text-white">{item.name}</h3>
            <p class="text-sm text-gray-400 leading-relaxed mt-2">{item.description}</p>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if character.nen}
    <section class="bg-[#0b0b0b] border border-[#2a2a2a] rounded-xl p-6 mb-8">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2a2a] pb-4 mb-5">
        <h2 class="text-2xl font-bold text-gray-100">Nen</h2>
        <span class="uppercase tracking-widest text-xs text-red-300">
          {character.nen.typeLabel}{character.nen.secondaryTypeLabels?.length ? ` · ${character.nen.secondaryTypeLabels.join(' · ')}` : ''}
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>{character.nen.overview}</p>
          {#if character.nen.waterDivination}
            <div class="rounded-lg border border-blue-900/40 bg-blue-950/20 p-4">
              <h3 class="font-semibold text-blue-200 mb-1">Divination par l'eau</h3>
              <p class="text-gray-400">{character.nen.waterDivination}</p>
            </div>
          {/if}
          {#if character.nen.combatProficiency}
            <p>{character.nen.combatProficiency}</p>
          {/if}
          {#if character.nen.techniques?.length}
            <div class="flex flex-wrap gap-2">
              {#each character.nen.techniques as technique}
                <span class="px-2.5 py-1 rounded-md border border-[#3a3a3a] bg-[#151515] text-gray-300 text-xs">{technique}</span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="space-y-4">
          {#each character.abilities || [] as ability}
            <article class="relative overflow-hidden rounded-lg border border-bw-gold/30 bg-gradient-to-br from-bw-gold/10 to-transparent p-5">
              <p class="text-[10px] uppercase tracking-[0.2em] text-bw-gold/70 mb-2">Hatsu · {character.nen.typeLabel}</p>
              <h3 class="text-xl font-bold text-white">{ability.name}</h3>
              {#if ability.alternateNames?.length}
                <p class="text-xs text-gray-500 mt-1">{ability.alternateNames.join(' · ')}</p>
              {/if}
              {#if ability.inheritedFrom}
                <p class="text-xs text-bw-gold/70 mt-2">Héritée de {ability.inheritedFrom}</p>
              {/if}
              <p class="text-sm text-gray-300 leading-relaxed mt-4">{ability.description}</p>
            </article>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  {#if character.guardianSpiritBeast}
    <section class="bg-[#0b0b0b] border border-violet-900/40 rounded-xl p-6 mb-8">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2a2a] pb-4 mb-4">
        <h2 class="text-2xl font-bold text-gray-100">Bête spirituelle gardienne</h2>
        <span class="text-xs uppercase tracking-widest text-violet-300">{character.guardianSpiritBeast.type}</span>
      </div>
      <p class="text-sm text-gray-300 leading-relaxed">{character.guardianSpiritBeast.description}</p>
      {#if character.guardianSpiritBeast.rules?.length}
        <ul class="mt-4 grid gap-2 text-sm text-gray-400">
          {#each character.guardianSpiritBeast.rules as rule}
            <li class="rounded-md border border-violet-950 bg-violet-950/20 px-3 py-2">{rule}</li>
          {/each}
        </ul>
      {/if}
      {#if character.guardianSpiritBeast.ability}
        <p class="mt-4 rounded-lg border border-violet-900/40 bg-violet-950/20 p-4 text-sm text-violet-100 leading-relaxed">{character.guardianSpiritBeast.ability}</p>
      {/if}
    </section>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <section>
      <h2 class="text-2xl font-bold text-gray-100 mb-6 border-b border-[#333] pb-2">Historique des déplacements</h2>
      
      {#if presences.length > 0}
        <div class="relative border-l border-[#333] ml-3 space-y-6">
          {#each presences as presence}
            <div class="relative pl-6">
              <div class="absolute w-3 h-3 bg-bw-gold rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#050505]"></div>
              <div class="bg-[#111] border border-[#222] p-4 rounded-lg">
                <div class="text-xs text-gray-400 mb-1">Ch. {presence.fromEvent.chapter.number} — Séquence {presence.fromEvent.sequence}</div>
                <h3 class="font-bold text-white mb-1">Position : {presence.location?.name || 'Inconnue'}</h3>
                <p class="text-sm text-gray-400">Certitude : <span class="text-gray-300">{presence.certainty}</span></p>
                {#if presence.untilEvent}
                  <div class="mt-2 text-xs text-gray-500 border-t border-[#333] pt-2">Jusqu'au Ch. {presence.untilEvent.chapter.number}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 italic">Aucun déplacement connu.</p>
      {/if}
    </section>

    <section>
      <h2 class="text-2xl font-bold text-gray-100 mb-6 border-b border-[#333] pb-2">États biologiques & statut</h2>
      
      {#if states.length > 0}
        <div class="relative border-l border-[#333] ml-3 space-y-6">
          {#each states as state}
            <div class="relative pl-6">
              <div class="absolute w-3 h-3 bg-red-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#050505]"></div>
              <div class="bg-[#111] border border-red-900/30 p-4 rounded-lg">
                <div class="text-xs text-gray-400 mb-1">Ch. {state.fromEvent.chapter.number}</div>
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

  {#if character.battles?.length}
    <section class="mb-8">
      <h2 class="text-2xl font-bold text-gray-100 mb-4 border-b border-[#333] pb-2">Combats</h2>
      <div class="grid gap-3">
        {#each character.battles as battle}
          <article class="rounded-lg border border-red-900/30 bg-red-950/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-gray-100">{battle.label || `${character.canonicalName} contre ${battle.opponents.join(', ')}`}</p>
              <p class="text-xs text-gray-500 mt-1">Arc {battle.arc}</p>
            </div>
            <span class="text-sm text-red-300">Chapitre {battle.chapter}</span>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if character.mangaAppearances?.length}
    <section>
      <div class="flex flex-wrap items-end justify-between gap-3 mb-4 border-b border-[#333] pb-2">
        <div>
          <h2 class="text-2xl font-bold text-gray-100">Apparitions dans le manga</h2>
          <p class="text-sm text-gray-500 mt-1">Arc de la Guerre de Succession · chapitres 340 à 414</p>
        </div>
        <p class="text-xs text-gray-500">{character.mangaAppearances.filter((entry: any) => entry.status !== 'absent').length} occurrences</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {#each character.mangaAppearances as appearance}
          <article class={`rounded-md border px-3 py-2 ${appearanceClasses[appearance.status]}`}>
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs">Ch. {appearance.chapter}</span>
              <span class="text-[10px] uppercase tracking-wider">{appearanceLabels[appearance.status]}</span>
            </div>
            <p class="text-xs mt-1 truncate" title={appearance.title}>{appearance.title}</p>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</div>
