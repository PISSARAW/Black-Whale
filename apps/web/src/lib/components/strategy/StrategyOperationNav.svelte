<script lang="ts">
  import type { StrategyScenarioV2 } from '$lib/strategy/scenario/types'
  import { localizeStrategyScenario } from '$lib/strategy/localization'
  import { link, locale, t } from '$lib/i18n'

  /** The campaign's operations, one link per scenario; taken out of the route. */
  let {
    scenarios,
    currentId,
  }: {
    scenarios: StrategyScenarioV2[]
    currentId?: string
  } = $props()
  let operations = $derived(
    scenarios.map((scenario) => localizeStrategyScenario(scenario, $locale)),
  )
</script>

<nav
  class="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3"
  aria-label={$t.strategy.ui.campaignOperations}
>
  {#each operations as operation, index (operation.id)}
    <a
      href={$link(`/strategy?scenario=${operation.id}`)}
      aria-current={currentId === operation.id ? 'page' : undefined}
      class="group flex flex-col gap-2 rounded-sm border border-sky-900/40 bg-[#0a0f1c]/80 p-5 transition-all hover:border-sky-400 hover:bg-sky-900/30 aria-[current=page]:border-amber-500/60 aria-[current=page]:bg-amber-950/20"
    >
      <span
        class="text-[9px] font-bold uppercase tracking-widest text-sky-500/60 group-aria-[current=page]:text-amber-500/80"
        >{$t.strategy.ui.operation(index + 1, operation.chapterNumber)}</span
      >
      <strong class="font-black text-lg text-white group-aria-[current=page]:text-amber-300"
        >{operation.title}</strong
      >
      <small
        class="text-xs leading-relaxed text-sky-200/50 group-aria-[current=page]:text-amber-100/70"
        >{operation.description}</small
      >
    </a>
  {/each}
</nav>
