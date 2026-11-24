<script lang="ts">
  import type { FighterState } from '$lib/combat/types'

  let {
    player,
    opponent,
    french,
    onToggle,
  }: {
    player: FighterState
    opponent?: FighterState
    french: boolean
    onToggle: (on: boolean) => void
  } = $props()

  const wounds = (count: number) =>
    french ? `${count} plaie${count === 1 ? '' : 's'}` : `${count} wound${count === 1 ? '' : 's'}`
</script>

<aside class="wounds" aria-label={french ? 'État des plaies' : 'Wound status'}>
  <div>
    <small>{french ? 'VOUS' : 'YOU'}</small>
    <strong class:open={player.openWounds > 0}>{wounds(player.openWounds)}</strong>
    {#if player.bloodLoss > 0}<span>−{player.bloodLoss} {french ? 'sang' : 'blood'}</span>{/if}
  </div>
  {#if opponent}
    <div>
      <small>{french ? 'CIBLE' : 'TARGET'}</small>
      <strong class:open={opponent.openWounds > 0}>{wounds(opponent.openWounds)}</strong>
      {#if opponent.bloodLoss > 0}<span>−{opponent.bloodLoss} {french ? 'sang' : 'blood'}</span
        >{/if}
    </div>
  {/if}
  {#if player.openWounds > 0}
    <button
      type="button"
      class:active={player.pluggingWounds}
      disabled={player.condition !== 'ready' || Boolean(player.intent)}
      onclick={() => onToggle(!player.pluggingWounds)}
    >
      {player.pluggingWounds
        ? french
          ? 'Relâcher les plaies'
          : 'Release wounds'
        : french
          ? 'Couvrir 2 plaies'
          : 'Cover 2 wounds'}
    </button>
  {/if}
</aside>

<style>
  .wounds {
    position: fixed;
    top: 5.2rem;
    left: 50%;
    z-index: 24;
    display: flex;
    gap: 0.45rem;
    align-items: stretch;
    padding: 0.4rem;
    color: #d8d1c7;
    background: rgb(17 10 11 / 88%);
    border: 1px solid rgb(186 55 55 / 45%);
    border-radius: 0.35rem;
    font: 600 0.62rem/1.15 var(--font-sans, sans-serif);
    transform: translateX(-50%);
    backdrop-filter: blur(8px);
  }

  div {
    display: grid;
    min-width: 4.8rem;
    padding: 0.15rem 0.35rem;
  }

  small,
  span {
    color: #9b8e8d;
    font-size: 0.52rem;
  }

  strong.open,
  span {
    color: #dc6767;
  }

  button {
    padding: 0 0.55rem;
    color: #eadede;
    background: rgb(112 30 35 / 45%);
    border: 1px solid rgb(215 91 96 / 48%);
    border-radius: 0.25rem;
    font: inherit;
    cursor: pointer;
  }

  button.active {
    color: #171112;
    background: #d6b4ae;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  @media (max-width: 700px) {
    .wounds {
      top: 4.4rem;
      width: calc(100vw - 1rem);
      justify-content: center;
    }
  }
</style>
