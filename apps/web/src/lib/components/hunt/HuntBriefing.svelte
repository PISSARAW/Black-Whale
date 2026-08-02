<script lang="ts">
  import type { HuntHatsuId, HuntHatsuProfile } from '$lib/hunt/hatsu'
  import type { HunterProfile, HunterProfileId } from '$lib/hunt/hunter/profiles'
  import type { HuntTerrain, HuntTerrainId } from '$lib/hunt/arena'

  interface Props {
    labels: {
      eyebrow: string
      title: string
      premise: string
      rule: string
      objective: string
      begin: string
      hatsu: string
      hatsuRule: string
      chooseHatsu: string
      role: Record<HuntHatsuProfile['role'], string>
    }
    profiles: HuntHatsuProfile[]
    selected: HuntHatsuId
    onSelect: (id: HuntHatsuId) => void
    hunterProfiles: HunterProfile[]
    selectedHunter: HunterProfileId
    hunterLabels: { choose: string; role: Record<HunterProfileId, string> }
    onSelectHunter: (id: HunterProfileId) => void
    terrains: HuntTerrain[]
    selectedTerrain: HuntTerrainId
    terrainLabel: string
    locale: string
    onSelectTerrain: (id: HuntTerrainId) => void
    onBegin: () => void
  }

  let {
    labels,
    profiles,
    selected,
    onSelect,
    hunterProfiles,
    selectedHunter,
    hunterLabels,
    onSelectHunter,
    terrains,
    selectedTerrain,
    terrainLabel,
    locale,
    onSelectTerrain,
    onBegin,
  }: Props = $props()
</script>

<section
  class="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-black/88 p-6 backdrop-blur-md"
>
  <div class="max-w-lg text-center">
    <p class="text-xs uppercase tracking-[0.35em] text-sky-300/80">{labels.eyebrow}</p>
    <h1 class="mt-4 text-3xl font-medium text-white sm:text-4xl">{labels.title}</h1>
    <p class="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70">{labels.premise}</p>
    <p
      class="mx-auto mt-4 max-w-md border-y border-white/10 py-4 text-sm leading-relaxed text-rose-200/90"
    >
      {labels.rule}
    </p>
    <p class="mt-4 text-sm text-white/55">{labels.objective}</p>
    <div class="mx-auto mt-6 max-w-lg">
      <p class="text-[0.65rem] uppercase tracking-[0.25em] text-violet-300/70">
        {labels.chooseHatsu}
      </p>
      <div class="mt-2 grid gap-2 sm:grid-cols-3">
        {#each profiles as profile (profile.id)}
          <button
            class="rounded-lg border p-3 text-left transition {selected === profile.id
              ? 'border-violet-300 bg-violet-300/10'
              : 'border-white/10 bg-white/[0.03]'}"
            aria-pressed={selected === profile.id}
            onclick={() => onSelect(profile.id)}
          >
            <span class="block text-sm font-medium text-violet-100">{profile.name}</span>
            <span class="mt-1 block text-[0.65rem] uppercase tracking-wider text-white/40">
              {labels.role[profile.role]}
            </span>
          </button>
        {/each}
      </div>
      <p class="mt-5 text-[0.65rem] uppercase tracking-[0.25em] text-sky-300/70">
        {terrainLabel}
      </p>
      <div class="mt-2 grid gap-2 sm:grid-cols-3">
        {#each terrains as terrain (terrain.id)}
          <button
            class="rounded-lg border p-3 text-left transition {selectedTerrain === terrain.id
              ? 'border-sky-300 bg-sky-300/10'
              : 'border-white/10 bg-white/[0.03]'}"
            aria-pressed={selectedTerrain === terrain.id}
            onclick={() => onSelectTerrain(terrain.id)}
          >
            <span class="block text-sm font-medium text-sky-100">
              {locale === 'fr' ? terrain.name.fr : terrain.name.en}
            </span>
            <span class="mt-1 block text-[0.65rem] leading-snug text-white/40">
              {locale === 'fr' ? terrain.description.fr : terrain.description.en}
            </span>
          </button>
        {/each}
      </div>
      <p class="mt-2 text-xs leading-relaxed text-white/45">{labels.hatsuRule}</p>
      <p class="mt-5 text-[0.65rem] uppercase tracking-[0.25em] text-rose-300/70">
        {hunterLabels.choose}
      </p>
      <div class="mt-2 grid gap-2 sm:grid-cols-3">
        {#each hunterProfiles as profile (profile.id)}
          <button
            class="rounded-lg border p-3 text-left transition {selectedHunter === profile.id
              ? 'border-rose-300 bg-rose-300/10'
              : 'border-white/10 bg-white/[0.03]'}"
            aria-pressed={selectedHunter === profile.id}
            onclick={() => onSelectHunter(profile.id)}
          >
            <span class="block text-sm font-medium capitalize text-rose-100">{profile.id}</span>
            <span class="mt-1 block text-[0.65rem] leading-snug text-white/40">
              {hunterLabels.role[profile.id]}
            </span>
          </button>
        {/each}
      </div>
    </div>
    <button
      class="mt-8 rounded-full border border-sky-300/60 bg-sky-300/10 px-7 py-3 text-sm uppercase tracking-widest text-sky-100 transition hover:bg-sky-300/20"
      onclick={onBegin}>{labels.begin}</button
    >
  </div>
</section>
