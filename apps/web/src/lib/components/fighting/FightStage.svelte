<script lang="ts">
  import FightScene from './FightScene.svelte'
  import FightHud from './FightHud.svelte'
  import FightNenControls from './FightNenControls.svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { AttackKind, FightInput, FightNenCommand, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let onAttack: (kind: AttackKind) => void
  export let onControl: (key: keyof FightInput, active: boolean) => void
  export let onNen: (command: FightNenCommand) => void

  $: playerDefinition = fighterDefinition(state.player.id)
  $: specialLabel = language === 'fr' ? playerDefinition.specialFr : playerDefinition.specialEn
  $: sceneKey = `${state.player.id}:${state.opponent.id}:${JSON.stringify(state.player.nen)}:${JSON.stringify(state.opponent.nen)}`

  function hold(key: keyof FightInput, active: boolean) {
    onControl(key, active)
  }
</script>

<section class="fight-stage" aria-label={language === 'fr' ? 'Arène de combat' : 'Fight arena'}>
  <FightHud {state} />
  <FightNenControls fighter={state.player} {language} {onNen} />
  {#key sceneKey}
    <FightScene {state} />
  {/key}

  <div class="fighter-name" style={`left:${state.player.x}%;bottom:${4 + state.player.y * 0.62}%`}>
    {playerDefinition.name}
  </div>
  <div
    class="fighter-name"
    style={`left:${state.opponent.x}%;bottom:${4 + state.opponent.y * 0.62}%`}
  >
    {fighterDefinition(state.opponent.id).name}
  </div>

  {#if state.impact}
    {#key state.impact.sequence}
      <div class:blocked={state.impact.blocked} class="impact-flash"></div>
      <div class="damage-callout" class:from-player={state.impact.attacker === 'player'}>
        {state.impact.blocked ? (language === 'fr' ? 'GARDE' : 'BLOCK') : `-${state.impact.damage}`}
      </div>
    {/key}
  {/if}

  <div class="touch-controls">
    <div class="touch-group movement-controls">
      <button
        type="button"
        aria-label={language === 'fr' ? 'Aller à gauche' : 'Move left'}
        onpointerdown={() => hold('left', true)}
        onpointerup={() => hold('left', false)}
        onpointercancel={() => hold('left', false)}
        onpointerleave={() => hold('left', false)}>←</button
      >
      <button
        type="button"
        aria-label={language === 'fr' ? 'Sauter' : 'Jump'}
        onpointerdown={() => hold('jump', true)}
        onpointerup={() => hold('jump', false)}
        onpointercancel={() => hold('jump', false)}>↑</button
      >
      <button
        type="button"
        aria-label={language === 'fr' ? 'Aller à droite' : 'Move right'}
        onpointerdown={() => hold('right', true)}
        onpointerup={() => hold('right', false)}
        onpointercancel={() => hold('right', false)}
        onpointerleave={() => hold('right', false)}>→</button
      >
      <button
        type="button"
        aria-label={language === 'fr' ? 'Garde' : 'Block'}
        onpointerdown={() => hold('block', true)}
        onpointerup={() => hold('block', false)}
        onpointercancel={() => hold('block', false)}>G</button
      >
    </div>
    <div class="touch-group attack-controls">
      <button type="button" onclick={() => onAttack('light')}>J</button>
      <button type="button" onclick={() => onAttack('heavy')}>K</button>
      <button
        type="button"
        class="special-button"
        disabled={state.player.aura < 40 || state.player.nen.mode === 'zetsu'}
        aria-label={specialLabel}
        onclick={() => onAttack('special')}>L</button
      >
    </div>
  </div>
</section>

<style>
  .fight-stage {
    position: relative;
    overflow: hidden;
    min-height: min(68vh, 650px);
    border: 1px solid #31404c;
    border-radius: 3px;
    background: linear-gradient(#07121a 0 58%, #14202a 58% 61%, #0a0d10 61%);
    box-shadow:
      inset 0 0 80px #000,
      0 30px 80px rgb(0 0 0 / 45%);
    isolation: isolate;
    touch-action: none;
    user-select: none;
  }
  .fighter-name {
    position: absolute;
    z-index: 4;
    padding: 0.12rem 0.45rem;
    background: rgb(0 0 0 / 68%);
    color: #cad5dc;
    font: 600 0.58rem/1.2 var(--font-mono);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    transform: translateX(-50%);
    transition:
      left 45ms linear,
      bottom 35ms linear;
  }
  .impact-flash {
    position: absolute;
    z-index: 12;
    inset: 0;
    background: #fff;
    pointer-events: none;
    animation: flash 130ms ease-out forwards;
  }
  .impact-flash.blocked {
    background: #55b8ff;
  }
  .damage-callout {
    position: absolute;
    z-index: 13;
    top: 43%;
    left: 38%;
    color: #fff;
    font: 700 1.4rem/1 var(--font-display);
    text-shadow: 0 2px 8px #000;
    pointer-events: none;
    animation: callout 600ms ease-out forwards;
  }
  .damage-callout.from-player {
    left: 62%;
  }
  .touch-controls {
    position: absolute;
    z-index: 30;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  }
  .touch-group {
    display: flex;
    gap: 0.45rem;
    pointer-events: auto;
  }
  .touch-group button {
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border: 1px solid rgb(255 255 255 / 34%);
    border-radius: 50%;
    background: rgb(6 10 14 / 72%);
    color: #fff;
    font: 700 1rem/1 var(--font-mono);
    backdrop-filter: blur(5px);
  }
  .touch-group button:active {
    background: #c7952d;
    color: #080a0c;
  }
  .touch-group button:disabled {
    opacity: 0.35;
  }
  .special-button {
    border-color: #6dd9ff !important;
    box-shadow: inset 0 0 14px rgb(72 188 238 / 25%);
  }
  @keyframes flash {
    from {
      opacity: 0.42;
    }
    to {
      opacity: 0;
    }
  }
  @keyframes callout {
    from {
      opacity: 1;
      transform: scale(0.7);
    }
    to {
      opacity: 0;
      transform: translateY(-50px) scale(1.2);
    }
  }
  @media (hover: hover) and (pointer: fine) {
    .touch-controls {
      opacity: 0.5;
    }
    .touch-controls:hover {
      opacity: 1;
    }
  }
  @media (max-width: 700px) {
    .fight-stage {
      min-height: 590px;
    }
    .touch-controls {
      right: 0.55rem;
      bottom: 0.55rem;
      left: 0.55rem;
    }
    .touch-group {
      gap: 0.28rem;
    }
    .touch-group button {
      width: 42px;
      height: 42px;
    }
    .movement-controls {
      max-width: 185px;
      flex-wrap: wrap;
    }
    .damage-callout {
      top: 49%;
    }
  }
</style>
