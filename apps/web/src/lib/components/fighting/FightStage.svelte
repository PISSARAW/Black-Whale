<script lang="ts">
  import { clashCareer } from '$lib/fighting/career/profile'
  import FightTouchControls from './FightTouchControls.svelte'
  import FightDecisionReadout from './FightDecisionReadout.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  export let comfort = defaultFightComfort()
  import { parallelFutureCamera } from '$lib/fighting/parallelFutureCamera'
  import FightParallelFuture from './FightParallelFuture.svelte'
  import FightBlinkyPanel from './FightBlinkyPanel.svelte'
  import type { BlinkyTarget, BlinkyCommand } from '$lib/fighting/blinky'
  import FightLiveScene from './FightLiveScene.svelte'
  import FightEasterEggs from './FightEasterEggs.svelte'
  import FightEasterEggCaptions from './FightEasterEggCaptions.svelte'
  import { defaultEasterEggPreferences } from '$lib/fighting/easterEggPreferences'
  import type { EasterEggSlot } from '$lib/fighting/easterEggCatalogue'
  import FightSaiyuSenses from './FightSaiyuSenses.svelte'
  import FightHud from './FightHud.svelte'
  import FightCatsName from './FightCatsName.svelte'
  import FightResources from './FightResources.svelte'
  import FightTrainingOverlay from './FightTrainingOverlay.svelte'
  import FightAudio from './FightAudio.svelte'
  import { isThrowTech } from '$lib/fighting/reactionMotion'
  import { impactCallout } from '$lib/fighting/impactCallout'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import type { AttackKind, FightInput, FightState, FightSide } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let stageId: FightStageId = DEFAULT_FIGHT_STAGE
  export let onAttack: (kind: AttackKind) => void
  export let onThrow: () => void
  export let onCall: () => void
  export let onFinisher: () => void
  export let onEmperor: () => void = () => {}
  export let onControl: (key: keyof FightInput, active: boolean) => void
  export let onTalk: (side: FightSide) => void = () => {}
  export let onBattleAction: (side: FightSide, moveId: string) => void = () => {}
  export let onBlinkyTarget: (side: FightSide, target: BlinkyTarget) => void = () => {}
  export let onBlinkyCommand: (side: FightSide, command: BlinkyCommand) => void = () => {}
  export let onOpponentControl: (key: keyof FightInput, active: boolean) => void = () => {}
  export let detailed = false
  export let showControls = false
  export let training = false
  export let paused = false
  export let easterEggPreferences = defaultEasterEggPreferences()
  export let onEasterEgg: (side: FightSide, slot: EasterEggSlot) => void = () => {}
  let sensoryViewer: 'player' | 'opponent' = 'player'
  let futureViewer: 'player' | 'opponent' = 'player'
  let futurePreview: number | null = null
  $: visibleState = parallelFutureCamera(state, futureViewer, futurePreview).main
  $: sceneKey = `${stageId}:${state.player.id}:${state.opponent.id}`
  $: throwTech = isThrowTech(visibleState)
</script>

<FightAudio {state} {language} {paused} viewer={sensoryViewer} />
<section
  class="fight-stage"
  data-clash-theme={$clashCareer.appearance.theme}
  class:high-contrast={comfort.highContrast}
  data-shake={comfort.shake}
  data-flashes={comfort.flashes}
  aria-label={language === 'fr' ? 'Arène de combat' : 'Fight arena'}
>
  <div class="fight-arena">
    <FightHud state={visibleState} {language} {detailed} />
    <FightCatsName state={visibleState} {language} />
    <FightEasterEggCaptions state={visibleState} {language} />
    {#key sceneKey}
      <FightLiveScene
        {state}
        {stageId}
        {language}
        {comfort}
        viewer={state.parallelFuture ? futureViewer : sensoryViewer}
        previewIndex={futurePreview}
        appearance={$clashCareer.appearance}
      />
    {/key}

    {#if training}
      <FightTrainingOverlay state={visibleState} {language} />
    {/if}

    {#if visibleState.impact}
      {#key visibleState.impact.sequence}
        {#if comfort.flashes}<div
            class:blocked={visibleState.impact.blocked}
            class="impact-flash"
          ></div>{/if}
        <div class="damage-callout" class:from-player={visibleState.impact.attacker === 'player'}>
          {impactCallout(visibleState.impact, language)}
        </div>
      {/key}
    {/if}
    {#if throwTech}<div class="damage-callout">THROW TECH</div>{/if}
    <FightSaiyuSenses {state} {language} bind:viewer={sensoryViewer} />
  </div>
  <FightParallelFuture
    {state}
    {language}
    bind:viewer={futureViewer}
    bind:scrub={futurePreview}
    onOpenEyes={() => onAttack('special')}
  />
  <FightDecisionReadout state={visibleState} {language} />
  {#if showControls}<FightTouchControls
      state={visibleState}
      {language}
      {onAttack}
      {onThrow}
      {onCall}
      {onFinisher}
      {onControl}
    />{/if}
  <FightBlinkyPanel
    state={visibleState}
    {language}
    onTarget={onBlinkyTarget}
    onCommand={onBlinkyCommand}
    onHold={(side, key, active) =>
      side === 'player' ? onControl(key, active) : onOpponentControl(key, active)}
  />
  <FightResources
    {onOpponentControl}
    {onTalk}
    {onBattleAction}
    {onControl}
    state={visibleState}
    {language}
    {detailed}
    {showControls}
    {onEmperor}
    onAura={(active) => onControl('aura', active)}
  />
  <FightEasterEggs
    {state}
    {language}
    {paused}
    bind:preferences={easterEggPreferences}
    onPlay={onEasterEgg}
  />
</section>

<style>
  .fight-stage[data-clash-theme='heavens'] {
    border-color: #a6e5ff;
  }
  .fight-stage[data-clash-theme='nocturne'] {
    border-color: #d3a9ff;
  }
  .fight-stage {
    --hud-font: calc(0.75rem * var(--hud-scale, 1));
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid #31404c;
    background: #080f15;
  }
  .fight-arena {
    position: relative;
    overflow: hidden;
    min-height: 360px;
    height: min(68vh, 720px);
    flex: 1 0 auto;
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
  .high-contrast .fight-arena {
    filter: contrast(1.25);
  }
  @media (prefers-reduced-motion: reduce) {
    .impact-flash {
      display: none;
    }
    .damage-callout {
      animation-name: callout-fade;
    }
  }
  @keyframes callout-fade {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
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
  @media (max-width: 700px) {
    .fight-arena {
      height: 56vh;
      min-height: 360px;
    }
    .damage-callout {
      top: 49%;
    }
  }
</style>
