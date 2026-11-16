<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { futureVisibleState } from '$lib/fighting/parallelFuturePresentation'
  import FightParallelFuture from './FightParallelFuture.svelte'
  import FightBlinkyPanel from './FightBlinkyPanel.svelte'
  import type { BlinkyTarget, BlinkyCommand } from '$lib/fighting/blinky'
  import FightScene from './FightScene.svelte'
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
  import FightHanzoCall from './FightHanzoCall.svelte'
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { isThrowTech } from '$lib/fighting/reactionMotion'
  import { impactCallout } from '$lib/fighting/impactCallout'
  import { canUseRangedAttack, projectileProfile, rangedAuraCost } from '$lib/fighting/projectiles'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import { finisherReady, moveForSlot, movesetFor } from '$lib/fighting/movesets'
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
  $: visibleState = futureVisibleState(state, futureViewer, futurePreview)
  $: moveset = movesetFor(state.player.id)
  $: special = fightSpecialPresentation(state, language)
  $: hatsuReady = special.ready
  $: hatsuHint = special.hint
  $: ranged = projectileProfile(state.player.id)
  $: rangedLabel = language === 'fr' ? ranged.labelFr : ranged.labelEn
  $: rangedReady = canUseRangedAttack(state.player)
  $: rangedHint = `${rangedLabel} · ${rangedAuraCost(state.player.id)} aura`
  $: sceneKey = `${stageId}:${state.player.id}:${state.opponent.id}`
  $: finisher = moveForSlot(state.player.id, 'finisher')
  $: finisherAvailable = finisherReady(state, 'player')
  $: throwTech = isThrowTech(visibleState)
  function hold(key: keyof FightInput, active: boolean) {
    onControl(key, active)
  }
</script>

<FightAudio {state} {language} {paused} viewer={sensoryViewer} />
<section class="fight-stage" aria-label={language === 'fr' ? 'Arène de combat' : 'Fight arena'}>
  <div class="fight-arena">
    <FightHud state={visibleState} {language} {detailed} />
    <FightCatsName state={visibleState} {language} />
    <FightEasterEggCaptions state={visibleState} {language} />
    {#key sceneKey}
      <FightScene state={visibleState} {stageId} />
    {/key}

    {#if training}
      <FightTrainingOverlay state={visibleState} {language} />
    {/if}

    {#if visibleState.impact}
      {#key visibleState.impact.sequence}
        <div class:blocked={visibleState.impact.blocked} class="impact-flash"></div>
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
  {#if showControls}<div class="touch-controls">
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
          aria-label={language === 'fr' ? 'Se baisser' : 'Crouch'}
          onpointerdown={() => hold('down', true)}
          onpointerup={() => hold('down', false)}
          onpointercancel={() => hold('down', false)}>↓</button
        >
        <button
          type="button"
          aria-label={language === 'fr' ? 'Garde' : 'Block'}
          onpointerdown={() => hold('guard', true)}
          onpointerup={() => hold('guard', false)}
          onpointercancel={() => hold('guard', false)}>G</button
        >
        <button
          type="button"
          aria-label={language === 'fr' ? 'Se couvrir les oreilles' : 'Cover ears'}
          onpointerdown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            hold('coverEars', true)
          }}
          onpointerup={() => hold('coverEars', false)}
          onpointercancel={() => hold('coverEars', false)}>E</button
        >
      </div>
      <div class="touch-group attack-controls">
        <FightHanzoCall {state} {language} {onCall} />
        <button type="button" onclick={() => onAttack('light')}>{$bindings.playerLight}</button>
        <button type="button" onclick={() => onAttack('heavy')}>{$bindings.playerHeavy}</button>
        <button
          type="button"
          onclick={onThrow}
          aria-label={language === 'fr' ? 'Projection / déprojection' : 'Throw / tech'}
          >{$bindings.playerThrow}</button
        >
        <button
          type="button"
          class="ranged-button"
          disabled={!rangedReady}
          aria-label={rangedHint}
          title={rangedHint}
          onclick={() => onAttack('ranged')}
        >
          <kbd>{$bindings.playerRanged}</kbd>
          <span>{language === 'fr' ? 'Tir' : 'Shot'}</span>
        </button>
        {#if moveset && finisher}
          <button
            type="button"
            class="finisher-button"
            disabled={!finisherAvailable}
            aria-label={`${language === 'fr' ? finisher.nameFr : finisher.nameEn} · ${language === 'fr' ? moveset.finisherConditionFr : moveset.finisherConditionEn}`}
            title={language === 'fr' ? finisher.nameFr : finisher.nameEn}
            onclick={onFinisher}
          >
            <kbd>{$bindings.playerFinisher}</kbd>
            <span>{language === 'fr' ? 'Ultime' : 'Super'}</span>
          </button>
        {/if}
        {#if state.player.id !== 'camilla'}
          <button
            type="button"
            class="special-button"
            disabled={!hatsuReady}
            aria-label={hatsuHint}
            title={hatsuHint}
            onpointerdown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              hold('hatsu', true)
            }}
            onpointerup={() => {
              onAttack('special')
              hold('hatsu', false)
            }}
            onpointercancel={() => hold('hatsu', false)}
          >
            <kbd>{$bindings.playerSpecial}</kbd>
            <span
              >{state.player.id === 'beyond'
                ? language === 'fr'
                  ? 'Physique'
                  : 'Physical'
                : 'Hatsu'}</span
            >
          </button>
        {/if}
      </div>
    </div>{/if}
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
  .touch-controls {
    position: relative;
    z-index: 30;
    padding: 0.65rem;
    border-top: 1px solid #34434d;
    background: #080f15;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  }
  .touch-group {
    display: flex;
    gap: 0.45rem;
    pointer-events: auto;
  }
  .attack-controls {
    max-width: 65%;
    flex-wrap: wrap;
    justify-content: flex-end;
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
  .special-button,
  .ranged-button,
  .finisher-button {
    width: auto !important;
    min-width: 104px;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 0.45rem;
    padding: 0 0.7rem;
    border-radius: 24px !important;
    border-color: #6dd9ff !important;
    box-shadow: inset 0 0 14px rgb(72 188 238 / 25%);
  }
  .special-button kbd,
  .ranged-button kbd,
  .finisher-button kbd {
    display: grid;
    width: 24px;
    height: 24px;
    place-items: center;
    border: 1px solid rgb(109 217 255 / 55%);
    border-radius: 50%;
    color: #9be8ff;
    font: 700 0.7rem/1 var(--font-mono);
  }
  .special-button span,
  .ranged-button span,
  .finisher-button span {
    overflow: hidden;
    min-width: 0;
    max-width: 112px;
    font: 700 0.75rem/1.15 var(--font-mono);
    letter-spacing: 0.04em;
    text-align: left;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .ranged-button {
    width: auto !important;
    min-width: 92px;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 0.4rem;
    padding: 0 0.6rem;
    border-radius: 24px !important;
    border-color: #e7bc68 !important;
  }
  .finisher-button {
    width: auto !important;
    min-width: 104px;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 0.4rem;
    padding: 0 0.6rem;
    border-radius: 24px !important;
    border-color: #ef5a62 !important;
    box-shadow: inset 0 0 14px rgb(239 90 98 / 25%);
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
    .touch-controls {
      gap: 0.5rem;
    }
    .touch-group {
      gap: 0.28rem;
    }
    .touch-group button {
      width: 44px;
      height: 44px;
    }
    .movement-controls {
      max-width: 185px;
      flex-wrap: wrap;
    }
    .attack-controls {
      max-width: 220px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .damage-callout {
      top: 49%;
    }
  }
</style>
