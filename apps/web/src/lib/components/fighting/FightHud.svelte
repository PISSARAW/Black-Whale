<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import { auraDistribution, nenStatus } from '$lib/fighting/nen'
  import type { FightState } from '$lib/fighting/types'

  export let state: FightState

  $: player = fighterDefinition(state.player.id)
  $: opponent = fighterDefinition(state.opponent.id)
</script>

<div class="hud" aria-live="polite">
  <div class="fighter-meter player-meter">
    <div class="meter-label"><strong>{player.name}</strong><span>P1</span></div>
    <div class="health"><span style={`width:${state.player.health}%`}></span></div>
    <div class="aura"><span style={`width:${state.player.aura}%`}></span></div>
    <div class="nen-status">{nenStatus(state.player).join(' · ')}</div>
  </div>
  <div class="tower-score">
    <strong>{state.score.player}<span>/10</span></strong>
    <div class="timer">{Math.ceil(state.time)}</div>
    <strong>{state.score.opponent}<span>/10</span></strong>
  </div>
  <div class="fighter-meter opponent-meter">
    <div class="meter-label"><span>CPU</span><strong>{opponent.name}</strong></div>
    <div class="health"><span style={`width:${state.opponent.health}%`}></span></div>
    <div class="aura"><span style={`width:${state.opponent.aura}%`}></span></div>
    <div class="nen-status">
      {state.player.nen.gyo ? auraDistribution(state.opponent) : 'aura adverse masquée'}
    </div>
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
    .health {
      height: 13px;
    }
    .meter-label span {
      display: none;
    }
  }
</style>
