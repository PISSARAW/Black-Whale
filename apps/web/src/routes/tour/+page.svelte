<script lang="ts">
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
  import { loadComfort, prefersReducedMotion } from '$lib/tour/comfort'
  import { flashFor, type TourFlash } from '$lib/tour/apparitions'
  import { describeSpace } from '$lib/tour/describe'
  import { TourChromeState } from '$lib/tour/pageChrome.svelte'
  import { TourHatsuAudio } from '$lib/tour/pageHatsuAudio.svelte'
  import { placeOf, type Naming } from '$lib/tour/search'
  import { localizedName, localizedSource, provenanceClass } from '$lib/tour/pagePresentation'
  import { playTourReportSound } from '$lib/tour/reportSound'
  import { blindWallReasons, declaredDoorReasons } from '$lib/tour/pageTargets'
  import { TourKeyboardController } from '$lib/tour/pageKeyboard'
  import { examine, type Exhibit } from '$lib/tour/exhibit'
  import { TourWorldTicker } from '$lib/tour/pageWorldTicker'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import { TourHatsuView } from '$lib/tour/pageHatsuView.svelte'
  import { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import { TourTargetView } from '$lib/tour/pageTargetView.svelte'
  import { type CastHand } from '$lib/tour/pageCasting'
  import { TourCastController } from '$lib/tour/pageCastController'
  import { TourOverlayView } from '$lib/tour/pageOverlayView.svelte'
  import {
    crossingLabel as describeCrossing,
    linkPrompt as describeLink,
    type LinkWords,
  } from '$lib/tour/pageNavigation'
  import {
    EMPTY_WORLD,
    identityOf,
    TAKES_ORDERS,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Provenance, Space } from '$lib/tour/types'
  import { TourCastView } from '$lib/tour/pageCastView.svelte'
  import { aimedPerson, personExhibit } from '$lib/tour/cast/provenance'
  import { NO_CAST } from '$lib/tour/cast'
  import { NO_HOUR } from '$lib/tour/hour'
  import type { PageData } from './$types'

  // The walk is no longer only a ship: the server hands it the cast of the
  // canon at the event under the reader's cap. See ADR-003.
  let { data }: { data: PageData } = $props()
  const cast = $derived(data?.cast ?? NO_CAST)
  /**
   * And what time that event happens at, which two windows in three hundred and
   * fourteen spaces read. Arbitrated on the server — see `$lib/tour/hour` — so
   * the sky behind the bay and the people in the rooms come from one answer.
   */
  const hour = $derived(data?.hour ?? NO_HOUR)

  const ship = theShip()
  const chrome = new TourChromeState()
  const hatsuAudio = new TourHatsuAudio()
  chrome.watch()
  const requestedSpace = $derived(
    ship.spaces.get($page.url.searchParams.get('space') ?? '') ?? null,
  )
  const requestedDeck = $derived($page.url.searchParams.get('deck'))
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
  const plan = $derived(ship.plans.get(tierId)!)
  const deck = $derived(deckOf(ship, tierId))
  const insideInterior = $derived(plan.tier.kind === 'interior')
  const french = $derived($locale === 'fr')
  const nameOf = (entity: { name: string; nameFr: string }) => localizedName(entity, french)
  const sourceOf = (entity: { source: string; sourceFr: string }) => localizedSource(entity, french)
  const sortedSpaces = $derived(
    [...plan.spaces].sort((a, b) => nameOf(a).localeCompare(nameOf(b), french ? 'fr' : 'en')),
  )
  const named = (space: Space) => identityOf(ship, world, space)
  const provenanceLabel = (thing: { provenance: Provenance }) =>
    $t.tour.provenance[thing.provenance]
  const promptFor = (words: LinkWords) =>
    describeLink({ available: availableLink, ship, nameOf, words })
  const linkPrompt = $derived(promptFor($t.tour))
  const touchUseLabel = $derived(promptFor($t.tour.touch))
  const goToSpace = navigation.goToSpace
  const selectTier = navigation.selectTier
  $effect(() => {
    const space = requestedSpace
    const deck = requestedDeck
    untrack(() => navigation.honor(space, deck))
  })

  async function copyViewpoint() {
    await chrome.copyViewpoint({ current: $page.url, spaceId: currentSpace?.id ?? null, tierId })
  }

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
      immersive: chrome.immersive,
      nativeFullscreen: chrome.nativeFullscreen,
      engaged,
      planOpen: chrome.planOpen,
      finderOpen: chrome.findOpen,
    }),
    toggleReveal: () => (chrome.reveal = !chrome.reveal),
    toggleFullscreen: () => chrome.toggleFullscreen(),
    togglePlan: () => (chrome.planOpen = !chrome.planOpen),
    examine: () => (asking ? close() : ask()),
  })

  /**
   * The evidence for what is down the reticle, once it has been asked for.
   *
   * Held rather than derived from the aim. A card that re-read the reticle every
   * frame would rewrite itself as the visitor's head drifted a degree, and a
   * piece of evidence you cannot look away from while reading is not one you
   * have been handed — it is one being waved at you. The same key puts it back.
   */
  let exhibit = $state<Exhibit | null>(null)
  let asking = $state(false)
  const ask = () => {
    exhibit = examineAim()
    asking = true
  }
  const close = () => {
    asking = false
    exhibit = null
  }

  /**
   * What the reticle is on, in the order the visitor meant it.
   *
   * A person first: aiming at somebody is the least ambiguous thing a visitor
   * can do in a room, and a silhouette owes the same account as a coffin — who
   * they are, since which chapter, in what role. Then the solid, then the room,
   * exactly as before.
   */
  const examineAim = (): Exhibit | null => {
    const person = aimedPerson(castView.posts, {
      from: position,
      heading,
      spaceId: currentSpace?.id ?? null,
    })
    if (person)
      return personExhibit(person, currentSpace ? nameOf(named(currentSpace)) : null, {
        badge: (provenance) => $t.tour.provenance[provenance],
        since: $t.tour.examine.person.since,
        sinceUnknown: $t.tour.examine.person.sinceUnknown,
        claim: $t.tour.examine.person.claim,
        standingIn: $t.tour.examine.standingIn,
        role: $t.tour.examine.person.role,
      })
    return examine(
      ship,
      { solid: aimedSolidAt, space: aimedAt ?? currentSpace },
      {
        nameOf,
        sourceOf,
        badge: (provenance) => $t.tour.provenance[provenance],
        claim: (kind) => $t.tour.examine.claims[kind],
        roomClaim: $t.tour.examine.room,
        measured: $t.tour.examine.measured,
        standingIn: $t.tour.examine.standingIn,
      },
    )
  }
  onMount(() => {
    loadComfort()
    chrome.calm = prefersReducedMotion()
  })
  onDestroy(() => {
    chrome.dispose()
  })
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
  /**
   * The word the wheel offers to whatever this technique has already sent out.
   *
   * Only the three that leave something standing in a room have one — the
   * double, the owl, the insect — and for them the second place on the wheel
   * changes its orders rather than casting again. `null` everywhere else,
   * which is what keeps the wheel from opening on a technique that is only
   * ever cast.
   */
  const orders = $derived(
    !technique || !TAKES_ORDERS.has(technique.kind)
      ? null
      : technique.kind === 'guardian'
        ? $t.tour.hatsu.double.watch
        : technique.kind === 'surveillance'
          ? $t.tour.hatsu.owl.watch
          : $t.tour.hatsu.insect.orders,
  )
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

  const targetView = new TourTargetView({
    ship,
    read: () => ({ technique, world, french }),
    nameOf,
    named,
  })
  const targets = $derived(targetView.spaces)
  const onSolids = $derived(targetView.onSolids)
  const targetMode = $derived(targetView.mode)
  const targetName = targetView.name
  const solidTargets = $derived(targetView.solids)
  const mute = $derived(world.sealed >= 3)
  const naming = $derived<Naming>({
    nameOf,
    sourceOf,
    insideOf: (room: string) => $t.tour.insideOf(room),
  })
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
  // The plan and finder are navigation controls, even while aura is active.
  // Hatsu targets have their own index in the sidebar; sharing this callback
  // made every room click cast instead of walking as soon as a technique was
  // selected, which made the tour appear to stop working.
  const selectOnPlan = (space: Space) => goToSpace(space)
  const planVerb = $derived($t.tour.goTo)
  const blindWalls = $derived(chrome.reveal ? blindWallReasons(plan, french) : [])
  const handPlacedDoors = $derived(chrome.reveal ? declaredDoorReasons({ plan, ship, french }) : [])
  const overlayView = new TourOverlayView({
    read: () => ({
      muted: mute,
      levelName: deck ? nameOf(deck) : nameOf(plan.tier),
      tierName: nameOf(plan.tier),
      insideInterior,
      currentSpace,
      isolatedCopy: Boolean(
        world.isolated && !world.isolated.occupant && world.isolated.spaceId === currentSpace?.id,
      ),
      onSolids,
      aimedAt,
      aimedSolidAt,
      color: technique?.color ?? null,
      touch,
      engaged,
      controls: controlKeys,
    }),
    labels: () => ({
      insideOf: $t.tour.insideOf,
      outside: $t.tour.outside,
      noSource: $t.tour.noSource,
      copyBadge: $t.tour.hatsu.copy,
      copySource: $t.tour.hatsu.copySource,
      aimingSolid: $t.tour.hatsu.solids.aiming,
      aimingNothingSolid: $t.tour.hatsu.solids.aimingNothing,
      aimingSpace: $t.tour.hatsu.aiming,
      aimingNothingSpace: $t.tour.hatsu.aimingNothing,
      click: $t.tour.hatsu.keys.click,
      action: (key) => $t.tour.hatsu.keys.actions[key],
      engaged: $t.tour.engaged,
      touch: $t.tour.touch.hint,
      enter: $t.tour.enter,
    }),
    named,
    nameOf,
    badgeOf: provenanceLabel,
    badgeClassOf: provenanceClass,
    sourceOf,
  })
  /**
   * The people in the ship, and what they are doing while the visitor walks.
   *
   * Everything it needs, it reads; everything it decides, it decides in
   * `lib/tour/cast/`. The page carries four lines of it because that was the
   * deal ADR-003 §4 made with ADR-002.
   */
  const castView = new TourCastView({
    ship,
    read: () => ({
      cast,
      world,
      tierId,
      visitorIn: currentSpace?.id ?? null,
      casting: Boolean(technique),
    }),
    updateWorld: (next) => (world = next),
  })
  // The conduct runs on the walk's own clock, a second at a time: the page
  // already keeps one, and the walk is only ever allowed one.
  $effect(() => {
    const beat = setInterval(() => castView.step(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(beat)
  })

  const locationReadout = $derived(overlayView.location)
  const aimReadout = $derived(overlayView.aim)
  const overlayControls = $derived(overlayView.controls)
  const statusHint = $derived(overlayView.status)
</script>

<svelte:window onkeydown={keyboard.onKeydown} />

<TourPageIntro {ship} />

<div class="mx-auto max-w-[1600px] px-4 py-8" data-hatsu-pass>
  <div
    class="grid {chrome.immersive
      ? `fixed inset-0 z-[90] h-[100dvh] w-screen overflow-hidden bg-[#050505] ${
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
        nen: hatsuSession.nen,
        onNenChange: hatsuSession.useNen,
        aiming: Boolean(technique),
        selfCastable,
        reveal: chrome.reveal,
        onCast: castOn,
        onHatsu: castOn,
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
        orders,
        onOrder: () => technique && turn(technique.kind),
        swings: technique?.kind === 'stitch',
        touchUseLabel,
        touchLabels: { move: $t.tour.touch.move, cast: $t.tour.touch.cast },
        soundLabels: { silence: $t.tour.sound.silence, restore: $t.tour.sound.restore },
        loadingLabel: $t.tour.loading,
        unsupportedLabel: $t.tour.unsupported,
        extras: castView.apparitions,
        // Taking hold of a beast is the one thing §2.4 lets one do: it answers,
        // and nothing else in the ship changes.
        onPick: (id) => castView.speak(id),
        hour,
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
        // The provenance card of the light, beside the deck: the visitor can
        // see why the bay is black at chapter 374 and a drawn noon elsewhere.
        hour: hour.label,
        // Hidden while the card is up: the same gesture puts it back, and the
        // card carries its own way out.
        examine: asking
          ? null
          : { label: $t.tour.examine.open, key: touch ? null : 'P', onOpen: ask },
      }}
      examine={{
        open: asking,
        exhibit,
        sourcesHref: $link('/tour/sources'),
        onClose: close,
      }}
    />

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
        decks: ship.decks.map((tier) => ({
          id: tier.id,
          label: nameOf(tier),
          active: tier.id === deck?.id,
        })),
        plan,
        position,
        heading,
        crossings,
        currentSpaceId: currentSpace?.id ?? null,
        planLabel: $t.tour.minimap(nameOf(plan.tier)),
        nameOf: (space) => {
          if (!space) return ''
          return nameOf(named(space as Space))
        },
        crossingLabel,
        onSelectPlan: selectOnPlan,
        selectLabel: planVerb,
        aiming: false,
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
            at: [...position] as [number, number],
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
  {naming}
  onClosePlan={() => (chrome.planOpen = false)}
  onSelect={selectOnPlan}
  onGo={goToSpace}
/>
