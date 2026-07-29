<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'
  import { displayName } from '$lib/utils/displayNames'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'

  export let data: PageData

  let searchEventQuery = ''
  let showEventDropdown = false

  let selectedEventId = data.eventId || ''
  let selectedLeft = data.leftCharacterId || ''
  let selectedRight = data.rightCharacterId || ''

  $: filteredEvents = data.events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
      e.chapter.number.toString().includes(searchEventQuery),
  )

  $: selectedEvent = data.events.find((e) => e.id === selectedEventId)

  function selectEvent(id: string) {
    selectedEventId = id
    showEventDropdown = false
    searchEventQuery = ''
    submitForm()
  }

  function submitForm() {
    if (!selectedEventId || !selectedLeft) return
    const url = new URL($page.url)
    url.searchParams.set('eventId', selectedEventId)
    url.searchParams.set('left', selectedLeft)
    if (selectedRight) {
      url.searchParams.set('right', selectedRight)
    } else {
      url.searchParams.delete('right')
    }
    goto(url.toString(), { keepFocus: true })
  }

  function getCharacterName(id: string) {
    return displayName(data.characters.find((c) => c.id === id)?.canonicalName, $locale) || id
  }
</script>

<Seo
  title={$t.perspectives.seoTitle}
  description={$t.perspectives.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.perspectives.breadcrumb, path: $link('/perspectives') },
  ])}
/>

