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
  import Seo from '$lib/components/Seo.svelte'
  import TourFinder from '$lib/components/tour/TourFinder.svelte'
  import TourHatsuHud from '$lib/components/tour/TourHatsuHud.svelte'
  import TourMinimap from '$lib/components/tour/TourMinimap.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { setAmbientMuffled } from '$lib/audio/ambient'
  import {
    blowAGust,
    fireABurst,
    foldPaper,
    crackAWhip,
    grindThroughSpace,
    hissLikeASnake,
    hootAnOwl,
    landAPunch,
    loostAnArrow,
    openAWormhole,
    playATune,
    chirpTheFlock,
    crushLikeACat,
    roarLikeADragon,
    raiseTheSun,
    selectACard,
    skipThroughTime,
    startEngine,
    startFly,
    startRequiem,
    startVacuum,
    stopEngine,
    stopEveryHatsuLoop,
    stopFly,
    stopRequiem,
    stopVacuum,
    stretchTheGum,
    strikeAGong,
    unspoolWire,
    wakeTheMachine,
  } from '$lib/audio/hatsuSounds'
  import { activeHatsu, enterForcedZetsu, parallelFutureVisible } from '$lib/nen/hatsuState'
  import { get } from 'svelte/store'
  import { HATSU_PROFILES, type HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, t } from '$lib/i18n'
  import { locale } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { crossingsOn, deckOf, entrySpace, theShip, type Crossing } from '$lib/tour/blueprint'
  import {
    FOV_RANGE,
    NIGHT_LIGHT_RANGE,
    SENSITIVITY_RANGE,
    SNAP_ANGLE_RANGE,
    comfort,
    loadComfort,
    prefersReducedMotion,
    resetComfort,
    setComfort,
  } from '$lib/tour/comfort'
  import { flashFor, type TourFlash } from '$lib/tour/apparitions'
  import { describeSpace } from '$lib/tour/describe'
  import { placeOf, type Naming } from '$lib/tour/search'
  import {
    EMPTY_WORLD,
    aimsAtSolids,
    arriveInTour,
    castInTour,
    catStep,
    gasStep,
    looseTheFlock,
    reelStep,
    smokeStep,
    takeTheCoin,
    ageTheOwl,
    fishBite,
    polarityStep,
    flyTheEye,
    flyTheOwl,
    hatsuKeys,
    identityOf,
    nextDoubleMode,
    nextEyeMode,
    nextOwlMode,
    openTheBook,
    otherHand,
    spendPage,
    TAKES_ORDERS,
    turnTheBook,
    twoPages,
    TWO_HANDED_KINDS,
    worksInTour,
    worksOnTheBody,
    wormExit,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Link, Provenance, Space, Structure, Vec2 } from '$lib/tour/types'

  const ship = theShip()

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

  let tierId = $state(initialTierId)
  let currentSpace = $state<Space | null>(null)
  let availableLink = $state<{ link: Link; to: string } | null>(null)
  let jumpTo = $state<string | null>(null)
  /** Where in that room, for the arrow — which lands where it fell, not at the door. */
  let jumpAt = $state<Vec2 | null>(null)
  let engaged = $state(false)
  /** Set by the scene once it knows it is being walked with a finger. */
  let touch = $state(false)
  let position = $state<[number, number]>([0, 0])
  let heading = $state(0)
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
  let reveal = $state(false)

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

  /**
   * A room and a solid are sourced the same way and read the same way — the
   * coffin carries ch. 371 whatever the chamber around it carries — so the
   * badge takes anything with a provenance rather than a space.
   */
  const provenanceLabel = (thing: { provenance: Provenance }) =>
    $t.tour.provenance[thing.provenance]

  // Four ranks, four readings: gold for a panel, bone for a deck plan, green
  // for what only the /ship room plan draws, cold blue for what nothing draws.
  const PROVENANCE_CLASS: Record<Provenance, string> = {
    panel: 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]',
    plan: 'border-[#FFFFF0]/30 bg-[#FFFFF0]/5 text-[#FFFFF0]/80',
    map: 'border-[#5f8f6a] bg-[#5f8f6a]/20 text-[#8fd0a0]',
    inferred: 'border-[#2b3a4a] bg-[#2b3a4a]/30 text-[#9dc4e0]',
  }

  const provenanceClass = (thing: { provenance: Provenance }) => PROVENANCE_CLASS[thing.provenance]

  /**
   * The stairwell or door within reach, named — read out of one wording or the
   * other, because the same crossing is a key to press on a keyboard and a
   * button to tap on a phone, which has no E.
   */
  const promptFor = (words: {
    takeLink: (destination: string) => string
    takeBulkhead: (destination: string) => string
    enterInterior: (destination: string) => string
    leaveInterior: (destination: string) => string
  }) => {
    if (!availableLink) return null
    const destination = ship.spaces.get(availableLink.to)
    if (!destination) return null
    const tier = ship.tiers.find((candidate) => candidate.id === destination.tierId)
    const label = `${nameOf(destination)}${tier ? ` — ${nameOf(tier)}` : ''}`
    if (availableLink.link.kind === 'door') {
      return tier?.kind === 'interior'
        ? words.enterInterior(nameOf(tier))
        : words.leaveInterior(nameOf(destination))
    }
    return availableLink.link.kind === 'bulkhead'
      ? words.takeBulkhead(label)
      : words.takeLink(label)
  }

  const linkPrompt = $derived(promptFor($t.tour))
  const touchUseLabel = $derived(promptFor($t.tour.touch))

  /** Bow-to-stern length of the ship, read off the widest deck. */
  const shipLength = Math.round(
    Math.max(
      ...ship.decks.map((tier) => {
        const zs = tier.hull.map((point) => point[1])
        return Math.max(...zs) - Math.min(...zs)
      }),
    ),
  )

  function goToSpace(space: Space, landing: Vec2 | null = null) {
    if (space.tierId !== tierId) tierId = space.tierId
    jumpAt = landing
    jumpTo = space.id
  }

  function selectTier(id: string) {
    if (id === tierId) return
    const plan = ship.plans.get(id)
    if (plan) goToSpace(entrySpace(plan))
  }

  /**
   * Honour whatever the URL currently asks for. `untrack` because `selectTier`
   * reads the deck it is leaving: without it the walk would answer its own move
   * and jump back to the linked room every time the visitor took a stairwell.
   */
  $effect(() => {
    const space = requestedSpace
    const deck = requestedDeck
    untrack(() => {
      if (space) goToSpace(space)
      else if (deck && ship.plans.has(deck)) selectTier(deck)
    })
  })

  /**
   * A link back to where the visitor is standing.
   *
   * The walk deliberately does not rewrite the URL as it is walked, so this is
   * how a viewpoint is shared: the room under the visitor's feet, or the deck
   * they are on when they are out between rooms.
   */
  let copied = $state<'idle' | 'done' | 'failed'>('idle')
  let copyTimer: ReturnType<typeof setTimeout> | null = null

  async function copyViewpoint() {
    const url = new URL($page.url)
    url.searchParams.delete('deck')
    url.searchParams.delete('space')
    if (currentSpace) url.searchParams.set('space', currentSpace.id)
    else url.searchParams.set('deck', tierId)

    try {
      await navigator.clipboard.writeText(url.toString())
      copied = 'done'
    } catch {
      copied = 'failed'
    }
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied = 'idle'), 2500)
  }

  // ── The plan, and the finder ───────────────────
  let planOpen = $state(false)
  let planDialog = $state<HTMLDialogElement | null>(null)
  let findOpen = $state(false)

  $effect(() => {
    if (!planDialog) return
    if (planOpen && !planDialog.open) planDialog.showModal()
    else if (!planOpen && planDialog.open) planDialog.close()
  })

  /** The stairs, the bulkhead and the interior doors that touch this level. */
  const crossings = $derived(crossingsOn(ship, tierId))

  const crossingLabel = (crossing: Crossing) => {
    const destination = ship.spaces.get(crossing.to)
    const tier = destination
      ? ship.tiers.find((candidate) => candidate.id === destination.tierId)
      : null
    const label = destination
      ? `${nameOf(named(destination))}${tier ? ` — ${nameOf(tier)}` : ''}`
      : crossing.to
    if (crossing.rise > 0.5) return $t.tour.plan.crossingUp(label)
    if (crossing.rise < -0.5) return $t.tour.plan.crossingDown(label)
    return $t.tour.plan.crossingAcross(label)
  }

  // ── The walk at the size of the screen ─────────
  /**
   * Full screen is not the walk with its page taken away.
   *
   * Two things make that true. The layout: the walk takes the screen and the
   * column comes with it — the decks, the plan, the index, the Hatsu panel, the
   * comfort dials, the legend — folded away on a keypress when the ship is what
   * you came to look at, and never gone. And the element: what is handed to the
   * browser is the document rather than this page, because the Nen dock is the
   * archive's and hangs outside the route. Full screen on the grid would take
   * the walk and leave the aura at the door.
   */
  let immersive = $state(false)
  let panelOpen = $state(true)
  /**
   * Whether the browser actually took the element. A phone has no element full
   * screen to give, so the same layout stands on `position: fixed` instead —
   * which is also what has to be undone by hand, since there is no
   * `fullscreenchange` coming for it.
   */
  let native = false

  /**
   * The archive's chrome stands down for the walk.
   *
   * Not decoration: the route is drawn inside a transformed shell, which is a
   * stacking context of its own, so no z-index this page can name will ever put
   * the walk over the site header. The header goes instead — and the Nen dock,
   * which hangs outside the route entirely, deliberately stays.
   */
  $effect(() => {
    const root = document.documentElement
    root.classList.toggle('tour-immersive', immersive)
    return () => root.classList.remove('tour-immersive')
  })

  async function toggleFullscreen() {
    if (immersive) {
      if (native && document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch {
          // Refused: fall through and drop the layout ourselves.
        }
      }
      native = false
      immersive = false
      return
    }

    immersive = true
    // `requestFullscreen` is missing on iOS Safari altogether. The fixed layout
    // is the same layout, so the walk still fills the phone — it just keeps the
    // browser's chrome, which is the browser's call rather than ours.
    if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        native = true
      } catch {
        native = false
      }
    }
  }

  /**
   * M opens the plan at a size it can be read at. In the 320-pixel column a
   * room's legend comes out under four pixels tall, which is a cost paid for
   * nothing; full screen, the same drawing is legible, and it is the same
   * component rather than a second plan to keep in step.
   *
   * V gives the walk the screen, and Esc gives it back — but only when the
   * pointer is not engaged, because there Esc already means "let go of my
   * mouse", and one key cannot mean two things in the same breath.
   *
   * R changes the orders of the three techniques that take orders: the double's
   * watch under Without You, which of the three birds Secret Window sends, and
   * what Little Eye's insect is doing where it is. Under a technique that can be
   * turned on its own user — Black Voice's needle, Elastic Love — the walk takes
   * it instead and casts with an empty reticle; the two sets do not overlap, so
   * the key never means two things at once. Under anything else it means nothing
   * and is left to the browser.
   */
  function onWindowKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const key = event.key.toLowerCase()
    if (key === 'r' && !(technique && TAKES_ORDERS.has(technique.kind))) return
    if (key !== 'm' && key !== 'g' && key !== 'r' && key !== 'v' && key !== 'escape') return
    // Esc leaves full screen only where nothing else has a claim on it: the
    // browser answers it in native full screen, an engaged pointer answers it
    // with "let go of my mouse", and an open dialog closes on it first.
    if (key === 'escape' && !(immersive && !native && !engaged && !planOpen && !findOpen)) return
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('input, textarea, select') !== null)
    ) {
      return
    }
    event.preventDefault()
    if (key === 'g') reveal = !reveal
    else if (key === 'r') {
      if (technique) turn(technique.kind)
    } else if (key === 'v' || key === 'escape') void toggleFullscreen()
    else planOpen = !planOpen
  }

  /**
   * Whether this system asks for less movement — read on mount rather than at
   * init, because the server has no media query to ask and would render the
   * hint one way and hydrate it the other.
   */
  let calm = $state(false)
  onMount(() => {
    loadComfort()
    calm = prefersReducedMotion()

    // Esc, F11 and the window chrome all leave full screen without asking the
    // page, so the browser is the authority on whether we are still in it.
    const sync = () => {
      if (native && !document.fullscreenElement) {
        native = false
        immersive = false
      }
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  })

  onDestroy(() => {
    if (copyTimer) clearTimeout(copyTimer)
    // Leaving the route leaves full screen with it: the walk asked for the
    // screen, and no other page of the archive did.
    if (native && document.fullscreenElement) void document.exitFullscreen()
  })

  // ── Nen ────────────────────────────────────────
  let world = $state<TourWorld>(EMPTY_WORLD)

  /**
   * The clock the ten blind seconds are read against.
   *
   * A deadline in the world is not reactive on its own — nothing changes when
   * it passes — so the walk has to keep asking what time it is for the screen
   * to come back. The walking itself is the scene's: it holds the keys down for
   * the visitor and drifts the heading, which is what wandering looks like.
   * Nothing here moves them, because a body carried room to room every second
   * and a half is not a body walking blind.
   */
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
  /**
   * The blast and the punch, which are gone by the time the read-out is read.
   *
   * Everything else a technique does is in the world and can simply be drawn
   * from it. These two are events: the page hands the walk one and counts it,
   * because casting the same blast at the same room twice is two gusts of air
   * and an unchanged value would only ever be one.
   */
  let flash = $state<(TourFlash & { seq: number }) | null>(null)
  let flashes = 0

  /** Hands the walk whatever the cast that just happened has to show. */
  function show(shown: TourReport) {
    const seen = flashFor(shown, ship, world, position)
    if (seen) flash = { ...seen, seq: ++flashes }
    sound(shown)
  }

  /**
   * And whatever it has to be heard as.
   *
   * Nineteen of the techniques have a sound of their own, in
   * `$lib/audio/hatsuSounds`; the rest are silent and should be, because a walk
   * where every cast made a noise would be a slot machine. The switch is on the
   * report rather than on the technique for the reason the flash is: a cast that
   * came up empty is a different event from one that landed, and the ear is
   * better than the read-out at telling a visitor which of the two happened.
   */
  function sound(shown: TourReport) {
    switch (shown.kind) {
      // Snake Arm.
      case 'bound':
        return hissLikeASnake()
      // The Dowsing Chain, used as what it is: a weight on the end of a chain.
      case 'lashed':
        return crackAWhip()
      // Secret Window. Twenty seconds up, and the bird says so on its way out.
      case 'owl-attached':
      case 'owl-recalled':
      case 'owl-expired':
        return hootAnOwl()
      // Cross Game, and Culdcept, which is the other technique made of cards.
      case 'card-blue':
        return selectACard(1)
      case 'card-yellow':
        return selectACard(2)
      case 'card-red':
        return selectACard(3)
      case 'carded':
      case 'acquisition-failed':
        return selectACard(1)
      // Magical Worm: both mouths are the same hole being cut.
      case 'worm-set':
      case 'worm-open':
      case 'worm-crossed':
        return openAWormhole()
      // Chrollo's teleport.
      case 'teleported':
        return skipThroughTime()
      // Surveillance Paper Dolls.
      case 'watching':
        return foldPaper()
      // Air Blow.
      case 'stripped':
        return blowAGust()
      // Black Voice.
      case 'puppeted':
      case 'puppet-released':
      case 'autopilot-started':
        return unspoolWire()
      // Order Stamp: the seal coming down, the lock turning on a head that
      // already wears one, and the puppets moving when they are finally told.
      // An order with nothing locked is deliberately silent — it is spoken to
      // nobody, and nobody is what it sounds like.
      case 'stamped':
        return strikeAGong(1)
      case 'stamp-locked':
        return selectACard(shown.locked ? 2 : 1)
      case 'ordered':
        return wakeTheMachine()
      // The Sun and Moon.
      case 'marked':
        return openAWormhole() // TODO: specialized sound
      case 'detonated':
        return strikeAGong(3) // TODO: specialized explosion sound
      // Remote Punch, whether it found something or bare deck.
      case 'came-up-under':
      case 'came-up-empty':
        return landAPunch()
      // Rising Sun, at whatever radius the wrapping had taken.
      case 'sun-risen':
        return raiseTheSun(shown.metres)
      // Grimmel the Dissonance.
      case 'souls-swapped':
      case 'arrow-drawn':
        return loostAnArrow()
      // Nen Stitches. The thread is thrown on the same click, so this is also
      // the sound of the swing the scene is about to take.
      case 'stitched':
      case 'nothing-to-stitch':
        return unspoolWire()
      // Double Machine Gun.
      case 'volley':
        return fireABurst(shown.hits)
      // Three Monkeys: one gong per seal, and one for lifting all three.
      case 'sealed':
        return strikeAGong(shown.stage)
      // Bungee Gum, all five of its uses: the strand, the pull, the trap laid,
      // the trap sprung, and the two it works on the visitor themselves.
      case 'gum-set':
      case 'gum-pulled':
      case 'gum-trap-set':
      case 'gum-rebound':
      case 'gum-propulsion':
      case 'gum-healed':
        return stretchTheGum()
      // Spatial Teleportation, which grinds one way going and the other coming.
      case 'phasing':
        return grindThroughSpace(shown.on)
      // Biohazard.
      case 'animated':
        return wakeTheMachine()
      // Enchanting Music, which is the one technique in the walk whose whole
      // substance is a sound: the air is played whether it is being put on the
      // room or taken back off it, because both are the flute being played.
      case 'tune-played':
        return playATune(shown.tune)
      // The Guardian Spirit Beasts that have a voice. Not all of them do: a
      // jellyfish over a room and a wheel turning in one are silent in the
      // source and are silent here, and inventing a noise for them would be
      // the walk making something up.
      case 'crushed-one':
        return crushLikeACat()
      case 'flock-loosed':
        return chirpTheFlock()
      // Marayam's roars at somebody trying the door — the scene answers that
      // one, because the door is a keypress rather than a cast — and it roars
      // once on arriving, which is this.
      case 'isolated':
        return roarLikeADragon()
      default:
        return
    }
  }
  let aimedAt = $state<Space | null>(null)
  let aimedSolidAt = $state<Structure | null>(null)

  const technique = $derived(worksInTour($activeHatsu) ? $activeHatsu : null)

  /**
   * The two pages Double Face has live, in the order the two keys play them:
   * the open one under F, the one the ribbon is holding under R.
   *
   * `null` under everything else, which is what makes R mean what it has always
   * meant everywhere else.
   */
  const openPages = $derived(technique?.kind === 'bookmark' ? twoPages(world.book) : null)

  /**
   * Every key the technique in hand answers to, said before it is pressed.
   *
   * The walk casts with three keys at most and no aura uses all three: which
   * ones this one uses — and what R means under it — is decided in one place,
   * and both the panel and the walk itself read it from there.
   */
  const controlKeys = $derived(hatsuKeys(technique, world.book))

  /** A page under the name of whoever the book took it from. */
  const pageName = (kind: HatsuInteractionKind) => {
    const stolen = HATSU_PROFILES.find((candidate) => candidate.kind === kind)
    return stolen ? localizeHatsu(stolen, $locale).name : kind
  }

  /** The two pages as the two buttons a touchscreen gets instead of F and R. */
  const hands = $derived(
    openPages ? { first: pageName(openPages[0]), second: pageName(openPages[1]) } : null,
  )

  /**
   * What a cast would actually run, which is not always the technique in hand.
   *
   * Double Face is not cast at all — it is a bookmark, and what a bookmark does
   * is keep a second page live. So the key decides: F runs the open page and R
   * runs the marked one, and the walk answers to whichever came back.
   */
  const castingKind = (hand: 'first' | 'second' | 'third'): HatsuInteractionKind | null => {
    if (!technique) return null
    if (!openPages) return technique.kind
    return hand === 'second' ? openPages[1] : openPages[0]
  }

  /**
   * Which of Enchanting Music's three airs each key plays.
   *
   * The lively one is on F because F is the key everything is cast with and the
   * dance is what the technique is remembered for; the soft one is on R, which
   * an instrument has no other use for; and the sharp one is on C. Nothing else
   * in the walk reads this — the flute is the only thing aboard that is played
   * rather than aimed.
   */
  const AIR_KEYS = { first: 'dance', second: 'bloom', third: 'scatter' } as const

  /** The three airs as the three buttons a touchscreen gets instead of the keys. */
  const tunes = $derived(
    technique?.kind === 'melody' && !openPages
      ? {
          first: $t.tour.hatsu.tunes[AIR_KEYS.first],
          second: $t.tour.hatsu.tunes[AIR_KEYS.second],
          third: $t.tour.hatsu.tunes[AIR_KEYS.third],
        }
      : null,
  )

  /**
   * Whether the technique in hand is cast with two hands rather than one.
   *
   * Genthru puts the sun on with one hand and the moon with the other, and
   * which of the two a thing wears is the whole decision the technique asks
   * for — so the walk gives the two hands the two keys it already casts with:
   * F is the sun and R is the moon. R is free to be that, because the only
   * other thing it does is turn a technique on its own user and The Sun and
   * Moon has nothing to do to one. A page of the book is the exception, and
   * says so at `nextHand`.
   */
  const twoHanded = $derived(
    Boolean(technique) && !openPages && TWO_HANDED_KINDS.has(technique!.kind),
  )

  /**
   * Which hand each key casts with next, for the techniques that have two.
   *
   * The Sun and Moon is the whole of it: Genthru puts the sun on with one hand
   * and the moon with the other, and the pair does nothing until both are out.
   * Spending a second key on the second hand would collide with everything else
   * a key already means — R is Double Face's other page, and C is the flute's
   * third air — so the key alternates instead. Press it once for the sun and
   * again for the moon, and the pair is two presses of the same key. Kept per
   * key, so a book holding it on one page counts that page's hands alone.
   */
  let nextHand = $state<Record<'first' | 'second' | 'third', 'sun' | 'moon'>>({
    first: 'sun',
    second: 'sun',
    third: 'sun',
  })

  /**
   * Whether R has anything to do: the technique is on both sides of the line.
   *
   * A technique that only ever works on the visitor takes F wherever the
   * reticle happens to be pointing, so it needs no second key. The ones in both
   * sets — Black Voice's needle, Elastic Love — are the ones the reticle
   * decides for, and on a walk the reticle is nearly always on something. R is
   * how the visitor says *me*.
   */
  const selfCastable = $derived(worksOnTheBody(technique) && aimsAtSolids(technique))

  /** Sight is the scene's business; hearing is the archive's ambience. */
  $effect(() => {
    setAmbientMuffled(world.sealed >= 2)
  })

  /**
   * The four techniques that make a noise for as long as they are up.
   *
   * A motor, an engine, an insect and a mass for the dead are states rather
   * than events, so they are driven off the world exactly as the apparitions
   * are, and not off the report that started them. Each is keyed to the same
   * value the scene draws from — Blinky's is `holding`, which is when the
   * hoover appears at the visitor's side — so what is heard and what is on
   * screen can never disagree.
   */
  $effect(() => {
    if (world.holding === 'vacuum') startVacuum()
    else stopVacuum()
  })
  $effect(() => {
    if (world.body.riding) startEngine()
    else stopEngine()
  })
  $effect(() => {
    if (world.eye) startFly()
    else stopFly()
  })
  $effect(() => {
    if (world.devouring.length) startRequiem()
    else stopRequiem()
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
    // What is being held, in the world rather than only in the dock: the
    // passive abilities are decided by `$lib/tour/hatsu`, and it has to be able
    // to tell Voconte's doors from anyone else's.
    const kind = worksInTour($activeHatsu) ? $activeHatsu.kind : null
    const currentWorld = untrack(() => world)
    if (currentWorld.holding !== kind) {
      const nextWorld = { ...currentWorld, holding: kind }
      if (kind === 'guardian') {
        nextWorld.double = currentSpace?.id ?? null
        // The watch she was last set to is kept: R is the only thing that
        // changes it, and taking the aura up again is not R.
        nextWorld.doubleMode = currentWorld.doubleMode ?? 'follow'
      }
      // Momoze's is not cast at anything: the beasts are simply out. Asking the
      // visitor to press F at a room to make them appear would be asking them
      // to aim an ability that has no aim — what it does is ask, over and over,
      // wherever it is, and the flock is the asking. So it is loosed the moment
      // the aura goes up, from where the visitor is standing, exactly as
      // Voconte's doors are simply wired the moment they are held.
      if (kind === 'solicitation') {
        const loose = looseTheFlock(nextWorld, ship, currentSpace?.id ?? null, position)
        if (loose) nextWorld.menagerie = loose.world.menagerie
      }
      // Double Face is handed over already holding two: a bookmark with one
      // page under it is not an ability, and the walk cannot ask the visitor to
      // steal twice before it does anything. Which two is rolled here and
      // stands until the aura is put down.
      if (kind === 'bookmark' && !twoPages(currentWorld.book)) {
        nextWorld.book = openTheBook()
      }
      // Both hands begin with the sun, whatever the last aura left them on.
      nextHand = { first: 'sun', second: 'sun', third: 'sun' }
      world = nextWorld
    }
  })

  /**
   * The double's next watch: at your shoulder, loose in the room she was posted
   * in, or out ahead of the walk.
   *
   * One ability with three orders rather than three abilities in the dock —
   * she is the same double whichever of them she is under, and the visitor
   * changes her orders mid-walk the way they would speak to her.
   */
  function cycleDouble() {
    turn('guardian')
  }

  /**
   * The next of Little Eye's three orders: piloted, scouting, filming.
   *
   * The sphere is the whole ability and it costs nothing to keep up — what
   * makes it worth anything is what the insect is told to do with the room it
   * is in, which is the choice Sayird's module exposes and the walk did not.
   */
  function cycleEye() {
    turn('scout')
  }

  /**
   * The next of Secret Window's three birds: the free one, the one that rides
   * your shoulder, and the one let go without being aimed.
   *
   * Chosen before the cast rather than by it — the bird is what F sends, so the
   * visitor has to be able to say which bird it is while nothing is out. A bird
   * already perched is left where it is; what changes is what the next cast
   * sends, and whether this one is still allowed to move.
   */
  function cycleOwl() {
    turn('surveillance')
  }

  /**
   * R, in one place: the walk asks the technique for its next order and says
   * what came back. A technique with nothing to cycle — or one that is not the
   * aura being held — answers with nothing, and the key stays inert.
   */
  function turn(kind: HatsuInteractionKind) {
    if (technique?.kind !== kind) return
    let said: TourReport
    if (kind === 'guardian') {
      const mode = nextDoubleMode(world.doubleMode)
      world = { ...world, doubleMode: mode }
      said = { kind: 'double-mode-changed', mode }
    } else if (kind === 'surveillance') {
      const mode = nextOwlMode(world.owlMode)
      world = { ...world, owlMode: mode }
      said = { kind: 'owl-mode-changed', mode }
    } else if (kind === 'scout') {
      const mode = nextEyeMode(world.eyeMode)
      world = { ...world, eyeMode: mode }
      said = { kind: 'eye-mode-changed', mode }
    } else return
    report = said
    show(said)
  }

  /**
   * Handing the ship back is not always free. Silent Majority is a curse that
   * has to find a victim: dismissing it without one turns it on the user, and
   * the archive already has a penalty for that.
   */
  function release() {
    const rebound = Boolean(world.snakes && !world.snakes.fed)
    // Everything the aura was holding is handed back — but the aura itself is
    // still up, and what is held is not a hold. The book is the exception the
    // other way round: it is not something Double Face did to the ship, it is
    // Double Face, so letting go of the ship deals a fresh pair rather than
    // leaving the visitor holding a bookmark with nothing under it.
    world = {
      ...EMPTY_WORLD,
      holding: world.holding,
      book: world.holding === 'bookmark' ? openTheBook() : EMPTY_WORLD.book,
    }
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

  let wasFutureVisible = false
  const unsubFuture = parallelFutureVisible.subscribe((isVisible) => {
    const active = get(activeHatsu)
    if (wasFutureVisible && !isVisible && active?.id === 'parallel-future') {
      const ended: TourReport = { kind: 'vision-ended' }
      report = ended
      show(ended)
    }
    wasFutureVisible = isVisible
  })

  onDestroy(() => {
    unsubFuture()
    setAmbientMuffled(false)
    // Leaving the walk stops the walk's noises. An engine that kept running on
    // the sources page would be the archive talking over itself.
    stopEveryHatsuLoop()
  })

  function castOn(
    spaceId: string | null,
    solidId: string | null = null,
    /** Which key cast: F is the first hand, R the second, C the third. */
    hand: 'first' | 'second' | 'third' = 'first',
  ) {
    if (!technique) return
    const kind = castingKind(hand)
    if (!kind) return
    // An instrument is played rather than cast, and which key was pressed is
    // which piece: the walk carries the choice across and `$lib/tour/hatsu`
    // decides what a room that has heard it looks like afterwards.
    const tune = kind === 'melody' ? AIR_KEYS[hand] : undefined
    // The two hands on the two keys: F puts the sun on, R the moon. Held on a
    // page of the book instead, the technique has only its own key — R is how
    // the other page is cast — so that one alternates, and which hand this press
    // is comes from what the last press of that key left behind.
    const mark = !TWO_HANDED_KINDS.has(kind)
      ? undefined
      : openPages
        ? nextHand[hand === 'third' ? 'first' : hand]
        : hand === 'second'
          ? ('moon' as const)
          : ('sun' as const)
    const result = castInTour(world, kind, {
      ship,
      targetId: spaceId,
      targetSolidId: solidId,
      standingIn: currentSpace?.id ?? null,
      at: position,
      heading,
      mark,
      tune,
    })
    world = result.world
    report = result.report
    show(result.report)
    // The turn is only taken when a hand actually went out: a cast that found
    // nothing to mark has not used one up, and the next press is still the sun.
    if (mark && result.report?.kind === 'marked') {
      nextHand = { ...nextHand, [hand]: otherHand(mark) }
    }
    if (result.travelTo) {
      // Where the aura came down in that room, for the technique that carries
      // the visitor to it rather than merely reaching it.
      const landing = result.world.landed[result.travelTo] ?? null
      goToSpace(ship.spaces.get(result.travelTo)!, landing)
    }
  }

  /**
   * A page of the book, cast at whatever the visitor is aiming at.
   *
   * This is the whole of what the fifth wave bought: the dock still gives the
   * walk exactly one aura, and the book gives it a second to cast with.
   */
  function castPage(kind: HatsuInteractionKind) {
    const result = castInTour(world, kind, {
      ship,
      targetId: aimedAt?.id ?? currentSpace?.id ?? null,
      targetSolidId: aimedSolidAt?.id ?? null,
      standingIn: currentSpace?.id ?? null,
      at: position,
      heading,
    })
    world = spendPage(result.world, kind)
    report = result.report
    show(result.report)
    if (result.travelTo) goToSpace(ship.spaces.get(result.travelTo)!)
  }

  /**
   * What the cast keys do, offered to a visitor working the panel instead of
   * the keyboard: the same cast, at whatever the reticle is on, under the same
   * hand — so the moon goes on off a mouse exactly as it does off R.
   */
  function castHand(hand: 'first' | 'second' | 'third') {
    castOn(aimedAt?.id ?? currentSpace?.id ?? null, aimedSolidAt?.id ?? null, hand)
  }

  /** The ribbon moved to the other page, which swaps what the two keys play. */
  function turnTheRibbon() {
    world = { ...world, book: turnTheBook(world.book) }
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

  /**
   * One mouthful, in every room the fish are loose in.
   *
   * The walk's clock decides when; `fishBite` decides what. A room they have
   * already emptied gives them nothing and says nothing, which is why the
   * read-out goes quiet rather than repeating itself.
   */
  function fishEat() {
    let next = world
    let last: TourReport | null = null
    for (const spaceId of world.devouring) {
      const bite = fishBite(next, ship, spaceId)
      if (!bite) continue
      next = bite.world
      last = bite.report
    }
    if (!last) return
    world = next
    report = last
  }

  /**
   * The sun and the moon closing on each other, on the walk's own clock.
   *
   * Silent until they touch: two things crossing a room are something to watch
   * rather than something to be told about, and the one line the technique has
   * to say is the one it says when neither of them is there any more.
   */
  /**
   * One step of every Guardian Spirit Beast that goes on working after the cast.
   *
   * Four of them do, and they are asked in one call rather than four because
   * they share a clock and because only one of them can be up at a time in
   * practice — the walk hands out one aura. Each answers with a world and a
   * line or with nothing at all, and the last one that had something to say is
   * what the read-out shows: a beast that has finished its room goes quiet
   * rather than repeating itself.
   */
  function beastStep() {
    let next = world
    let last: TourReport | null = null
    for (const step of [gasStep(next, ship), reelStep(next, ship, position), catStep(next, ship)]) {
      if (!step) continue
      next = step.world
      last = step.report
    }
    // The smoke reads the world the others left, since filling a room is not
    // affected by what melted in it — but it must not read a stale one.
    const filling = smokeStep(next)
    if (filling) {
      next = filling.world
      last = filling.report
    }
    if (!last) return
    world = next
    report = last
    show(last)
  }

  /**
   * The coin off Zhang Lei's wheel, taken by having walked into it.
   *
   * The scene says the visitor is standing where it hangs; what that is worth,
   * and what the wheel puts out next, is the pure layer's.
   */
  function takeCoin() {
    const taken = takeTheCoin(world)
    if (!taken) return
    world = taken.world
    report = taken.report
    show(taken.report)
  }

  function polarityWalk(seconds: number, delta: number) {
    const step = polarityStep(world, ship, seconds, delta)
    if (!step) return
    world = step.world
    if (!step.report) return
    report = step.report
    show(step.report)
  }

  /**
   * One hop of the free bird, on the same clock the fish feed on.
   *
   * The read-out says where it went, because a bird that leaves the room you
   * sent it to without saying so is a bird you have lost. It is not sounded:
   * one hoot every few seconds for as long as the technique is up would be the
   * walk talking over itself.
   */
  function owlFlight() {
    const flown = flyTheOwl(world, ship)
    if (!flown) return
    world = flown.world
    report = flown.report
  }

  /**
   * One room further for the insect, while it is scouting.
   *
   * Said and not sounded, for the bird's reason: the walk already has the fly
   * running under it for as long as the sphere is up, and one line a room is
   * what makes the feed in the corner readable as a route rather than as a
   * picture that keeps changing.
   */
  function scoutFlight() {
    const flown = flyTheEye(world, ship)
    if (!flown) return
    world = flown.world
    report = flown.report
  }

  /**
   * One second of the twenty a bird holds for.
   *
   * Silent while it is counting: nineteen lines saying the owl is still there
   * would bury whatever the walk was actually told. It speaks once, when the
   * bird goes and hands its ten seconds over — and the scene plays them back
   * in the corner off the same disappearance.
   */
  function owlSecond() {
    const aged = ageTheOwl(world)
    if (!aged) return
    world = aged.world
    if (!aged.report) return
    report = aged.report
    show(aged.report)
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
    reveal
      ? [
          ...plan.blind
            .reduce((counted, wall) => {
              const reason = french ? wall.seal.reasonFr : wall.seal.reason
              counted.set(reason, (counted.get(reason) ?? 0) + 1)
              return counted
            }, new Map<string, number>())
            .entries(),
        ].sort((a, b) => b[1] - a[1])
      : [],
  )

  const handPlacedDoors = $derived(
    reveal
      ? [
          ...plan.doorways
            .reduce((counted, door) => {
              const declared = ship.doors.find(
                (candidate) =>
                  (candidate.a === door.a && candidate.b === door.b) ||
                  (candidate.a === door.b && candidate.b === door.a),
              )
              if (!declared) return counted
              const reason = french ? declared.reasonFr : declared.reason
              counted.set(reason, (counted.get(reason) ?? 0) + 1)
              return counted
            }, new Map<string, number>())
            .entries(),
        ].sort((a, b) => b[1] - a[1])
      : [],
  )

  /** Standing in the isolated room as an outsider: the copy, not the room. */
  const inEmptyCopy = $derived(
    Boolean(
      world.isolated && !world.isolated.occupant && world.isolated.spaceId === currentSpace?.id,
    ),
  )
</script>

<svelte:window onkeydown={onWindowKeydown} />

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
    <!-- The one room of the reconstruction you sit down in rather than walk
         through, which is the only reason it is a page of its own. -->
    <p class="mt-3">
      <a
        href={$link('/tour/morena')}
        class="text-sm text-[#d94f68] underline underline-offset-2 transition-colors hover:text-[#e8697f]"
      >
        {$t.tour.morena.title} →
      </a>
    </p>
  </header>

  <!-- Full screen is this grid over everything else, not the canvas alone:
       everything in the column has to come with the ship, or it would be a walk
       with no way to change deck, aim a technique or read the plan. -->
  <div
    class="grid {immersive
      ? // Over the archive's own sticky header (80) and under its Nen dock
        // (100), which is the one thing that has to stay reachable above the
        // walk: full screen must not be where the aura cannot be picked up.
        `fixed inset-0 z-[90] h-[100dvh] w-screen overflow-hidden bg-[#050505] ${
          panelOpen ? 'grid-cols-[1fr_min(22rem,50vw)]' : 'grid-cols-1'
        }`
      : 'gap-4 lg:grid-cols-[1fr_320px]'}"
  >
    <!-- The walk -->
    <section
      class="relative overflow-hidden {immersive
        ? 'h-full min-h-0'
        : 'min-h-[420px] rounded-lg border border-[#333] lg:h-[70vh]'}"
    >
      <TourScene
        {ship}
        bind:tierId
        bind:currentSpace
        bind:availableLink
        bind:jumpTo
        bind:jumpAt
        bind:engaged
        bind:touch
        bind:position
        bind:heading
        bind:aimedAt
        bind:aimedSolidAt
        {world}
        {flash}
        auraColour={technique?.color ?? null}
        aiming={Boolean(technique)}
        {selfCastable}
        {reveal}
        onCast={castOn}
        onArrive={arrived}
        onWorm={crossWorm}
        onFish={fishEat}
        onOwl={owlFlight}
        onOwlSecond={owlSecond}
        onScout={scoutFlight}
        onBeast={beastStep}
        onCoin={takeCoin}
        onPolarity={polarityWalk}
        {hands}
        {tunes}
        {twoHanded}
        swings={technique?.kind === 'stitch'}
        {touchUseLabel}
        touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
        soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
        loadingLabel={$t.tour.loading}
        unsupportedLabel={$t.tour.unsupported}
      />

      {#if isAutopilot}
        <div class="pointer-events-auto absolute inset-0 z-50 bg-black"></div>
      {/if}

      <!-- Reticle. It takes the technique's colour while one is up, because it
           has stopped being a crosshair and become where the aura goes. -->
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style:background={technique ? technique.color : 'rgb(255 255 240 / 0.6)'}
        style:box-shadow={technique ? `0 0 10px ${technique.color}` : 'none'}
      ></div>

      <!-- The walk, said out loud. The canvas is one unchanging rectangle to a
           screen reader, and everything needed to describe a room — its size, its
           height, its ways out, what the panels put in it — is in the blueprint
           already. Announced on arrival, and only then: it is polite, so it waits
           for a pause rather than interrupting. -->
      <p class="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>

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

      <!-- Bottom right: the top right of the canvas is the remote eye's feed.

           A solid is a claim about the ship in its own right — the coffin rests
           on ch. 371 whether or not the chamber around it does — so what is
           under the reticle says where it comes from, exactly as the room the
           visitor is standing in does. -->
      {#if technique && !mute}
        <div class="pointer-events-none absolute bottom-3 right-3 max-w-xs text-right">
          <p
            class="inline-block rounded border bg-[#050505]/80 px-2 py-1 text-[11px]"
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
          {#if onSolids && aimedSolidAt}
            <p class="mt-1">
              <span
                class="inline-block rounded border bg-[#050505]/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wider {provenanceClass(
                  aimedSolidAt,
                )}"
              >
                {provenanceLabel(aimedSolidAt)}
              </span>
            </p>
            <p
              class="mt-1 rounded bg-[#050505]/80 px-1.5 py-0.5 text-[11px] leading-snug text-[#FFFFF0]/60"
            >
              {sourceOf(aimedSolidAt) || $t.tour.noSource}
            </p>
          {/if}
        </div>
      {/if}

      <!-- The keys the technique in hand answers to, over the walk itself: the
           panel says the same thing, and the panel is the first thing folded
           away in full screen — which is exactly when a visitor is walking with
           an aura up and nothing to remind them what R does under it. Not on a
           touchscreen, where there are no keys and the casts are the buttons in
           the corner. -->
      {#if controlKeys.length && !touch && !mute}
        <ul
          class="pointer-events-none absolute bottom-3 left-3 space-y-0.5 rounded bg-[#050505]/80 px-2 py-1"
        >
          {#each controlKeys as control (control.key)}
            <li class="flex items-baseline gap-2 text-[11px]">
              <kbd class="shrink-0 font-mono text-[10px]" style:color={technique?.color}>
                {control.click ? `${control.key} / ${$t.tour.hatsu.keys.click}` : control.key}
              </kbd>
              <span class="text-[#FFFFF0]/70">{$t.tour.hatsu.keys.actions[control.action]}</span>
            </li>
          {/each}
        </ul>
      {/if}

      <p
        class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-[#050505]/80 px-3 py-1 text-xs text-[#FFFFF0]/70"
      >
        {#if engaged}
          {$t.tour.engaged}
        {:else if touch}
          {$t.tour.touch.hint}
        {:else}
          {$t.tour.enter}
        {/if}
      </p>

      <!-- On a touchscreen the crossing is a button in the scene, which says the
           same thing without naming a key. -->
      {#if linkPrompt && !touch}
        <p
          class="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded border border-[#FFD700]/50 bg-[#050505]/90 px-3 py-1 text-xs text-[#FFD700]"
        >
          {linkPrompt}
        </p>
      {/if}
    </section>

    <!-- The way back into the panel, once it is folded. Halfway down the right
         edge because the walk has already spoken for the corners: the eye's feed
         is inset top right, the read-outs run along the bottom. -->
    {#if immersive && !panelOpen}
      <button
        type="button"
        onclick={() => (panelOpen = true)}
        aria-expanded="false"
        class="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-l border border-r-0 border-[#333] bg-[#050505]/90 px-2 py-3 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
      >
        {$t.tour.fullscreen.showPanel}
      </button>
    {/if}

    <!-- Deck selector, plan and index -->
    <aside
      class="flex flex-col gap-4 {immersive
        ? `min-h-0 overflow-y-auto border-l border-[#333] p-3 ${panelOpen ? '' : 'hidden'}`
        : ''}"
    >
      <!-- Full screen has two buttons of its own, and they ride at the head of
           the panel rather than over the walk, where the feed and the read-outs
           already are. Sticky, because a way out that scrolls off is not one. -->
      {#if immersive}
        <div class="sticky top-0 z-10 -m-3 mb-0 flex gap-1.5 bg-[#050505] p-3">
          <button
            type="button"
            onclick={() => (panelOpen = false)}
            aria-expanded="true"
            class="rounded border border-[#333] px-2.5 py-1 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
          >
            {$t.tour.fullscreen.hidePanel}
          </button>
          <button
            type="button"
            onclick={toggleFullscreen}
            class="rounded border border-[#FFD700]/50 px-2.5 py-1 text-xs text-[#FFD700] transition-colors hover:bg-[#FFD700]/10"
          >
            {$t.tour.fullscreen.exit}
            <kbd class="ml-1 text-[10px] text-[#FFD700]/70">V</kbd>
          </button>
        </div>
      {/if}

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
        {crossings}
        {crossingLabel}
        currentSpaceId={currentSpace?.id ?? null}
        label={$t.tour.minimap(nameOf(plan.tier))}
        nameOf={(space) => nameOf(named(space))}
        onSelect={selectOnPlan}
        selectLabel={planVerb}
        aiming={Boolean(technique)}
      />

      <!-- What the plan cannot do in 320 pixels, and where a viewpoint is copied -->
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          onclick={() => (planOpen = true)}
          class="rounded border border-[#333] px-2.5 py-1 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
        >
          {$t.tour.plan.open} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">M</kbd>
        </button>
        <button
          type="button"
          onclick={() => (findOpen = true)}
          class="rounded border border-[#333] px-2.5 py-1 text-xs text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
        >
          {$t.tour.find.open} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">⌘K</kbd>
        </button>
        <button
          type="button"
          onclick={() => (reveal = !reveal)}
          aria-pressed={reveal}
          title={$t.tour.reveal.help}
          class="rounded border px-2.5 py-1 text-xs transition-colors {reveal
            ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
            : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
        >
          {$t.tour.reveal.toggle} <kbd class="ml-1 text-[10px] text-[#FFD700]/70">G</kbd>
        </button>
        <button
          type="button"
          onclick={toggleFullscreen}
          aria-pressed={immersive}
          class="rounded border px-2.5 py-1 text-xs transition-colors {immersive
            ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
            : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
        >
          {immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
          <kbd class="ml-1 text-[10px] text-[#FFD700]/70">V</kbd>
        </button>
        <button
          type="button"
          onclick={copyViewpoint}
          class="rounded border px-2.5 py-1 text-xs transition-colors {copied === 'done'
            ? 'border-[#FFD700] text-[#FFD700]'
            : 'border-[#333] text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
        >
          {copied === 'done'
            ? $t.tour.viewpoint.copied
            : copied === 'failed'
              ? $t.tour.viewpoint.failed
              : $t.tour.viewpoint.copy}
        </button>
      </div>

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
          {touch}
          {nameOf}
          {sourceOf}
          onRelease={release}
          onCycleDouble={cycleDouble}
          onCycleOwl={cycleOwl}
          onCycleEye={cycleEye}
          onCastPage={castPage}
          onCastHand={castHand}
          onTurnTheBook={turnTheRibbon}
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
          <p
            class="rounded border border-[#333] px-2.5 py-2 text-xs leading-snug text-[#FFFFF0]/50"
          >
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
                    <span class="flex shrink-0 items-baseline gap-1.5">
                      <span class="truncate text-[9px] text-[#FFFFF0]/40">
                        {nameOf(ship.spaces.get(solid.spaceId) ?? solid)}
                      </span>
                      <span
                        class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {provenanceClass(
                          solid,
                        )}"
                      >
                        {provenanceLabel(solid)}
                      </span>
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
          <dt class="text-[#FFFFF0]">{$t.tour.controls.plan}</dt>
          <dd>{$t.tour.controls.planKeys}</dd>
          <dt class="text-[#FFFFF0]">{$t.tour.controls.find}</dt>
          <dd>{$t.tour.controls.findKeys}</dd>
          <dt class="text-[#FFFFF0]">{$t.tour.controls.reveal}</dt>
          <dd>{$t.tour.controls.revealKeys}</dd>
          <dt class="text-[#FFFFF0]">{$t.tour.controls.fullscreen}</dt>
          <dd>{$t.tour.controls.fullscreenKeys}</dd>
          {#if technique}
            <dt class="text-[#FFFFF0]">{$t.tour.controls.nen}</dt>
            <dd>{$t.tour.controls.nenKeys}</dd>
          {/if}
          {#if hands}
            <dt class="text-[#FFFFF0]">{$t.tour.controls.nenSecond}</dt>
            <dd>{$t.tour.controls.nenSecondKeys(hands.second)}</dd>
          {:else if twoHanded}
            <dt class="text-[#FFFFF0]">{$t.tour.controls.nenMoon}</dt>
            <dd>{$t.tour.controls.nenMoonKeys}</dd>
          {:else if selfCastable}
            <dt class="text-[#FFFFF0]">{$t.tour.controls.nenSelf}</dt>
            <dd>{$t.tour.controls.nenSelfKeys}</dd>
          {/if}
          {#if touch}
            <dt class="text-[#FFFFF0]">{$t.tour.controls.touch}</dt>
            <dd>{$t.tour.controls.touchKeys}</dd>
          {/if}
        </dl>
      </section>

      <!-- How the walk is driven. A first-person camera is not a neutral thing to
           put in front of someone, and none of these has a right answer, so all of
           them are the visitor's — kept in localStorage, because being made to dial
           them in again on every visit is the same as not having them. -->
      <section class="rounded border border-[#333] p-3">
        <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tour.comfort.title}
        </p>
        {#if calm}
          <p class="mb-2 text-xs leading-snug text-[#FFFFF0]/50">{$t.tour.comfort.calm}</p>
        {/if}

        <div class="space-y-2.5 text-xs text-[#FFFFF0]/70">
          <label class="block">
            <span class="flex items-baseline justify-between">
              <span>{$t.tour.comfort.fov}</span>
              <span class="text-[#FFD700]/80">{$t.tour.comfort.degrees($comfort.fov)}</span>
            </span>
            <input
              type="range"
              min={FOV_RANGE[0]}
              max={FOV_RANGE[1]}
              step="1"
              value={$comfort.fov}
              oninput={(event) => setComfort({ fov: Number(event.currentTarget.value) })}
              class="mt-1 w-full accent-[#FFD700]"
            />
          </label>

          <label class="block">
            <span class="flex items-baseline justify-between">
              <span>{$t.tour.comfort.sensitivity}</span>
              <span class="text-[#FFD700]/80">{$t.tour.comfort.times($comfort.sensitivity)}</span>
            </span>
            <input
              type="range"
              min={SENSITIVITY_RANGE[0]}
              max={SENSITIVITY_RANGE[1]}
              step="0.05"
              value={$comfort.sensitivity}
              oninput={(event) => setComfort({ sensitivity: Number(event.currentTarget.value) })}
              class="mt-1 w-full accent-[#FFD700]"
            />
          </label>

          <!-- The one light aboard that is not the ship's: see `nightLight` in
               `$lib/tour/comfort`. Off is a real position on this slider, and the
               label says what off means rather than reading zero. -->
          <label class="block">
            <span class="flex items-baseline justify-between">
              <span>{$t.tour.comfort.nightLight}</span>
              <span class="text-[#FFD700]/80">
                {$comfort.nightLight > 0
                  ? $t.tour.comfort.metres($comfort.nightLight)
                  : $t.tour.comfort.nightLightOff}
              </span>
            </span>
            <input
              type="range"
              min={NIGHT_LIGHT_RANGE[0]}
              max={NIGHT_LIGHT_RANGE[1]}
              step="1"
              value={$comfort.nightLight}
              oninput={(event) => setComfort({ nightLight: Number(event.currentTarget.value) })}
              class="mt-1 w-full accent-[#FFD700]"
            />
          </label>

          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              checked={$comfort.snapTurn}
              onchange={(event) => setComfort({ snapTurn: event.currentTarget.checked })}
              class="accent-[#FFD700]"
            />
            <span>{$t.tour.comfort.snapTurn}</span>
          </label>

          {#if $comfort.snapTurn}
            <label class="block">
              <span class="flex items-baseline justify-between">
                <span>{$t.tour.comfort.snapAngle}</span>
                <span class="text-[#FFD700]/80">
                  {$t.tour.comfort.degrees($comfort.snapAngle)}
                </span>
              </span>
              <input
                type="range"
                min={SNAP_ANGLE_RANGE[0]}
                max={SNAP_ANGLE_RANGE[1]}
                step="5"
                value={$comfort.snapAngle}
                oninput={(event) => setComfort({ snapAngle: Number(event.currentTarget.value) })}
                class="mt-1 w-full accent-[#FFD700]"
              />
            </label>
          {/if}

          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              checked={$comfort.jumpOnly}
              onchange={(event) => setComfort({ jumpOnly: event.currentTarget.checked })}
              class="accent-[#FFD700]"
            />
            <span>{$t.tour.comfort.jumpOnly}</span>
          </label>

          <button
            type="button"
            onclick={resetComfort}
            class="rounded border border-[#333] px-2 py-1 text-[11px] text-[#FFFFF0]/60 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
          >
            {$t.tour.comfort.reset}
          </button>
        </div>
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
          {#if reveal}
            <!-- The two things on this deck the reconstruction authored rather
                 than derived, each with the reason it was declared for. -->
            <li class="border-t border-[#333] pt-1.5">
              <span class="rounded border border-[#ef3340]/70 bg-[#ef3340]/15 px-1 text-[#ef8a90]">
                {$t.tour.reveal.blind}
              </span>
              <span class="ml-1">{$t.tour.reveal.blindHelp}</span>
              <ul class="mt-1 space-y-1 text-[#FFFFF0]/50">
                {#each blindWalls as [reason, count] (reason)}
                  <li>{reason} <span class="text-[#FFFFF0]/35">· {count}</span></li>
                {/each}
                {#if !blindWalls.length}
                  <li class="text-[#FFFFF0]/35">{$t.tour.reveal.none}</li>
                {/if}
              </ul>
            </li>
            <li class="pt-1">
              <span class="rounded border border-[#7095d6]/70 bg-[#7095d6]/15 px-1 text-[#a8c2ea]">
                {$t.tour.reveal.declared}
              </span>
              <span class="ml-1">{$t.tour.reveal.declaredHelp}</span>
              <ul class="mt-1 space-y-1 text-[#FFFFF0]/50">
                {#each handPlacedDoors as [reason, count] (reason)}
                  <li>{reason} <span class="text-[#FFFFF0]/35">· {count}</span></li>
                {/each}
                {#if !handPlacedDoors.length}
                  <li class="text-[#FFFFF0]/35">{$t.tour.reveal.none}</li>
                {/if}
              </ul>
            </li>
          {/if}
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

<!-- The same plan, at a size it can be read at: the legends are drawn in plan
     units, so the drawing that gives four-pixel type in the column gives
     readable type here without a second code path. -->
<dialog
  bind:this={planDialog}
  aria-label={$t.tour.minimap(nameOf(plan.tier))}
  onclose={() => (planOpen = false)}
  onclick={(event) => {
    if (event.target === planDialog) planOpen = false
  }}
  class="mx-auto my-[4vh] h-[92vh] w-[96vw] max-w-none border-0 bg-transparent p-0 backdrop:bg-[#050505]/85"
>
  <div class="flex h-full flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#FFFFF0]/60">
        <span class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tour.plan.legend}
        </span>
        <span><span class="text-[#FFD700]">—</span> {$t.tour.plan.doorway}</span>
        <span><span class="text-[#FFD700]">▲</span> {$t.tour.plan.up}</span>
        <span><span class="text-[#FFD700]">▼</span> {$t.tour.plan.down}</span>
        <span><span class="text-[#FFD700]">◈</span> {$t.tour.plan.across}</span>
      </p>
      <button
        type="button"
        onclick={() => (planOpen = false)}
        class="rounded border border-[#FFD700]/50 px-2.5 py-1 text-xs text-[#FFD700] transition-colors hover:bg-[#FFD700]/10"
      >
        {$t.tour.plan.close}
      </button>
    </div>

    {#if spoken}
      <p class="text-xs leading-snug text-[#FFFFF0]/70">{spoken}</p>
    {/if}

    <div class="min-h-0 flex-1">
      <TourMinimap
        {plan}
        {position}
        {heading}
        {crossings}
        {crossingLabel}
        fill
        currentSpaceId={currentSpace?.id ?? null}
        label={$t.tour.minimap(nameOf(plan.tier))}
        nameOf={(space) => nameOf(named(space))}
        onSelect={(space) => {
          selectOnPlan(space)
          planOpen = false
        }}
        selectLabel={planVerb}
        aiming={Boolean(technique)}
      />
    </div>
  </div>
</dialog>

<TourFinder
  {ship}
  bind:open={findOpen}
  words={naming}
  labels={{
    title: $t.tour.find.title,
    placeholder: $t.tour.find.placeholder,
    showing: $t.tour.find.showing,
    noMatch: $t.tour.find.noMatch,
    action: technique ? $t.tour.hatsu.targets : $t.tour.jumpTo,
    level: $t.tour.find.level,
    close: $t.tour.find.close,
    hint: $t.tour.find.hint,
  }}
  provenanceLabel={(provenance) => $t.tour.provenance[provenance]}
  provenanceClass={(provenance) => PROVENANCE_CLASS[provenance]}
  onPick={(spaceId) => {
    const space = ship.spaces.get(spaceId)
    if (!space) return
    // The finder reaches the whole ship, and so does a technique: with an aura up
    // it aims rather than travels, like the index and the plan.
    if (technique) castOn(space.id)
    else goToSpace(space)
  }}
/>

<style>
  /* What full screen takes away, and what it keeps. The header and the footer
     belong to the archive rather than to the ship, and the walk is the whole
     screen or it is not full screen. The Nen dock is left standing: it is the
     one control the walk cannot supply for itself, since the aura is picked up
     outside the route. */
  :global(html.tour-immersive .app-header),
  :global(html.tour-immersive .app-footer) {
    display: none;
  }

  /* And the route's entry animation stands down with them — not for the motion,
     which is over in half a second, but because it is filled `both` and leaves a
     `transform` on the shell for good. A transformed ancestor is the containing
     block for everything fixed inside it, so `inset: 0` would measure the route
     rather than the screen: the walk would start under the header and run off
     the bottom of the window, taking the read-outs with it. `animation: none`
     is what lifts it — a plain `transform: none` loses to a running fill. */
  :global(html.tour-immersive .route-shell) {
    animation: none;
  }

  /* Nothing scrolls behind the walk. */
  :global(html.tour-immersive body) {
    overflow: hidden;
  }
</style>
