<script lang="ts">
  import { hunterOptions } from '$lib/fighting/skillHunterAcquisition'
  import { historicalOptions } from '$lib/fighting/chrolloHistoricalOptions'
  import { HISTORICAL_CHROLLO_PAGES } from '$lib/fighting/chrolloHistoricalPages'
  import { chrolloPageName } from '$lib/fighting/chrolloPageNames'
  import {
    liveBookEffects,
    liveFishRoomCue,
    liveBookMove,
    liveBookMoveReady,
    liveBookReady,
    type LiveBookActions,
  } from '$lib/fighting/chrolloLiveBook'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { performAuraAttack } from '$lib/fighting/engine'
  import { observeFightCommand } from '$lib/fighting/commandFeedback'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let side: FightSide = 'player'
  export let readOnly = false
  $: other = (side === 'player' ? 'opponent' : 'player') as FightSide
  export let actions: LiveBookActions
  let open = false
  $: fr = language === 'fr'
  $: book = state[side].chrolloBook
  $: ready = !readOnly && liveBookReady(state, side)
  $: options = open
    ? [...historicalOptions(state, side), ...hunterOptions(state, side)].filter(
        (option) => option.command.action !== 'history-page',
      )
    : []
  $: effects = liveBookEffects(state, language, side)
  $: roomCue = liveFishRoomCue(state, language, side)
  function use(command: ArsenalCommand) {
    actions.queueAction((current) =>
      observeFightCommand(current, { side, action: 'utility' }, (next) =>
        performArsenalAction({ state: next, side, command }, performAuraAttack),
      ),
    )
  }
  function selectPage(event: Event) {
    use({ action: 'history-page', target: (event.currentTarget as HTMLSelectElement).value })
  }
</script>

{#if book}
  <details
    class="live-book"
    bind:open
    aria-label={fr ? 'Livre de Chrollo en combat' : 'Chrollo combat book'}
  >
    <summary
      >{side === 'player' ? 'P1' : 'P2'} · {fr ? 'Livre' : 'Book'} · {chrolloPageName(
        book.pages[book.page],
        language,
      )} · {state[side].facing === 1 ? '→' : '←'}
      {Math.abs(state[side].x - state[other].x).toFixed(1)} u</summary
    >
    {#if open}
      <div
        class="book-panel"
        aria-label={fr ? 'Pages et actions de Skill Hunter' : 'Skill Hunter pages and actions'}
      >
        <p class="book-state" role="status">
          {book.open
            ? fr
              ? 'Livre ouvert · main droite occupée'
              : 'Book open · right hand occupied'
            : fr
              ? 'Livre fermé · mains libres'
              : 'Book closed · hands free'}
          <br />{fr ? 'Signet' : 'Bookmark'} : {chrolloPageName(book.bookmark, language)}
        </p>
        <p class="distance">
          {state[side].facing === 1 ? '→' : '←'} · {fr ? 'Distance du duel' : 'Duel distance'} : {Math.abs(
            state[side].x - state[other].x,
          ).toFixed(1)} u
        </p>
        {#if book.pages[book.page] === 'indoor-fish'}<p class="room-cue">{roomCue}</p>{/if}
        <label
          >{fr ? 'Page historique' : 'Historical page'}
          <select
            aria-label={fr ? 'Page de Skill Hunter' : 'Skill Hunter page'}
            value={book.pages[book.page]}
            disabled={!ready}
            onchange={selectPage}
          >
            {#each Object.entries(HISTORICAL_CHROLLO_PAGES) as [id, label] (id)}
              <option value={id}>{label}</option>
            {/each}
          </select>
        </label>
        <div class="book-moves">
          <button
            type="button"
            disabled={readOnly || !liveBookMoveReady(state, 'use', side)}
            onclick={() => actions.queueCommand(liveBookMove('use', side))}
            >{fr ? 'Utiliser la page' : 'Use page'}</button
          >
          <button
            type="button"
            disabled={readOnly || !liveBookMoveReady(state, 'bookmark', side)}
            onclick={() => actions.queueCommand(liveBookMove('bookmark', side))}>Double Face</button
          >
          <button
            type="button"
            disabled={readOnly || !liveBookMoveReady(state, 'secondary', side)}
            onclick={() => actions.queueCommand(liveBookMove('secondary', side))}
            >{fr ? 'Page au signet / Lune' : 'Bookmarked page / Moon'}</button
          >
        </div>
        {#each options as option (`${option.command.action}:${option.command.target ?? ''}`)}
          <button
            class="application"
            type="button"
            disabled={readOnly || !option.ready}
            title={fr ? option.conditionFr : option.conditionEn}
            onclick={() => use(option.command)}>{fr ? option.labelFr : option.labelEn}</button
          >
        {/each}
        {#each effects as effect (effect)}<p class="effect" role="status">{effect}</p>{/each}
        <small
          >{readOnly
            ? fr
              ? 'Replay · commandes verrouillées.'
              : 'Replay · controls locked.'
            : fr
              ? 'Le combat continue. Les contacts, les mains libres et les coûts restent nécessaires.'
              : 'Combat continues. Contact, free hands and costs still apply.'}</small
        >
      </div>
    {/if}
  </details>
{/if}

<style>
  .live-book {
    position: absolute;
    top: 8.6rem;
    right: 0.8rem;
    z-index: 28;
    width: min(310px, 42vw);
    color: #eee2fa;
    font: 0.72rem/1.4 var(--font-mono);
  }
  summary {
    padding: 0.6rem 0.8rem;
    border: 1px solid #9c7ab5;
    background: #180f23ed;
    cursor: pointer;
    min-height: 44px;
  }
  .book-panel {
    display: grid;
    gap: 0.4rem;
    padding: 0.65rem;
    max-height: 57vh;
    overflow: auto;
    background: #120b1bf0;
    border: 1px solid #725586;
  }
  p {
    margin: 0;
  }
  .book-state {
    color: #dac4ed;
  }
  .distance {
    color: #c6bdce;
  }
  label {
    display: grid;
    gap: 0.25rem;
  }
  select,
  button {
    width: 100%;
    min-height: 36px;
    border: 1px solid #816593;
    background: #2c1b39;
    color: #f2e7fa;
    padding: 0.35rem;
    font: inherit;
    cursor: pointer;
  }
  .book-moves {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.3rem;
  }
  .book-moves button:last-child {
    grid-column: 1 / -1;
  }
  button:disabled,
  select:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible,
  summary:focus-visible,
  select:focus-visible {
    outline: 2px solid #f6cb91;
    outline-offset: 2px;
  }
  .effect {
    padding: 0.25rem;
    border-left: 2px solid #daa5ff;
    color: #f0cdff;
  }
  small {
    color: #bcaec7;
    font-size: 0.65rem;
  }
  @media (max-width: 600px) {
    .live-book {
      top: 7.5rem;
      right: 0.4rem;
      width: min(280px, 62vw);
    }
  }
</style>