<div class="max-w-7xl mx-auto p-6">
  <header class="mb-10">
    <h1 class="text-3xl font-bold text-bw-gold mb-2">{$t.perspectives.title}</h1>
    <p class="text-gray-400">{$t.perspectives.intro}</p>
    <div class="mt-4 flex flex-wrap gap-2 text-xs">
      {#if selectedLeft}
        <a
          href={$link(`/perspectives/${selectedLeft}`)}
          class="border border-gray-700 rounded px-3 py-1 hover:border-bw-gold"
          >{$t.perspectives.openSubjectiveMap}</a
        >
        <a
          href={$link(`/knowledge/${selectedLeft}`)}
          class="border border-gray-700 rounded px-3 py-1 hover:border-bw-gold"
          >{$t.perspectives.openKnowledgeMap}</a
        >
      {/if}
      <a
        href={$link('/compare')}
        class="border border-gray-700 rounded px-3 py-1 hover:border-bw-gold"
        >{$t.perspectives.openComparison}</a
      >
    </div>
  </header>

  <!-- Formulaire de configuration -->
  <div
    class="bg-bw-navy border border-bw-gold/20 p-6 rounded-xl mb-10 flex flex-col md:flex-row gap-6 items-end"
  >
    <div class="flex-1 relative w-full">
      <label for="perspective-event" class="block text-sm text-gray-400 mb-1"
        >{$t.perspectives.pointInTime}</label
      >
      <div class="relative">
        <input
          id="perspective-event"
          type="text"
          placeholder={$t.perspectives.searchEventPlaceholder}
          class="w-full bg-bw-dark border border-gray-700 text-white p-3 rounded-lg focus:border-bw-gold focus:outline-none placeholder-gray-600"
          bind:value={searchEventQuery}
          on:focus={() => (showEventDropdown = true)}
          on:blur={() => setTimeout(() => (showEventDropdown = false), 200)}
        />
        {#if selectedEvent && !showEventDropdown}
          <div
            class="absolute inset-y-0 left-0 right-0 p-3 bg-bw-dark border border-bw-gold/50 rounded-lg pointer-events-none truncate text-bw-gold"
          >
            {$t.perspectives.eventOption(selectedEvent.chapter.number, selectedEvent.title)}
          </div>
        {/if}
      </div>

      {#if showEventDropdown}
        <div
          class="absolute z-10 w-full mt-1 bg-bw-dark border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {#each filteredEvents as event (event.id)}
            <button
              class="w-full text-left px-4 py-2 hover:bg-bw-navy text-sm border-b border-gray-800 last:border-0"
              on:click={() => selectEvent(event.id)}
            >
              <span class="text-bw-gold mr-2 font-mono text-xs"
                >{$t.common.chapterShort(event.chapter.number)}</span
              >
              <span class="text-white">{event.title}</span>
            </button>
          {/each}
          {#if filteredEvents.length === 0}
            <div class="px-4 py-3 text-sm text-gray-500">{$t.perspectives.noEvents}</div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex-1 w-full">
      <label for="observer-a" class="block text-sm text-gray-400 mb-1"
        >{$t.perspectives.observerA}</label
      >
      <select
        id="observer-a"
        bind:value={selectedLeft}
        on:change={submitForm}
        class="w-full bg-bw-dark border border-gray-700 text-white p-3 rounded-lg focus:border-bw-gold focus:outline-none"
      >
        <option value="" disabled>{$t.perspectives.chooseCharacter}</option>
        {#each data.characters as char (char.id)}
          <option value={char.id}>{displayName(char.canonicalName, $locale)}</option>
        {/each}
      </select>
    </div>

    <div class="flex-1 w-full">
      <label for="observer-b" class="block text-sm text-gray-400 mb-1"
        >{$t.perspectives.observerB}</label
      >
      <select
        id="observer-b"
        bind:value={selectedRight}
        on:change={submitForm}
        class="w-full bg-bw-dark border border-gray-700 text-white p-3 rounded-lg focus:border-bw-gold focus:outline-none"
      >
        <option value="">{$t.perspectives.noneSingleView}</option>
        {#each data.characters as char (char.id)}
          {#if char.id !== selectedLeft}
            <option value={char.id}>{displayName(char.canonicalName, $locale)}</option>
          {/if}
        {/each}
      </select>
    </div>
  </div>

  <!-- Résultat -->
  {#if !selectedEventId || !selectedLeft}
    <div class="py-20 text-center border border-dashed border-gray-700 rounded-xl">
      <p class="text-gray-500">{$t.perspectives.selectPrompt}</p>
    </div>
  {:else if selectedRight && data.comparison}
    <!-- Mode Comparaison -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Fiche Gauche -->
      <div class="bg-bw-dark border border-gray-800 rounded-xl p-6">
        <h2 class="text-2xl font-bold text-bw-gold mb-4 border-b border-gray-800 pb-2">
          {getCharacterName(selectedLeft)}
        </h2>

        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {$t.perspectives.identityState}
        </h3>
        <div
          class="bg-bw-navy/50 p-4 rounded-lg border border-gray-800 mb-6 font-mono text-xs text-gray-300"
        >
          <p>
            {$t.perspectives.occupiedBody}:
            <span class="text-white"
              >{data.leftPerspective?.observer?.currentBodyId || $t.common.unknown}</span
            >
          </p>
          <p>
            {$t.perspectives.activeConsciousness}:
            <span class="text-white"
              >{data.leftPerspective?.observer?.consciousnessId || $t.common.unknown}</span
            >
          </p>
        </div>

        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {$t.perspectives.subjectiveFacts}
        </h3>
        <ul class="space-y-2">
          {#each data.leftPerspective?.knownFacts || [] as fact (fact.id)}
            <li class="p-3 bg-gray-900 rounded border border-gray-800 text-sm flex flex-col">
              <span class="text-gray-500 mb-1"
                >{$t.perspectives.factSubject(fact.predicate, fact.subjectId)}</span
              >
              <span class="text-white font-medium">{JSON.stringify(fact.value)}</span>
            </li>
          {/each}
          {#if data.leftPerspective?.knownFacts?.length === 0}
            <li class="text-gray-500 italic text-sm">{$t.perspectives.noKnownFacts}</li>
          {/if}
        </ul>
      </div>

      <!-- Fiche Droite -->
      <div class="bg-bw-dark border border-gray-800 rounded-xl p-6">
        <h2 class="text-2xl font-bold text-bw-gold mb-4 border-b border-gray-800 pb-2">
          {getCharacterName(selectedRight)}
        </h2>

        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {$t.perspectives.identityState}
        </h3>
        <div
          class="bg-bw-navy/50 p-4 rounded-lg border border-gray-800 mb-6 font-mono text-xs text-gray-300"
        >
          <p>
            {$t.perspectives.occupiedBody}:
            <span class="text-white"
              >{data.rightPerspective?.observer?.currentBodyId || $t.common.unknown}</span
            >
          </p>
          <p>
            {$t.perspectives.activeConsciousness}:
            <span class="text-white"
              >{data.rightPerspective?.observer?.consciousnessId || $t.common.unknown}</span
            >
          </p>
        </div>

        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {$t.perspectives.subjectiveFacts}
        </h3>
        <ul class="space-y-2">
          {#each data.rightPerspective?.knownFacts || [] as fact (fact.id)}
            <li class="p-3 bg-gray-900 rounded border border-gray-800 text-sm flex flex-col">
              <span class="text-gray-500 mb-1"
                >{$t.perspectives.factSubject(fact.predicate, fact.subjectId)}</span
              >
              <span class="text-white font-medium">{JSON.stringify(fact.value)}</span>
            </li>
          {/each}
          {#if data.rightPerspective?.knownFacts?.length === 0}
            <li class="text-gray-500 italic text-sm">{$t.perspectives.noKnownFacts}</li>
          {/if}
        </ul>
      </div>
    </div>

    <!-- Section Différences -->
    <div class="mt-8 bg-bw-navy/30 border border-bw-gold/30 rounded-xl p-6">
      <h3 class="text-xl font-bold text-white mb-4">{$t.perspectives.differencesTitle}</h3>

      <div class="space-y-3">
        {#each data.comparison as diff, diffIndex (diffIndex)}
          <div
            class="p-4 rounded-lg border flex items-center justify-between
            {diff.differenceType === 'CONTRADICTION'
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-bw-dark border-gray-700'}"
          >
            <div class="flex flex-col">
              <span class="text-xs font-mono text-gray-400 mb-1"
                >{diff.subjectId} — {diff.dimension}</span
              >
              <span class="text-sm text-white font-medium">
                {#if diff.differenceType === 'LEFT_ONLY'}
                  {$t.perspectives.knowsButNot(
                    getCharacterName(selectedLeft),
                    getCharacterName(selectedRight),
                  )}
                {:else if diff.differenceType === 'RIGHT_ONLY'}
                  {$t.perspectives.knowsButNot(
                    getCharacterName(selectedRight),
                    getCharacterName(selectedLeft),
                  )}
                {:else if diff.differenceType === 'CONTRADICTION'}
                  {$t.perspectives.contradiction}
                {/if}
              </span>
            </div>

            {#if diff.differenceType === 'CONTRADICTION'}
              <div class="flex text-xs font-mono gap-4 items-center">
                <div class="text-red-400 text-right">
                  <span>{getCharacterName(selectedLeft)} :</span>
                  <br />{JSON.stringify(diff.leftValue)}
                </div>
                <div class="text-gray-600">{$t.perspectives.versus}</div>
                <div class="text-red-400">
                  <span>{getCharacterName(selectedRight)} :</span>
                  <br />{JSON.stringify(diff.rightValue)}
                </div>
              </div>
            {:else if diff.differenceType === 'LEFT_ONLY'}
              <div class="text-xs font-mono text-gray-300 bg-gray-800 p-2 rounded">
                {$t.perspectives.value(JSON.stringify(diff.leftValue))}
              </div>
            {:else if diff.differenceType === 'RIGHT_ONLY'}
              <div class="text-xs font-mono text-gray-300 bg-gray-800 p-2 rounded">
                {$t.perspectives.value(JSON.stringify(diff.rightValue))}
              </div>
            {/if}
          </div>
        {/each}
        {#if data.comparison.length === 0}
          <p class="text-gray-400 text-sm italic">{$t.perspectives.noDifferences}</p>
        {/if}
      </div>
    </div>
  {:else if data.leftPerspective}
    <!-- Mode Simple (Un seul observateur) -->
    <div class="bg-bw-dark border border-gray-800 rounded-xl p-8 max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold text-bw-gold mb-6 pb-4 border-b border-gray-800">
        {$t.perspectives.perspectiveOf(getCharacterName(selectedLeft))}
      </h2>

      <div class="mb-8">
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center"
        >
          <span class="w-8 h-[1px] bg-gray-700 mr-3"></span>
          {$t.perspectives.apparentIdentity}
          <span class="w-8 h-[1px] bg-gray-700 ml-3"></span>
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-bw-navy p-4 rounded-lg border border-gray-800">
            <span class="block text-xs text-gray-500 mb-1">{$t.perspectives.occupiedBody}</span>
            <span class="font-mono text-white text-sm"
              >{data.leftPerspective.observer?.currentBodyId || $t.perspectives.notFound}</span
            >
          </div>
          <div class="bg-bw-navy p-4 rounded-lg border border-gray-800">
            <span class="block text-xs text-gray-500 mb-1">{$t.perspectives.consciousness}</span>
            <span class="font-mono text-white text-sm"
              >{data.leftPerspective.observer?.consciousnessId || $t.perspectives.notFound}</span
            >
          </div>
        </div>
      </div>

      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center"
        >
          <span class="w-8 h-[1px] bg-gray-700 mr-3"></span>
          {$t.perspectives.knowledgeBase}
          <span class="w-8 h-[1px] bg-gray-700 ml-3"></span>
        </h3>

        <div class="space-y-4">
          {#each data.leftPerspective.knownFacts || [] as fact (fact.id)}
            <div
              class="p-4 bg-gray-900 rounded-lg border border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <span
                  class="inline-block px-2 py-1 bg-gray-800 text-gray-400 rounded text-[10px] uppercase font-bold mb-2"
                >
                  {fact.truthStatus === 'CONTESTED'
                    ? $t.perspectives.contestedBelief
                    : $t.perspectives.verifiedFact}
                </span>
                <p class="text-white text-sm font-medium">{fact.predicate}</p>
                <p class="text-gray-500 text-xs mt-1">
                  {$t.perspectives.subjectPrefix} <span class="font-mono">{fact.subjectId}</span>
                </p>
              </div>
              <div
                class="font-mono text-bw-gold bg-bw-dark p-2 rounded text-xs text-right whitespace-pre-wrap max-w-xs overflow-x-auto"
              >
                {JSON.stringify(fact.value, null, 2)}
              </div>
            </div>
          {/each}

          {#if !data.leftPerspective.knownFacts || data.leftPerspective.knownFacts.length === 0}
            <div
              class="p-8 text-center border border-dashed border-gray-800 rounded-lg text-gray-500 italic"
            >
              {$t.perspectives.noVerifiedKnowledge}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Loading ou erreur silencieuse (non trouvé) -->
    <div class="py-20 text-center">
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-bw-gold border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
      ></div>
      <p class="mt-4 text-gray-500">{$t.perspectives.retrieving}</p>
    </div>
  {/if}
</div>
