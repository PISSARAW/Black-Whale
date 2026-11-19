<script lang="ts">
  import { ARENA_FIGHTERS, arenaMoveLabels } from '$lib/arena/fighting'
  import type { FighterId } from '$lib/fighting/types'

  interface Props {
    fighterId: FighterId
    french: boolean
    disabled: boolean
    onFighterChange: (fighterId: FighterId) => void
    onMove: (slot: 'standingLight' | 'standingHeavy' | 'neutralSpecial') => void
  }

  let { fighterId, french, disabled, onFighterChange, onMove }: Props = $props()
  let moves = $derived(arenaMoveLabels(fighterId, french))
</script>

<article class="fighting-controls">
  <header>
    <span>{french ? 'Style de Fighting' : 'Fighting style'}</span>
    <select
      value={fighterId}
      aria-label={french ? 'Combattant' : 'Fighter'}
      onchange={(event) => onFighterChange(event.currentTarget.value as FighterId)}
    >
      {#each ARENA_FIGHTERS as fighter (fighter.id)}
        <option value={fighter.id}>{fighter.name}</option>
      {/each}
    </select>
  </header>
  <div>
    {#each moves as move, index (move.slot)}
      <button type="button" {disabled} onclick={() => onMove(move.slot)}>
        <kbd>{index === 0 ? 'Espace' : index === 1 ? 'X' : 'C'}</kbd>
        <strong>{move.name}</strong>
        {#if move.auraCost > 0}<small>−{move.auraCost} aura</small>{/if}
      </button>
    {/each}
  </div>
</article>

<style>
  .fighting-controls {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    display: grid;
    width: min(38rem, calc(100vw - 2rem));
    gap: 0.5rem;
    padding: 0.65rem;
    border: 1px solid rgb(255 215 0 / 24%);
    background: rgb(4 10 14 / 84%);
    pointer-events: auto;
    transform: translateX(-50%);
  }

  header,
  div,
  button {
    display: flex;
    align-items: center;
  }

  header {
    justify-content: space-between;
    gap: 0.5rem;
  }

  header span,
  small {
    color: #ffd700;
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  select {
    max-width: 9rem;
    color: #fffff0;
    border: 1px solid rgb(255 255 240 / 18%);
    background: #0b151b;
  }

  div {
    gap: 0.35rem;
  }

  button {
    flex: 1;
    min-width: 0;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.45rem;
    color: #fffff0;
    border: 1px solid rgb(255 255 240 / 15%);
    background: rgb(255 255 240 / 5%);
  }

  button:hover:not(:disabled) {
    border-color: #ffd700;
  }

  button strong {
    overflow: hidden;
    font-size: 0.65rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kbd {
    color: #ffd700;
    font-size: 0.58rem;
  }

  @media (max-width: 680px) {
    .fighting-controls {
      bottom: 0.5rem;
      width: calc(100vw - 1rem);
    }

    header span,
    button small {
      display: none;
    }

    div {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }

    button {
      display: grid;
    }
  }
</style>
