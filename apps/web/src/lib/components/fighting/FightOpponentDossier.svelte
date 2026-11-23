<script lang="ts">
  import { auraDistribution } from '$lib/fighting/nen'
  import { bodyMemoryLabel } from '$lib/fighting/bodyMemory'
  import { livingPortraitTierLabel } from '$lib/fighting/perception/livingPortraitPose'
  import {
    auraBracketLabel,
    burstDossierLabel,
    conditionLabel,
    tacticalKameoEntry,
  } from '$lib/fighting/perception/opponentDossierText'
  import type { OpponentHudView } from '$lib/fighting/perception/opponentHudView'
  import type { FightState } from '$lib/fighting/types'

  export let state: FightState
  export let view: OpponentHudView
  export let language: 'fr' | 'en'

  $: opponent = state.opponent
  $: vitalityLabel = livingPortraitTierLabel({ tier: view.health.tier, language })
  $: bracketText = auraBracketLabel(view.aura.bracket, language)
  $: burstInfo = burstDossierLabel(view.burst, language)
  $: kameoEntry = tacticalKameoEntry(state, view.kameo, language)
  $: memory =
    view.level === 2 && !view.health.textureMasked ? bodyMemoryLabel(opponent, language) : null
  $: gyoActive = view.aura.level === 2 && view.aura.exact !== null
</script>

<div class="opponent-dossier" data-perception-level={view.level}>
  <div class="vitality-row" class:adrenaline={view.health.adrenalineAlert}>
    {#if vitalityLabel}<span class="vitality-tier">{vitalityLabel}</span>{/if}
    {#if view.health.adrenalineAlert}
      <b class="adrenaline-tag">{language === 'fr' ? 'ADRÉNALINE' : 'ADRENALINE'}</b>
    {/if}
  </div>

  <div class="gyo-layer" class:active={gyoActive}>
    {#if gyoActive && view.aura.exact !== null}
      <div
        class="gyo-aura-bar"
        role="meter"
        aria-label="Aura (Gyo)"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={view.aura.exact}
      >
        <span style={`width:${view.aura.exact}%`}></span>
      </div>
      <div class="gyo-nen-line">
        <b>{view.aura.exact}<small> / 100</small></b>
        <span>{auraDistribution(opponent)}</span>
      </div>
    {:else if bracketText}
      <div class="dossier-chip aura-chip">{bracketText}</div>
    {/if}
  </div>

  {#if memory}<div class="dossier-memory">{memory}</div>{/if}

  {#if burstInfo}
    <div class="dossier-burst tone-{burstInfo.tone}">{burstInfo.text}</div>
  {/if}

  {#if kameoEntry}
    <div class="dossier-kameo" class:on-stage={kameoEntry.active}>
      <strong>{kameoEntry.name}</strong> · <span>{kameoEntry.status}</span>
    </div>
  {/if}

  {#if view.hatsu.revealedConditions.length > 0}
    <div class="dossier-conditions">
      {#each view.hatsu.revealedConditions as cond (cond)}
        <span class="dossier-chip condition-chip">{conditionLabel(cond, language)}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .opponent-dossier {
    display: grid;
    justify-items: end;
    gap: 0.22rem;
    text-align: right;
  }
  .vitality-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.45rem;
    min-height: calc(18px * var(--hud-scale, 1));
    color: #d5c7b2;
    font: 700 var(--hud-font)/1.2 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .adrenaline-tag {
    color: #ff8e7b;
  }
  .gyo-layer {
    width: 100%;
    display: grid;
    justify-items: end;
    gap: 0.2rem;
    opacity: 0.86;
    transition:
      opacity 240ms ease,
      filter 240ms ease;
  }
  .gyo-layer.active {
    opacity: 1;
    filter: drop-shadow(0 0 6px #7ad4ee44);
  }
  .gyo-aura-bar {
    width: 100%;
    height: calc(7px * var(--hud-scale, 1));
    overflow: hidden;
    border: 1px solid #6ec7e8;
    background: #101a24;
    transform: scaleX(-1);
  }
  .gyo-aura-bar > span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #7ad4ee, #b8f1ff);
  }
  .gyo-nen-line {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.4rem;
    color: #a6deec;
    font: 600 var(--hud-font)/1.3 var(--font-mono);
  }
  .gyo-nen-line b {
    color: #eef8ff;
    font-variant-numeric: tabular-nums;
  }
  .gyo-nen-line small {
    color: #9ab3c4;
    font-size: inherit;
  }
  .dossier-chip {
    display: inline-block;
    padding: 0.14rem 0.42rem;
    border: 1px solid #486477;
    background: #0d1822cc;
    color: #b7d8e8;
    font: 600 calc(0.65rem * var(--hud-scale, 1))/1.25 var(--font-mono);
    letter-spacing: 0.04em;
  }
  .condition-chip {
    border-color: #8f6b9e;
    color: #e4c7f7;
  }
  .dossier-memory {
    color: #ffad96;
    font: 700 calc(0.65rem * var(--hud-scale, 1))/1.2 var(--font-mono);
    text-transform: uppercase;
  }
  .dossier-burst {
    font: 800 calc(0.65rem * var(--hud-scale, 1))/1.2 var(--font-mono);
    letter-spacing: 0.06em;
  }
  .dossier-burst.tone-spent {
    color: #6f808c;
  }
  .dossier-burst.tone-zetsu {
    color: #ff9b8d;
  }
  .dossier-burst.tone-tension {
    color: #ffd37a;
  }
  .dossier-kameo {
    color: #b1c0cd;
    font: 600 calc(0.68rem * var(--hud-scale, 1))/1.25 var(--font-mono);
  }
  .dossier-kameo strong {
    color: #eef8ff;
  }
  .dossier-kameo.on-stage {
    color: #edce7b;
  }
  .dossier-conditions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.25rem;
  }
  @media (prefers-reduced-motion: reduce) {
    .gyo-layer {
      transition: none;
    }
  }
</style>
