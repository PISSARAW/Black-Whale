<script lang="ts">
  import { finisherHint, useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { chrolloNenActive } from '$lib/fighting/chrolloBook'
  import { chrolloPageName } from '$lib/fighting/chrolloPageNames'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false

  $: fighter = state[side]
  $: book = fighter.chrolloBook
  $: active = chrolloNenActive(fighter)
  $: effects = state[side === 'player' ? 'opponent' : 'player'].hatsuEffects
  $: useKey = side === 'player' ? $bindings.playerSpecial : $bindings.opponentSpecial
  $: secondaryKey = finisherHint($bindings, side)
</script>

{#if fighter.id === 'chrollo' && book}
  <div class="book-status" class:opponent={side === 'opponent'}>
    <strong>Bandit’s Secret · {book.page + 1}/{book.pages.length}</strong>
    <span>{chrolloPageName(book.pages[book.page], language)}</span>
    {#if detailed}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable book pages need a keyboard focus target.) -->
      <div
        class="pages"
        role="region"
        tabindex="0"
        data-fight-scroll
        aria-label={language === 'fr' ? 'Pages du livre' : 'Book pages'}
      >
        {#each book.pages as page, index (page)}
          <span
            class:open={active && book.open && index === book.page}
            class:pinned={book.bookmark === page}
          >
            {book.bookmark === page ? '◆ ' : ''}{chrolloPageName(page, language)}
          </span>
        {/each}
      </div>
    {/if}
    {#if !active}
      <span
        >{language === 'fr' ? 'Livre dissipé · Nen requis' : 'Book dismissed · Nen required'}</span
      >
    {:else}
      <span
        >{book.open
          ? language === 'fr'
            ? 'Ouvert · main droite occupée'
            : 'Open · right hand occupied'
          : language === 'fr'
            ? 'Fermé · mains libres'
            : 'Closed · hands free'} · [{useKey}]</span
      >
      <span
        >Double Face · {chrolloPageName(book.bookmark, language)}{book.bookmark
          ? ` [${secondaryKey}]`
          : ''}</span
      >
    {/if}
    {#if effects.sunMark || effects.moonMark}
      <span class="marks"
        >{language === 'fr' ? 'Cible marquée' : 'Marked target'} · {effects.sunMark
          ? '+'
          : ''}{effects.moonMark ? ' −' : ''}</span
      >
    {/if}
    {#if effects.manipulatedFrames > 0}
      <span class="marks"
        >Black Voice · {language === 'fr' ? 'ordre : recule' : 'order: retreat'}</span
      >
    {/if}
  </div>
{/if}

<style>
  .book-status {
    display: grid;
    gap: 0.15rem;
    margin-top: 0.35rem;
    color: #c6c9d8;
    font: 600 0.58rem/1.35 var(--font-mono);
    text-shadow: 0 1px 3px #000;
  }
  strong,
  .marks {
    color: #f1d36d;
  }
  .pages {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    max-height: 10rem;
    overflow-y: auto;
    scrollbar-gutter: stable;
    padding: 0.2rem;
  }
  .pages:focus-visible {
    outline: 2px solid #e2c979;
    outline-offset: 2px;
  }
  .pages span {
    max-width: 100%;
    border: 1px solid #51515a;
    padding: 0.12rem 0.3rem;
    border-radius: 2px;
    background: #10151de8;
  }
  .pages .open {
    border-color: #8fdfff;
    color: #8fdfff;
  }
  .pages .pinned {
    border-bottom: 2px solid #f07791;
  }
  .opponent {
    text-align: right;
  }
  @media (max-width: 600px) {
    .book-status {
      font-size: 0.48rem;
    }
  }
</style>
