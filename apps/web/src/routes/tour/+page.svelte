<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte'
  import { page } from '$app/stores'
  import TourPageIntro from '$lib/components/tour/TourPageIntro.svelte'
  import TourPageDialogs from '$lib/components/tour/TourPageDialogs.svelte'
  import TourPageStage from '$lib/components/tour/TourPageStage.svelte'
  import TourPageSidebar from '$lib/components/tour/TourPageSidebar.svelte'
  import { activeHatsu } from '$lib/nen/hatsuState'
  import { HATSU_PROFILES, type HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
  import { localizeHatsu } from '$lib/i18n/hatsu'
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
  import { playTourHatsuSound } from '$lib/tour/hatsuSound'
  import { playTourReachSound } from '$lib/tour/reachSound'
  import { hearTheRoom } from '$lib/tour/cast/hearing'
  import { punchRuns } from '$lib/tour/punch'
  import { daysLeft } from '$lib/tour/decipher'
  import { HOURS_IN_A_YEAR } from '$lib/tour/emperor'
  import { blindWallReasons, declaredDoorReasons } from '$lib/tour/pageTargets'
  import { TourKeyboardController } from '$lib/tour/pageKeyboard'
  import { examine, type Exhibit } from '$lib/tour/exhibit'
  import { TourWorldTicker } from '$lib/tour/pageWorldTicker'
  import { TourHatsuSession } from '$lib/tour/pageHatsuSession.svelte'
  import TourPostcardModal from '$lib/components/tour/TourPostcardModal.svelte'
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
    onFloorOf,
    TAKES_ORDERS,
    TOUR_KINDS,
    wearTheMask,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Provenance, Space } from '$lib/tour/types'
  import { TourCastView } from '$lib/tour/pageCastView.svelte'
  import { TourBodyView } from '$lib/tour/pageBodyView.svelte'
  import { noteFor } from '$lib/tour/pageBodyReadout'
  import { aimedPerson, personExhibit } from '$lib/tour/cast/provenance'
  import { NO_CAST, readingIsFelt, spacesForLocation, type AddressWords } from '$lib/tour/cast'
  import type { BodyReadoutWords } from '$lib/tour/pageBodyReadout'
  import { NO_HOUR } from '$lib/tour/hour'
  import { viewsForSpace } from '$lib/tour/mangaViews'
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
    // One key for the cards, and it puts back whichever is up: the exchange
    // first, since it is the one the visitor opened from the other.
    examine: () => {
      if (bodyView.talk) bodyView.close()
      else if (asking) close()
      else ask()
    },
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
        approximateClaim: $t.tour.examine.person.approximateClaim,
        standingIn: $t.tour.examine.standingIn,
        standingAbout: $t.tour.examine.standingAbout,
        role: $t.tour.examine.person.role,
        drawnFrom: $t.tour.examine.person.drawnFrom,
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
    const seen = flashFor({ report: shown, from: position, heading }, ship, world)
    if (seen) flash = { ...seen, seq: ++flashes }
    playTourHatsuSound($activeHatsu, shown)
  }
  const ticker = new TourWorldTicker({
    read: () => ({ world, ship, position, standingIn: currentSpace?.id ?? null }),
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
    vowRules: (subjectId) => {
      const subjectName =
        subjectId === 'self' ? $t.tour.hatsu.vow.self : nameOf(ship.spaces.get(subjectId)!)
      return [$t.tour.hatsu.vow.ruleA(subjectName), $t.tour.hatsu.vow.ruleB(subjectName)]
    },
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
    vowText: (subjectId) =>
      subjectId === 'self'
        ? $t.tour.hatsu.reports.vowBroken($t.tour.hatsu.vow.self)
        : $t.tour.hatsu.reports.vowBroken(nameOf(ship.spaces.get(subjectId)!)),
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
    // Walking out ends everything the walk was holding on anybody, and closes
    // the exchange with them: ADR-004 §2.3, kept by the mechanism rather than
    // by discipline.
    bodyView.release()
  }
  /**
   * A cast, offered to the body in front of you before it is offered to the room.
   *
   * The order is the gesture's own: a visitor with a technique up and a person
   * down the reticle meant the person. A technique that has nothing to say to
   * anybody falls straight through and does to the ship what it always did —
   * `reach` returns false for exactly that case, and for nobody being there.
   */
  const castAt = (
    spaceId: string | null,
    solidId: string | null = null,
    hand: CastHand = 'first',
  ) => (bodyView.reach(Date.now()) ? undefined : castOn(spaceId, solidId, hand))
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
  /**
   * The words the exchange and the read-out are worded in.
   *
   * Both packs are handed to pure modules as parameters — `cast/address.ts` and
   * `pageBodyReadout.ts` never touch i18n — and both are derived, so a visitor
   * who changes language mid-walk sees the next answer in it.
   */
  const addressWords = $derived<AddressWords>({
    question: (topic) => $t.tour.address.questions[topic],
    role: $t.tour.address.role,
    faction: $t.tour.address.faction,
    since: $t.tour.address.since,
    step: $t.tour.address.step,
    route: $t.tour.address.route,
    category: $t.tour.address.category,
    techniques: $t.tour.address.techniques,
    silent: $t.tour.address.silent,
    capped: $t.tour.address.capped,
  })
  /**
   * The name a visitor knows a technique by, from the kind the walk files it
   * under. Same lookup the HUD makes for the pages of the book, and for the same
   * reason: what the chain took is an ability, not somebody's copy of one — so
   * the line has to say "Little Eye" where the engine says `scout`.
   */
  const techniqueName = (kind: string) => {
    const profile = HATSU_PROFILES.find((candidate) => candidate.kind === kind)
    return profile ? localizeHatsu(profile, $locale).name : kind
  }
  const bodyWords = $derived<BodyReadoutWords>({
    refusal: (reason) => $t.tour.body.refusals[reason],
    tell: (tell) => $t.tour.body.tells[tell],
    mark: (mark) => $t.tour.body.marks[mark],
    held: $t.tour.body.held,
    worn: $t.tour.body.worn,
    stolen: (name, technique) => $t.tour.body.stolen(name, techniqueName(technique)),
    returned: (name, technique) => $t.tour.body.returned(name, techniqueName(technique)),
    delivered: $t.tour.body.delivered,
    consoleOn: $t.tour.body.consoleOn,
  })
  const bodyNameOf = (characterId: string) =>
    cast.members.find((member) => member.characterId === characterId)?.name ?? ''
  /**
   * What the last cast at a body came to, and until when.
   *
   * Dated rather than cleared by a timer: the page already ticks `now`, and a
   * line that outlived the gesture it reports would sit over the next room.
   */
  const NOTE_MS = 6000
  let note = $state<{ line: string; until: number } | null>(null)
  const bodyNote = $derived(note && note.until > now ? note.line : null)

  /**
   * Emperor Time over the scene, deepening with what it has spent.
   *
   * The walk's own ledger rather than the global store `/nen` keeps: the hours
   * are counted in `TourWorld` on the page's own beat — see `emperor.ts` — and a
   * wash driven by anything else would be the picture and the panel quoting two
   * different years.
   */
  const scarletWash = $derived(
    world.scarlet
      ? {
          share: Math.min(1, world.scarlet.hours / HOURS_IN_A_YEAR),
          label: $t.nen.lifeConsumed(world.scarlet.hours.toLocaleString($locale)),
        }
      : null,
  )

  const castView: TourCastView = new TourCastView({
    ship,
    read: () => ({
      cast,
      world,
      tierId,
      visitorIn: currentSpace?.id ?? null,
      casting: Boolean(technique),
    }),
    // What the visitor is doing to one body in particular (ADR-004): the
    // conduct answers being aimed at personally, and being held, differently
    // from a technique merely going off in the room. Only a raised aura is
    // felt — `readingIsFelt` — so looking hard through Gyo alarms nobody.
    readBodies: () => ({
      aimedAt: readingIsFelt(hatsuSession.nen) ? bodyView.aimedId : null,
      holds: bodyView.marks,
      // Not a hold, and it outlasts every one of them: a body Steal Chain has
      // emptied has no aura for as long as the book has its ability.
      drained: world.book.stolenFrom ? [world.book.stolenFrom] : [],
    }),
    updateWorld: (next) => (world = next),
  })
  /**
   * The people, as things one can read, reach and address (ADR-004).
   *
   * It reads the distribution the cast view already computed rather than
   * aiming a second time, which is §2.1: the body one interrogates is the body
   * whose fiche is already on screen.
   */
  const bodyView: TourBodyView = new TourBodyView({
    read: () => ({
      cast,
      posts: castView.posts,
      spaceId: currentSpace?.id ?? null,
      position,
      heading,
      nen: hatsuSession.nen,
      activeKind: technique?.kind ?? null,
      beastFor: castView.beastFor,
      auraFor: castView.auraOf,
      book: world.book,
      decipherDays: world.decipher ? daysLeft(world.decipher) : 0,
      throughMatter: (to) =>
        punchRuns({ from: position, to, onFloor: onFloorOf(ship, tierId) }) !== null,
    }),
    words: () => addressWords,
    placeOf: (location) => {
      const space = spacesForLocation(ship, location)[0]
      return space ? nameOf(named(space)) : null
    },
    report: (reach) => {
      const line = noteFor(reach, bodyWords, bodyNameOf)
      if (line) note = { line, until: Date.now() + NOTE_MS }
      playTourReachSound(reach)
    },
    // The console goes on somebody and starts counting. Which of the three
    // attested readings it is follows from who they are: Beyond's curse is the
    // one the archive puts a year on, and everything else the walk can read is
    // a Guardian Spirit Beast at ten days. There is no fourth duration to pick.
    // The room is taken with them, because the days are counted against the
    // compartment rather than against the person: outside one there is nothing
    // to be beside, and a reading opened there could never bank a day.
    startReading: (characterId) => {
      const spaceId = currentSpace?.id
      if (!spaceId) return
      const cursed = world.curse?.victim === characterId || world.curse?.sacrifice === characterId
      world = {
        ...world,
        decipher: {
          characterId,
          spaceId,
          reading: cursed ? 'decodeCurse' : 'guardianBeast',
          days: 0,
        },
      }
    },
    wear: (characterId) => (world = wearTheMask(world, characterId)),
    // The book holds what a technique *does* rather than whose it was, and a
    // cast member's repertoire is already in that vocabulary: the server builds
    // it from the catalogue's `kind`, filtered to what the walk performs. Asking
    // the registry to turn it into a kind a second time — by *ability id* — was
    // the whole of why Steal Chain took nothing: the lookup never matched, the
    // page returned early, and the finger went in and came out empty.
    // One the walk cannot perform is still not filed: a page the visitor could
    // turn to and get nothing from would be worse than none.
    steal: (characterId, technique) => {
      const kind = TOUR_KINDS.has(technique as HatsuInteractionKind)
        ? (technique as HatsuInteractionKind)
        : null
      if (!kind) return
      world = {
        ...world,
        book: {
          ...world.book,
          pages: [...new Set([...world.book.pages, kind])],
          open: kind,
          // The person, in `stolenFrom`. `zetsu` is a list of *rooms* — the
          // engine tests it with `ship.spaces.get(target.id)` — and pushing a
          // character id into it put the two vocabularies in one array, where
          // a drained guard read as a drained compartment.
          stolenFrom: characterId,
        },
      }
    },
    // The thumb aimed back at whoever it emptied. The page comes out of the
    // book with the ability, because a technique the visitor can still cast
    // after giving it back is a technique that was never given back.
    giveBack: (characterId) => {
      if (world.book.stolenFrom !== characterId) return
      const gone = world.book.open
      world = {
        ...world,
        book: {
          ...world.book,
          pages: world.book.pages.filter((page) => page !== gone),
          open: null,
          stolenFrom: null,
        },
      }
    },
  })
  // The conduct runs on the walk's own clock, a second at a time: the page
  // already keeps one, and the walk is only ever allowed one. The holds expire
  // on the same beat, for the same reason.
  $effect(() => {
    const beat = setInterval(() => {
      castView.step(Math.floor(Date.now() / 1000))
      bodyView.step(Date.now())
      // The console counts on the walk's own beat, never on the reader's clock.
      ticker.consoleDay()
      // And Emperor Time spends on it: an hour of life a second, held or not
      // touched, which is the only way a price can be one.
      ticker.scarletSecond()
      // And a copy lasts a day, on the same exchange: the second of the walk
      // is worth an hour, so twenty-four of them and the fake is gone.
      ticker.copyHour()
    }, 1000)
    return () => clearInterval(beat)
  })
  /**
   * Everybody is let go of when the aura comes down.
   *
   * The other half of §2.3 — walking out of the room — is `arrived`. Between
   * the two there is no way to keep a hold on somebody the visitor is not
   * standing in front of with their aura up.
   */
  $effect(() => {
    const held = Boolean($activeHatsu) && hatsuSession.nen.mode !== 'zetsu'
    if (!held) untrack(() => bodyView.release())
  })

  /**
   * The far end of the filament when it is stuck to a person rather than a thing.
   *
   * Resolved here because this is the one place holding both halves: the hold
   * lives in `bodyView` and the position lives in `castView`. The scene is
   * handed a point rather than an identity, so it never has to look anybody up.
   * Somebody the projection has stopped drawing takes the strand with them,
   * which is the honest answer — the walk cannot draw a line to a body it is
   * not drawing.
   */
  const strandOn = $derived.by(() => {
    if (!bodyView.strandOn) return null
    const post = castView.posts.find((each) => each.member.characterId === bodyView.strandOn)
    return post ? { spaceId: post.spaceId, at: post.at } : null
  })

  /**
   * What Melody's ear picks up in the room, or null when she is not the one
   * being held.
   *
   * Continuous rather than cast, because that is what absolute hearing is: she
   * is not doing anything, she is in the room. So it follows the technique in
   * hand and the flute — put the flute up and the listening stops, which is
   * `hearing.ts`'s own first answer.
   */
  const heard = $derived(
    technique?.kind === 'melody'
      ? hearTheRoom({
          posts: castView.posts,
          spaceId: currentSpace?.id ?? null,
          auraFor: castView.auraOf,
          playing: world.body.playing !== null,
        })
      : null,
  )

  const locationReadout = $derived(overlayView.location)
  const aimReadout = $derived(overlayView.aim)
  const overlayControls = $derived(overlayView.controls)
  const statusHint = $derived(overlayView.status)

  let takeScreenshot = $state<(() => Promise<Blob | null>) | null>(null)
  let postcardPhotoBlob = $state<Blob | null>(null)
  const gyoMode = $derived(hatsuSession.nen.gyo)
  const currentMangaViews = $derived(viewsForSpace(currentSpace?.id ?? null))
  const currentMangaView = $derived(currentMangaViews[0] ?? null)

  const tourist = $derived({
    available: true,
    ...(currentMangaView
      ? {
          mangaViewLabel: `${french ? currentMangaView.labelFr : currentMangaView.label} — ${
            french ? 'tome' : 'vol.'
          } ${currentMangaView.volume}, ${french ? 'chap.' : 'ch.'} ${currentMangaView.chapter}${
            currentMangaView.pages ? `, p. ${currentMangaView.pages}` : ''
          }`,
          onJumpToAngle: () => {
            const view = currentMangaView
            navigation.jumpTo = view.spaceId
            navigation.jumpAt = view.at
            navigation.jumpHeading = view.heading
            navigation.jumpPitch = view.pitch
          },
        }
      : {}),
    onTakePhoto: async () => {
      if (takeScreenshot) {
        const blob = await takeScreenshot()
        if (blob) {
          postcardPhotoBlob = blob
        }
      }
    },
    onTakePhotoWithHud: async () => {
      const el = document.getElementById('tour-stage-container')
      if (!el || !takeScreenshot) return

      const sceneBlob = await takeScreenshot()
      if (!sceneBlob) return

      const { captureStageWithHud } = await import('$lib/tour/hudCapture')
      const blob = await captureStageWithHud(el, sceneBlob)
      if (blob) postcardPhotoBlob = blob
    },
  })
</script>

{#if postcardPhotoBlob}
  <TourPostcardModal photoBlob={postcardPhotoBlob} onClose={() => (postcardPhotoBlob = null)} />
{/if}

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
      bind:takeScreenshot
      {gyoMode}
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
        onCast: castAt,
        onHatsu: castAt,
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
        propels: technique?.kind === 'elastic',
        gumOn: strandOn,
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
        note: bodyNote,
        aim: aimReadout,
        controls: overlayControls,
        statusHint,
        tourist,
        gyo: {
          active: gyoMode,
          onToggle: () => hatsuSession.useNen({ type: 'GYO', on: !gyoMode }),
        },
        linkPrompt: touch ? null : linkPrompt,
        // The provenance card of the light, beside the deck: the visitor can
        // see why the bay is black at chapter 374 and a drawn noon elsewhere.
        hour: hour.label,
        scarlet: scarletWash,
        // Hidden while the card is up: the same gesture puts it back, and the
        // card carries its own way out.
        examine:
          asking || bodyView.talk
            ? null
            : { label: $t.tour.examine.open, key: touch ? null : 'P', onOpen: ask },
      }}
      examine={{
        open: asking,
        exhibit,
        sourcesHref: $link('/tour/sources'),
        onClose: close,
        // The way on to the exchange, only in front of somebody the server
        // sent a dossier for. The evidence card steps aside for it: both are
        // the same card in the same place, about the same body.
        address: bodyView.dossier
          ? {
              label: $t.tour.address.open,
              onOpen: () => {
                close()
                bodyView.address()
              },
            }
          : null,
      }}
      address={{
        talk: bodyView.talk,
        extracted: bodyView.extracted,
        reading: bodyView.reading,
        held: bodyView.heldMark,
        onClose: bodyView.close,
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
            personName: bodyNameOf,
            heard,
            onRelease: release,
            onCycleDouble: cycleDouble,
            onCycleOwl: cycleOwl,
            onCycleEye: cycleEye,
            onCastPage: castPage,
            onCastHand: castHand,
            onTurnTheBook: turnTheRibbon,
            onSelfInjury: hatsuSession.selfInjure,
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
