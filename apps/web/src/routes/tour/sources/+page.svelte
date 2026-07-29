<script lang="ts">
  /**
   * The evidence behind the reconstruction, published in full.
   *
   * The tour already shows a room's provenance while you stand in it, which
   * answers the question one room at a time and only for whoever is walking.
   * The recurring question is the other one — *how do you know all of this?* —
   * and it deserves a page that can be read, searched and linked to without
   * WebGL: every space, the source it rests on, and the ones the reconstruction
   * admits to inventing.
   *
   * It reads the same blueprint the tour walks. There is no second list of
   * sources to keep in step, because a second list would drift.
   */
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { buildShip } from '$lib/tour/blueprint'
  import type { Provenance, Space, Tier } from '$lib/tour/types'

  const ship = buildShip()

  const REPOSITORY_FILE =
    'https://github.com/PISSARAW/Black-Whale/blob/main/data/ship/blueprint.json'

  /** Strongest claim first: it is also the order the tally reads best in. */
  const PROVENANCE_ORDER: Provenance[] = ['panel', 'plan', 'inferred']

  let query = $state('')
  let evidence = $state<Provenance | 'all'>('all')
  let grouping = $state<'source' | 'deck'>('source')

  const french = $derived($locale === 'fr')

  const nameOf = (entity: { name: string; nameFr: string }) =>
    french ? entity.nameFr : entity.name
  const sourceOf = (entity: { source: string; sourceFr: string }) =>
    french ? entity.sourceFr : entity.source
  const reasonOf = (entity: { reason: string; reasonFr: string }) =>
    french ? entity.reasonFr : entity.reason

  const tierById = new Map(ship.tiers.map((tier) => [tier.id, tier]))

  /** The deck a space is on — through its parent room, when it is an interior. */
  function deckOfSpace(space: Space): Tier {
    const tier = tierById.get(space.tierId)!
    if (tier.kind !== 'interior') return tier
    const parent = ship.spaces.get(tier.parentSpaceId ?? '')
    return parent ? tierById.get(parent.tierId)! : tier
  }

  /** Where a space is, said in one line: the deck, and the room it is inside. */
  const placeOf = $derived((space: Space) => {
    const tier = tierById.get(space.tierId)!
    const deck = deckOfSpace(space)
    return tier.kind === 'interior'
      ? `${nameOf(deck)} · ${$t.tourSources.insideOf(nameOf(tier))}`
      : nameOf(deck)
  })

  const provenanceLabel = (provenance: Provenance) => $t.tour.provenance[provenance]

  const provenanceClass = (provenance: Provenance) =>
    provenance === 'inferred'
      ? 'border-[#2b3a4a] bg-[#2b3a4a]/30 text-[#9dc4e0]'
      : provenance === 'panel'
        ? 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]'
        : 'border-[#FFFFF0]/30 bg-[#FFFFF0]/5 text-[#FFFFF0]/80'

  const tally = $derived(
    PROVENANCE_ORDER.map((provenance) => ({
      provenance,
      count: ship.blueprint.spaces.filter((space) => space.provenance === provenance).length,
    })),
  )

  const distinctSources = new Set(ship.blueprint.spaces.map((space) => space.source)).size

  const normalized = $derived(query.trim().toLowerCase())

  const matches = $derived(
    ship.blueprint.spaces.filter((space) => {
      if (evidence !== 'all' && space.provenance !== evidence) return false
      if (!normalized) return true
      return `${nameOf(space)} ${sourceOf(space)} ${placeOf(space)}`
        .toLowerCase()
        .includes(normalized)
    }),
  )

  interface Group {
    key: string
    label: string
    /** Set when the group *is* a source; a deck holds spaces of every kind. */
    provenance: Provenance | null
    spaces: Space[]
  }

  const groups = $derived.by((): Group[] => {
    // A plain record, not a Map: this is a local accumulator inside the
    // derivation, so it must not become reactive state of its own. String keys
    // keep their insertion order, which is what the sort below refines.
    const collected: Record<string, Group | undefined> = {}

    for (const space of matches) {
      const key = grouping === 'source' ? space.source : deckOfSpace(space).id
      const existing = collected[key]
      if (existing) {
        existing.spaces.push(space)
        continue
      }
      collected[key] = {
        key,
        label: grouping === 'source' ? sourceOf(space) : nameOf(deckOfSpace(space)),
        provenance: grouping === 'source' ? space.provenance : null,
        spaces: [space],
      }
    }

    const ordered = Object.values(collected).filter((group) => group !== undefined)
    for (const group of ordered) {
      group.spaces.sort((a, b) => nameOf(a).localeCompare(nameOf(b), $t.common.intlLocale))
    }

    // By source, the strongest evidence comes first and the widest claim within
    // it; by deck, the ship's own order, top tier down.
    if (grouping === 'source') {
      return ordered.sort(
        (a, b) =>
          PROVENANCE_ORDER.indexOf(a.provenance!) - PROVENANCE_ORDER.indexOf(b.provenance!) ||
          b.spaces.length - a.spaces.length ||
          a.label.localeCompare(b.label, $t.common.intlLocale),
      )
    }
    const deckOrder = ship.decks.map((deck) => deck.id)
    return ordered.sort((a, b) => deckOrder.indexOf(a.key) - deckOrder.indexOf(b.key))
  })

  /** The vertical joins, in the order the decks stack. */
  const verticalLinks = $derived(
    ship.links.map((connection) => {
      const from = ship.spaces.get(connection.from)
      const to = ship.spaces.get(connection.to)
      return {
        connection,
        fromLabel: from ? nameOf(from) : connection.from,
        toLabel: to ? nameOf(to) : connection.to,
        fromDeck: from ? nameOf(deckOfSpace(from)) : '',
        toDeck: to ? nameOf(deckOfSpace(to)) : '',
      }
    }),
  )

  /** Seals and hand-placed doors say the same thing many times over. */
  function byReason(entries: Array<{ reason: string; reasonFr: string }>) {
    const counted: Record<string, { label: string; count: number } | undefined> = {}
    for (const entry of entries) {
      const existing = counted[entry.reason]
      if (existing) existing.count += 1
      else counted[entry.reason] = { label: reasonOf(entry), count: 1 }
    }
    return Object.values(counted)
      .filter((entry) => entry !== undefined)
      .sort((a, b) => b.count - a.count)
  }

  const sealReasons = $derived(byReason(ship.seals))
  const doorReasons = $derived(byReason(ship.doors))

  const spaceUrl = $derived((space: Space) => `${$link('/tour')}?space=${space.id}`)
