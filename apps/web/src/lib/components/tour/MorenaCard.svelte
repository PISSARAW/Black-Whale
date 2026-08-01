<script lang="ts">
  /**
   * One card at Morena's table, as an object rather than as a line of text.
   *
   * The panel used to name the five answers and print their rules beside them,
   * which is a rulebook; the chapters hold up cards. This is the frame the
   * chapters draw — a phone card, ink on white, the mark in the middle and the
   * name lettered along the bottom — with one thing added that the page needs
   * and the manga did not: the edge is inked in the colour that card is laid on
   * the table in, so a card in the hand and the same card three metres away on
   * the wood are recognisably the one card.
   *
   * Four states, and they are the four things that happen to a card here:
   * face up in your hand, face down in her fan, spent in the middle, and taken
   * away into the graveyard. Nothing about the game is decided here — the route
   * says which state a card is in, and this draws it.
   */
  import type { CardFace } from '$lib/tour/morena'
  import MorenaCardArt from './MorenaCardArt.svelte'

  let {
    face,
    label,
    ink = '#FFFFF0',
    state = 'live',
    marked = false,
    markedLabel = '',
  }: {
    face: CardFace
    /** The card's name, lettered along the bottom the way the panel letters it. */
    label: string
    /** The colour this card is laid on the table in. */
    ink?: string
    /** `hidden` is her fan: a card you can see the back of and nothing else. */
    state?: 'live' | 'hidden' | 'spent' | 'buried'
    /** Whether the nick Morena put in it is visible yet. */
    marked?: boolean
    markedLabel?: string
  } = $props()

  const buried = $derived(state === 'buried')
  const spent = $derived(state === 'spent')
</script>

<figure
  class="morena-card relative flex flex-col overflow-hidden rounded-[3px] border-2 transition-colors"
  class:opacity-45={buried}
  class:grayscale={buried}
  style:border-color={buried ? '#4a4a52' : ink}
  style:background={state === 'hidden' ? '#140f13' : spent ? '#d3ccc1' : '#f6f3ec'}
>
  {#if state === 'hidden'}
    <!-- Her side of the table. Seven of these, and the whole of the game is
         that you do not get to see them until you have paid for one. -->
    <div class="card-back h-full w-full" style:--ink={ink}></div>
  {:else}
    <div
      class="flex min-h-0 flex-1 items-center justify-center px-1.5 pt-1.5"
      style:--card-face={spent ? '#d3ccc1' : '#f6f3ec'}
      style:color={buried ? '#8b8b94' : '#141018'}
    >
      <MorenaCardArt {face} />
    </div>
    <figcaption
      class="overflow-hidden text-ellipsis whitespace-nowrap border-t px-0.5 py-[3px] text-center text-[7px] font-bold uppercase leading-tight tracking-[0.06em]"
      style:border-color={buried ? '#4a4a52' : ink}
      style:color={buried ? '#8b8b94' : '#141018'}
      style:background={buried ? 'transparent' : `color-mix(in srgb, ${ink} 22%, transparent)`}
    >
      {label}
    </figcaption>
  {/if}

  <!-- The nick. It is drawn on the corner of the card and not in a caption,
       because the reason it matters is that it was there the whole time and
       could have been seen. -->
  {#if marked}
    <span
      class="absolute -right-px -top-px flex h-3.5 w-3.5 items-end justify-start rounded-bl-[3px] bg-[#d94f68] text-[7px] font-bold leading-none text-[#0b0b0d]"
      title={markedLabel}
      aria-label={markedLabel}
    >
      <span class="sr-only">{markedLabel}</span>
    </span>
  {/if}
</figure>

<style>
  .morena-card {
    width: var(--card-w, 3.4rem);
    aspect-ratio: 5 / 7;
    flex: none;
  }

  /* A card back is a card back: a ruled grid, dark, and the same in all seven
     copies. The colour is the one the table lays her fan in. */
  .card-back {
    background-image:
      repeating-linear-gradient(
        45deg,
        color-mix(in srgb, var(--ink) 30%, transparent) 0 1px,
        transparent 1px 6px
      ),
      repeating-linear-gradient(
        -45deg,
        color-mix(in srgb, var(--ink) 30%, transparent) 0 1px,
        transparent 1px 6px
      );
  }
</style>
