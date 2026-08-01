<script lang="ts">
  /**
   * The Heil-Ly dashboard: Contagion, read rather than cast.
   *
   * `docs/jeu-de-morena.md` §4.3 asks for three things and this is them — the
   * negotiation laid out round by round, the twenty-two slots of the network,
   * and the one view that makes the whole feature worth building: the **frieze
   * of frauds**, every move played under an aura with the detection that
   * succeeded or failed beside it. The site then answers a question the manga
   * poses and never answers: *how, exactly, was somebody recruited?*
   *
   * It renders state and decides nothing. Everything it shows comes off a
   * `MorenaGame` and a list of members, both of which are the engine's — see
   * `packages/ability-modules/src/contagion/`.
   *
   * Registered under the `componentKey` the ability module has always declared
   * (`ContagionDashboard`), through `$lib/nen/abilityComponents`.
   */
  import { locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
  import { CONTAGION_LIMITS } from '@black-whale/ability-modules'
  import { infectionAfter, infectionStepsFrom, moveFor } from '$lib/tour/morena'
  import type { AnswerCard, MorenaGame, TableKind } from '$lib/tour/morena'
  import type { CohortMember } from './cohort'

  let {
    game,
    members = [],
    spoilerLimit = null,
  }: {
    /** The negotiation being watched, or `null` when none is running. */
    game: MorenaGame | null
    /** What the cohort holds, newest last. */
    members?: CohortMember[]
    /**
     * The chapter the reader has stopped at.
     *
     * The recruitment procedure is not public knowledge until ch. 407 shows it
     * being run, so a reader held before then is told that rather than shown
     * twelve cards. `null` means no limit is being applied.
     */
    spoilerLimit?: number | null
  } = $props()

  const copy = $derived($t.tour.morena)
  const board = $derived(copy.dashboard)

  const revealed = $derived(
    spoilerLimit === null || spoilerLimit >= CONTAGION_LIMITS.gameRevealedAtChapter,
  )

  const nameOfCard = (card: AnswerCard) => copy.cards[card].name

  /** A technique's published name, off the registry rather than a second list. */
  const nameOfTechnique = (kind: TableKind) => {
    const profile = HATSU_PROFILES.find((entry) => entry.id === moveFor(kind).hatsuId)
    return profile ? localizeHatsu(profile, $locale).name : kind
  }

  /**
   * The frieze: every move played under an aura, with what caught it.
   *
   * Read off the game's own transcript rather than kept as a second record —
   * the beats are already in the order they happened, and a frieze that could
   * disagree with the log would be a frieze nobody could cite.
   */
  const frauds = $derived(
    (game?.log ?? []).flatMap((beat, index) =>
      beat.kind === 'played'
        ? [{ index, round: beat.round, technique: beat.technique, seen: beat.seen }]
        : [],
    ),
  )

  const conditions = $derived(game ? infectionAfter(game) : null)
  const steps = $derived(game ? infectionStepsFrom(game) : [])

  /** Twenty-two slots, filled from the left. Capacity is canon, not a choice. */
  const slots = $derived(
    Array.from({ length: CONTAGION_LIMITS.capacity }, (_, index) => members[index] ?? null),
  )
</script>

<section class="rounded-lg border border-[#d94f68]/40 bg-[#0b0b0d] p-4">
  <header class="flex items-baseline justify-between gap-3">
    <h2 class="text-sm font-semibold uppercase tracking-widest text-[#d94f68]">{board.title}</h2>
    <span class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/35">
      {members.length} / {CONTAGION_LIMITS.capacity}
    </span>
  </header>

  {#if !revealed}
    <!-- The procedure is not public knowledge until the chapter that shows it
         being run. Said plainly rather than by rendering an empty board. -->
    <p class="mt-3 text-xs leading-relaxed text-[#FFFFF0]/50">{board.unrevealed}</p>
  {:else}
    <!-- ── The network ────────────────────────── -->
    <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{board.network}</h3>
    <ol class="mt-2 grid grid-cols-11 gap-1">
      {#each slots as slot, index (index)}
        <li
          class="aspect-square rounded-sm border text-center text-[9px] leading-[1.6] {slot
            ? 'border-[#d94f68] bg-[#d94f68]/25 text-[#FFFFF0]'
            : 'border-[#2a2a30] text-transparent'}"
          title={slot ? `${slot.label ?? slot.memberId} · ${board.level(slot.level)}` : board.empty}
        >
          {slot ? slot.level : index + 1}
        </li>
      {/each}
    </ol>
    {#if members.length === 0}
      <p class="mt-2 text-[11px] text-[#FFFFF0]/35">{board.noMembers}</p>
    {/if}

    <!-- ── The game ───────────────────────────── -->
    <h3 class="mt-5 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{board.game}</h3>
    {#if !game}
      <p class="mt-2 text-[11px] text-[#FFFFF0]/35">{board.noGame}</p>
    {:else}
      <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/35">{board.round}</dt>
          <dd class="text-[#FFFFF0]">{game.round}</dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/35">{board.questions}</dt>
          <dd class="text-[#FFFFF0]">{game.questions.length} / 7</dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/35">{board.answers}</dt>
          <dd class="text-[#FFFFF0]">{game.hand.length} / 5</dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/35">{board.watch}</dt>
          <dd class={game.watch > 0 ? 'text-[#FFD700]' : 'text-[#FFFFF0]/40'}>
            {Math.round(game.watch * 100)}%
          </dd>
        </div>
      </dl>

      <p class="mt-2 text-xs text-[#FFFFF0]/60">
        <span class="text-[#FFFFF0]/35">{copy.table.hand} — </span>
        {game.hand.length ? game.hand.map(nameOfCard).join(' · ') : copy.table.empty}
      </p>
      <p class="text-xs text-[#FFFFF0]/60">
        <span class="text-[#FFFFF0]/35">{copy.table.graveyard} — </span>
        {game.graveyard.length ? game.graveyard.map(nameOfCard).join(' · ') : copy.table.empty}
      </p>

      {#if game.manipulated}
        <p
          class="mt-2 rounded border border-[#9d65d0]/60 bg-[#9d65d0]/10 px-2 py-1 text-[11px] text-[#c7a5e8]"
        >
          {copy.hatsu.narrowed.title} — {board.narrowed}
        </p>
      {/if}

      {#if game.verdict}
        <p class="mt-2 text-xs">
          <span class="text-[#FFFFF0]/35">{board.verdict} — </span>
          <span class="font-semibold text-[#FFFFF0]">{copy.verdicts[game.verdict].title}</span>
        </p>
      {/if}

      <!-- ── The frieze of frauds ─────────────── -->
      <h3 class="mt-5 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{board.frieze}</h3>
      {#if frauds.length === 0}
        <p class="mt-2 text-[11px] text-[#FFFFF0]/35">{board.noFrauds}</p>
      {:else}
        <ol class="mt-2 space-y-1">
          {#each frauds as fraud (fraud.index)}
            <li class="flex items-baseline gap-2 text-xs">
              <span class="w-8 shrink-0 text-[10px] text-[#FFFFF0]/30">{board.at(fraud.round)}</span
              >
              <span class="font-semibold text-[#FFFFF0]">{nameOfTechnique(fraud.technique)}</span>
              <span class="text-[#FFFFF0]/45">
                {copy.hatsu.effects[moveFor(fraud.technique).effect]}
              </span>
              <span
                class="ml-auto shrink-0 rounded border px-1 text-[10px] uppercase tracking-wider {fraud.seen
                  ? 'border-[#ef3340]/60 text-[#ef8a90]'
                  : 'border-[#7fc8a0]/50 text-[#7fc8a0]'}"
              >
                {fraud.seen ? board.caught : board.unseen}
              </span>
            </li>
          {/each}
        </ol>
      {/if}

      <!-- ── The three conditions ─────────────── -->
      <h3 class="mt-5 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
        {copy.conditions.title}
      </h3>
      <ul class="mt-2 space-y-0.5 text-xs">
        {#each CONTAGION_LIMITS.infectionSteps as step (step)}
          <li class="flex justify-between gap-3">
            <span class="text-[#FFFFF0]/65">{board.steps[step]}</span>
            <span class={steps.includes(step) ? 'text-[#7fc8a0]' : 'text-[#FFFFF0]/30'}>
              {steps.includes(step) ? copy.conditions.met : copy.conditions.unmet}
            </span>
          </li>
        {/each}
      </ul>
      {#if conditions}
        <p class="mt-1 text-xs font-semibold text-[#FFD700]">
          {conditions.level === null
            ? copy.conditions.none
            : copy.conditions.level(conditions.level)}
        </p>
      {/if}
    {/if}
  {/if}
</section>
