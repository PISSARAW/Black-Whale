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
  import { onDestroy, onMount, untrack } from 'svelte'
  import { page } from '$app/stores'
  import TourPageIntro from '$lib/components/tour/TourPageIntro.svelte'
  import TourPageDialogs from '$lib/components/tour/TourPageDialogs.svelte'
  import TourPageStage from '$lib/components/tour/TourPageStage.svelte'
  import TourPageSidebar from '$lib/components/tour/TourPageSidebar.svelte'
  import { activeHatsu } from '$lib/nen/hatsuState'
  import { link, t } from '$lib/i18n'
  import { locale } from '$lib/i18n'
  import { crossingsOn, deckOf, theShip, type Crossing } from '$lib/tour/blueprint'
  import {
    loadComfort,
    prefersReducedMotion,
  } from '$lib/tour/comfort'
  import { flashFor, type TourFlash } from '$lib/tour/apparitions'
  import { describeSpace } from '$lib/tour/describe'
  import { TourChromeState } from '$lib/tour/pageChrome.svelte'
  import { TourHatsuAudio } from '$lib/tour/pageHatsuAudio.svelte'
  import { placeOf, type Naming } from '$lib/tour/search'
  import {
    localizedName,
    localizedSource,
    provenanceClass,
  } from '$lib/tour/pagePresentation'
  import { playTourReportSound } from '$lib/tour/reportSound'
  import {
    blindWallReasons,
    declaredDoorReasons,
    groupSolidTargets,
    groupSpaceTargets,
  } from '$lib/tour/pageTargets'
  import { TourKeyboardController } from '$lib/tour/pageKeyboard'
  import { TourWorldTicker } from '$lib/tour/pageWorldTicker'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import { TourHatsuView } from '$lib/tour/pageHatsuView.svelte'
  import { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import { type CastHand } from '$lib/tour/pageCasting'
  import { TourCastController } from '$lib/tour/pageCastController'
  import {
    aimReadout as buildAimReadout,
    controlReadouts,
    locationReadout as buildLocationReadout,
    statusReadout,
  } from '$lib/tour/pageReadouts'
  import {
    crossingLabel as describeCrossing,
    linkPrompt as describeLink,
    type LinkWords,
  } from '$lib/tour/pageNavigation'
  import {
    EMPTY_WORLD,
    aimsAtSolids,
    identityOf,
    TAKES_ORDERS,
    worksOnTheBody,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Provenance, Space } from '$lib/tour/types'

  const ship = theShip()
  const chrome = new TourChromeState()
  const hatsuAudio = new TourHatsuAudio()
  chrome.watch()
  type TourTargetMode = 'body' | 'solid' | 'relay' | 'space' | 'jump'

  // `?space=` names a space to open in, `?deck=` a deck. `/tour/sources` links to
  // three hundred and one of them, so the walk does not read them once and forget
  // them: the request is derived from the URL and honoured whenever it changes,
  // which is what makes a second link, and the back button, do anything at all.
  //
  // The walk still does not *write* the URL as the visitor moves — a shared link
  // has to keep pointing at the room it was copied from, and "copy this
  // viewpoint" is how a new one is made.
  const requestedSpace = $derived(
    ship.spaces.get($page.url.searchParams.get('space') ?? '') ?? null,
  )
  const requestedDeck = $derived($page.url.searchParams.get('deck'))
  // Read once, deliberately: the level the walk opens on. Every later change of
  // URL goes through the effect below instead.
  const initialTierId = untrack(
    () =>
      requestedSpace?.tierId ??
      (requestedDeck && ship.plans.has(requestedDeck) ? requestedDeck : ship.tiers[0].id),
  )

  const navigation = new TourNavigationState(ship, initialTierId)
  const tierId = $derived(navigation.tierId)
  const currentSpace = $derived(navigation.currentSpace)
  const availableLink = $derived(navigation.availableLink)
  const engaged = $derived(navigation.engaged)
  const touch = $derived(navigation.touch)
  const position = $derived(navigation.position)
  const heading = $derived(navigation.heading)
  const aimedAt = $derived(navigation.aimedAt)
  const aimedSolidAt = $derived(navigation.aimedSolidAt)
  /**
   * The reveal, on G.
   *
   * The walk already tints a surface by what it is worth as evidence, which is
   * enough to notice and not enough to read. Turned on, the categories drop out
   * and the deck is painted in its badges alone — and the two things the
   * reconstruction authored rather than derived, the walls it declared blind and
   * the openings it placed by hand, are shown with the reason each was declared
   * for. It changes nothing about the ship, only what the ship says about
   * itself.
   */
  const plan = $derived(ship.plans.get(tierId)!)
  const deck = $derived(deckOf(ship, tierId))
  const insideInterior = $derived(plan.tier.kind === 'interior')
  const french = $derived($locale === 'fr')

  const nameOf = (entity: { name: string; nameFr: string }) => localizedName(entity, french)

  const sourceOf = (entity: { source: string; sourceFr: string }) =>
    localizedSource(entity, french)

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

  /**
   * A room and a solid are sourced the same way and read the same way — the
   * coffin carries ch. 371 whatever the chamber around it carries — so the
   * badge takes anything with a provenance rather than a space.
   */
  const provenanceLabel = (thing: { provenance: Provenance }) =>
    $t.tour.provenance[thing.provenance]

  // Four ranks, four readings: gold for a panel, bone for a deck plan, green
  // for what only the /ship room plan draws, cold blue for what nothing draws.
  /**
   * The stairwell or door within reach, named — read out of one wording or the
   * other, because the same crossing is a key to press on a keyboard and a
   * button to tap on a phone, which has no E.
   */
  const promptFor = (words: LinkWords) =>
    describeLink({ available: availableLink, ship, nameOf, words })

  const linkPrompt = $derived(promptFor($t.tour))
  const touchUseLabel = $derived(promptFor($t.tour.touch))

  const goToSpace = navigation.goToSpace
  const selectTier = navigation.selectTier

  /**
   * Honour whatever the URL currently asks for. `untrack` because `selectTier`
   * reads the deck it is leaving: without it the walk would answer its own move
   * and jump back to the linked room every time the visitor took a stairwell.
   */
  $effect(() => {
    const space = requestedSpace
    const deck = requestedDeck
    untrack(() => navigation.honor(space, deck))
  })

  /**
   * A link back to where the visitor is standing.
   *
   * The walk deliberately does not rewrite the URL as it is walked, so this is
   * how a viewpoint is shared: the room under the visitor's feet, or the deck
   * they are on when they are out between rooms.
   */
  async function copyViewpoint() {
    await chrome.copyViewpoint({ current: $page.url, spaceId: currentSpace?.id ?? null, tierId })
  }

  // ── The plan, and the finder ───────────────────
  /** The stairs, the bulkhead and the interior doors that touch this level. */
  const crossings = $derived(crossingsOn(ship, tierId))

  const crossingLabel = (crossing: Crossing) => {
    return describeCrossing({
      crossing,
      ship,
      nameOf,
      named,
      up: $t.tour.plan.crossingUp,
      down: $t.tour.plan.crossingDown,
      across: $t.tour.plan.crossingAcross,
    })
  }

  const keyboard = new TourKeyboardController({
    read: () => ({
      takesOrders: Boolean(technique && TAKES_ORDERS.has(technique.kind)),
      immersive: chrome.immersive,
      nativeFullscreen: chrome.nativeFullscreen,
      engaged,
      planOpen: chrome.planOpen,
      finderOpen: chrome.findOpen,
    }),
    toggleReveal: () => (chrome.reveal = !chrome.reveal),
    turnTechnique: () => technique && turn(technique.kind),
    toggleFullscreen: () => chrome.toggleFullscreen(),
    togglePlan: () => (chrome.planOpen = !chrome.planOpen),
  })

  /**
   * Whether this system asks for less movement — read on mount rather than at
   * init, because the server has no media query to ask and would render the
   * hint one way and hydrate it the other.
   */
  onMount(() => {
    loadComfort()
    chrome.calm = prefersReducedMotion()
  })

  onDestroy(() => {
    chrome.dispose()
  })

  // ── Nen ────────────────────────────────────────
  let world = $state<TourWorld>(EMPTY_WORLD)
  hatsuAudio.watch(() => world)

  let now = $state(Date.now())
  $effect(() => {
    const i = setInterval(() => {
      now = Date.now()
    }, 100)
    return () => clearInterval(i)
  })
  const isAutopilot = $derived(
    world.body.autopilotUntil !== null && world.body.autopilotUntil > now,
  )
  let report = $state<TourReport | null>(null)
  let flash = $state<(TourFlash & { seq: number }) | null>(null)
  let flashes = 0

  function show(shown: TourReport) {
    const seen = flashFor({ report: shown, from: position }, ship, world)
    if (seen) flash = { ...seen, seq: ++flashes }
    playTourReportSound(shown)
  }
  const ticker = new TourWorldTicker({
    read: () => ({ world, ship, position }),
    updateWorld: (next) => (world = next),
    updateReport: (next) => (report = next),
    show,
  })
  const hatsuView = new TourHatsuView({
    active: () => $activeHatsu,
    world: () => world,
    locale: () => $locale,
    tuneName: (air) => $t.tour.hatsu.tunes[air],
  })
  const technique = $derived(hatsuView.technique)
  const openPages = $derived(hatsuView.openPages)
  const controlKeys = $derived(hatsuView.controlKeys)
  const hands = $derived(hatsuView.hands)
  const tunes = $derived(hatsuView.tunes)
  const twoHanded = $derived(hatsuView.twoHanded)
  const selfCastable = $derived(hatsuView.selfCastable)

  let nextHand = $state<Record<CastHand, 'sun' | 'moon'>>({
    first: 'sun',
    second: 'sun',
    third: 'sun',
  })
  const casting = new TourCastController({
    read: () => ({
      world,
      ship,
      activeKind: technique?.kind ?? null,
      pages: openPages,
      hands: nextHand,
      currentSpace,
      aimedAt,
      aimedSolidAt,
      position,
      heading,
    }),
    updateWorld: (next) => (world = next),
    updateReport: (next) => (report = next),
    updateHands: (next) => (nextHand = next),
    show,
    goToSpace,
  })
  const hatsuSession = new TourHatsuSession({
    readActivation: () => ({
      ship,
      activeKind: technique?.kind ?? null,
      hasAura: Boolean($activeHatsu),
      position,
      spaceId: currentSpace?.id ?? null,
    }),
    read: () => ({
      world,
      ship,
      activeKind: technique?.kind ?? null,
      hasAura: Boolean($activeHatsu),
      position,
      spaceId: currentSpace?.id ?? null,
    }),
    updateWorld: (next) => (world = next),
    updateReport: (next) => (report = next),
    resetHands: () => (nextHand = { first: 'sun', second: 'sun', third: 'sun' }),
    show,
    goToSpace: (spaceId) => {
      const space = ship.spaces.get(spaceId)
      if (space) goToSpace(space)
    },
    reboundText: () => $t.tour.hatsu.reports.snakesRebound,
    vowText: (spaceId) => $t.tour.hatsu.reports.vowBroken(nameOf(ship.spaces.get(spaceId)!)),
  })
  hatsuSession.watchActivation()
  hatsuSession.watchFuture()

  function cycleDouble() {
    hatsuSession.turn('guardian')
  }

  function cycleEye() {
    hatsuSession.turn('scout')
  }

  function cycleOwl() {
    hatsuSession.turn('surveillance')
  }

  const turn = hatsuSession.turn

  const release = hatsuSession.release

  onDestroy(() => {
    hatsuSession.dispose()
    hatsuAudio.dispose()
  })

  const castOn = casting.castOn

  const castPage = casting.castPage

  const castHand = casting.castHand
  const turnTheRibbon = casting.turnRibbon

  function arrived(spaceId: string | null) {
    hatsuSession.arrived(spaceId)
  }

  const fishEat = ticker.fishEat

  const beastStep = ticker.beastStep

  const takeCoin = ticker.takeCoin

  const polarityWalk = ticker.polarityWalk

  const owlFlight = ticker.owlFlight

  const scoutFlight = ticker.scoutFlight

  const owlSecond = ticker.owlSecond
  const crossWorm = ticker.crossWorm

  /** With a technique up, the index stops being a way to travel and becomes the reach. */
  const targets = $derived(
    technique ? groupSpaceTargets({ ship, nameOf, locale: french ? 'fr' : 'en' }) : [],
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
  const targetMode = $derived<TourTargetMode>(
    onBody
      ? 'body'
      : onSolids
        ? 'solid'
        : technique?.kind === 'relay' && world.pairing
          ? 'relay'
          : technique
            ? 'space'
            : 'jump',
  )

  function targetName(item: { id?: string; name: string; nameFr: string }): string {
    const space = item.id ? ship.spaces.get(item.id) : null
    return nameOf(space ? named(space) : item)
  }

  /**
   * Every solid in the ship, grouped by the room it stands in.
   *
   * The reach is the same as it is for the rooms: a coffin four decks down is
   * as castable as the table in front of you, so the index is the whole
   * inventory rather than this deck's.
   */
  const solidTargets = $derived(
    onSolids ? groupSolidTargets({ ship, nameOf, locale: french ? 'fr' : 'en' }) : [],
  )

  /** Speech sealed: the walk stops naming the room the visitor is standing in. */
  const mute = $derived(world.sealed >= 3)

  // ── What the walk says out loud ────────────────
  /** How a place is named and situated, for the finder and the read-out alike. */
  const naming = $derived<Naming>({
    nameOf,
    sourceOf,
    insideOf: (room: string) => $t.tour.insideOf(room),
  })

  /**
   * The room the visitor is standing in, in one sentence.
   *
   * A canvas and an SVG are, to a screen reader, two rectangles that never
   * change. Everything needed to say what a room actually is has been in the
   * blueprint all along, so arriving somewhere is announced rather than merely
   * drawn — and it is announced under the name the walk currently gives the
   * room, which a technique may have swapped.
   */
  const spoken = $derived(
    currentSpace && !mute
      ? describeSpace(ship, named(currentSpace), {
          nameOf,
          placeOf: (space: Space) => placeOf(ship, space, naming),
          size: $t.tour.room.size,
          exits: $t.tour.room.exits,
          solids: $t.tour.room.solids,
          bare: $t.tour.room.bare,
        })
      : '',
  )

  /**
   * One verb per widget. With a technique up the index casts rather than
   * travels, and the plan has to agree with it: the same drawing that teleports
   * empty-handed and aims with an aura up is two behaviours wearing one face.
   */
  const selectOnPlan = $derived(
    technique ? (space: Space) => castOn(space.id) : (space: Space) => goToSpace(space),
  )
  const planVerb = $derived(technique ? $t.tour.aimAt : $t.tour.goTo)

  /**
   * What the reveal shows in words: the walls this level keeps blind, and the
   * openings on it the blueprint places rather than derives — each under the
   * reason it was declared for, because a declaration is a claim about the ship.
   */
  const blindWalls = $derived(
    chrome.reveal ? blindWallReasons(plan, french) : [],
  )

  const handPlacedDoors = $derived(
    chrome.reveal ? declaredDoorReasons({ plan, ship, french }) : [],
  )

  /** Standing in the isolated room as an outsider: the copy, not the room. */
  const inEmptyCopy = $derived(
    Boolean(
      world.isolated && !world.isolated.occupant && world.isolated.spaceId === currentSpace?.id,
    ),
  )

  const locationReadout = $derived.by(() => {
    const room = currentSpace ? named(currentSpace) : null
    return buildLocationReadout({
      muted: mute,
      level: `${deck ? nameOf(deck) : nameOf(plan.tier)}${insideInterior ? ` · ${$t.tour.insideOf(nameOf(plan.tier))}` : ''}`,
      outside: $t.tour.outside,
      room: room
        ? {
            name: nameOf(room),
            badge: provenanceLabel(room),
            badgeClass: provenanceClass(room),
            source: sourceOf(room) || $t.tour.noSource,
          }
        : null,
      copy: {
        active: inEmptyCopy,
        badge: $t.tour.hatsu.copy,
        badgeClass: 'border-[#7095d6] bg-[#7095d6]/20 text-[#a8c2ea]',
        source: $t.tour.hatsu.copySource,
      },
    })
  })

  const aimReadout = $derived.by(() => {
    const solid = onSolids ? aimedSolidAt : null
    const text = onSolids
      ? solid
        ? $t.tour.hatsu.solids.aiming(nameOf(solid))
        : $t.tour.hatsu.solids.aimingNothing
      : aimedAt
        ? $t.tour.hatsu.aiming(nameOf(named(aimedAt)))
        : $t.tour.hatsu.aimingNothing
    return buildAimReadout({
      muted: mute,
      color: technique?.color ?? null,
      text,
      evidence: solid
        ? {
            badge: provenanceLabel(solid),
            badgeClass: provenanceClass(solid),
            source: sourceOf(solid) || $t.tour.noSource,
          }
        : null,
    })
  })

  const overlayControls = $derived(controlReadouts({
    hidden: touch || mute,
    controls: controlKeys,
    keyOf: (control) => control.click ? `${control.key} / ${$t.tour.hatsu.keys.click}` : control.key,
    actionOf: (control) => $t.tour.hatsu.keys.actions[control.action],
    color: technique?.color ?? null,
  }))
  const statusHint = $derived(statusReadout({
    engaged,
    touch,
    engagedText: $t.tour.engaged,
    touchText: $t.tour.touch.hint,
    enterText: $t.tour.enter,
  }))
</script>

<svelte:window onkeydown={keyboard.onKeydown} />

<TourPageIntro {ship} />

<div class="mx-auto max-w-[1600px] px-4 py-8" data-hatsu-pass>
  <!-- Full screen is this grid over everything else, not the canvas alone:
       everything in the column has to come with the ship, or it would be a walk
       with no way to change deck, aim a technique or read the plan. -->
  <div
    class="grid {chrome.immersive
      ? // Over the archive's own sticky header (80) and under its Nen dock
        // (100), which is the one thing that has to stay reachable above the
        // walk: full screen must not be where the aura cannot be picked up.
        `fixed inset-0 z-[90] h-[100dvh] w-screen overflow-hidden bg-[#050505] ${
          chrome.panelOpen ? 'grid-cols-[1fr_min(22rem,50vw)]' : 'grid-cols-1'
        }`
      : 'gap-4 lg:grid-cols-[1fr_320px]'}"
  >
    <TourPageStage
      immersive={chrome.immersive}
      {navigation}
      scene={{
        ship,
        world,
        flash,
        auraColour: technique?.color ?? null,
        aiming: Boolean(technique),
        selfCastable,
        reveal: chrome.reveal,
        onCast: castOn,
        onArrive: arrived,
        onWorm: crossWorm,
        onFish: fishEat,
        onOwl: owlFlight,
        onOwlSecond: owlSecond,
        onScout: scoutFlight,
        onBeast: beastStep,
        onCoin: takeCoin,
        onPolarity: polarityWalk,
        hands,
        tunes,
        twoHanded,
        swings: technique?.kind === 'stitch',
        touchUseLabel,
        touchLabels: { move: $t.tour.touch.move, cast: $t.tour.touch.cast },
        soundLabels: { silence: $t.tour.sound.silence, restore: $t.tour.sound.restore },
        loadingLabel: $t.tour.loading,
        unsupportedLabel: $t.tour.unsupported,
      }}
      overlay={{
        autopilot: isAutopilot,
        reticleColor: technique?.color ?? null,
        spoken,
        location: locationReadout,
        penalty: hatsuSession.penalty,
        aim: aimReadout,
        controls: overlayControls,
        statusHint,
        linkPrompt: touch ? null : linkPrompt,
      }}
    />

    <!-- The way back into the panel, once it is folded. Halfway down the right
         edge because the walk has already spoken for the corners: the eye's feed
         is inset top right, the read-outs run along the bottom. -->
    {#if chrome.immersive && !chrome.panelOpen}
      <button
        type="button"
        onclick={() => (chrome.panelOpen = true)}
        aria-expanded="false"
        class="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-l border border-r-0 border-[#333] bg-[#050505]/90 px-2 py-3 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
      >
        {$t.tour.fullscreen.showPanel}
      </button>
    {/if}

    <TourPageSidebar
      immersive={chrome.immersive}
      panelOpen={chrome.panelOpen}
      navigation={{
        immersive: chrome.immersive,
        reveal: chrome.reveal,
        copied: chrome.copied,
        decks: ship.decks.map((tier) => ({ id: tier.id, label: nameOf(tier), active: tier.id === deck?.id })),
        plan,
        position,
        heading,
        crossings,
        currentSpaceId: currentSpace?.id ?? null,
        planLabel: $t.tour.minimap(nameOf(plan.tier)),
        nameOf: (space) => nameOf(named(space)),
        crossingLabel,
        onSelectPlan: selectOnPlan,
        selectLabel: planVerb,
        aiming: Boolean(technique),
        onHide: () => (chrome.panelOpen = false),
        onFullscreen: () => chrome.toggleFullscreen(),
        onSelectDeck: selectTier,
        onOpenPlan: () => (chrome.planOpen = true),
        onOpenFinder: () => (chrome.findOpen = true),
        onToggleReveal: () => (chrome.reveal = !chrome.reveal),
        onCopy: copyViewpoint,
      }}
      hatsu={$activeHatsu
        ? {
            ship,
            profile: $activeHatsu,
            castable: Boolean(technique),
            world,
            report,
            aimedAt,
            aimedSolidAt,
            at: position,
            standingIn: currentSpace?.id ?? null,
            touch,
            nameOf,
            sourceOf,
            onRelease: release,
            onCycleDouble: cycleDouble,
            onCycleOwl: cycleOwl,
            onCycleEye: cycleEye,
            onCastPage: castPage,
            onCastHand: castHand,
            onTurnTheBook: turnTheRibbon,
        }
        : null}
      targets={{
        mode: targetMode,
        solidGroups: solidTargets,
        spaceGroups: targets,
        deckSpaces: sortedSpaces,
        currentSpaceId: currentSpace?.id ?? null,
        techniqueColor: technique?.color ?? null,
        nameOf: targetName,
        roomName: (solid) => targetName(ship.spaces.get(solid.spaceId) ?? solid),
        provenanceLabel,
        provenanceClass,
        isSolidActive: (solidId) => Boolean(world.solids[solidId]),
        onSolid: (spaceId, solidId) => castOn(spaceId, solidId),
        onSpace: (space) => (technique ? castOn(space.id) : goToSpace(space)),
      }}
      controls={{
        hasTechnique: Boolean(technique),
        secondHand: hands?.second ?? null,
        twoHanded,
        selfCastable,
        touch,
      }}
      calm={chrome.calm}
      provenance={{
        reveal: chrome.reveal,
        blindWalls,
        handPlacedDoors,
        sourcesHref: $link('/tour/sources'),
      }}
    />
  </div>
</div>

<TourPageDialogs
  bind:dialog={chrome.planDialog}
  bind:finderOpen={chrome.findOpen}
  {ship}
  {plan}
  {position}
  {heading}
  currentSpaceId={currentSpace?.id ?? null}
  {spoken}
  {crossings}
  {crossingLabel}
  nameOf={(space) => nameOf(named(space))}
  selectLabel={planVerb}
  aiming={Boolean(technique)}
  {naming}
  onClosePlan={() => (chrome.planOpen = false)}
  onSelect={selectOnPlan}
  onCast={(spaceId) => castOn(spaceId)}
  onGo={goToSpace}
/>
