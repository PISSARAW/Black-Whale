<script lang="ts">
  import FightFutureVictory from './FightFutureVictory.svelte'
  import { VICTORY_TITLES } from '$lib/fighting/victory/catalogue'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { FightState } from '$lib/fighting/types'
  export let frame: VictoryFrame | null
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onSkip: () => void
  $: fr = language === 'fr'
  $: fatality = frame && frame.fighter !== 'hisoka'
</script>

{#if frame?.active}
  <div
    class="victory-cinematic"
    role="region"
    aria-label={fr ? 'Cinématique de victoire' : 'Victory cinematic'}
    data-victory-cinematic
    data-winner={frame.fighter}
    data-target={state[frame.loser].id}
    data-stage={state.environment.stageId}
    data-elapsed={frame.elapsed.toFixed(2)}
  >
    <div class="cinema-top"></div>
    <div class="cinema-bottom"></div>
    {#if frame.fighter === 'tserriednich'}<FightFutureVictory
        elapsed={frame.elapsed}
        {language}
      />{/if}
    <p class="cinematic-match" aria-live="polite">
      {fighterDefinition(frame.fighter).name}
      <span>{fr ? 'remporte le combat' : 'wins the fight'}</span>
    </p>
    {#if !(frame.fighter === 'camilla' && frame.elapsed >= 8.5) && frame.elapsed >= (['tserriednich', 'chrollo', 'leorio', 'halkenburg', 'camilla'].includes(frame.fighter) ? 8 : 7)}
      <div class="cinematic-verdict">
        <strong>{fatality ? 'FATALITY' : fr ? 'VICTOIRE' : 'VICTORY'}</strong><b
          >{fighterDefinition(frame.fighter).name}</b
        ><span>{VICTORY_TITLES[frame.fighter][fr ? 0 : 1]}</span>
      </div>
    {/if}
    <button type="button" class="skip-victory" onclick={onSkip}
      >{fr ? 'Passer' : 'Skip'} <kbd>{fr ? 'Échap' : 'Esc'}</kbd></button
    >
  </div>
{/if}

<style>
  .victory-cinematic {
    position: absolute;
    inset: 0;
    z-index: 35;
    pointer-events: none;
    color: #f5eee6;
    font-family: var(--font-display, sans-serif);
  }
  .cinema-top,
  .cinema-bottom {
    position: absolute;
    height: 7%;
    left: 0;
    right: 0;
    background: #06070b;
  }
  .cinema-top {
    top: 0;
  }
  .cinema-bottom {
    bottom: 0;
  }
  .cinematic-match {
    position: absolute;
    top: 1.5%;
    left: 3%;
    margin: 0;
    font-size: clamp(10px, 1.5vw, 16px);
    letter-spacing: 0.08em;
  }
  .cinematic-match span {
    color: #b8b0a9;
    font-size: 0.8em;
    margin-left: 0.6em;
  }
  .cinematic-verdict {
    position: absolute;
    top: 42%;
    left: 5%;
    display: grid;
    gap: 0.6rem;
    max-width: 42%;
    text-shadow: 0 3px 15px #000;
  }
  .cinematic-verdict strong {
    color: #f1a05d;
    font:
      900 clamp(22px, 4.6vw, 64px)/1 Georgia,
      serif;
    letter-spacing: 0.07em;
  }
  .cinematic-verdict b {
    font-size: clamp(12px, 2vw, 25px);
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }
  .cinematic-verdict span {
    font-size: clamp(9px, 1vw, 13px);
    color: #dcc3b2;
  }
  .skip-victory {
    position: absolute;
    pointer-events: auto;
    right: 3%;
    bottom: 1%;
    min-height: 30px;
    padding: 0.25rem 0.65rem;
    color: #f7eee6;
    background: #12121b;
    border: 1px solid #9c8b79;
    border-radius: 3px;
    cursor: pointer;
    font: 600 12px/1.3 var(--font-mono, monospace);
  }
  .skip-victory:focus-visible {
    outline: 2px solid #f9cd78;
    outline-offset: 2px;
  }
  kbd {
    color: #c8bba9;
    font: inherit;
    margin-left: 0.5rem;
  }
  @media (max-width: 600px) {
    .cinematic-verdict {
      top: auto;
      bottom: 12%;
      max-width: 65%;
      gap: 0.35rem;
    }
    .cinematic-match span {
      display: none;
    }
  }
</style>
