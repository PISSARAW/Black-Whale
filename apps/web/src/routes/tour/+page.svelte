<script lang="ts">
  /**
   * The virtual tour: a first-person walk through the reconstructed ship.
   *
   * This route is deliberately self-contained. It reads `data/ship` and nothing
   * else — no world state, no perspective, no spoiler profile — because the
   * reconstruction is architecture rather than a moment in the story. `/ship`
   * remains the place to ask who was where.
   */
  import { page } from '$app/stores'
  import Seo from '$lib/components/Seo.svelte'
  import TourMinimap from '$lib/components/tour/TourMinimap.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, t } from '$lib/i18n'
  import { locale } from '$lib/i18n'
  import { buildShip, entrySpace } from '$lib/tour/blueprint'
  import type { Link, Space } from '$lib/tour/types'

  const ship = buildShip()

  // `?space=` names a space to open in, `?deck=` a deck. Read once, on the way
  // in: the walk does not rewrite the URL as the visitor moves, so a shared
  // link keeps pointing at the room it was copied from.
  const requestedSpace = ship.spaces.get($page.url.searchParams.get('space') ?? '')
  const requestedDeck = $page.url.searchParams.get('deck')
  const initialTierId =
    requestedSpace?.tierId ??
    (requestedDeck && ship.plans.has(requestedDeck) ? requestedDeck : ship.tiers[0].id)

  let tierId = $state(initialTierId)
  let currentSpace = $state<Space | null>(null)
  let availableLink = $state<{ link: Link; to: string } | null>(null)
  let jumpTo = $state<string | null>(requestedSpace?.id ?? null)
  let engaged = $state(false)
  let position = $state<[number, number]>([0, 0])
  let heading = $state(0)

  const plan = $derived(ship.plans.get(tierId)!)
  const french = $derived($locale === 'fr')

  const nameOf = (entity: { name: string; nameFr: string }) => (french ? entity.nameFr : entity.name)

  const sortedSpaces = $derived(
    [...plan.spaces].sort((a, b) => nameOf(a).localeCompare(nameOf(b), french ? 'fr' : 'en')),
  )

  const provenanceLabel = (space: Space) => $t.tour.provenance[space.provenance]

  const provenanceClass = (space: Space) =>
    space.provenance === 'inferred'
      ? 'border-[#2b3a4a] bg-[#2b3a4a]/30 text-[#9dc4e0]'
      : space.provenance === 'panel'
        ? 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]'
        : 'border-[#FFFFF0]/30 bg-[#FFFFF0]/5 text-[#FFFFF0]/80'

  const linkPrompt = $derived.by(() => {
    if (!availableLink) return null
    const destination = ship.spaces.get(availableLink.to)
    if (!destination) return null
    const tier = ship.tiers.find((candidate) => candidate.id === destination.tierId)
    const label = `${nameOf(destination)}${tier ? ` — ${nameOf(tier)}` : ''}`
    return availableLink.link.kind === 'bulkhead'
      ? $t.tour.takeBulkhead(label)
      : $t.tour.takeLink(label)
  })

  /** Bow-to-stern length of the ship, read off the widest tier. */
  const shipLength = Math.round(
    Math.max(
      ...ship.tiers.map((tier) => {
        const zs = tier.hull.map((point) => point[1])
        return Math.max(...zs) - Math.min(...zs)
      }),
    ),
  )

  function goToSpace(space: Space) {
    if (space.tierId !== tierId) tierId = space.tierId
    jumpTo = space.id
  }

  function selectTier(id: string) {
    if (id === tierId) return
    const plan = ship.plans.get(id)
    if (plan) goToSpace(entrySpace(plan))
  }
</script>

<Seo
  title={$t.tour.seoTitle}
  description={$t.tour.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
  ])}
/>

