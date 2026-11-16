<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import { fightFormat } from '$lib/fighting/formats'
  import { bungeeVisible } from '$lib/fighting/hisokaTechnique'
  import { auraDistribution, nenStatus } from '$lib/fighting/nen'
  import type { FightState } from '$lib/fighting/types'
  import FightChrolloStatus from './FightChrolloStatus.svelte'
  import FightGrudge from './FightGrudge.svelte'
  import FightPainPacker from './FightPainPacker.svelte'

  export let state: FightState
  export let language: 'fr' | 'en'

  $: player = fighterDefinition(state.player.id)
  $: opponent = fighterDefinition(state.opponent.id)
  $: format = fightFormat(state.formatId)
  $: visibleBungee = bungeeVisible(state)
</script>

<div class="hud" aria-live="polite">
  <div class="fighter-meter player-meter">
    <div class="meter-label">
      <strong>{player.name}</strong><span
        >P1 · {'●'.repeat(state.roundsWon.player)}{'○'.repeat(2 - state.roundsWon.player)}</span
      >
    </div>
    <div class="health"><span style={`width:${state.player.health}%`}></span></div>
    <div class="aura"><span style={`width:${state.player.aura}%`}></span></div>
    <div class="nen-status">{nenStatus(state.player).join(' · ')}</div>
    <FightGrudge fighter={state.player} {language} />
    <FightPainPacker fighter={state.player} {language} />
    <FightChrolloStatus {state} side="player" {language} />
    {#if state.player.textureSurprise}
      <div class="secret-status">Texture Surprise · {language === 'fr' ? 'tissu masqué' : 'cloth disguised'}</div>
    {/if}
    {#if visibleBungee}
      <div class="secret-status">
        {state.bungeeGum?.retracting
          ? state.bungeeGum.rebounding
            ? language === 'fr'
              ? 'Bungee Gum · rebond'
              : 'Bungee Gum · rebound'
            : language === 'fr'
              ? 'Bungee Gum · rappel'
              : 'Bungee Gum · recall'
          : state.bungeeGum?.owner === 'player'
            ? language === 'fr'
              ? 'Bungee Gum · attaché'
              : 'Bungee Gum · attached'
            : language === 'fr'
              ? 'Bungee Gum détecté'
              : 'Bungee Gum detected'}
      </div>
    {/if}
  </div>
  <div class="tower-score">
    <small>{language === 'fr' ? format.titleFr : format.titleEn}</small>
    <strong>
      {format.hitTarget === null ? Math.ceil(state.player.health) : state.score.player}<span
        >{format.hitTarget === null
          ? language === 'fr'
            ? ' PV'
            : ' HP'
          : `/${format.hitTarget}`}</span
      >
    </strong>
    {#if format.knockdownTarget !== null}
      <div class="knockdown-score">
        <span>{state.knockdowns.player} KD</span>
        <span>{state.knockdowns.opponent} KD</span>
      </div>
    {/if}
    <div class="timer">{Math.ceil(state.time)}</div>
    <strong>
      {format.hitTarget === null ? Math.ceil(state.opponent.health) : state.score.opponent}<span
        >{format.hitTarget === null
          ? language === 'fr'
            ? ' PV'
            : ' HP'
          : `/${format.hitTarget}`}</span
      >
    </strong>
  </div>
  <div class="fighter-meter opponent-meter">
    <div class="meter-label">
      <span
        >{state.mode === 'versus-ai' ? 'CPU' : state.mode === 'training' ? 'DUMMY' : 'P2'} · {'●'.repeat(
          state.roundsWon.opponent,
        )}{'○'.repeat(2 - state.roundsWon.opponent)}</span
      ><strong>{opponent.name}</strong>
    </div>
    <div class="health"><span style={`width:${state.opponent.health}%`}></span></div>
    <div class="aura"><span style={`width:${state.opponent.aura}%`}></span></div>
    <div class="nen-status">
      {state.player.nen.gyo
        ? auraDistribution(state.opponent)
        : language === 'fr'
          ? 'aura adverse masquée'
          : 'opponent aura hidden'}
    </div>
    <FightGrudge fighter={state.opponent} {language} />
    <FightPainPacker fighter={state.opponent} {language} />
    <FightChrolloStatus {state} side="opponent" {language} />
    {#if state.opponent.textureSurprise}
      <div class="secret-status">Texture Surprise · {language === 'fr' ? 'tissu masqué' : 'cloth disguised'}</div>
    {/if}
  </div>
</div>

<style>
  .hud {
    position: absolute;
    z-index: 20;
    top: 1rem;
    left: 50%;
    display: grid;
    width: min(94%, 1050px);
    grid-template-columns: 1fr 72px 1fr;
    gap: 0.75rem;
    transform: translateX(-50%);
  }
  .meter-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    color: #fff;
    font: 700 clamp(0.7rem, 1.5vw, 1rem)/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 2px 3px #000;
  }
  .meter-label span {
    color: #a7b4c2;
    font: 600 0.65rem/1 var(--font-mono);
  }
  .health,
  .aura {
    overflow: hidden;
    border: 2px solid rgb(255 255 255 / 65%);
    background: rgb(4 8 12 / 82%);
    transform: skewX(-9deg);
  }
  .health {
    height: 17px;
  }
  .aura {
    height: 7px;
    margin-top: 4px;
    border-width: 1px;
  }
  .health span,
  .aura span {
    display: block;
    height: 100%;
    transition: width 160ms ease-out;
  }
  .health span {
    background: linear-gradient(90deg, #a61d2d, #f2c84b 35%, #dff46b);
  }
  .aura span {
    background: linear-gradient(90deg, #2a87ff, #7de7ff);
    box-shadow: 0 0 8px #67dff8;
  }
  .nen-status {
    margin-top: 0.3rem;
    color: #8fdfff;
    font: 600 0.55rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 1px 4px #000;
  }
  .secret-status {
    margin-top: 0.25rem;
    color: #ff80dc;
    font: 700 0.52rem/1 var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    text-shadow: 0 0 7px #7e185f;
  }
  .opponent-meter .meter-label {
    text-align: right;
  }
  .opponent-meter .health,
  .opponent-meter .aura {
    transform: scaleX(-1) skewX(-9deg);
  }
  .opponent-meter .nen-status {
    text-align: right;
  }
  .tower-score {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
    color: #f1d36d;
    font: 800 0.9rem/1 var(--font-display);
  }
  .tower-score > strong {
    position: absolute;
    top: 62px;
  }
  .tower-score > small {
    position: absolute;
    top: -0.1rem;
    width: 8rem;
    color: #f1d36d;
    font: 700 0.46rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-align: center;
    text-transform: uppercase;
    text-shadow: 0 1px 3px #000;
  }
  .tower-score > strong:first-child {
    transform: translateX(-24px);
  }
  .tower-score > strong:last-child {
    transform: translateX(24px);
  }
  .tower-score span {
    color: #8998a1;
    font: 600 0.45rem/1 var(--font-mono);
  }
  .knockdown-score {
    position: absolute;
    top: 79px;
    display: flex;
    width: 86px;
    justify-content: space-between;
    color: #f1d36d;
    font: 700 0.44rem/1 var(--font-mono);
    letter-spacing: 0.04em;
  }
  .timer {
    display: grid;
    height: 58px;
    place-items: center;
    border: 2px solid #d9b650;
    background: rgb(5 9 13 / 88%);
    color: #fff;
    font: 700 2rem/1 var(--font-display);
    box-shadow: 0 0 0 3px rgb(0 0 0 / 60%);
  }
  @media (max-width: 600px) {
    .hud {
      top: 0.65rem;
      grid-template-columns: 1fr 48px 1fr;
      gap: 0.35rem;
    }
    .timer {
      height: 45px;
      font-size: 1.4rem;
    }
    .tower-score > strong {
      top: 49px;
      font-size: 0.75rem;
    }
    .knockdown-score {
      top: 64px;
      width: 70px;
    }
    .health {
      height: 13px;
    }
    .meter-label span {
      display: none;
    }
  }
</style>
