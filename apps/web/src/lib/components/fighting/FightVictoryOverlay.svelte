<script lang="ts">
  import FightHisokaFear from './FightHisokaFear.svelte'
  import FightBeyondCurse from './FightBeyondCurse.svelte'
  import FightGuardVictory from './FightGuardVictory.svelte'
  import FightMizaistomVictory from './FightMizaistomVictory.svelte'
  import FightBashoVictory from './FightBashoVictory.svelte'
  import FightLuiniVictory from './FightLuiniVictory.svelte'
  import FightLynchVictory from './FightLynchVictory.svelte'
  import FightRihanVictory from './FightRihanVictory.svelte'
  import FightSayirdVictory from './FightSayirdVictory.svelte'
  import { isBeyondCurse } from '$lib/fighting/victory/beyondCurseSelection'
  import FightHinrighVictory from './FightHinrighVictory.svelte'
  import FightSaiyuVictory from './FightSaiyuVictory.svelte'
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
  $: fatality = Boolean(frame)
  $: curse = isBeyondCurse(frame?.variant)
</script>

{#if frame?.active}
  <div
    class="victory-cinematic"
    role="region"
    aria-label={fr ? 'Cinématique de victoire' : 'Victory cinematic'}
    data-victory-cinematic
    data-winner={frame.fighter}
    data-target={state[frame.loser].id}
    data-variant={frame.variant}
    data-stage={state.environment.stageId}
    data-elapsed={frame.elapsed.toFixed(2)}
  >
    <div class="cinema-top"></div>
    <div class="cinema-bottom"></div>
    {#if curse}<FightBeyondCurse elapsed={frame.elapsed} {language} />{/if}
    {#if frame.fighter === 'longhi' || frame.fighter === 'furykov'}<FightGuardVictory
        target={state[frame.loser].id}
        fighter={frame.fighter}
        elapsed={frame.elapsed}
        {language}
      />{/if}
    {#if frame.fighter === 'hisoka'}<FightHisokaFear elapsed={frame.elapsed} />{/if}
    {#if frame.fighter === 'basho'}<FightBashoVictory elapsed={frame.elapsed} {language} />{/if}
    {#if frame.fighter === 'luini'}<FightLuiniVictory elapsed={frame.elapsed} {language} />{/if}
    {#if frame.fighter === 'lynch'}<FightLynchVictory elapsed={frame.elapsed} {language} />{/if}
    {#if frame.fighter === 'rihan'}<FightRihanVictory
        target={state[frame.loser].id}
        elapsed={frame.elapsed}
        {language}
      />{/if}
    {#if frame.fighter === 'mizaistom'}<FightMizaistomVictory
        elapsed={frame.elapsed}
        {language}
      />{/if}
    {#if frame.fighter === 'sayird'}<FightSayirdVictory elapsed={frame.elapsed} />{/if}
    {#if !curse && frame.fighter === 'tserriednich'}<FightFutureVictory
        elapsed={frame.elapsed}
        {language}
      />{/if}
    {#if frame.fighter === 'hinrigh'}<FightHinrighVictory elapsed={frame.elapsed} />{/if}
    {#if frame.fighter === 'saiyu'}<FightSaiyuVictory elapsed={frame.elapsed} {language} />{/if}
    <p class="cinematic-match" aria-live="polite">
      {fighterDefinition(frame.fighter).name}
      <span>{fr ? 'remporte le combat' : 'wins the fight'}</span>
    </p>
    {#if frame.variant === 'chrollo-sun-moon' && frame.elapsed >= 2.35}
      <div class="cinematic-verdict">
        <strong>{fr ? 'VICTOIRE' : 'VICTORY'}</strong><b>Sun and Moon</b>
        <span>{fr ? 'Détonation décisive' : 'Decisive detonation'}</span>
      </div>
    {:else if curse && frame.elapsed >= 8.5}
      <div class="cinematic-verdict">
        <strong>FATALITY</strong><b>{fr ? 'L’héritage de Beyond' : 'Beyond’s legacy'}</b>
        <span
          >{fighterDefinition(state[frame.loser].id).name} · {fr
            ? 'Nen post mortem'
            : 'Post-mortem Nen'}</span
        >
      </div>
    {:else if !curse && !(frame.fighter === 'camilla' && frame.elapsed >= 8.5) && frame.elapsed >= (frame.fighter === 'kurapika' || ['hisoka', 'tserriednich', 'chrollo', 'leorio', 'halkenburg', 'camilla', 'kalluto', 'machi', 'shizuku', 'bonolenov', 'illumi', 'biscuit', 'saiyu', 'hanzo', 'bill', 'melody', 'hinrigh', 'terebellum', 'voconte', 'longhi', 'furykov', 'theta', 'mizaistom', 'rihan', 'zakuro', 'lynch', 'luini', 'basho', 'sayird'].includes(frame.fighter) ? 8 : 7)}
      <div class="cinematic-verdict">
        <strong
          >{frame.fighter === 'melody'
            ? 'FRIENDSHIP'
            : fatality
              ? 'FATALITY'
              : fr
                ? 'VICTOIRE'
                : 'VICTORY'}</strong
        ><b>{fighterDefinition(frame.fighter).name}</b><span
          >{frame.variant === 'kurapika-judgment'
            ? fr
              ? 'La dernière condition'
              : 'The final condition'
            : frame.variant === 'kurapika-troupe'
              ? fr
                ? 'La colère écarlate'
                : 'Scarlet fury'
              : VICTORY_TITLES[frame.fighter][fr ? 0 : 1]}</span
        >
      </div>
    {/if}
    {#if frame.variant === 'kurapika-judgment' && frame.elapsed >= 3 && frame.elapsed < 5.8}
      <p class="judgment-condition">
        {fr ? '« N’utilise plus le Nen. »' : '“Do not use Nen again.”'}
      </p>
    {/if}
    <button type="button" class="skip-victory" onclick={onSkip}
      >{fr ? 'Passer' : 'Skip'} <kbd>{fr ? 'Échap' : 'Esc'}</kbd></button
    >
  </div>
{/if}

<style>
  .judgment-condition {
    position: absolute;
    left: 50%;
    bottom: 13%;
    transform: translateX(-50%);
    margin: 0;
    padding: 0.7rem 1.2rem;
    border: 1px solid #b98e60;
    background: #090b10dd;
    color: #f5d3a2;
    white-space: nowrap;
    font-size: clamp(12px, 1.7vw, 24px);
    letter-spacing: 0.07em;
  }

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
