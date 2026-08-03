<script lang="ts">
  import { t } from '$lib/i18n'
  import {
    CARD_COLOURS,
    DEALER_COLOUR,
    askMorena,
    cssInk,
    lastCard,
    needsAChoice,
    refuseTheDeal,
    settle,
    takeTheDeal,
    type AnswerCard,
    type MorenaGame,
    type QuestionCard,
  } from '$lib/tour/morena'
  import MorenaCard from './MorenaCard.svelte'

  interface Props {
    game: MorenaGame
    choice?: AnswerCard | null
    nameOfCard: (card: AnswerCard) => string
  }

  let { game = $bindable(), choice = $bindable(null), nameOfCard }: Props = $props()
  const copy = $derived($t.tour.morena)
  const settlement = $derived(needsAChoice(game))
  const questionCopy = (question: QuestionCard) =>
    (copy.questions as Record<string, { short: string; title: string }>)[question]

  function ask(question: QuestionCard) {
    game = askMorena(game, question)
  }

  function play() {
    if (settlement && !choice) return
    game = settle(game, choice ?? undefined)
    choice = null
  }
</script>

{#if game.phase === 'deal'}
  <div class="mt-4 rounded border border-[#d94f68]/60 bg-[#d94f68]/10 p-3">
    <h2 class="text-sm font-semibold text-[#FFFFF0]">{copy.deal.title}</h2>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/70">{copy.deal.body}</p>
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.deal.pick}</p>
    <div class="mt-2 flex flex-wrap items-end gap-2">
      {#each game.graveyard as card (card)}
        <button
          class="rounded border border-[#d94f68] p-1.5 hover:bg-[#d94f68]/30"
          onclick={() => (game = takeTheDeal(game, card))}
          title="{copy.deal.take} · {nameOfCard(card)}"
        >
          <MorenaCard face={card} label={nameOfCard(card)} ink={cssInk(CARD_COLOURS[card])} />
        </button>
      {/each}
      <button
        class="rounded border border-[#444] px-3 py-1.5 text-xs text-[#FFFFF0] hover:border-[#FFD700]"
        onclick={() => (game = refuseTheDeal(game))}>{copy.deal.refuse}</button
      >
    </div>
  </div>
{:else if game.phase === 'asking'}
  <h2 class="mt-4 text-sm font-semibold text-[#FFFFF0]">{copy.askTitle}</h2>
  <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.askHint}</p>
  <ul class="mt-2 space-y-1.5">
    {#each game.questions as question (question)}
      <li>
        <button
          class="flex w-full items-center gap-3 rounded border border-[#333] p-2 text-left text-sm text-[#FFFFF0]/85 hover:border-[#d94f68] hover:text-[#FFFFF0]"
          onclick={() => ask(question)}
        >
          <MorenaCard
            face={question}
            label={questionCopy(question).short}
            ink={cssInk(DEALER_COLOUR)}
          />
          <span>{questionCopy(question).title}</span>
        </button>
      </li>
    {/each}
  </ul>
{:else if game.phase === 'settling'}
  <h2 class="mt-4 text-sm font-semibold text-[#FFFFF0]">{copy.settle.title}</h2>
  {#if settlement === 'joker'}
    <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.jokerHint}</p>
    <div class="mt-2 flex gap-2">
      {#each ['yes', 'no'] as const as side (side)}
        <button
          class="rounded border p-1.5 {choice === side
            ? 'border-[#FFD700] bg-[#FFD700]/10'
            : 'border-[#444] hover:border-[#FFD700]/60'}"
          onclick={() => (choice = side)}
          title={nameOfCard(side)}
        >
          <MorenaCard face={side} label={nameOfCard(side)} ink={cssInk(CARD_COLOURS[side])} />
        </button>
      {/each}
    </div>
  {:else if settlement === 'back'}
    <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.backHint}</p>
    <div class="mt-2 flex flex-wrap gap-2">
      {#each game.graveyard as card (card)}
        <button
          class="rounded border p-1.5 {choice === card
            ? 'border-[#FFD700] bg-[#FFD700]/10'
            : 'border-[#444] hover:border-[#FFD700]/60'}"
          onclick={() => (choice = card)}
          title={nameOfCard(card)}
        >
          <MorenaCard face={card} label={nameOfCard(card)} ink={cssInk(CARD_COLOURS[card])} />
        </button>
      {/each}
    </div>
  {:else if lastCard(game) === 'back'}
    <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.settle.backEmpty}</p>
  {/if}
  <button
    class="mt-3 rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] disabled:opacity-40"
    disabled={Boolean(settlement) && !choice}
    onclick={play}>{copy.settle.play}</button
  >
{/if}
