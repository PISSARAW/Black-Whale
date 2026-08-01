<script lang="ts">
  /**
   * The face of one card at Morena's table.
   *
   * Chap. 407-410 does not describe the twelve cards, it *draws* them: a phone
   * card held up between two hands, ink on white, one mark big enough to read
   * across a table and a letter in the corner for the one who is holding it.
   * That is the whole of the design and it is worth keeping — a list of names
   * with rules beside them is a rulebook, and the chapters are not a rulebook,
   * they are two people looking at objects.
   *
   * The drawings themselves are in `$lib/tour/cardArt`, because the table films
   * the same twelve cards and a mark that meant one thing in the panel and
   * another on the wood would be two decks. This is the frame around them: a
   * 60×84 field, no colour of its own, everything stroked in `currentColor`, so
   * a buried card is a card drawn in the colour of a buried card and nothing
   * more.
   */
  import { CARD_ART } from '$lib/tour/cardArt'
  import type { CardFace } from '$lib/tour/morena'

  let { face }: { face: CardFace } = $props()
</script>

<svg
  class="h-full w-full"
  viewBox="0 0 60 84"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <!-- The markup is a constant of this repository, reached by a key that is a
       union of twelve literals: there is no path from a reader, a record or a
       URL to what is written here. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html CARD_ART[face]}
</svg>
