<script lang="ts">
  import type { ArenaReplay } from '$lib/arena/replay/types'
  import { stateAtTick } from '$lib/arena/replay/player'
  import { projectFrame, type ReplayPerspective } from '$lib/arena/replay/perspective'

  interface Props {
    replay: ArenaReplay
    locale: 'fr' | 'en'
  }

  let { replay, locale }: Props = $props()
  let tick = $state(replay.ticks)
  let perspective = $state<ReplayPerspective>('player')
  let frame = $derived(projectFrame(stateAtTick(replay, tick), perspective))
  let event = $derived(frame.event)

  function seek(by: number) {
    tick = Math.max(0, Math.min(replay.ticks, tick + by))
  }
</script>

<section class="replay-panel" aria-label={locale === 'fr' ? 'Replay du duel' : 'Match replay'}>
  <header>
    <strong>REPLAY · {(tick / replay.tickRate).toFixed(1)}s</strong>
    <div>
      {#each ['reality', 'player', 'opponent'] as view}
        <button
          class:active={perspective === view}
          onclick={() => (perspective = view as ReplayPerspective)}
        >
          {view}
        </button>
      {/each}
    </div>
  </header>
  <input
    type="range"
    min="0"
    max={replay.ticks}
    step="1"
    bind:value={tick}
    aria-label={locale === 'fr' ? 'Position du replay' : 'Replay position'}
  />
  <nav>
    <button onclick={() => seek(-replay.tickRate)}>−1s</button>
    <button onclick={() => seek(-1)}>−1</button>
    <button onclick={() => seek(1)}>+1</button>
    <button onclick={() => seek(replay.tickRate)}>+1s</button>
  </nav>
  <div class="readings">
    <span>P · {frame.player.aura === null ? '?' : Math.ceil(frame.player.aura)} aura</span>
    <span>O · {frame.opponent.aura === null ? '?' : Math.ceil(frame.opponent.aura)} aura</span>
  </div>
  {#if event}
    <p>
      <b>{event.technique.toUpperCase()}</b> · {event.zone} · {event.impact}
      {#if event.points > 0}
        · +{event.points}{/if}
    </p>
  {:else}
    <p>{locale === 'fr' ? 'Aucun échange à cet instant.' : 'No exchange at this moment.'}</p>
  {/if}
</section>

<style>
  .replay-panel {
    width: min(34rem, 92vw);
    margin: 0.8rem auto;
    padding: 0.8rem;
    border: 1px solid #7bc6d755;
    background: #061116e8;
  }
  header,
  header div,
  nav,
  .readings {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
  }
  button {
    border: 1px solid #81c9d755;
    background: #0a171c;
    color: #b9ced3;
    padding: 0.3rem 0.5rem;
    font:
      0.55rem 'IBM Plex Mono',
      monospace;
  }
  button.active {
    border-color: #e3c36d;
    color: #e3c36d;
  }
  input {
    width: 100%;
    margin: 0.65rem 0;
    accent-color: #e3c36d;
  }
  .readings,
  p {
    margin-top: 0.55rem;
    color: #a9c0c5;
    font:
      0.58rem 'IBM Plex Mono',
      monospace;
  }
  p {
    margin-bottom: 0;
  }
</style>
