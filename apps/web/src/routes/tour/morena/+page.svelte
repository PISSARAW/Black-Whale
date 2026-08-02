<script lang="ts">
  import { ModeNenState } from '$lib/nen/modeState.svelte'
  /**
   * Morena's game: the one room of the walk you sit down in.
   *
   * The walk is a walk, and this is the exception the ship earns — ch. 407-410
   * is two people at a table and twelve cards, and there is nothing to see in it
   * that walking past would show you. So the same engine draws the same deck
   * from the same blueprint, the visitor is put in the chair the chapters put
   * Borksen in, and the legs stop answering.
   *
   * The rules live in `$lib/tour/morena` and are pure: this route holds a game
   * and hands it to two consumers — the DOM, which is where the cards are
   * legible, and `TourScene`, which lays the same cards on the table in front
   * of you. Nothing about the negotiation is decided here.
   *
   * The technique the visitor sits down with is the one they are already
   * carrying in the site-wide Nen dock, exactly as in `/tour`: there is no
   * second roster to keep in step, and picking an aura up before walking in
   * here is the whole gesture.
   */
  import { onDestroy } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import MorenaPiles from '$lib/components/tour/MorenaPiles.svelte'
  import MorenaSetupPanel from '$lib/components/tour/MorenaSetupPanel.svelte'
  import MorenaSceneOverlay from '$lib/components/tour/MorenaSceneOverlay.svelte'
  import MorenaGameStatus from '$lib/components/tour/MorenaGameStatus.svelte'
  import MorenaPhaseActions from '$lib/components/tour/MorenaPhaseActions.svelte'
  import MorenaVerdictPanel from '$lib/components/tour/MorenaVerdictPanel.svelte'
  import MorenaHatsuSeats from '$lib/components/tour/MorenaHatsuSeats.svelte'
  import MorenaTranscript from '$lib/components/tour/MorenaTranscript.svelte'
  import ContagionDashboard from '$lib/nen/ContagionDashboard.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { get } from 'svelte/store'
  import {
    EMPEROR_TIME_LIFE_LIMIT_HOURS,
    activeHatsu,
    closeHatsuGate,
    emperorTimeLifeHours,
    openHatsuGate,
    spendEmperorTimeHours,
  } from '$lib/nen/hatsuState'
  import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
  import { floorOf, theShip } from '$lib/tour/blueprint'
  import { Fullscreen } from '$lib/tour/fullscreen.svelte'
  import {
    DEALER_AT,
    GUEST_AT,
    HIDEOUT_OFFICE,
    HIDEOUT_TIER,
    SEATED_EYE,
    dealTheGame,
    eyeFeed,
    leaveTheTable,
    livePages,
    moveFor,
    REWIND_BLUE,
    openTheBookHere,
    owlFilm,
    playTechnique,
    sheWillNotPlay,
    sitsAtTheTable,
    spentOn,
    theEyesTakeYou,
    castsItself,
    tableauOf,
    worksAtTheTable,
    type AnswerCard,
    type MorenaGame,
    type TableKind,
  } from '$lib/tour/morena'
  import { gesturesAt, playGesture, type TableGesture } from '$lib/tour/morenaHands'

  const ship = theShip()
  const modeNen = new ModeNenState()
  const french = $derived($locale === 'fr')
  const copy = $derived($t.tour.morena)

  const office = ship.spaces.get(HIDEOUT_OFFICE)!
  const hideout = ship.plans.get(HIDEOUT_TIER)!
  /** Every `y` in the walk is metres above the keel, and the table's is this. */
  const floor = floorOf(office, hideout.tier)

  /**
   * Which way the chair faces.
   *
   * A camera at yaw looks along `(-sin, -cos)`, so facing the dealer across a
   * table laid out along `z` is a matter of which side of her the guest sits:
   * she is at the lower `z`, so the guest looks along `-z`, which is yaw zero.
   */
  const facing = Math.atan2(-(DEALER_AT[0] - GUEST_AT[0]), -(DEALER_AT[1] - GUEST_AT[1]))

  /** The menu, the rules, or the table. The scene is under all three. */
  let view = $state<'menu' | 'rules' | 'table'>('menu')
  /** Whether Morena is dealing the hand she actually deals. */
  let cheats = $state(true)
  let game = $state<MorenaGame>(dealTheGame())
  /** What a Back or a Joker is being pointed at, while it is being pointed. */
  let choice = $state<AnswerCard | null>(null)

  let tierId = $state(HIDEOUT_TIER)

  // ── The table at the size of the screen ────────
  /**
   * Full screen here is the same bargain the walk makes, for the opposite
   * reason: on the walk the panel is what you steer with, and at the table it
   * is where the cards are legible. So the screen takes both — the room on the
   * left, the hand on the right — and the hand folds away when you want to look
   * across the table at her instead. It is the one page of the archive where
   * the panel, not the scene, is the thing you came for; it is also the one
   * that is a game, and a game is played at the size of the screen.
   */
  const screen = new Fullscreen()
  const immersive = $derived(screen.immersive)
  let panelOpen = $state(true)
  /**
   * Whether the table has the pointer.
   *
   * Looking around the room takes the mouse, and the cards are played with it —
   * so at this table, unlike on the walk, giving the pointer back is a move in
   * the game and not an aside. Tab is the scene's own way of handing it back;
   * the hint below says so, because Esc would take the screen with it.
   */
  let engaged = $state(false)

  $effect(() => screen.watch())

  const toggleFullscreen = () => void screen.toggle()

  /**
   * V gives the table the screen, and Esc gives it back — but only where
   * nothing else has a claim on Esc: in native full screen the browser answers
   * it first, an engaged pointer answers it with "let go of my mouse", and
   * either way a keystroke aimed at a radio or a field is not aimed at us.
   */
  function onWindowKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const key = event.key.toLowerCase()
    if (key !== 'v' && key !== 'escape') return
    if (key === 'escape' && !(immersive && !screen.native && !engaged)) return
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('input, textarea, select') !== null)
    ) {
      return
    }
    event.preventDefault()
    toggleFullscreen()
  }

  // Leaving the table leaves full screen with it.
  onDestroy(() => screen.leave())

  /**
   * The seat.
   *
   * Held rather than derived so it is one object for the whole visit: the scene
   * sits the visitor down whenever this changes identity, and a chair that was
   * rebuilt every render would put them back in it on every keystroke.
   */
  const seat = { at: GUEST_AT, heading: facing, eye: SEATED_EYE }

  const table = $derived(tableauOf(game, floor))
  /**
   * What Little Eye is sending back, or nothing if there is no eye here.
   *
   * The insect was in the room from the first commit and the picture it was
   * taking was not: the descent onto her fan read as a fly landing. The walk
   * has always inset the feed in the corner when the sphere is sent into a room
   * — this is the same inset, a metre away instead of a deck.
   */
  const feed = $derived(eyeFeed(game, floor))
  /**
   * And what the owl already filmed, which is the other corner.
   *
   * Two techniques read her hand from a camera and they are not the same
   * gesture: Little Eye is flown in and watched live, Secret Window was stuck
   * to the bulkhead before anyone sat down and is *reviewed*. So one is a feed
   * in the top corner and the other is a recording in the bottom one — the same
   * two corners the walk has always used for the same two things.
   */
  const record = $derived(owlFilm(game, floor))
  /** Her fan as that recording has it, which is not her fan as it is now. */
  /**
   * The colour the room is standing in, and why.
   *
   * One technique changes the light rather than the table: while Morena still
   * owes the ten seconds back, everybody in this room but the guest is living
   * a stretch that has already been decided, and the room says so by not being
   * its own colour. `null` the moment she is choosing again.
   */
  const tint = $derived(game.forced.length ? REWIND_BLUE : null)
  /** Which quatrain the beast wrote, or nothing while it has written none. */

  const nameOfCard = (card: AnswerCard) => copy.cards[card].name

  /**
   * The aura in hand, as the table sees it.
   *
   * Two questions, and they are different ones: what the dock is holding, and
   * whether that has anything to say to twelve cards. Most techniques do not —
   * a punch is a punch and this is a card game — and saying so plainly is part
   * of what the page is for.
   */
  const carried = $derived($activeHatsu)
  const tableKind = $derived(worksAtTheTable(carried?.kind) ? carried!.kind : null)
  /**
   * Whether what the dock is holding is the ribbon rather than a technique.
   *
   * Double Face is the one thing in the roster with no seat of its own and a
   * great deal to say here anyway: it is not a move, it is *two other people's
   * moves*, and which two is the only question it asks. So it is admitted to
   * the table beside `worksAtTheTable`, and what it brings is a pair.
   */
  const carryingTheBook = $derived(carried?.kind === 'bookmark')

  /**
   * The technique's own published name, in the reader's language.
   *
   * Off the registry rather than out of the message file: the ability already
   * has a name everywhere else on the site, and a second one here would be a
   * second thing to keep true.
   */
  const nameOfTechnique = (kind: TableKind) =>
    localizeHatsu(
      HATSU_PROFILES.find((profile) => profile.id === moveFor(kind).hatsuId)!,
      $locale,
    ).name

  /**
   * What is live in front of the guest: one technique, or the book's two.
   *
   * Everything the panel says about an aura is said once per seat rather than
   * once per game — the effect it buys, what it risks, how much of it is left —
   * because a book with two pages open has two of every one of those, and they
   * are not the same numbers. `livePages` is the rules' own answer to what can
   * be played; this only dresses it.
   */
  const seats = $derived(
    livePages(game).map((seat) => {
      const move = moveFor(seat.kind)
      return {
        ...seat,
        move,
        name: nameOfTechnique(seat.kind),
        usedUp: seat.spent >= move.uses,
        unbidden: castsItself(seat.kind),
      }
    }),
  )
  /**
   * The seats a key can play, in the order the keys play them.
   *
   * Not every live technique is one you press for. Lovely Ghostwriter writes by
   * itself the moment Morena reaches into your hand — that is what automatic
   * writing *is* — so it has a panel of its own and no key, and the book's
   * other page keeps the one it would otherwise have shared.
   */
  const keyed = $derived(seats.filter((seat) => !seat.unbidden))
  /** The two names the two keys play, when there are two. `null` otherwise. */
  const hands = $derived(
    keyed.length === 2 ? { first: keyed[0].name, second: keyed[1].name } : null,
  )

  function deal() {
    // The book is opened at the table rather than carried open: which two of
    // Chrollo's pages are live at any moment is exactly the sort of thing no
    // record of the Black Whale settles, so it is a roll, and it is rolled
    // again every deal.
    const pages = carryingTheBook ? openTheBookHere() : null
    game = dealTheGame({
      marked: cheats ? 'back' : null,
      technique: pages ? pages[0] : tableKind,
      bookmark: pages ? pages[1] : null,
    })
    choice = null
    view = 'table'
  }

  /**
   * Play a page, which for everybody but Chrollo is *the* page.
   *
   * F is the first and R is the second, the same two keys the walk gives the
   * book — and the scene reports which was pressed without knowing what it
   * means, so this is where the ribbon is read.
   */
  function cast(
    _spaceId?: string | null,
    _solidId?: string | null,
    hand?: 'first' | 'second' | 'third',
  ) {
    const seat = keyed[hand === 'second' ? 1 : 0]
    if (!seat || seat.usedUp) return
    game = playTechnique(game, { page: seat.page })
  }

  function walkOut() {
    game = leaveTheTable(game)
  }

  // ── The same game, played with the hands ───────
  /**
   * The card the visitor is looking at, and what taking it would do.
   *
   * The panel is a complete way to play this game and stays one: there is a
   * button for every move, and a reader who never touches the room can play a
   * whole hand with them. This is the other pair of hands — the cards are lying
   * on a table a metre away, and pointing at one and clicking is the move it
   * already is. Nothing here is a rule; `morenaHands` says which card is which
   * gesture, and the reducer in the ability module plays it.
   */
  let aimedExtra = $state<string | null>(null)
  const pointedAt = $derived<TableGesture | null>(
    aimedExtra ? (gesturesAt(game)[aimedExtra] ?? null) : null,
  )

  /** What the room says the pointed card would do, in the reader's language. */
  const pointedLabel = $derived.by(() => {
    const gesture = pointedAt
    if (!gesture) return null
    if (gesture.kind === 'ask') return copy.reach.ask(copy.questions[gesture.question].title)
    if (gesture.kind === 'kiss') return copy.reach.kiss(nameOfCard(gesture.card))
    if (gesture.kind === 'decline') return copy.reach.decline
    if (gesture.kind === 'point') return copy.reach.point(nameOfCard(gesture.side))
    if (gesture.kind === 'reach') return copy.reach.reachFor(nameOfCard(gesture.card))
    return copy.reach.play(nameOfCard(gesture.card))
  })

  /**
   * Take hold of a card.
   *
   * The gesture is looked up again rather than read off `pointedAt`: a click is
   * a frame or two behind the ray that found the card, and the only honest
   * answer to "what does this card do" is the one the game gives at the moment
   * the hand closes on it. A card that stopped being a move in between is not
   * one, and the reducer would refuse it in any case.
   */
  function takeHold(id: string) {
    const gesture = gesturesAt(game)[id]
    if (!gesture) return
    game = playGesture(game, gesture)
    // The panel's half-made choice is spent or void either way: the hand was
    // settled by hand, or it moved on to a phase that has no use for it.
    choice = null
  }

  /**
   * Whether anything is live, which is what F answers to.
   *
   * The same keys as the walk, for the same reason: the aura is in the
   * visitor's hand and the room is where it is played. One seat is one key, and
   * F is it; the book is the only thing here that fills the second, which is
   * where R goes — a page, exactly as on the walk. C stays unspent: nothing at
   * this table is an instrument with three airs.
   */
  const castable = $derived(
    view === 'table' && game.phase !== 'over' && keyed.some((seat) => !seat.usedUp),
  )

  // Nothing is pointed at from the menu, and a card left lifted by a hand that
  // ended would be a card waiting to be played in a game that is over.
  $effect(() => {
    if (view !== 'table') aimedExtra = null
  })

  // ── Emperor Time, which is the only seat with a clock ──
  /**
   * How much life a second at this table costs, in hours.
   *
   * The walk spends an hour a second, which is the ability's own rate and the
   * right one for somebody crossing rooms. A negotiation is not crossing a
   * room: Kurapika's eyes are open for the whole of it, and the canon price of
   * that is the thing this seat exists to say — a hand of seven questions is
   * paid for in years, not in afternoons. So the table runs the same clock at
   * two days a second, which is what makes the bill arrive inside a hand
   * rather than inside an evening.
   *
   * The counter itself is the site's, not the table's: it is the visitor's own
   * year, they may have spent some of it walking the ship, and a page that kept
   * its own would let them spend it twice.
   */
  const LIFE_PER_SECOND = 48
  /**
   * When she stands up: a third of the year, gone in front of her.
   *
   * She is a recruiter, and what she is watching is the thing she recruits
   * being used up. This is the number at which the candidate stops being worth
   * the hand — not a punishment, a decision, and the only end to this game that
   * neither player had to earn.
   */
  const SHE_STANDS_AT = Math.round(EMPEROR_TIME_LIFE_LIMIT_HOURS / 3)

  /** Whether the eyes are open at this table, which is what starts the clock. */
  const burning = $derived(
    view === 'table' && game.phase !== 'over' && spentOn(game, 'scarlet') !== null,
  )
  /** How far through the year the visitor is, from nothing to all of it. */
  const scorch = $derived(Math.min(1, $emperorTimeLifeHours / EMPEROR_TIME_LIFE_LIMIT_HOURS))

  $effect(() => {
    if (!burning) return
    const clock = setInterval(() => {
      // Two things can end the hand here and they are different deaths: the
      // year running out is the ability collecting, and her standing up is the
      // candidate having become worthless. The first is checked first because
      // a corpse has nothing left for anybody to decline.
      if (spendEmperorTimeHours(LIFE_PER_SECOND)) game = theEyesTakeYou(game)
      else if (get(emperorTimeLifeHours) >= SHE_STANDS_AT) game = sheWillNotPlay(game)
    }, 1000)
    return () => clearInterval(clock)
  })

  /**
   * The dock, while a hand is live.
   *
   * Sitting down is a commitment, and the menu is where it is made: it names
   * what you are carrying and says plainly whether it has a seat. Once the
   * cards are dealt, going shopping is not one of the moves — so the dock
   * stops offering the seventy techniques that would do nothing here, and says
   * why. The one already in hand is untouched: walking into a room does not
   * take an aura off anybody, it only stops them picking up a new one.
   *
   * The gate is lifted the moment the hand is over, so reading the verdict and
   * choosing a different technique for the next deal is one gesture again.
   */
  $effect(() => {
    if (view !== 'table' || game.phase === 'over') {
      closeHatsuGate()
      return
    }
    openHatsuGate({ admits: sitsAtTheTable, reason: copy.hatsu.sealed })
    return closeHatsuGate
  })

  /** What Morena said to the last question asked, for the panel's read-out. */
  const lastAsked = $derived(game.asked.length ? game.asked[game.asked.length - 1] : null)
