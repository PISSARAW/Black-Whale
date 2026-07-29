<script lang="ts">
  import type { PageData } from './$types'
  import { HATSU_PROFILES, hatsuById } from '$lib/nen/hatsuRegistry.js'
  import { activateHatsu } from '$lib/nen/hatsuState.js'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'

  export let data: PageData

  // The checked-in registry is the canonical interaction list; the ability
  // catalogue only enriches it, so a profile that is missing from the
  // catalogue still renders from the registry rather than becoming a hole.
  $: abilities = HATSU_PROFILES.map((registryProfile) => {
    const profile = localizeHatsu(registryProfile, $locale)
    const catalogued = data.abilities.find((ability) => ability.id === profile.id)
    // The catalogue is still English-only, so the registry's own French text is
    // the better record on the French side.
    const preferRegistry = $locale !== 'en'
    return {
      id: profile.id,
      name: preferRegistry ? profile.name : (catalogued?.name ?? profile.name),
      owner: preferRegistry ? profile.owner : (catalogued?.owner ?? profile.owner),
      category: catalogued?.category ?? 'nen',
      description: preferRegistry ? profile.rule : (catalogued?.description ?? profile.rule),
    }
  })

  function activate(id: string) {
    const profile = hatsuById(id)
    if (profile) activateHatsu(profile)
  }
</script>

<Seo
  title={$t.abilities.seoTitle}
  description={$t.abilities.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.abilities.breadcrumb, path: $link('/abilities') },
  ])}
/>

<div class="max-w-4xl mx-auto p-8">
  <header class="mb-12">
    <h1 class="text-3xl font-bold text-bw-gold mb-2">{$t.abilities.title}</h1>
    <p class="text-gray-400">{$t.abilities.subtitle}</p>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each abilities as ability (ability.id)}
      {@const registryProfile = hatsuById(ability.id)}
      {@const profile = registryProfile ? localizeHatsu(registryProfile, $locale) : null}
      <article
        data-hatsu-id={ability.id}
        class="block group relative bg-bw-navy/50 border border-bw-gold/20 rounded-xl p-6 overflow-hidden hover:border-bw-gold/60 transition-colors"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-bw-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        ></div>
        <div class="relative">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold text-white group-hover:text-bw-gold transition-colors">
                {ability.name}
              </h2>
              <p class="text-gray-500 text-sm mt-1 uppercase tracking-wider">{ability.owner}</p>
            </div>
            <span
              class="px-2 py-1 text-xs rounded-full bg-bw-gold/10 text-bw-gold border border-bw-gold/30"
            >
              {ability.category || $t.abilities.unknownCategory}
            </span>
          </div>

          <p class="text-gray-400 text-sm mt-2 line-clamp-2">
            {ability.description || $t.abilities.noDescription}
          </p>

          {#if profile}
            <button
              class="mt-6 flex w-full items-center text-left text-bw-gold/80 text-sm font-semibold hover:text-bw-gold"
              onclick={() => activate(ability.id)}
              data-hatsu-pass
              aria-label={$t.abilities.activateAria(ability.name)}
            >
              <span>{$t.abilities.activate}</span>
              <svg
                class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
            <div class="mt-3 border-l pl-3 text-xs" style={`border-color:${profile.color}`}>
              <p class="text-gray-400">{profile.instruction}</p>
              <p class="mt-1 text-gray-600">{$t.abilities.cost(profile.cost)}</p>
            </div>
          {/if}
        </div>
      </article>
    {/each}

    {#if abilities.length === 0}
      <div class="col-span-full py-12 text-center border border-dashed border-gray-700 rounded-xl">
        <p class="text-gray-500">{$t.abilities.empty}</p>
      </div>
    {/if}
  </div>
</div>
