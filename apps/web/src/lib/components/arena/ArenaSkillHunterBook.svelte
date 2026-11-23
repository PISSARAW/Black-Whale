<script lang="ts">
  import { arenaBookPage } from '$lib/combat/fightingSkillHunter'
  import type { ArenaBookSlot, ArenaSkillHunterBook } from '$lib/combat/types'

  let { book }: { book: ArenaSkillHunterBook } = $props()
  let slots = $derived<readonly ArenaBookSlot[]>(
    book.stolenPage ? [0, 1, 2, 3, 'stolen'] : [0, 1, 2, 3],
  )

  function label(slot: ArenaBookSlot): string {
    return (arenaBookPage(book, slot) ?? 'empty')
      .split('-')
      .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
      .join(' ')
  }
</script>

<aside class="book" aria-label="Skill Hunter book">
  <header>
    <strong>Skill Hunter</strong>
    <span>{book.open ? 'OPEN' : 'BOOKMARKED'}</span>
  </header>
  <ol>
    {#each slots as slot (slot)}
      <li
        class:selected={book.selectedSlot === slot}
        class:active={book.open && book.selectedSlot === slot}
        class:bookmark={book.bookmarkSlot === slot}
        class:stolen={slot === 'stolen'}
      >
        <i>{slot === 'stolen' ? '5' : slot + 1}</i>
        <span>{label(slot)}</span>
        {#if book.bookmarkSlot === slot}<b>◆</b>{/if}
      </li>
    {/each}
  </ol>
  <p>back+special page · low+special bookmark · special use · forward+special steal</p>
</aside>

<style>
  .book {
    position: fixed;
    right: 1.25rem;
    bottom: 10.5rem;
    z-index: 23;
    width: min(18rem, calc(100vw - 2rem));
    padding: 0.65rem;
    color: #e9e1cf;
    background: rgb(14 12 10 / 90%);
    border: 1px solid rgb(202 174 111 / 45%);
    border-radius: 0.35rem;
    font: 600 0.66rem/1.2 var(--font-sans, sans-serif);
    letter-spacing: 0.08em;
    backdrop-filter: blur(8px);
    pointer-events: none;
  }

  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.45rem;
    color: #d8b968;
    text-transform: uppercase;
  }

  header span,
  p {
    color: #9d9688;
    font-size: 0.55rem;
  }

  ol {
    display: grid;
    gap: 0.2rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 1.25rem 1fr 1rem;
    align-items: center;
    min-height: 1.45rem;
    padding: 0 0.35rem;
    color: #aaa293;
    border-left: 2px solid transparent;
  }

  li.selected {
    color: #f2ead9;
    background: rgb(255 255 255 / 6%);
  }

  li.active {
    border-color: #d8b968;
  }

  li.bookmark b {
    color: #bd3838;
  }

  li.stolen {
    color: #d8b968;
  }

  i {
    font-style: normal;
    color: #756e62;
  }

  p {
    margin: 0.5rem 0 0;
    letter-spacing: 0.03em;
  }

  @media (max-width: 700px) {
    .book {
      right: 0.5rem;
      bottom: 12.5rem;
      width: 14rem;
    }
  }
</style>
