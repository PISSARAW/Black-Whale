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
    airborne: boolean
    combo: number
    onPlayerChange: (fighterId: FighterId) => void
    onOpponentChange: (fighterId: FighterId) => void
    onMove: (action: MoveAction) => void
    onJump: () => void
  }

  let {
    playerFighterId,
    opponentFighterId,
    french,
    disabled,
    direction,
    aimed,
    airborne,
    combo,
    onPlayerChange,
    onOpponentChange,
    onMove,
    onJump,
  }: Props = $props()
  let moves = $derived(arenaMoveLabels(playerFighterId, french, { direction, aimed, airborne }))
  let labOpen = $state(false)
  let inspected = $state<MoveAction>('light')
  let sample = $derived(moves.find(({ action }) => action === inspected) ?? moves[0])
</script>

<article class="fighting-controls">
  <header>
    <span>
      {#if combo > 1}<b class="combo" role="status">{combo} {french ? 'coups' : 'hits'}</b
        >{:else}{french ? 'Duel en vue subjective' : 'First-person duel'}{/if}
    </span>
    <button
      class="lab-toggle"
      type="button"
      aria-pressed={labOpen}
      onclick={() => (labOpen = !labOpen)}>{french ? 'LABO' : 'LAB'}</button
    >
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
    <button type="button" disabled={disabled || airborne} onclick={onJump}>
      <kbd>U</kbd>
      <strong>{french ? 'Saut' : 'Jump'}</strong>
    </button>
    {#each moves as move (move.action)}
      <button
        type="button"
        disabled={disabled || !move.name}
        title={move.slot}
        data-arena-action={move.action === 'light' ? 'strike' : undefined}
        onfocus={() => (inspected = move.action)}
        onpointerenter={() => (inspected = move.action)}
        onclick={() => onMove(move.action)}
      >
        <kbd>{move.key}</kbd>
        <strong>{move.name ?? '—'}</strong>
        {#if move.auraCost > 0}<small>−{move.auraCost} aura</small>{/if}
      </button>
    {/each}
  </div>
  {#if labOpen && sample?.frames}
    <footer class="frame-data" aria-live="polite">
      <strong>{sample.name}</strong>
      <span><b>{sample.frames.startup}</b>f {french ? 'démarrage' : 'startup'}</span>
      <span><b>{sample.frames.active}</b>f {french ? 'actif' : 'active'}</span>
      <span><b>{sample.frames.recovery}</b>f {french ? 'récup.' : 'recovery'}</span>
      <span>{french ? 'Touche' : 'Hit'} <b>{sample.frames.onHit}</b></span>
      <span>{french ? 'Garde' : 'Block'} <b>{sample.frames.onBlock}</b></span>
      {#if sample.frames.safeOnBlock !== null}
        <em class:safe={sample.frames.safeOnBlock}
          >{sample.frames.safeOnBlock
            ? french
              ? 'SÛR'
              : 'SAFE'
            : french
              ? 'PUNISSABLE'
              : 'PUNISHABLE'}</em
        >
      {/if}
    </footer>
  {/if}
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

  .lab-toggle {
    flex: 0 0 auto;
    padding: 0.25rem 0.45rem;
    color: #73d8ee;
    border-color: #73d8ee66;
    font:
      600 0.52rem 'IBM Plex Mono',
      monospace;
    letter-spacing: 0.12em;
  }

  .lab-toggle[aria-pressed='true'] {
    color: #071318;
    background: #73d8ee;
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

  .frame-data {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    padding: 0.4rem 0.5rem;
    color: #a9bec4;
    border-top: 1px solid #73d8ee44;
    font:
      500 0.55rem 'IBM Plex Mono',
      monospace;
  }

  .frame-data strong {
    overflow: hidden;
    margin-right: auto;
    color: #fffff0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .frame-data b {
    color: #73d8ee;
  }

  .frame-data em {
    color: #ff9f84;
    font-style: normal;
  }

  .frame-data em.safe {
    color: #8ed9a6;
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
      grid-template-columns: repeat(3, 1fr);
    }

    .frame-data {
      display: grid;
      grid-template-columns: repeat(3, auto);
      gap: 0.25rem 0.55rem;
    }

    .frame-data strong {
      grid-column: 1 / -1;
    }

    button {
      display: grid;
    }
  }
</style>
