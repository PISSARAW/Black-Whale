<script lang="ts">
  import { ARENA_FIGHTERS, arenaMoveLabels } from '$lib/arena/fighting'
  import type { ArenaDirection } from '$lib/arena/moveSlot'
  import type { BodyZone } from '$lib/combat/types'
  import type { FighterId, MoveAction } from '$lib/fighting/types'

  interface Props {
    playerFighterId: FighterId
    opponentFighterId: FighterId
    french: boolean
    disabled: boolean
    direction: ArenaDirection
    aimed: BodyZone
    combo: number
    onPlayerChange: (fighterId: FighterId) => void
    onOpponentChange: (fighterId: FighterId) => void
    onMove: (action: MoveAction) => void
  }

  let {
    playerFighterId,
    opponentFighterId,
    french,
    disabled,
    direction,
    aimed,
    combo,
    onPlayerChange,
    onOpponentChange,
    onMove,
  }: Props = $props()
  let moves = $derived(arenaMoveLabels(playerFighterId, french, { direction, aimed }))
</script>

<article class="fighting-controls">
  <header>
    <span>
      {#if combo > 1}<b class="combo" role="status">{combo} {french ? 'coups' : 'hits'}</b
        >{:else}{french ? 'Duel en vue subjective' : 'First-person duel'}{/if}
    </span>
    <div class="fighters">
      <label>
        <small>{french ? 'Vous' : 'You'}</small>
        <select
          value={playerFighterId}
          aria-label={french ? 'Personnage incarné' : 'Player fighter'}
          onchange={(event) => onPlayerChange(event.currentTarget.value as FighterId)}
        >
          {#each ARENA_FIGHTERS as fighter (fighter.id)}
            <option value={fighter.id}>{fighter.name}</option>
          {/each}
        </select>
      </label>
      <b>VS</b>
      <label>
        <small>{french ? 'Adversaire' : 'Opponent'}</small>
        <select
          value={opponentFighterId}
          aria-label={french ? 'Personnage adverse' : 'Opponent fighter'}
          onchange={(event) => onOpponentChange(event.currentTarget.value as FighterId)}
        >
          {#each ARENA_FIGHTERS as fighter (fighter.id)}
            <option value={fighter.id}>{fighter.name}</option>
          {/each}
        </select>
      </label>
    </div>
  </header>
  <div
    class="moves"
    title={french
      ? 'Avancer / reculer et viser les jambes changent la variante. Enchaîne pendant l’impact.'
      : 'Moving forward / back and aiming at the legs change the variant. Chain on impact.'}
  >
    {#each moves as move (move.action)}
      <button
        type="button"
        disabled={disabled || !move.name}
        title={move.slot}
        data-arena-action={move.action === 'light' ? 'strike' : undefined}
        onclick={() => onMove(move.action)}
      >
        <kbd>{move.key}</kbd>
        <strong>{move.name ?? '—'}</strong>
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
    width: min(46rem, calc(100vw - 2rem));
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

  .fighters,
  label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  label small {
    color: #9eb7bd;
  }

  .fighters b {
    color: #ffd700;
    font-size: 0.58rem;
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

  .combo {
    color: #fffff0;
  }

  @media (max-width: 680px) {
    .fighting-controls {
      bottom: 0.5rem;
      width: calc(100vw - 1rem);
    }

    header span,
    label small,
    button small {
      display: none;
    }

    .fighters {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }

    .moves {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }

    button {
      display: grid;
    }
  }
</style>
