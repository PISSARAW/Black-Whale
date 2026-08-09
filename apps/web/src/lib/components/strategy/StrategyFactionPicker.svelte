<script lang="ts">
  import type { StrategyFaction } from '$lib/strategy/types'
  import type { StrategySave } from '$lib/strategy/persistence'
  import { scenarioDoctrineForFaction } from '$lib/strategy/scenario'
  import { doctrineLabel } from '$lib/strategy/localization'
  import { locale, t } from '$lib/i18n'

  let {
    chapterNumber,
    factions,
    saved,
    onselect,
    onresume,
  }: {
    chapterNumber?: number
    factions: StrategyFaction[]
    saved: StrategySave | null
    onselect: (id: string) => void
    onresume: () => void
  } = $props()
</script>

<section class="mx-auto max-w-5xl px-6 py-12 text-center sm:py-24">
  <div
    class="inline-flex items-center gap-3 rounded-full border border-sky-500/30 bg-sky-950/40 px-4 py-1.5 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
  >
    <span class="h-2 w-2 animate-pulse rounded-full bg-sky-400"></span>
    <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400">
      {$t.strategy.ui.picker.scenario(chapterNumber)}
    </p>
  </div>

  <h1 class="mt-6 font-black text-5xl text-white drop-shadow-md sm:text-6xl">
    {$t.strategy.ui.picker.title}
  </h1>
  <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-sky-200/60">
    {$t.strategy.ui.picker.intro}
  </p>

  {#if saved}
    <button
      class="mt-8 rounded-full border border-amber-400/50 bg-amber-900/30 px-8 py-3 text-sm font-bold uppercase tracking-widest text-amber-400 transition-all hover:bg-amber-400/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]"
      type="button"
      onclick={onresume}
    >
      {$t.strategy.ui.picker.resume(saved.turns.length + 1)}
    </button>
  {/if}

  {#if factions.length}
    <div class="mt-12 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
      {#each factions as faction (faction.id)}
        <button
          type="button"
          onclick={() => onselect(faction.id)}
          class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-sky-900/50 bg-[#0a0f1c]/80 p-6 transition-all hover:-translate-y-1 hover:border-sky-400 hover:bg-sky-900/30 hover:shadow-[0_0_25px_rgba(56,189,248,0.3)]"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-sky-400/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
          <div>
            <strong class="block font-black text-2xl text-white">{faction.name}</strong>
            <span class="mt-2 block text-xs text-sky-200/50"
              >{$t.strategy.ui.picker.activeUnits(faction.members.length)}</span
            >
            <span
              class="mt-3 block rounded-md border border-sky-900/40 bg-sky-950/40 p-2 text-[10px] font-medium leading-relaxed text-sky-100/70"
            >
              {doctrineLabel(scenarioDoctrineForFaction(faction.id), $locale)}
            </span>
          </div>
          <em
            class="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-400 not-italic"
          >
            {$t.strategy.ui.picker.begin} <svg
              class="h-3 w-3 transition-transform group-hover:translate-x-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              ><path
                fill-rule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              /></svg
            >
          </em>
        </button>
      {/each}
    </div>
  {:else}
    <div class="mt-12 rounded-xl border border-red-900/50 bg-red-950/20 p-8">
      <p class="text-sm font-medium uppercase tracking-widest text-red-400">
        {$t.strategy.ui.picker.none}
      </p>
    </div>
  {/if}
</section>