</script>

<Seo
  title={copy.seoTitle}
  description={copy.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
    { name: copy.breadcrumb, path: $link('/tour/morena') },
  ])}
/>

<svelte:window onkeydown={onWindowKeydown} />

<div class="mx-auto max-w-[1600px] px-4 py-8" data-hatsu-pass>
  <header class="mb-6">
    <p class="text-xs uppercase tracking-widest text-[#FFD700]/70">
      <a class="hover:text-[#FFD700]" href={$link('/tour')}>{$t.nav.virtualTour}</a>
      <span class="px-1 text-[#FFFFF0]/30">/</span>
      {copy.breadcrumb}
    </p>
    <h1 class="mt-2 text-3xl font-bold tracking-tight text-[#FFFFF0] sm:text-4xl">{copy.title}</h1>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-[#FFFFF0]/70">{copy.intro}</p>
  </header>

  <!-- Full screen is this grid over everything else rather than the canvas
       alone: a table with no hand beside it is a room with a chair in it, and
       the game would be somewhere behind the screen it just took. -->
  <div
    class="grid {immersive
      ? // Over the archive's own sticky header (80) and under its Nen dock
        // (100): the aura is picked up outside the route, and full screen must
        // not be where it cannot be reached.
        `fixed inset-0 z-[90] h-[100dvh] w-screen overflow-hidden bg-[#0b0b0d] ${
          panelOpen ? 'grid-cols-[1fr_min(26rem,55vw)]' : 'grid-cols-1'
        }`
      : 'gap-4 lg:grid-cols-[1fr_380px]'}"
  >
    <!-- The room, drawn by the walk's own engine off the walk's own blueprint. -->
    <section
      class="relative overflow-hidden {immersive
        ? 'h-full min-h-0'
        : 'min-h-[420px] rounded-lg border border-[#333] lg:h-[70vh]'}"
    >
      <TourScene
        {ship}
        bind:tierId
        bind:engaged
        seated={seat}
        extras={table}
        {feed}
        {record}
        {tint}
        {hands}
        bind:aimedExtra
        onPick={view === 'table' ? takeHold : undefined}
        aiming={castable}
        onCast={cast}
        onHatsu={cast}
        nen={modeNen.value}
        onNenChange={modeNen.use}
        auraColour={carried?.color ?? null}
        castOnClick={false}
        touchLabels={{
          move: $t.tour.touch.move,
          cast: keyed.length === 1 ? copy.hatsu.effects[keyed[0].move.effect] : $t.tour.touch.cast,
        }}
        soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
        loadingLabel={copy.loading}
        unsupportedLabel={copy.unsupported}
      />

      <!-- Emperor Time, which is the one seat you look through rather than at.
           The room goes scarlet the way the eyes do, and it goes further with
           every second the visitor sits there: what is being spent is not a
           resource, it is the year, and the only honest way to draw that is to
           put it over everything. The number is said as well as shown — a tint
           is a feeling and a year is a quantity, and this ability is the one
           whose whole argument is the quantity. -->
      <!-- The table, played with the hands.
           A reticle only while the pointer is held — with a cursor on the glass
           there is already a thing pointing at the card, and two would be one
           too many — and, above it, what the card under it would do. The line is
           the whole of the interface: it is the only thing that says a hand of
           cards a metre away is something you may reach for. -->
      <MorenaSceneOverlay
        tierName={french ? hideout.tier.nameFr : hideout.tier.name}
        officeName={french ? office.nameFr : office.name}
        {engaged}
        tableActive={view === 'table'}
        scarletActive={spentOn(game, 'scarlet') !== null}
        {scorch}
        {pointedLabel}
        phaseOver={game.phase === 'over'}
        {castable}
        castHints={keyed.map((seat) => ({
          id: seat.page,
          effect: copy.hatsu.effects[seat.move.effect],
          usedUp: seat.usedUp,
        }))}
        auraColor={carried?.color ?? null}
        {immersive}
        onFullscreen={toggleFullscreen}
      />
    </section>

    <!-- The hand, once it is folded away: the table is still there to be looked
         at, and the cards are one press from coming back. -->
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

    <!-- The game, where the cards are legible. -->
    <section
      class="flex flex-col overflow-y-auto border-[#333] bg-[#0b0b0d] p-4 {immersive
        ? `min-h-0 border-l ${panelOpen ? '' : 'hidden'}`
        : 'max-h-[70vh] rounded-lg border'}"
    >
      <!-- Folding the hand away is offered only where it buys something: full
           screen, where what it uncovers is the table itself. -->
      {#if immersive}
        <div class="sticky top-0 z-10 -m-4 mb-0 flex gap-1.5 bg-[#0b0b0d] p-4 pb-3">
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

      {#if view === 'menu'}
        <MorenaSetupPanel mode="menu" bind:cheats {carried} onDeal={deal} onRules={() => (view = 'rules')} onBack={() => (view = 'menu')} />
      {:else if view === 'rules'}
        <MorenaSetupPanel mode="rules" bind:cheats {carried} onDeal={deal} onRules={() => (view = 'rules')} onBack={() => (view = 'menu')} />
      {:else}
        <MorenaGameStatus {game} {nameOfCard} />

        <!-- The room, ten seconds behind itself. Said while it is true and not
             a word afterwards: what the reader can see is that the light is
             wrong, and this is the sentence that names why. -->
        <!-- The quatrain, once the beast has written it. Printed as a poem and
             not as a read-out: the technique is cryptic verse, and a line
             saying "she marked the Back" would be the page playing the game
             for the reader. Kept for the rest of the hand, and after it — a
             prophecy that came true is still what was written. -->
        <!-- The owl's recording, which is the one thing at this table that does
             not go out of date because it is already out of date: seven cards
             as a bird on the bulkhead had them at the moment somebody thought
             to look. The ones spent since are still in it — that is what a
             recording is — and the corner of the room is showing the same
             footage as a picture. -->
        {#if lastAsked}
          <div class="mt-3 rounded border border-[#3a2b33] bg-[#140f13] p-3">
            <p class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
              {copy.askedLabel}
            </p>
            <p class="text-sm font-semibold text-[#FFFFF0]">{copy.questions[lastAsked].title}</p>
            <p class="mt-2 text-[10px] uppercase tracking-widest text-[#d94f68]/80">
              {copy.answerLabel}
            </p>
            <p class="mt-1 text-sm italic leading-relaxed text-[#FFFFF0]/80">
              {copy.questions[lastAsked].morena}
            </p>
          </div>
        {/if}

        {#if game.phase === 'deal'}
          <MorenaPhaseActions bind:game bind:choice {nameOfCard} />
        {:else if game.phase === 'asking'}
          <MorenaPhaseActions bind:game bind:choice {nameOfCard} />
        {:else if game.phase === 'settling'}
          <MorenaPhaseActions bind:game bind:choice {nameOfCard} />
        {:else if game.verdict}
          <MorenaVerdictPanel {game} onAgain={deal} onLeave={() => (view = 'menu')} />
        {/if}

        <MorenaHatsuSeats
          {game}
          {seats}
          {keyed}
          auraColor={carried?.color ?? null}
          onCast={(hand) => cast(null, null, hand)}
        />

        <!-- Walking out. Canon puts it under the same sanction as cheating, so
             it is offered as a move rather than as a way out. -->
        {#if game.phase !== 'over'}
          <div class="mt-4 border-t border-[#222] pt-3">
            <p class="text-[11px] leading-snug text-[#FFFFF0]/45">{copy.hatsu.leaveWarning}</p>
            <p class="mt-2 text-[11px] text-[#FFFFF0]/40">
              {game.watch > 0 ? copy.hatsu.watching : copy.hatsu.unwatched}
            </p>
            <button
              class="mt-2 rounded border border-[#444] px-3 py-1.5 text-xs text-[#FFFFF0]/80 hover:border-[#ef3340] hover:text-[#ef8a90]"
              onclick={walkOut}
            >
              {copy.hatsu.leave}
            </button>
          </div>
        {/if}

        <!-- What is on the table, in the same three piles the scene lays out —
             and as cards, because that is how the chapters show them. -->
        <div class="mt-5 border-t border-[#222] pt-4">
          <MorenaPiles {game} {copy} />
        </div>

        <!-- Contagion, read rather than cast: the network, the negotiation and
             the frieze of what was played under an aura to get there. The
             ability module has declared this component key since it was
             written; `$lib/nen/abilityComponents` is what finally resolves it. -->
        <div class="mt-5">
          <ContagionDashboard {game} />
        </div>

        <MorenaTranscript {game} {nameOfCard} />
      {/if}
    </section>
  </div>
</div>
