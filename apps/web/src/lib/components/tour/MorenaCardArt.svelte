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
   * So this is the art alone: a 60×84 ink drawing with no frame, no label and
   * no colour. `MorenaCard` puts it in a card; the route decides what the card
   * is doing. Everything here is stroked in `currentColor`, so a buried card is
   * a card drawn in the colour of a buried card and nothing more.
   */
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
  {#if face === 'yes'}
    <!-- Yes is the maru: the circle a Japanese form is marked correct with,
         which is what she is asking Borksen to write on hers. -->
    <circle cx="30" cy="38" r="19" stroke-width="3" />
    <circle cx="30" cy="38" r="12" stroke-width="1" opacity="0.45" />
    <path d="M14 66h32" stroke-width="1.5" opacity="0.5" />
  {:else if face === 'no'}
    <!-- And No is the batsu, drawn the way the panel draws it: white on black. -->
    <rect x="8" y="16" width="44" height="44" fill="currentColor" stroke="none" />
    <path d="M18 26 42 50M42 26 18 50" stroke="var(--card-face, #f6f3ec)" stroke-width="4" />
    <path d="M14 66h32" stroke-width="1.5" opacity="0.5" />
  {:else if face === 'back'}
    <!-- Return: an arrow that goes down into the pile and comes back up. -->
    <path d="M44 20v14a10 10 0 0 1-10 10H18" stroke-width="3" />
    <path d="M26 36 17 44l9 8" stroke-width="3" />
    <path d="M12 60h36" stroke-width="1.5" opacity="0.5" />
    <path d="M12 66h24" stroke-width="1.5" opacity="0.3" />
  {:else if face === 'joker'}
    <!-- The joker is the one card drawn twice on itself: whichever way up you
         hold it, it is already the other answer. -->
    <path d="M8 12 52 72" stroke-width="1" opacity="0.4" />
    <circle cx="20" cy="24" r="9" stroke-width="2.5" />
    <rect x="31" y="48" width="18" height="18" fill="currentColor" stroke="none" />
    <path d="M35 52l10 10M45 52 35 62" stroke="var(--card-face, #f6f3ec)" stroke-width="3" />
  {:else if face === 'x'}
    <!-- X voids the game, so it is drawn as the thing that swallows it. -->
    <path d="M30 8c-14 8-22 18-22 30s10 22 22 22 22-8 22-22-8-22-22-30z" opacity="0.25" />
    <path d="M14 22 46 54M46 22 14 54" stroke-width="4" />
    <circle cx="30" cy="38" r="26" stroke-width="1" opacity="0.4" />
  {:else if face === 'goal'}
    <!-- Aim: the eye the chapter draws on her side of the fan, and the light
         coming off it. -->
    <path d="M8 38c8-11 15-16 22-16s14 5 22 16c-8 11-15 16-22 16s-14-5-22-16z" stroke-width="2.5" />
    <circle cx="30" cy="38" r="7" fill="currentColor" stroke="none" />
    <path d="M30 8v8M12 16l5 6M48 16l-5 6M30 60v8M12 60l5-6M48 60l-5-6" stroke-width="1.5" />
  {:else if face === 'power'}
    <!-- Power: an aura going out from a body, which is the only honest picture
         of an ability that spreads by touching people. -->
    <circle cx="30" cy="38" r="6" fill="currentColor" stroke="none" />
    <circle cx="30" cy="38" r="13" stroke-width="2" opacity="0.75" />
    <circle cx="30" cy="38" r="20" stroke-width="1.5" opacity="0.5" />
    <circle cx="30" cy="38" r="27" stroke-width="1" opacity="0.3" />
  {:else if face === 'if-yes'}
    <!-- What a Yes costs: the circle, and a question mark over it. -->
    <circle cx="26" cy="42" r="16" stroke-width="2.5" opacity="0.7" />
    <path d="M34 16c0-5 4-8 8-8s8 3 8 8-6 6-7 10" stroke-width="3" />
    <circle cx="42" cy="34" r="2" fill="currentColor" stroke="none" />
    <path d="M12 68h32" stroke-width="1.5" opacity="0.4" />
  {:else if face === 'if-no'}
    <!-- And what a No costs, which the chapters say is nothing. -->
    <path d="M12 30 34 52M34 30 12 52" stroke-width="4" opacity="0.7" />
    <path d="M34 16c0-5 4-8 8-8s8 3 8 8-6 6-7 10" stroke-width="3" />
    <circle cx="42" cy="34" r="2" fill="currentColor" stroke="none" />
    <path d="M12 68h32" stroke-width="1.5" opacity="0.4" />
  {:else if face === 'contract'}
    <!-- The contract is the game itself, so it is drawn as the thing that is
         signed and then sealed: a sheet, a line, a stamp. -->
    <rect x="12" y="12" width="36" height="46" stroke-width="2.5" />
    <path d="M19 24h22M19 32h22M19 40h14" stroke-width="1.5" opacity="0.6" />
    <circle cx="41" cy="52" r="8" stroke-width="2.5" />
    <path d="M12 70h36" stroke-width="1.5" opacity="0.4" />
  {:else if face === 'origin'}
    <!-- Where she comes from: a door left open behind her, and no name on it. -->
    <path d="M16 68V20a14 14 0 0 1 28 0v48" stroke-width="2.5" />
    <path d="M16 68h28" stroke-width="2.5" />
    <circle cx="37" cy="44" r="2.5" fill="currentColor" stroke="none" />
    <path d="M24 34h8" stroke-width="1.5" opacity="0.5" />
  {:else}
    <!-- Price: the scale, tipped, because she has already weighed you. -->
    <path d="M30 14v46M18 66h24" stroke-width="2.5" />
    <path d="M10 26h40" stroke-width="2.5" transform="rotate(-9 30 26)" />
    <path d="M10 24l-6 12h12z" stroke-width="2" transform="rotate(-9 30 26)" />
    <path d="M50 28l-6 12h12z" stroke-width="2" transform="rotate(-9 30 26)" />
  {/if}
</svg>
