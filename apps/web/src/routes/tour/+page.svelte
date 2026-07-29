<script lang="ts">
  /**
   * The virtual tour: a first-person walk through the reconstructed ship.
   *
   * This route is deliberately self-contained. It reads `data/ship` and nothing
   * else — no world state, no perspective, no spoiler profile — because the
   * reconstruction is architecture rather than a moment in the story. `/ship`
   * remains the place to ask who was where.
   *
   * The one thing it does take from the rest of the archive is the Hatsu the
   * visitor has active. The page marks itself `data-hatsu-pass`, which stops the
   * DOM layer of the Nen system at the door: in the walk a technique works on
   * the ship, through `$lib/tour/hatsu`, and on nothing else — not the deck
   * buttons, not the index, not the minimap. Those become how you aim it.
   */
  import { onDestroy } from 'svelte'
  import { page } from '$app/stores'
  import Seo from '$lib/components/Seo.svelte'
  import TourHatsuHud from '$lib/components/tour/TourHatsuHud.svelte'
  import TourMinimap from '$lib/components/tour/TourMinimap.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { setAmbientMuffled } from '$lib/audio/ambient'
  import { activeHatsu, enterForcedZetsu } from '$lib/nen/hatsuState'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, t } from '$lib/i18n'
  import { locale } from '$lib/i18n'
  import { buildShip, deckOf, entrySpace } from '$lib/tour/blueprint'
  import {
    EMPTY_WORLD,
    aimsAtSolids,
    arriveInTour,
    castInTour,
    identityOf,
    worksInTour,
    worksOnTheBody,
    wormExit,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Link, Provenance, Space, Structure } from '$lib/tour/types'

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
  const deck = $derived(deckOf(ship, tierId))
  const insideInterior = $derived(plan.tier.kind === 'interior')
  const french = $derived($locale === 'fr')

  const nameOf = (entity: { name: string; nameFr: string }) =>
    french ? entity.nameFr : entity.name

  const sourceOf = (entity: { source: string; sourceFr: string }) =>
    french ? entity.sourceFr : entity.source

  const sortedSpaces = $derived(
    [...plan.spaces].sort((a, b) => nameOf(a).localeCompare(nameOf(b), french ? 'fr' : 'en')),
  )

  /**
   * A room under the name the walk currently gives it.
   *
   * Grimmel's arrow swaps what two rooms are, so every place the walk says a
   * room's name — the read-out, the index, the panel — has to ask this rather
   * than read the blueprint directly, or the same room ends up called two
   * things on one screen.
   */
  const named = (space: Space) => identityOf(ship, world, space)

  const provenanceLabel = (space: Space) => $t.tour.provenance[space.provenance]

  // Four ranks, four readings: gold for a panel, bone for a deck plan, green
  // for what only the /ship room plan draws, cold blue for what nothing draws.
  const PROVENANCE_CLASS: Record<Provenance, string> = {
    panel: 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]',
    plan: 'border-[#FFFFF0]/30 bg-[#FFFFF0]/5 text-[#FFFFF0]/80',
    map: 'border-[#5f8f6a] bg-[#5f8f6a]/20 text-[#8fd0a0]',
    inferred: 'border-[#2b3a4a] bg-[#2b3a4a]/30 text-[#9dc4e0]',
  }

  const provenanceClass = (space: Space) => PROVENANCE_CLASS[space.provenance]

  const linkPrompt = $derived.by(() => {
    if (!availableLink) return null
    const destination = ship.spaces.get(availableLink.to)
    if (!destination) return null
    const tier = ship.tiers.find((candidate) => candidate.id === destination.tierId)
    const label = `${nameOf(destination)}${tier ? ` — ${nameOf(tier)}` : ''}`
    if (availableLink.link.kind === 'door') {
      const target = ship.tiers.find((candidate) => candidate.id === destination.tierId)
      return target?.kind === 'interior'
        ? $t.tour.enterInterior(nameOf(target))
        : $t.tour.leaveInterior(nameOf(destination))
    }
    return availableLink.link.kind === 'bulkhead'
      ? $t.tour.takeBulkhead(label)
      : $t.tour.takeLink(label)
  })

  /** Bow-to-stern length of the ship, read off the widest deck. */
  const shipLength = Math.round(
    Math.max(
      ...ship.decks.map((tier) => {
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

  // ── Nen ────────────────────────────────────────
  let world = $state<TourWorld>(EMPTY_WORLD)
  let report = $state<TourReport | null>(null)
  let aimedAt = $state<Space | null>(null)
  let aimedSolidAt = $state<Structure | null>(null)

  const technique = $derived(worksInTour($activeHatsu) ? $activeHatsu : null)

  /** Sight is the scene's business; hearing is the archive's ambience. */
  $effect(() => {
    setAmbientMuffled(world.sealed >= 2)
  })

  // Dropping the aura hands the ship back; swapping one technique for another
  // does not. Air Blow exists to blow off what *another* technique put on a
  // room and Blinky refuses to swallow what Nen is holding — both of which
  // would be unreachable if changing technique quietly undid the last one. What
  // is still standing is always listed in the panel, and released from it.
  $effect(() => {
    if (!$activeHatsu) {
      world = EMPTY_WORLD
      report = null
      return
    }
    // Taking an aura up again is what clears the last penalty off the walk.
    penalty = null
  })

  /**
   * Handing the ship back is not always free. Silent Majority is a curse that
   * has to find a victim: dismissing it without one turns it on the user, and
   * the archive already has a penalty for that.
   */
  function release() {
    const rebound = Boolean(world.snakes && !world.snakes.fed)
    world = EMPTY_WORLD
    report = null
    if (rebound) punish($t.tour.hatsu.reports.snakesRebound)
  }

  /**
   * The two techniques that can turn on their user cost the aura itself, which
   * takes the panel down with it — so what happened has to be said over the
   * walk instead, where the visitor is still looking.
   */
  let penalty = $state<string | null>(null)
  function punish(said: string) {
    penalty = said
    enterForcedZetsu()
  }

  onDestroy(() => setAmbientMuffled(false))

  function castOn(spaceId: string | null, solidId: string | null = null) {
    if (!technique) return
    const result = castInTour(world, technique.kind, {
      ship,
      targetId: spaceId,
      targetSolidId: solidId,
      standingIn: currentSpace?.id ?? null,
      at: position,
      heading,
    })
    world = result.world
    report = result.report
    if (result.travelTo) goToSpace(ship.spaces.get(result.travelTo)!)
  }

  /**
   * Setting foot somewhere is where half the techniques actually happen: the
   * guards expel, the chain punishes, the fish take one more thing, the dolls
   * count. `arriveInTour` holds all of it, so the page only carries out what it
   * is told — including the archive's own penalty, which is Zetsu.
   */
  function arrived(spaceId: string | null) {
    const arrival = arriveInTour(world, ship, spaceId)
    world = arrival.world
    if (arrival.report) report = arrival.report
    if (arrival.travelTo) {
      const back = ship.spaces.get(arrival.travelTo)
      if (back) goToSpace(back)
    }
    // A vow broken is a vow broken: the aura goes, and with it the ship comes
    // back — the same five minutes of Zetsu the rest of the archive charges.
    if (arrival.punished && spaceId) {
      punish($t.tour.hatsu.reports.vowBroken(nameOf(ship.spaces.get(spaceId)!)))
    }
  }

  /** Fugetsu's tunnel, asked on the same arrival the doors are asked on. */
  function crossWorm(spaceId: string | null, arrivedFrom: string | null) {
    const crossing = wormExit(world, spaceId, arrivedFrom)
    if (!crossing) return null
    world = crossing.world
    report = crossing.report
    return crossing.to
  }

  /** With a technique up, the index stops being a way to travel and becomes the reach. */
  const targets = $derived(
    technique
      ? ship.tiers.map((tier) => ({
          tier,
          spaces: ship.blueprint.spaces
            .filter((space) => space.tierId === tier.id)
            .sort((a, b) => nameOf(a).localeCompare(nameOf(b), french ? 'fr' : 'en')),
        }))
      : [],
  )

  /**
   * Whether the active technique takes a thing rather than a place — and, for
   * Transport Portals, whether it is past the cargo and waiting for the relay.
   */
  const onSolids = $derived(
    (aimsAtSolids(technique) && !(technique?.kind === 'relay' && world.pairing)) ||
      technique?.kind === 'mimicry' ||
      // Anything aimed at a solid while Kurton is ridden loads it into his hold.
      Boolean(technique && world.body.riding),
  )

  /** A technique whose target is the visitor has nothing for the index to offer. */
  const onBody = $derived(worksOnTheBody(technique) && !onSolids)

  /**
   * Every solid in the ship, grouped by the room it stands in.
   *
   * The reach is the same as it is for the rooms: a coffin four decks down is
   * as castable as the table in front of you, so the index is the whole
   * inventory rather than this deck's.
   */
  const solidTargets = $derived(
    onSolids
      ? ship.tiers
          .map((tier) => ({
            tier,
            solids: ship.structures
              .filter((solid) => ship.spaces.get(solid.spaceId)?.tierId === tier.id)
              .sort((a, b) => nameOf(a).localeCompare(nameOf(b), french ? 'fr' : 'en')),
          }))
          .filter((group) => group.solids.length)
      : [],
  )

  /** Speech sealed: the walk stops naming the room the visitor is standing in. */
  const mute = $derived(world.sealed >= 3)

  /** Standing in the isolated room as an outsider: the copy, not the room. */
  const inEmptyCopy = $derived(
    Boolean(
      world.isolated && !world.isolated.occupant && world.isolated.spaceId === currentSpace?.id,
    ),
  )
</script>

<Seo
  title={$t.tour.seoTitle}
  description={$t.tour.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
  ])}
/>

<div class="mx-auto max-w-[1600px] px-4 py-8" data-hatsu-pass>
  <header class="mb-6">
    <h1 class="text-3xl font-bold tracking-tight text-[#FFFFF0] sm:text-4xl">{$t.tour.title}</h1>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/70">{$t.tour.intro}</p>
    <p class="mt-2 text-xs uppercase tracking-widest text-[#FFD700]/70">
      {$t.tour.counts(
        ship.blueprint.spaces.length,
        ship.decks.length,
        ship.tiers.length - ship.decks.length,
      )} · {$t.tour.scale(shipLength)}
    </p>
  </header>

  <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
    <!-- The walk -->
    <section
      class="relative min-h-[420px] overflow-hidden rounded-lg border border-[#333] lg:h-[70vh]"
    >
      <TourScene
        {ship}
        bind:tierId
        bind:currentSpace
        bind:availableLink
        bind:jumpTo
        bind:engaged
        bind:position
        bind:heading
        bind:aimedAt
        bind:aimedSolidAt
        {world}
        auraColour={technique?.color ?? null}
        aiming={Boolean(technique)}
        onCast={castOn}
        onArrive={arrived}
        onWorm={crossWorm}
        loadingLabel={$t.tour.loading}
        unsupportedLabel={$t.tour.unsupported}
      />

      <!-- Reticle. It takes the technique's colour while one is up, because it
           has stopped being a crosshair and become where the aura goes. -->
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style:background={technique ? technique.color : 'rgb(255 255 240 / 0.6)'}
        style:box-shadow={technique ? `0 0 10px ${technique.color}` : 'none'}
      ></div>

      <!-- Where the visitor stands, and what it is worth as evidence -->
      {#if !mute}
        <div class="pointer-events-none absolute left-3 top-3 max-w-sm">
          <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
            {deck ? nameOf(deck) : nameOf(plan.tier)}{insideInterior
              ? ` · ${$t.tour.insideOf(nameOf(plan.tier))}`
              : ''}
          </p>
          <p class="text-lg font-semibold leading-tight text-[#FFFFF0]">
            {currentSpace ? nameOf(named(currentSpace)) : $t.tour.outside}
          </p>
          {#if currentSpace && inEmptyCopy}
            <!-- An isolated room reached from outside: the walls are the ship's
                 and nothing in it is, so it cannot be cited as evidence. -->
            <span
              class="mt-1 inline-block rounded border border-[#7095d6] bg-[#7095d6]/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#a8c2ea]"
            >
              {$t.tour.hatsu.copy}
            </span>
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">{$t.tour.hatsu.copySource}</p>
          {:else if currentSpace}
            <span
              class="mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {provenanceClass(
                named(currentSpace),
              )}"
            >
              {provenanceLabel(named(currentSpace))}
            </span>
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">
              {sourceOf(named(currentSpace)) || $t.tour.noSource}
            </p>
          {/if}
        </div>
      {/if}

      {#if penalty}
        <p
          class="pointer-events-none absolute bottom-20 left-1/2 max-w-md -translate-x-1/2 rounded border border-[#ef3340]/60 bg-[#050505]/90 px-3 py-1.5 text-center text-xs leading-snug text-[#ef8a90]"
          aria-live="polite"
        >
          {penalty}
        </p>
      {/if}

      <!-- Bottom right: the top right of the canvas is the remote eye's feed. -->
      {#if technique && !mute}
        <p
          class="pointer-events-none absolute bottom-3 right-3 rounded border bg-[#050505]/80 px-2 py-1 text-[11px]"
          style:border-color="color-mix(in srgb, {technique.color} 55%, transparent)"
          style:color={technique.color}
        >
          {#if onSolids}
            {aimedSolidAt
              ? $t.tour.hatsu.solids.aiming(nameOf(aimedSolidAt))
              : $t.tour.hatsu.solids.aimingNothing}
          {:else}
            {aimedAt ? $t.tour.hatsu.aiming(nameOf(named(aimedAt))) : $t.tour.hatsu.aimingNothing}
          {/if}
        </p>
      {/if}

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
          {#each ship.decks as tier (tier.id)}
            <button
              type="button"
              onclick={() => selectTier(tier.id)}
              aria-current={tier.id === deck?.id ? 'true' : undefined}
              class="rounded border px-2.5 py-1 text-xs transition-colors {tier.id === deck?.id
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
        {nameOf}
        onSelect={goToSpace}
      />

      {#if $activeHatsu}
        <TourHatsuHud
          {ship}
          profile={$activeHatsu}
          castable={Boolean(technique)}
          {world}
          {report}
          {aimedAt}
          {aimedSolidAt}
          at={position}
          standingIn={currentSpace?.id ?? null}
          {nameOf}
          {sourceOf}
          onRelease={release}
        />
      {/if}

      <section>
        <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {#if onBody}
            {$t.tour.hatsu.body.noTarget}
          {:else if onSolids}
            {$t.tour.hatsu.solids.targets} · {$t.tour.hatsu.allDecks}
          {:else if technique?.kind === 'relay' && world.pairing}
            {$t.tour.hatsu.solids.relayTargets}
          {:else if technique}
            {$t.tour.hatsu.targets} · {$t.tour.hatsu.allDecks}
          {:else}
            {$t.tour.jumpTo}
          {/if}
        </p>
        {#if onBody}
          <p class="rounded border border-[#333] px-2.5 py-2 text-xs leading-snug text-[#FFFFF0]/50">
            {$t.tour.hatsu.body.castHint}
          </p>
        {:else if onSolids}
          <!-- The same reach, one noun down: every solid in the ship, under the
               room it stands in. -->
          <ul class="max-h-56 overflow-y-auto rounded border border-[#333]">
            {#each solidTargets as group (group.tier.id)}
              <li
                class="sticky top-0 bg-[#0b0b0b] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40"
              >
                {nameOf(group.tier)}
              </li>
              {#each group.solids as solid (solid.id)}
                <li>
                  <button
                    type="button"
                    onclick={() => castOn(solid.spaceId, solid.id)}
                    class="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-[#FFFFF0]/80 transition-colors hover:text-[#FFFFF0]"
                    style:background={world.solids[solid.id]
                      ? `color-mix(in srgb, ${technique?.color} 18%, transparent)`
                      : undefined}
                  >
                    <span class="truncate">{nameOf(solid)}</span>
                    <span class="shrink-0 truncate text-[9px] text-[#FFFFF0]/40">
                      {nameOf(ship.spaces.get(solid.spaceId) ?? solid)}
                    </span>
                  </button>
                </li>
              {/each}
            {/each}
          </ul>
        {:else if technique}
          <!-- Reach is the whole ship, so the index stops being this deck's and
               becomes every deck's: a room four levels down is as castable as
               the one through the bulkhead. -->
          <ul class="max-h-56 overflow-y-auto rounded border border-[#333]">
            {#each targets as group (group.tier.id)}
              {#if group.spaces.length}
                <li
                  class="sticky top-0 bg-[#0b0b0b] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40"
                >
                  {nameOf(group.tier)}
                </li>
                {#each group.spaces as space (space.id)}
                  <li>
                    <button
                      type="button"
                      onclick={() => castOn(space.id)}
                      class="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-[#FFFFF0]/80 transition-colors hover:text-[#FFFFF0]"
                      style:background={space.id === currentSpace?.id
                        ? `color-mix(in srgb, ${technique.color} 18%, transparent)`
                        : undefined}
                    >
                      <span class="truncate">{nameOf(named(space))}</span>
                      <span
                        class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {provenanceClass(
                          named(space),
                        )}"
                      >
                        {provenanceLabel(named(space))}
                      </span>
                    </button>
                  </li>
                {/each}
              {/if}
            {/each}
          </ul>
        {:else}
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
                  <span class="truncate">{nameOf(named(space))}</span>
                  <span
                    class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {provenanceClass(
                      named(space),
                    )}"
                  >
                    {provenanceLabel(named(space))}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
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
          {#if technique}
            <dt class="text-[#FFFFF0]">{$t.tour.controls.nen}</dt>
            <dd>{$t.tour.controls.nenKeys}</dd>
          {/if}
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
            <span class="rounded border border-[#5f8f6a] bg-[#5f8f6a]/20 px-1 text-[#8fd0a0]">
              {$t.tour.provenance.map}
            </span>
            <span class="ml-1">{$t.tour.provenance.mapHelp}</span>
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
          <li class="pt-0.5">
            <a
              href={$link('/tour/sources')}
              class="text-[#FFD700]/80 underline underline-offset-2 transition-colors hover:text-[#FFD700]"
            >
              {$t.tour.sourcesLink} →
            </a>
          </li>
        </ul>
      </section>
    </aside>
  </div>
</div>
