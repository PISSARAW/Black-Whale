<script lang="ts">
  import FightScene from './FightScene.svelte'
  import FightHud from './FightHud.svelte'
  import FightNenControls from './FightNenControls.svelte'
  import FightTrainingOverlay from './FightTrainingOverlay.svelte'
  import FightAudio from './FightAudio.svelte'
  import { canUseFightHatsu, FIGHT_HATSU_AURA_COST } from '$lib/fighting/hatsu'
  import { nenTacticalState } from '$lib/fighting/nen'
  import { isThrowTech } from '$lib/fighting/reactionMotion'
  import { fighterDefinition } from '$lib/fighting/roster'
  import {
    canUseRangedAttack,
    projectileProfile,
    RANGED_AURA_COST,
  } from '$lib/fighting/projectiles'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import { canUseMovesetMove, finisherReady, moveForSlot, movesetFor } from '$lib/fighting/movesets'
  import type { AttackKind, FightInput, FightNenZone, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let stageId: FightStageId = DEFAULT_FIGHT_STAGE
  export let onAttack: (kind: AttackKind) => void
  export let onThrow: () => void
  export let onFinisher: () => void
  export let onControl: (key: keyof FightInput, active: boolean) => void
  export let training = false

  $: playerDefinition = fighterDefinition(state.player.id)
  $: moveset = movesetFor(state.player.id)
  $: neutralSpecial = moveForSlot(state.player.id, 'neutralSpecial')
  $: specialLabel = moveset
    ? language === 'fr'
      ? (neutralSpecial?.nameFr ?? 'Technique')
      : (neutralSpecial?.nameEn ?? 'Technique')
    : language === 'fr'
      ? playerDefinition.specialFr
      : playerDefinition.specialEn
  $: hatsuReady = moveset
    ? Boolean(neutralSpecial && canUseMovesetMove(state, 'player', neutralSpecial))
    : canUseFightHatsu(state.player)
  $: hatsuHint = moveset
    ? hatsuReady
      ? `${specialLabel} · ${neutralSpecial?.auraCost ?? 40} aura`
      : state.player.id === 'kurapika' && neutralSpecial?.id === 'kurapika:neutralSpecial'
        ? language === 'fr'
          ? 'Chain Jail · Brigade Fantôme uniquement'
          : 'Chain Jail · Phantom Troupe only'
        : `${specialLabel} · indisponible`
    : `${specialLabel} · ${FIGHT_HATSU_AURA_COST} aura`
  $: ranged = projectileProfile(state.player.id)
  $: rangedLabel = language === 'fr' ? ranged.labelFr : ranged.labelEn
  $: rangedReady = canUseRangedAttack(state.player)
  $: rangedHint = `${rangedLabel} · ${RANGED_AURA_COST} aura`
  $: sceneKey = `${stageId}:${state.player.id}:${state.opponent.id}`
  $: finisher = moveForSlot(state.player.id, 'finisher')
  $: finisherAvailable = finisherReady(state, 'player')
  $: playerTactical = nenTacticalState(state.player)
  $: throwTech = isThrowTech(state)

  const focusZoneLabels: Record<'fr' | 'en', Record<FightNenZone, string>> = {
    fr: { head: 'Tête', torso: 'Torse', hands: 'Mains', feet: 'Jambes' },
    en: { head: 'Head', torso: 'Torso', hands: 'Hands', feet: 'Legs' },
  }

  function focusZoneLabel(zone: FightNenZone): string {
    return focusZoneLabels[language][zone]
  }

  function hold(key: keyof FightInput, active: boolean) {
    onControl(key, active)
  }
</script>

<section class="fight-stage" aria-label={language === 'fr' ? 'Arène de combat' : 'Fight arena'}>
  <FightAudio {state} />
  <FightHud {state} {language} />
  <FightNenControls
    fighter={state.player}
    {language}
    onAura={(active) => onControl('aura', active)}
  />
  {#key sceneKey}
    <FightScene {state} {stageId} />
  {/key}

  {#if training}
    <FightTrainingOverlay {state} {language} />
  {/if}

  {#if playerTactical.focusZone}
    <div
      class="nen-focus-callout"
      class:ko={playerTactical.technique === 'ko'}
      style={`left:clamp(6rem, ${state.player.x}%, calc(100% - 6rem));bottom:${28 + state.player.y * 0.5}%`}
      aria-live="polite"
    >
      <small>
        {playerTactical.technique.toUpperCase()} · {language === 'fr'
          ? 'ZONE RENFORCÉE'
          : 'REINFORCED ZONE'}
      </small>
      <b>
        {focusZoneLabel(playerTactical.focusZone)} · {Math.round(playerTactical.focusShare * 100)}%
      </b>
      <span>
        {language === 'fr' ? 'Exposé' : 'Exposed'} · {playerTactical.exposedZones
          .map(focusZoneLabel)
          .join(' · ')}
      </span>
    </div>
  {/if}

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
        {state.impact.invulnerable
          ? 'INVUL'
          : state.impact.avoided
            ? language === 'fr'
              ? 'FUTUR ÉVITÉ'
              : 'FUTURE EVADED'
            : state.impact.parried
              ? language === 'fr'
                ? 'PARADE · RYU'
                : 'PARRY · RYU'
              : state.impact.blocked
                ? state.impact.damage === 0
                  ? 'KEN'
                  : language === 'fr'
                    ? 'GARDE'
                    : 'BLOCK'
                : `${state.impact.counterHit ? 'COUNTER · ' : state.impact.punish ? 'PUNISH · ' : ''}${state.impact.antiAir ? 'ANTI-AIR · ' : ''}${state.impact.wallSplat ? 'WALL · ' : ''}${state.impact.comboHits > 1 ? `${state.impact.comboHits} HITS · ` : ''}${state.impact.critical ? 'CRIT · ' : ''}${state.impact.knockdown ? (language === 'fr' ? 'CHUTE · ' : 'KD · ') : ''}-${state.impact.damage} · +${state.impact.points}`}
      </div>
    {/key}
  {/if}
  {#if throwTech}<div class="damage-callout">THROW TECH</div>{/if}

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
    </div>
    <div class="touch-group attack-controls">
      <button type="button" onclick={() => onAttack('light')}>J</button>
      <button type="button" onclick={() => onAttack('heavy')}>K</button>
      <button
        type="button"
        onclick={onThrow}
        aria-label={language === 'fr' ? 'Projection / déprojection' : 'Throw / tech'}>O</button
      >
      <button
        type="button"
        class="ranged-button"
        disabled={!rangedReady}
        aria-label={rangedHint}
        title={rangedHint}
        onclick={() => onAttack('ranged')}
      >
        <kbd>U</kbd>
        <span>{rangedLabel}</span>
      </button>
      {#if moveset && finisher}
        <button
          type="button"
          class="finisher-button"
          disabled={!finisherAvailable}
          aria-label={`${language === 'fr' ? finisher.nameFr : finisher.nameEn} · ${language === 'fr' ? moveset.finisherConditionFr : moveset.finisherConditionEn}`}
          onclick={onFinisher}
        >
          <kbd>H</kbd>
          <span>{language === 'fr' ? finisher.nameFr : finisher.nameEn}</span>
        </button>
      {/if}
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
        <kbd>L</kbd>
        <span>{specialLabel}</span>
      </button>
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
  .nen-focus-callout {
    position: absolute;
    z-index: 18;
    display: grid;
    min-width: 132px;
    padding: 0.38rem 0.5rem;
    border: 1px solid rgb(255 217 91 / 72%);
    border-left-width: 4px;
    background: rgb(7 12 15 / 88%);
    box-shadow: 0 0 18px rgb(255 202 58 / 16%);
    transform: translateX(-50%);
    pointer-events: none;
  }
  .nen-focus-callout::after {
    position: absolute;
    top: 100%;
    left: 50%;
    width: 1px;
    height: 32px;
    background: linear-gradient(#ffdc67, transparent);
    content: '';
  }
  .nen-focus-callout.ko {
    border-color: #ff6d66;
    background: rgb(35 7 9 / 91%);
    box-shadow: 0 0 24px rgb(255 60 55 / 28%);
  }
  .nen-focus-callout small,
  .nen-focus-callout span {
    font: 700 0.43rem/1.2 var(--font-mono);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .nen-focus-callout small {
    color: #d2b958;
  }
  .nen-focus-callout b {
    margin-top: 0.16rem;
    color: #fff5b8;
    font: 900 0.67rem/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .nen-focus-callout span {
    margin-top: 0.2rem;
    color: #ff918a;
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
  .special-button,
  .ranged-button,
  .finisher-button {
    width: auto !important;
    min-width: 112px;
    grid-template-columns: auto 1fr;
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
    max-width: 112px;
    font: 700 0.54rem/1.05 var(--font-mono);
    letter-spacing: 0.04em;
    text-align: left;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .ranged-button {
    width: auto !important;
    min-width: 92px;
    grid-template-columns: auto 1fr;
    gap: 0.4rem;
    padding: 0 0.6rem;
    border-radius: 24px !important;
    border-color: #e7bc68 !important;
  }
  .finisher-button {
    width: auto !important;
    min-width: 104px;
    grid-template-columns: auto 1fr;
    gap: 0.4rem;
    padding: 0 0.6rem;
    border-radius: 24px !important;
    border-color: #ef5a62 !important;
    box-shadow: inset 0 0 14px rgb(239 90 98 / 25%);
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