<div class="mx-auto max-w-[1600px] px-4 py-8">
  <header class="mb-6">
    <h1 class="text-3xl font-bold tracking-tight text-[#FFFFF0] sm:text-4xl">{$t.tour.title}</h1>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/70">{$t.tour.intro}</p>
    <p class="mt-2 text-xs uppercase tracking-widest text-[#FFD700]/70">
      {$t.tour.counts(ship.blueprint.spaces.length, ship.tiers.length)} · {$t.tour.scale(shipLength)}
    </p>
  </header>

  <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
    <!-- The walk -->
    <section class="relative min-h-[420px] overflow-hidden rounded-lg border border-[#333] lg:h-[70vh]">
      <TourScene
        {ship}
        bind:tierId
        bind:currentSpace
        bind:availableLink
        bind:jumpTo
        bind:engaged
        bind:position
        bind:heading
        loadingLabel={$t.tour.loading}
        unsupportedLabel={$t.tour.unsupported}
      />

      <!-- Reticle -->
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFFFF0]/60"
      ></div>

      <!-- Where the visitor stands, and what it is worth as evidence -->
      <div class="pointer-events-none absolute left-3 top-3 max-w-sm">
        <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {nameOf(plan.tier)}
        </p>
        <p class="text-lg font-semibold leading-tight text-[#FFFFF0]">
          {currentSpace ? nameOf(currentSpace) : $t.tour.outside}
        </p>
        {#if currentSpace}
          <span
            class="mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {provenanceClass(
              currentSpace,
            )}"
          >
            {provenanceLabel(currentSpace)}
          </span>
          <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">
            {currentSpace.source || $t.tour.noSource}
          </p>
        {/if}
      </div>

      <p
        class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-[#050505]/80 px-3 py-1 text-xs text-[#FFFFF0]/70"
      >
        {engaged ? $t.tour.engaged : $t.tour.enter}
      </p>

      {#if linkPrompt}
        <p
          class="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded border border-[#FFD700]/50 bg-[#050505]/90 px-3 py-1 text-xs text-[#FFD700]"
        >
          {linkPrompt}
        </p>
      {/if}
    </section>

    <!-- Deck selector, plan and index -->
    <aside class="flex flex-col gap-4">
      <nav aria-label={$t.tour.decks}>
        <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">{$t.tour.decks}</p>
        <div class="flex flex-wrap gap-1.5">
          {#each ship.tiers as tier (tier.id)}
            <button
              type="button"
              onclick={() => selectTier(tier.id)}
              aria-current={tier.id === tierId ? 'true' : undefined}
              class="rounded border px-2.5 py-1 text-xs transition-colors {tier.id === tierId
                ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
                : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
            >
              {nameOf(tier)}
            </button>
          {/each}
        </div>
      </nav>

      <TourMinimap
        {plan}
        {position}
        {heading}
        currentSpaceId={currentSpace?.id ?? null}
        label={$t.tour.minimap(nameOf(plan.tier))}
        onSelect={goToSpace}
      />

      <section>
        <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tour.jumpTo}
        </p>
        <ul class="max-h-56 overflow-y-auto rounded border border-[#333]">
          {#each sortedSpaces as space (space.id)}
            <li>
              <button
                type="button"
                onclick={() => goToSpace(space)}
                class="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[#FFD700]/10 {space.id ===
                currentSpace?.id
                  ? 'bg-[#FFD700]/15 text-[#FFD700]'
                  : 'text-[#FFFFF0]/80'}"
              >
                <span class="truncate">{nameOf(space)}</span>
                <span
                  class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {provenanceClass(
                    space,
                  )}"
                >
                  {provenanceLabel(space)}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      </section>

      <section class="rounded border border-[#333] p-3">
        <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tour.controls.title}
        </p>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-[#FFFFF0]/70">
          <dt class="text-[#FFFFF0]">{$t.tour.controls.move}</dt>
          <dd>{$t.tour.controls.moveKeys}</dd>
          <dt class="text-[#FFFFF0]">{$t.tour.controls.look}</dt>
          <dd>{$t.tour.controls.lookKeys}</dd>
          <dt class="text-[#FFFFF0]">{$t.tour.controls.sprint}</dt>
          <dd>{$t.tour.controls.sprintKeys}</dd>
          <dt class="text-[#FFFFF0]">{$t.tour.controls.use}</dt>
          <dd>{$t.tour.controls.useKeys}</dd>
        </dl>
      </section>

      <section class="rounded border border-[#333] p-3">
        <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tour.provenance.title}
        </p>
        <ul class="space-y-1.5 text-xs text-[#FFFFF0]/60">
          <li>
            <span class="rounded border border-[#FFD700]/60 bg-[#FFD700]/10 px-1 text-[#FFD700]">
              {$t.tour.provenance.panel}
            </span>
            <span class="ml-1">{$t.tour.provenance.panelHelp}</span>
          </li>
          <li>
            <span class="rounded border border-[#FFFFF0]/30 bg-[#FFFFF0]/5 px-1 text-[#FFFFF0]/80">
              {$t.tour.provenance.plan}
            </span>
            <span class="ml-1">{$t.tour.provenance.planHelp}</span>
          </li>
          <li>
            <span class="rounded border border-[#2b3a4a] bg-[#2b3a4a]/30 px-1 text-[#9dc4e0]">
              {$t.tour.provenance.inferred}
            </span>
            <span class="ml-1">{$t.tour.provenance.inferredHelp}</span>
          </li>
          <li class="border-t border-[#333] pt-1.5 text-[#FFFFF0]/50">
            {$t.tour.provenance.scaleHelp}
          </li>
        </ul>
      </section>
    </aside>
  </div>
</div>
