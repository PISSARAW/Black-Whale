<script lang="ts">
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
  import ContagionDashboard from '$lib/nen/ContagionDashboard.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { activeHatsu, closeHatsuGate, openHatsuGate } from '$lib/nen/hatsuState'
  import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
  import { floorOf, theShip } from '$lib/tour/blueprint'
  import { Fullscreen } from '$lib/tour/fullscreen.svelte'
  import {
    ANSWER_CARDS,
    DEALER_AT,
    GUEST_AT,
    HIDEOUT_OFFICE,
    HIDEOUT_TIER,
    QUESTION_CARDS,
    SEATED_EYE,
    askMorena,
    dealTheGame,
    infectionAfter,
    lastCard,
    leaveTheTable,
    exposureNow,
    moveFor,
    needsAChoice,
    playTechnique,
    refuseTheDeal,
    settle,
    tableauOf,
    takeTheDeal,
    worksAtTheTable,
    type AnswerCard,
    type MorenaGame,
    type QuestionCard,
  } from '$lib/tour/morena'

  const ship = theShip()
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

  $effect(() => screen.watch())

  const toggleFullscreen = () => void screen.toggle()

  /**
   * V gives the table the screen, and Esc gives it back — but only where
   * nothing else has a claim on Esc: in native full screen the browser answers
   * it first, and either way a keystroke aimed at a radio or a field is not
   * aimed at us.
   */
  function onWindowKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const key = event.key.toLowerCase()
    if (key !== 'v' && key !== 'escape') return
    if (key === 'escape' && !(immersive && !screen.native)) return
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

  const nameOfCard = (card: AnswerCard) => copy.cards[card].name
  const questionsLeft = $derived(game.questions)
  const answersLeft = $derived(game.hand.length)

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
  const move = $derived(tableKind ? moveFor(tableKind) : null)
  /**
   * The technique's own published name, in the reader's language.
   *
   * Off the registry rather than out of the message file: the ability already
   * has a name everywhere else on the site, and a second one here would be a
   * second thing to keep true.
   */
  const techniqueName = $derived(
    game.technique
      ? localizeHatsu(
          HATSU_PROFILES.find((profile) => profile.id === moveFor(game.technique!).hatsuId)!,
          $locale,
        ).name
      : null,
  )
  const seated = $derived(game.technique ? moveFor(game.technique) : null)
  const usedUp = $derived(Boolean(seated) && game.spent >= seated!.uses)

  function deal() {
    game = dealTheGame({ marked: cheats ? 'back' : null, technique: tableKind })
    choice = null
    view = 'table'
  }

  function ask(question: QuestionCard) {
    game = askMorena(game, question)
  }

  function cast() {
    game = playTechnique(game)
  }

  function walkOut() {
    game = leaveTheTable(game)
  }

  function play() {
    const needed = needsAChoice(game)
    if (needed && !choice) return
    game = settle(game, choice ?? undefined)
    choice = null
  }

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
    openHatsuGate({ admits: worksAtTheTable, reason: copy.hatsu.sealed })
    return closeHatsuGate
  })

  /** What Morena said to the last question asked, for the panel's read-out. */
  const lastAsked = $derived(game.asked.length ? game.asked[game.asked.length - 1] : null)
  const settlement = $derived(needsAChoice(game))
  const conditions = $derived(infectionAfter(game))
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
        seated={seat}
        extras={table}
        touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
        soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
        loadingLabel={copy.loading}
        unsupportedLabel={copy.unsupported}
      />

      <div class="pointer-events-none absolute left-3 top-3 max-w-sm">
        <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {french ? hideout.tier.nameFr : hideout.tier.name}
        </p>
        <p class="text-lg font-semibold leading-tight text-[#FFFFF0]">
          {french ? office.nameFr : office.name}
        </p>
        <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">{copy.seat}</p>
      </div>

      <!-- The way in and out of the screen. Top right of the room, because the
           left corner already names the deck and the office. -->
      <button
        type="button"
        onclick={toggleFullscreen}
        aria-pressed={immersive}
        class="absolute right-3 top-3 z-20 rounded border px-2.5 py-1 text-xs transition-colors {immersive
          ? 'border-[#FFD700] bg-[#050505]/80 text-[#FFD700]'
          : 'border-[#333] bg-[#050505]/80 text-[#FFFFF0]/70 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]'}"
      >
        {immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
        <kbd class="ml-1 text-[10px] text-[#FFD700]/70">V</kbd>
      </button>
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
        <h2 class="text-lg font-semibold text-[#FFFFF0]">{copy.menu.deck}</h2>

        <div class="mt-4 space-y-3">
          <label
            class="flex cursor-pointer gap-3 rounded border border-[#333] p-3 hover:border-[#d94f68]"
          >
            <input type="radio" class="mt-1" bind:group={cheats} value={true} />
            <span>
              <span class="block text-sm font-semibold text-[#FFFFF0]">{copy.menu.marked}</span>
              <span class="mt-1 block text-xs leading-snug text-[#FFFFF0]/60">
                {copy.menu.markedNote}
              </span>
            </span>
          </label>
          <label
            class="flex cursor-pointer gap-3 rounded border border-[#333] p-3 hover:border-[#d94f68]"
          >
            <input type="radio" class="mt-1" bind:group={cheats} value={false} />
            <span>
              <span class="block text-sm font-semibold text-[#FFFFF0]">{copy.menu.clean}</span>
              <span class="mt-1 block text-xs leading-snug text-[#FFFFF0]/60">
                {copy.menu.cleanNote}
              </span>
            </span>
          </label>
        </div>

        <!-- What you are carrying as you sit down. Read off the site-wide dock,
             so the gesture is the same one the walk asks for. -->
        <h3 class="mt-6 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {copy.hatsu.title}
        </h3>
        {#if tableKind && move}
          <div class="mt-2 rounded border border-[#333] p-3" style:border-color={carried?.color}>
            <p class="text-sm font-semibold" style:color={carried?.color}>
              {localizeHatsu(carried!, $locale).name}
            </p>
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/70">
              <span class="text-[#FFFFF0]/40">{copy.hatsu.buys} — </span>
              {copy.hatsu.techniques[tableKind].buys}
            </p>
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">
              <span class="text-[#FFFFF0]/40">{copy.hatsu.costs} — </span>
              {copy.hatsu.techniques[tableKind].costs}
            </p>
          </div>
        {:else if carried}
          <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/50">
            {copy.hatsu.useless(localizeHatsu(carried, $locale).name)}
          </p>
        {:else}
          <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/50">{copy.hatsu.none}</p>
        {/if}

        <div class="mt-5 flex flex-wrap gap-2">
          <button
            class="rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-[#e8697f]"
            onclick={deal}
          >
            {copy.menu.play}
          </button>
          <button
            class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
            onclick={() => (view = 'rules')}
          >
            {copy.menu.rules}
          </button>
        </div>

        <p class="mt-6 text-xs leading-snug text-[#FFFFF0]/50">{copy.source}</p>
        <a
          class="mt-3 text-xs text-[#FFD700]/80 underline hover:text-[#FFD700]"
          href="{$link('/tour')}?space={HIDEOUT_OFFICE}"
        >
          {copy.menu.walk}
        </a>
      {:else if view === 'rules'}
        <h2 class="text-lg font-semibold text-[#FFFFF0]">{copy.rules.title}</h2>
        <ol class="mt-3 space-y-3">
          {#each copy.rules.lines as line, i (i)}
            <li class="flex gap-3 text-sm leading-relaxed text-[#FFFFF0]/75">
              <span class="text-[#d94f68]">{i + 1}</span>
              <span>{line}</span>
            </li>
          {/each}
        </ol>
        <div class="mt-5">
          <button
            class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
            onclick={() => (view = 'menu')}
          >
            {copy.menu.back}
          </button>
        </div>
      {:else}
        <!-- The hand, laid out the way the table is: her side, the middle, yours.
             The round counter goes when the hand does: a table that is still
             counting rounds is a table you are still sat at. -->
        {#if game.phase !== 'over'}
          <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70" aria-live="polite">
            {copy.round(game.asked.length, answersLeft)}
          </p>
        {/if}

        <!-- The Manipulation, once it has landed. It is the game's only
             sanction and it is canon, so it is stated rather than implied. -->
        {#if game.manipulated}
          <div class="mt-3 rounded border border-[#9d65d0]/70 bg-[#9d65d0]/10 p-3">
            <p class="text-[10px] uppercase tracking-widest text-[#c7a5e8]">
              {copy.hatsu.narrowed.title}
            </p>
            <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/80">
              {game.ending === 'abandoned'
                ? copy.hatsu.narrowed.leaving
                : copy.hatsu.narrowed.cheating}
            </p>
          </div>
        {/if}

        <!-- What the aura has bought so far, while it is still worth knowing. -->
        {#if game.read || game.foreseen || game.forged || game.shielded || game.proxied}
          <ul class="mt-3 space-y-1 text-xs leading-snug text-[#8ecae6]">
            {#if game.read}<li>{copy.hatsu.read}</li>{/if}
            {#if game.foreseen}<li>{copy.hatsu.foreseen(nameOfCard(game.foreseen))}</li>{/if}
            {#if game.forged}<li>{copy.hatsu.forged(nameOfCard(game.forged))}</li>{/if}
            {#if game.shielded}<li class="text-[#FFD700]">{copy.hatsu.shielded}</li>{/if}
            {#if game.proxied}<li>{copy.hatsu.proxied}</li>{/if}
          </ul>
        {/if}

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
          <div class="mt-4 rounded border border-[#d94f68]/60 bg-[#d94f68]/10 p-3">
            <h2 class="text-sm font-semibold text-[#FFFFF0]">{copy.deal.title}</h2>
            <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/70">{copy.deal.body}</p>
            <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
              {copy.deal.pick}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each game.graveyard as card (card)}
                <button
                  class="rounded border border-[#d94f68] px-3 py-1.5 text-xs font-semibold text-[#FFFFF0] hover:bg-[#d94f68]/30"
                  onclick={() => (game = takeTheDeal(game, card))}
                >
                  {copy.deal.take} · {nameOfCard(card)}
                </button>
              {/each}
              <button
                class="rounded border border-[#444] px-3 py-1.5 text-xs text-[#FFFFF0] hover:border-[#FFD700]"
                onclick={() => (game = refuseTheDeal(game))}
              >
                {copy.deal.refuse}
              </button>
            </div>
          </div>
        {:else if game.phase === 'asking'}
          <h2 class="mt-4 text-sm font-semibold text-[#FFFFF0]">{copy.askTitle}</h2>
          <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.askHint}</p>
          <ul class="mt-2 space-y-1.5">
            {#each questionsLeft as question (question)}
              <li>
                <button
                  class="w-full rounded border border-[#333] px-3 py-2 text-left text-sm text-[#FFFFF0]/85 hover:border-[#d94f68] hover:text-[#FFFFF0]"
                  onclick={() => ask(question)}
                >
                  {copy.questions[question].title}
                </button>
              </li>
            {/each}
          </ul>
        {:else if game.phase === 'settling'}
          <h2 class="mt-4 text-sm font-semibold text-[#FFFFF0]">{copy.settle.title}</h2>
          {#if settlement === 'joker'}
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.jokerHint}</p>
            <div class="mt-2 flex gap-2">
              <button
                class="rounded border px-3 py-1.5 text-xs font-semibold {choice === 'yes'
                  ? 'border-[#FFD700] text-[#FFD700]'
                  : 'border-[#444] text-[#FFFFF0]'}"
                onclick={() => (choice = 'yes')}
              >
                {nameOfCard('yes')}
              </button>
              <button
                class="rounded border px-3 py-1.5 text-xs font-semibold {choice === 'no'
                  ? 'border-[#FFD700] text-[#FFD700]'
                  : 'border-[#444] text-[#FFFFF0]'}"
                onclick={() => (choice = 'no')}
              >
                {nameOfCard('no')}
              </button>
            </div>
          {:else if settlement === 'back'}
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.backHint}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each game.graveyard as card (card)}
                <button
                  class="rounded border px-3 py-1.5 text-xs font-semibold {choice === card
                    ? 'border-[#FFD700] text-[#FFD700]'
                    : 'border-[#444] text-[#FFFFF0]'}"
                  onclick={() => (choice = card)}
                >
                  {nameOfCard(card)}
                </button>
              {/each}
            </div>
          {:else if lastCard(game) === 'back'}
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.backEmpty}</p>
          {/if}
          <button
            class="mt-3 rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] disabled:opacity-40"
            disabled={Boolean(settlement) && !choice}
            onclick={play}
          >
            {copy.settle.play}
          </button>
        {:else if game.verdict}
          <div class="mt-4 rounded border border-[#d94f68]/60 bg-[#d94f68]/10 p-3">
            <h2 class="text-base font-semibold text-[#FFFFF0]">
              {copy.verdicts[game.verdict].title}
            </h2>
            <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/75">
              {copy.verdicts[game.verdict].body}
            </p>
          </div>

          <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
            {copy.conditions.title}
          </h3>
          <ul class="mt-2 space-y-1 text-xs">
            {#each [{ label: copy.conditions.said, met: conditions.said }, { label: copy.conditions.kissed, met: conditions.kissed }, { label: copy.conditions.witnessed, met: conditions.witnessed }] as condition (condition.label)}
              <li class="flex justify-between gap-3">
                <span class="text-[#FFFFF0]/70">{condition.label}</span>
                <span class={condition.met ? 'text-[#7fc8a0]' : 'text-[#FFFFF0]/35'}>
                  {condition.met ? copy.conditions.met : copy.conditions.unmet}
                </span>
              </li>
            {/each}
          </ul>
          <p class="mt-2 text-xs font-semibold text-[#FFD700]">
            {conditions.level === null
              ? copy.conditions.none
              : copy.conditions.level(conditions.level)}
          </p>
          {#if !conditions.said && conditions.kissed}
            <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/60">
              {copy.conditions.kissedAnyway}
            </p>
          {/if}

          <!-- What the aura was worth, once the last card is down. This is the
               half of the feature the canon leaves open: the game produces a
               word, and these are the things that decide what the word cost. -->
          {#if game.aftermath.length}
            <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
              {copy.hatsu.aftermath.title}
            </h3>
            <ul class="mt-2 space-y-2">
              {#each game.aftermath as what (what)}
                <li class="text-xs leading-relaxed text-[#8ecae6]">
                  {copy.hatsu.aftermath[what]}
                </li>
              {/each}
            </ul>
          {/if}

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-[#e8697f]"
              onclick={deal}
            >
              {copy.again}
            </button>
            <button
              class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
              onclick={() => (view = 'menu')}
            >
              {copy.menu.leave}
            </button>
          </div>
        {/if}

        <!-- The aura, played across the table.
             Kept below the hand and above the piles because that is where it
             sits in the fiction too: it is not one of the twelve cards, it is
             the thing you brought into a room that has rules. -->
        {#if game.technique && seated && game.phase !== 'over'}
          <div class="mt-5 rounded border border-[#333] p-3" style:border-color={carried?.color}>
            <div class="flex items-baseline justify-between gap-2">
              <p class="text-sm font-semibold" style:color={carried?.color}>{techniqueName}</p>
              <span
                class="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {seated.fraud
                  ? 'border-[#ef3340]/60 text-[#ef8a90]'
                  : 'border-[#7fc8a0]/60 text-[#7fc8a0]'}"
              >
                {seated.fraud ? copy.hatsu.fraud : copy.hatsu.legal}
              </span>
            </div>
            <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">
              {copy.hatsu.techniques[game.technique].buys}
            </p>
            {#if seated.fraud}
              <p class="mt-2 text-[11px] text-[#ef8a90]/80">
                {copy.hatsu.exposure(Math.round(exposureNow(seated, game) * 100))}
              </p>
            {/if}
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <button
                class="rounded px-3 py-1.5 text-xs font-semibold text-[#0b0b0d] disabled:opacity-30"
                style:background={carried?.color ?? '#d94f68'}
                disabled={usedUp}
                onclick={cast}
              >
                {copy.hatsu.effects[seated.effect]}
              </button>
              <span class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/40">
                {usedUp ? copy.hatsu.exhausted : copy.hatsu.spent(game.spent, seated.uses)}
              </span>
            </div>
          </div>
        {/if}

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

        <!-- What is on the table, in the same three piles the scene lays out. -->
        <div class="mt-5 border-t border-[#222] pt-4">
          <h3 class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.table.hand}</h3>
          <ul class="mt-2 space-y-1.5">
            {#each ANSWER_CARDS.filter((card) => game.hand.includes(card)) as card (card)}
              <li class="flex items-baseline gap-2 text-xs">
                <span class="font-semibold text-[#FFFFF0]">{nameOfCard(card)}</span>
                {#if game.marked === card && game.phase === 'over'}
                  <span class="rounded border border-[#d94f68] px-1 text-[10px] text-[#d94f68]">
                    {copy.table.markedCard}
                  </span>
                {/if}
                <span class="text-[#FFFFF0]/50">{copy.cards[card].rule}</span>
              </li>
            {/each}
            {#if game.hand.length === 0}
              <li class="text-xs text-[#FFFFF0]/35">{copy.table.empty}</li>
            {/if}
          </ul>

          <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
            {copy.table.graveyard}
          </h3>
          <p class="mt-1 text-xs text-[#FFFFF0]/50">
            {game.graveyard.length ? game.graveyard.map(nameOfCard).join(' · ') : copy.table.empty}
          </p>

          <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
            {copy.table.fan}
          </h3>
          <p class="mt-1 text-xs text-[#FFFFF0]/50">
            {QUESTION_CARDS.filter((question) => game.questions.includes(question)).length} / {QUESTION_CARDS.length}
          </p>
        </div>

        <!-- Contagion, read rather than cast: the network, the negotiation and
             the frieze of what was played under an aura to get there. The
             ability module has declared this component key since it was
             written; `$lib/nen/abilityComponents` is what finally resolves it. -->
        <div class="mt-5">
          <ContagionDashboard {game} />
        </div>

        <!-- The transcript, which is the only record of a hand once it is over. -->
        <div class="mt-5 border-t border-[#222] pt-4">
          <h3 class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.log.title}</h3>
          <ol class="mt-2 space-y-1 text-xs leading-snug text-[#FFFFF0]/55">
            <!-- The marking is kept out of the transcript until the hand is
                 over: knowing which card is trapped is the whole of what the
                 cheat costs you, and it is not something the table tells you. -->
            {#each game.log.filter((beat) => beat.kind !== 'marked' || game.phase === 'over') as beat, i (i)}
              <li>
                {#if beat.kind === 'marked'}
                  {copy.log.marked(nameOfCard(beat.card))}
                {:else if beat.kind === 'asked'}
                  {copy.log.asked(beat.round, copy.questions[beat.question].title)}
                {:else if beat.kind === 'taken'}
                  {copy.log.taken(beat.round, nameOfCard(beat.card))}
                {:else if beat.kind === 'offered'}
                  {copy.log.offered}
                {:else if beat.kind === 'kissed'}
                  {copy.log.kissed(nameOfCard(beat.card))}
                {:else if beat.kind === 'declined'}
                  {copy.log.declined}
                {:else if beat.kind === 'recovered'}
                  {copy.log.recovered(nameOfCard(beat.card))}
                {:else if beat.kind === 'settled'}
                  {copy.log.settled(nameOfCard(beat.card))}
                {:else if beat.kind === 'played'}
                  <span class:text-[#ef8a90]={beat.seen}>
                    {copy.log.played(
                      beat.round,
                      copy.hatsu.effects[moveFor(beat.technique).effect],
                      beat.seen,
                    )}
                  </span>
                {:else if beat.kind === 'narrowed'}
                  <span class="text-[#c7a5e8]">{copy.log.narrowed(beat.because)}</span>
                {:else if beat.kind === 'exposed'}
                  <span class="text-[#ef8a90]">{copy.log.exposed(nameOfCard(beat.card))}</span>
                {:else if beat.kind === 'aftermath'}
                  <span class="text-[#8ecae6]">{copy.hatsu.aftermath[beat.what]}</span>
                {/if}
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </section>
  </div>
</div>