</script>

<Seo
  title={$t.tourSources.seoTitle}
  description={$t.tourSources.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
    { name: $t.tourSources.breadcrumb, path: $link('/tour/sources') },
  ])}
/>

<div class="mx-auto max-w-5xl px-4 py-8">
  <header class="mb-8">
    <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
      <a class="hover:text-[#FFD700]" href={$link('/tour')}>{$t.nav.virtualTour}</a>
      <span class="text-[#FFFFF0]/30"> / </span>{$t.tourSources.breadcrumb}
    </p>
    <h1 class="mt-2 text-3xl font-bold tracking-tight text-[#FFFFF0] sm:text-4xl">
      {$t.tourSources.title}
    </h1>
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/70">{$t.tourSources.intro}</p>

    <dl class="mt-5 flex flex-wrap gap-2 text-xs">
      <div class="rounded border border-[#333] px-2.5 py-1 text-[#FFFFF0]/80">
        {$t.tourSources.counts(ship.blueprint.spaces.length, distinctSources)}
      </div>
      {#each tally as entry (entry.provenance)}
        <div class="rounded border px-2.5 py-1 {provenanceClass(entry.provenance)}">
          {$t.tourSources.tally(provenanceLabel(entry.provenance), entry.count)}
        </div>
      {/each}
    </dl>
  </header>

  <!-- What the drawings can and cannot support, before the room-by-room list -->
  <section class="mb-8 rounded-lg border border-[#333] p-4 sm:p-5">
    <h2 class="text-xs uppercase tracking-widest text-[#FFD700]/70">
      {$t.tourSources.method.title}
    </h2>
    <div class="mt-3 space-y-3 text-sm leading-relaxed text-[#FFFFF0]/70">
      <p>{$t.tourSources.method.crossSection}</p>
      <p>{$t.tourSources.method.apartmentPlan}</p>
      <p>{$t.tourSources.method.scale}</p>
      <p>{$t.tourSources.method.doorways}</p>
    </div>
  </section>

  <!-- The room-by-room account -->
  <section>
    <div class="flex flex-wrap items-end gap-4">
      <label class="min-w-[16rem] flex-1">
        <span class="mb-1 block text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tourSources.controls.search}
        </span>
        <input
          type="search"
          bind:value={query}
          placeholder={$t.tourSources.controls.searchPlaceholder}
          class="w-full rounded border border-[#333] bg-transparent px-3 py-1.5 text-sm text-[#FFFFF0] placeholder:text-[#FFFFF0]/30 focus:border-[#FFD700]/60 focus:outline-none"
        />
      </label>

      <fieldset>
        <legend class="mb-1 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tourSources.controls.evidence}
        </legend>
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            onclick={() => (evidence = 'all')}
            aria-pressed={evidence === 'all'}
            class="rounded border px-2.5 py-1 text-xs transition-colors {evidence === 'all'
              ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
              : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50'}"
          >
            {$t.common.all}
          </button>
          {#each PROVENANCE_ORDER as provenance (provenance)}
            <button
              type="button"
              onclick={() => (evidence = provenance)}
              aria-pressed={evidence === provenance}
              class="rounded border px-2.5 py-1 text-xs transition-colors {evidence === provenance
                ? provenanceClass(provenance)
                : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50'}"
            >
              {provenanceLabel(provenance)}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-1 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tourSources.controls.groupBy}
        </legend>
        <div class="flex gap-1.5">
          <button
            type="button"
            onclick={() => (grouping = 'source')}
            aria-pressed={grouping === 'source'}
            class="rounded border px-2.5 py-1 text-xs transition-colors {grouping === 'source'
              ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
              : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50'}"
          >
            {$t.tourSources.controls.bySource}
          </button>
          <button
            type="button"
            onclick={() => (grouping = 'deck')}
            aria-pressed={grouping === 'deck'}
            class="rounded border px-2.5 py-1 text-xs transition-colors {grouping === 'deck'
              ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
              : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50'}"
          >
            {$t.tourSources.controls.byDeck}
          </button>
        </div>
      </fieldset>
    </div>

    <p class="mt-3 text-xs text-[#FFFFF0]/50">
      {$t.common.results(matches.length, ship.blueprint.spaces.length)}
    </p>

    {#if groups.length === 0}
      <p class="mt-6 rounded border border-[#333] p-6 text-center text-sm text-[#FFFFF0]/60">
        {$t.tourSources.noMatch}
      </p>
    {/if}

    <ul class="mt-4 space-y-3">
      {#each groups as group (group.key)}
        <li class="overflow-hidden rounded-lg border border-[#333]">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#333] p-3">
            {#if group.provenance}
              <span
                class="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {provenanceClass(
                  group.provenance,
                )}"
              >
                {provenanceLabel(group.provenance)}
              </span>
            {/if}
            <h3 class="flex-1 text-sm font-medium leading-snug text-[#FFFFF0]">{group.label}</h3>
            <span class="text-xs text-[#FFFFF0]/50"
              >{$t.tourSources.spaces(group.spaces.length)}</span
            >
          </div>

          <ul class="divide-y divide-[#222]">
            {#each group.spaces as space (space.id)}
              <li>
                <a
                  href={spaceUrl(space)}
                  title={$t.tourSources.walkThere(nameOf(space))}
                  class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-xs transition-colors hover:bg-[#FFD700]/10"
                >
                  <span class="font-medium text-[#FFFFF0]/90">{nameOf(space)}</span>
                  {#if grouping === 'source'}
                    <span class="text-[#FFFFF0]/50">{placeOf(space)}</span>
                  {:else}
                    <span class="flex items-baseline gap-2 text-[#FFFFF0]/50">
                      <span
                        class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {provenanceClass(
                          space.provenance,
                        )}"
                      >
                        {provenanceLabel(space.provenance)}
                      </span>
                      <span>{sourceOf(space)}</span>
                    </span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </section>

  <!-- The joins, the blind walls and the hand-placed doors: claims too -->
  <section class="mt-10">
    <h2 class="text-xs uppercase tracking-widest text-[#FFD700]/70">
      {$t.tourSources.links.title}
    </h2>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/60">
      {$t.tourSources.links.help}
    </p>
    <ul class="mt-3 divide-y divide-[#222] rounded-lg border border-[#333]">
      {#each verticalLinks as entry (`${entry.connection.from}-${entry.connection.to}`)}
        <li class="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-xs">
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {provenanceClass(
              entry.connection.provenance,
            )}"
          >
            {$t.tourSources.links[entry.connection.kind]}
          </span>
          <span class="text-[#FFFFF0]/90">
            {entry.fromLabel} <span class="text-[#FFD700]/70">→</span>
            {entry.toLabel}
          </span>
          <span class="flex-1 text-right text-[#FFFFF0]/50">
            {sourceOf(entry.connection)}
          </span>
        </li>
      {/each}
    </ul>
  </section>

  <div class="mt-10 grid gap-6 sm:grid-cols-2">
    <section>
      <h2 class="text-xs uppercase tracking-widest text-[#FFD700]/70">
        {$t.tourSources.seals.title}
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-[#FFFFF0]/60">{$t.tourSources.seals.help}</p>
      <ul class="mt-3 space-y-2">
        {#each sealReasons as reason (reason.label)}
          <li class="rounded border border-[#333] p-3 text-xs text-[#FFFFF0]/80">
            <p>{reason.label}</p>
            <p class="mt-1 text-[#FFFFF0]/45">{$t.tourSources.doors.walls(reason.count)}</p>
          </li>
        {/each}
      </ul>
    </section>

    <section>
      <h2 class="text-xs uppercase tracking-widest text-[#FFD700]/70">
        {$t.tourSources.doors.title}
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-[#FFFFF0]/60">{$t.tourSources.doors.help}</p>
      <ul class="mt-3 space-y-2">
        {#each doorReasons as reason (reason.label)}
          <li class="rounded border border-[#333] p-3 text-xs text-[#FFFFF0]/80">
            <p>{reason.label}</p>
            <p class="mt-1 text-[#FFFFF0]/45">{$t.tourSources.doors.walls(reason.count)}</p>
          </li>
        {/each}
      </ul>
    </section>
  </div>

  <section class="mt-10 rounded-lg border border-[#333] p-4 sm:p-5">
    <h2 class="text-xs uppercase tracking-widest text-[#FFD700]/70">{$t.tourSources.data.title}</h2>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/70">
      {$t.tourSources.data.help}
    </p>
    <p class="mt-3 flex flex-wrap gap-3 text-xs">
      <a
        class="rounded border border-[#FFD700]/50 px-2.5 py-1 text-[#FFD700] transition-colors hover:bg-[#FFD700]/10"
        href={REPOSITORY_FILE}
        rel="noreferrer"
        target="_blank"
      >
        {$t.tourSources.data.file}
      </a>
      <a
        class="rounded border border-[#333] px-2.5 py-1 text-[#FFFFF0]/80 transition-colors hover:border-[#FFD700]/50"
        href={$link('/tour')}
      >
        {$t.tourSources.data.walkIt}
      </a>
    </p>
  </section>
</div>
