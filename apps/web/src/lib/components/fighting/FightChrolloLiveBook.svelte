<script lang="ts">
  import { chrolloPageName } from '$lib/fighting/chrolloPageNames'
  import { CHROLLO_DECK_PRESETS, isSlotRevealed, type BookSlot } from '$lib/fighting/chrolloDeck'
  import type { LiveBookActions } from '$lib/fighting/chrolloLiveBook'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let side: FightSide = 'player'
  export let readOnly = false
  export let actions: LiveBookActions | undefined = undefined
  export let perspective: 'owner' | 'opponent' = 'owner'
  $: void readOnly
  $: void actions

  $: fr = language === 'fr'
  $: book = state[side].chrolloBook
  $: deck = book?.deck ?? CHROLLO_DECK_PRESETS['heavens-arena']
  $: slots = ([0, 1, 2, 3] as const).map((index) => ({
    slot: index,
    key: ['L', 'H', 'U', 'Ctx'][index],
    page: deck[index],
  }))

  function slotLabel(slot: BookSlot, page: string | null | undefined): string {
    if (!page) return '—'
    if (perspective === 'opponent' && book && !isSlotRevealed(book, slot)) return '?'
    return chrolloPageName(page as Parameters<typeof chrolloPageName>[0], language)
  }
</script>

{#if book}
  <aside
    class="live-book"
    class:flipping={book.isFlipping}
    aria-label={fr ? 'Bandit’s Secret · Indicateur passif' : 'Bandit’s Secret · Passive HUD'}
  >
    <header class="book-head">
      <strong>{side === 'player' ? 'P1' : 'P2'} · BANDIT’S SECRET</strong>
      <span class="hand-state">
        {book.open
          ? fr
            ? 'Livre ouvert · main droite occupée'
            : 'Book open · right hand occupied'
          : fr
            ? 'Livre fermé · deux mains libres'
            : 'Book closed · both hands free'}
      </span>
    </header>
    <ul class="deck-slots">
      {#each slots as entry (entry.slot)}
        <li
          class:active={book.open && book.openSlot === entry.slot}
          class:bookmarked={book.bookmarkSlot === entry.slot}
        >
          <span class="slot-key">{book.isFlipping ? entry.key : entry.slot + 1}</span>
          <span class="slot-name">{slotLabel(entry.slot, entry.page)}</span>
          {#if book.bookmarkSlot === entry.slot}
            <span class="slot-mark" title={fr ? 'Signet Double Face' : 'Double Face bookmark'}
              >★</span
            >
          {/if}
        </li>
      {/each}
      <li
        class="stolen-slot"
        class:active={book.open && book.openSlot === 'stolen'}
        class:bookmarked={book.bookmarkSlot === 'stolen'}
        class:empty={!book.stolenPage}
      >
        <span class="slot-key">6S</span>
        <span class="slot-name">
          {book.stolenPage
            ? slotLabel('stolen', book.stolenPage)
            : fr
              ? 'Slot volé (vide)'
              : 'Stolen slot (empty)'}
        </span>
        {#if book.bookmarkSlot === 'stolen'}
          <span class="slot-mark" title={fr ? 'Signet Double Face' : 'Double Face bookmark'}>★</span
          >
        {/if}
      </li>
    </ul>
  </aside>
{/if}

<style>
  .live-book {
    position: absolute;
    top: 8.6rem;
    right: 0.8rem;
    z-index: 26;
    width: min(260px, 38vw);
    padding: 0.5rem 0.6rem;
    border: 1px solid #725586;
    background: #120b1bd9;
    color: #eee2fa;
    font: 600 0.62rem/1.35 var(--font-mono);
    pointer-events: none;
  }
  .live-book.flipping {
    border-color: #ff9b61;
    box-shadow: 0 0 14px #ff864b33;
  }
  .book-head {
    display: grid;
    gap: 0.15rem;
    margin-bottom: 0.35rem;
    border-bottom: 1px solid #ffffff1a;
    padding-bottom: 0.3rem;
  }
  .book-head strong {
    color: #f6e7ff;
    letter-spacing: 0.06em;
  }
  .hand-state {
    color: #c2adc9;
    font-size: 0.55rem;
  }
  .deck-slots {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.2rem;
  }
  .deck-slots li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.22rem 0.35rem;
    border: 1px solid #4d395d;
    background: #1c1228;
    color: #cbb9db;
  }
  .deck-slots li.active {
    border-color: #ff9b61;
    background: #381f24;
    color: #fff2e6;
  }
  .deck-slots li.bookmarked {
    border-left: 3px solid #c5a0fa;
  }
  .deck-slots li.empty {
    opacity: 0.55;
    border-style: dashed;
  }
  .slot-key {
    min-width: 1.5rem;
    text-align: center;
    color: #ff9b61;
    font-size: 0.55rem;
  }
  .slot-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .slot-mark {
    margin-left: auto;
    color: #c5a0fa;
  }
  @media (max-width: 600px) {
    .live-book {
      top: 7.5rem;
      right: 0.4rem;
      width: min(215px, 52vw);
    }
  }
</style>
