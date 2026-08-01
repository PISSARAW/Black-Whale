<script lang="ts">
  /**
   * What is on the table, in the three piles the scene lays out.
   *
   * The route used to print this as three lists of names, which is the one
   * place the page and the chapters disagreed about what the game is: the
   * chapters never name a card without drawing it. So the piles are cards —
   * yours face up because you are your own cards, hers face down because that
   * is what you are buying with each question, and the graveyard face up and
   * grey because a card she has taken is a card you can still count.
   *
   * The rule stays printed beside your hand and only there: it is the hand you
   * are choosing from, and a card whose rule you have to remember is a card
   * that has been made into a quiz.
   */
  import type { Messages } from '$lib/i18n'
  import type { MorenaGame } from '$lib/tour/morena'
  import {
    ANSWER_CARDS,
    ASKED_COLOUR,
    CARD_COLOURS,
    QUESTION_COLOUR,
    cssInk,
  } from '$lib/tour/morena'
  import MorenaCard from './MorenaCard.svelte'

  let { game, copy }: { game: MorenaGame; copy: Messages['tour']['morena'] } = $props()

  const held = $derived(ANSWER_CARDS.filter((card) => game.hand.includes(card)))
</script>

<h3 class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.table.hand}</h3>
{#if held.length}
  <ul class="mt-2 space-y-2">
    {#each held as card (card)}
      <li class="flex items-start gap-3">
        <MorenaCard
          face={card}
          label={copy.cards[card].name}
          ink={cssInk(CARD_COLOURS[card])}
          marked={game.marked === card && game.phase === 'over'}
          markedLabel={copy.table.markedCard}
        />
        <span class="pt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.cards[card].rule}</span>
      </li>
    {/each}
  </ul>
{:else}
  <p class="mt-2 text-xs text-[#FFFFF0]/35">{copy.table.empty}</p>
{/if}

<h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.table.graveyard}</h3>
{#if game.graveyard.length}
  <div class="mt-2 flex flex-wrap gap-1.5">
    {#each game.graveyard as card (card)}
      <MorenaCard
        face={card}
        label={copy.cards[card].name}
        ink={cssInk(CARD_COLOURS[card])}
        state="buried"
      />
    {/each}
  </div>
{:else}
  <p class="mt-1 text-xs text-[#FFFFF0]/35">{copy.table.empty}</p>
{/if}

<h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.table.fan}</h3>
<div class="mt-2 flex flex-wrap gap-1">
  <!-- Face down while they are hers, and face up the moment one is spent —
       which is the only currency the game has.

       Unless something has read them. A technique that turns her fan over and
       leaves seven card backs printed here would be a line of text claiming a
       thing the page then declines to show: the table lays them face up, and
       this is the same fan. -->
  {#each game.questions as question (question)}
    <MorenaCard
      face={question}
      label={copy.questions[question].short}
      ink={cssInk(game.read ? ASKED_COLOUR : QUESTION_COLOUR)}
      state={game.read ? 'live' : 'hidden'}
    />
  {/each}
  {#each game.asked as question (question)}
    <MorenaCard
      face={question}
      label={copy.questions[question].short}
      ink={cssInk(ASKED_COLOUR)}
      state="spent"
    />
  {/each}
</div>
