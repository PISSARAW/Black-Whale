<script lang="ts">
  import { fightSeatLabel } from '$lib/fighting/pvp/presentation'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { fightFormat } from '$lib/fighting/formats'
  import { auraDistribution, nenStatus } from '$lib/fighting/nen'
  import { bodyMemoryLabel } from '$lib/fighting/bodyMemory'
  import { auraInformationKnown } from '$lib/fighting/nenInformationWar'
  import { textureSurpriseView } from '$lib/fighting/textureSurpriseMask'
  import type { FightHudMode } from '$lib/fighting/perception/hudMode'
  import { opaqueHudSides, rivalSide } from '$lib/fighting/perception/hudLayout'
  import { resolveOpponentHudView } from '$lib/fighting/perception/opponentHudView'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import FightIdentityPortrait from './FightIdentityPortrait.svelte'
  import FightLivingPortrait from './FightLivingPortrait.svelte'
  import FightOpponentDossier from './FightOpponentDossier.svelte'
  import FightHealth from './FightHealth.svelte'
  import FightComboMaster from './FightComboMaster.svelte'
  import FightKameoBadge from './FightKameoBadge.svelte'
  import FightAccelHeat from './FightAccelHeat.svelte'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let detailed = false
  export let hudMode: FightHudMode = 'omniscient'

  const sides: FightSide[] = ['player', 'opponent']
  $: format = fightFormat(state.formatId)
  /** Training and the death match have no clock: the bout ends otherwise. */
  $: untimed = state.mode === 'training' || format.timeLimit === false
  $: opaqueSides = opaqueHudSides({ state, mode: hudMode })
  /** Each side is seen through the eyes of its rival (double-opaque in local versus). */
  $: views = {
    player: resolveOpponentHudView({ state, observerSide: 'opponent', mode: hudMode }),
    opponent: resolveOpponentHudView({ state, observerSide: 'player', mode: hudMode }),
  }
</script>

<div class="hud" data-hud-mode={hudMode} data-opaque-sides={opaqueSides.join(' ')}>
  {#each sides as side (side)}
    {@const fighter = state[side]}
    {@const mirrored = side === 'opponent'}
    {@const useLivingPortrait = opaqueSides.includes(side)}
    {@const sideView = views[side]}
    {@const texturePov = textureSurpriseView(
      fighter,
      state[rivalSide(side)],
      mirrored ? 'opponent' : 'owner',
    )}
    {@const memory = texturePov.maskBodyMemory ? null : bodyMemoryLabel(fighter, language)}
    {@const auraKnown = auraInformationKnown(state, 'player', side)}
    <div class="fighter-meter" class:opponent-meter={mirrored}>
      {#key fighter.id}
        {#if useLivingPortrait}
          <FightLivingPortrait
            id={fighter.id}
            mood={sideView.health.portraitMood}
            textureMasked={sideView.health.textureMasked}
            auraSeeping={sideView.health.auraSeeping}
            adrenalineAlert={sideView.health.adrenalineAlert}
            blinded={sideView.blinded}
          />
        {:else}
          <FightIdentityPortrait id={fighter.id} />
        {/if}
      {/key}
      <div class="fighter-gauges">
        <div class="meter-label">
          <strong>{fighterDefinition(fighter.id).name}</strong>
          <span
            class="rounds"
            aria-label={`${state.roundsWon[side]} / 2 ${language === 'fr' ? 'manches gagnées' : 'rounds won'}`}
          >
            <small>{fightSeatLabel(state, side, language)}</small>
            <span aria-hidden="true"
              >{'●'.repeat(state.roundsWon[side])}{'○'.repeat(
                Math.max(0, 2 - state.roundsWon[side]),
              )}</span
            >
          </span>
        </div>
        {#if useLivingPortrait}
          <FightOpponentDossier {state} {side} view={sideView} {language} />
        {:else}
          <FightHealth
            {fighter}
            {language}
            {mirrored}
            {detailed}
            displayedHealth={texturePov.displayedHp}
            ghostHealth={texturePov.showGhostHp ? texturePov.realHp : undefined}
            textureMasked={texturePov.maskActive}
            auraSeeping={texturePov.auraSeeping}
          />
          {#if !state.spectatorView}<div
              class="aura"
              class:hidden={!auraKnown}
              role="meter"
              aria-label={auraKnown
                ? 'Aura'
                : language === 'fr'
                  ? 'Aura dissimulée'
                  : 'Concealed aura'}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={auraKnown ? fighter.aura : undefined}
            >
              <span style={`width:${auraKnown ? fighter.aura : 100}%`}></span>
            </div>{/if}
          <div class="nen-status">
            <span
              >{state.spectatorView
                ? language === 'fr'
                  ? 'Vue publique'
                  : 'Public view'
                : !mirrored
                  ? nenStatus(fighter).join(' · ')
                  : auraKnown
                    ? auraDistribution(fighter)
                    : language === 'fr'
                      ? 'Nen masqué'
                      : 'Nen hidden'}</span
            >
            {#if !state.spectatorView}<b
                >{auraKnown ? Math.floor(fighter.aura) : '?'}<small> / 100</small></b
              >{/if}
          </div>
          {#if memory}<div class="body-memory">{memory}</div>{/if}
          {#if !state.spectatorView}<div
              class:spent={state.burstAvailable?.[side] === false}
              class:zetsu={(fighter.burstZetsuFrames ?? 0) > 0}
              class="burst-status"
            >
              {state.burstAvailable?.[side] === false
                ? (fighter.burstZetsuFrames ?? 0) > 0
                  ? `BURST · ZETSU ${((fighter.burstZetsuFrames ?? 0) / 60).toFixed(1)}s`
                  : 'BURST · SPENT'
                : 'BURST · READY'}
            </div>{/if}
          {#if !state.spectatorView}<FightAccelHeat {fighter} {language} {mirrored} />{/if}
          <FightComboMaster {state} {side} {language} compact />
          <FightKameoBadge {state} {side} {language} />
        {/if}
      </div>
    </div>
  {/each}
  <div class="tower-score" aria-label={language === 'fr' ? format.titleFr : format.titleEn}>
    <div class="timer" class:urgent={untimed === false && state.time <= 10}>
      {untimed ? '∞' : Math.ceil(state.time)}
    </div>
    {#if format.hitTarget !== null}
      <div class="point-score" aria-label="Points">
        <strong>{state.score.player}</strong><small>/{format.hitTarget}</small><strong
          >{state.score.opponent}</strong
        >
      </div>
    {/if}
    {#if format.knockdownTarget !== null}
      <div class="knockdown-score" aria-label="Knockdowns">
        <span>{state.knockdowns.player}/{format.knockdownTarget}</span><small>KD</small><span
          >{state.knockdowns.opponent}/{format.knockdownTarget}</span
        >
      </div>
    {/if}
  </div>
</div>

<style>
  .hud {
    position: relative;
    z-index: 20;
    margin: 0.8rem 1rem 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) calc(80px * var(--hud-scale, 1)) minmax(0, 1fr);
    gap: 0.85rem;
    padding: 0.65rem;
    background: linear-gradient(#060c12ed, #060c12b3 75%, transparent);
    pointer-events: none;
  }
  .fighter-meter {
    min-width: 0;
    display: flex;
    gap: 8px;
  }
  .fighter-gauges {
    min-width: 0;
    flex: 1;
  }
  .opponent-meter {
    flex-direction: row-reverse;
  }
  @media (max-width: 600px), (max-height: 600px) {
    .fighter-meter {
      gap: 5px;
    }
  }
  .opponent-meter {
    grid-column: 3;
  }
  .meter-label,
  .nen-status,
  .rounds {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
  }
  .meter-label {
    min-height: 1.4rem;
    margin-bottom: 0.35rem;
    color: #fff;
    font: 700 calc(1rem * var(--hud-scale, 1))/1.5 var(--font-display);
    text-transform: uppercase;
  }
  .meter-label strong {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
  .rounds {
    flex-shrink: 0;
    color: #edce7b;
    font: 600 var(--hud-font)/1 var(--font-mono);
  }
  .rounds small {
    color: #b1c0cd;
    font-size: 0.7rem;
  }
  .aura {
    height: calc(7px * var(--hud-scale, 1));
    overflow: hidden;
    margin-top: 5px;
    border: 1px solid #50778c;
    background: #101a24;
  }
  .aura > span {
    display: block;
    height: 100%;
    background: #7ad4ee;
  }
  .aura.hidden > span {
    background: repeating-linear-gradient(135deg, #24333d 0 7px, #111b22 7px 14px);
  }
  .nen-status {
    margin-top: 0.3rem;
    color: #a6deec;
    font: 600 var(--hud-font)/1.35 var(--font-mono);
    overflow-wrap: anywhere;
  }
  .nen-status b {
    flex-shrink: 0;
    color: #eef8ff;
    font-variant-numeric: tabular-nums;
  }
  .nen-status small {
    color: #a6b7c6;
    font-size: inherit;
  }
  .burst-status {
    margin-top: 0.2rem;
    color: #8ff3ff;
    font: 800 calc(0.65rem * var(--hud-scale, 1))/1.2 var(--font-mono);
    letter-spacing: 0.06em;
  }
  .body-memory {
    margin-top: 0.2rem;
    color: #ffad96;
    font: 700 calc(0.65rem * var(--hud-scale, 1))/1.2 var(--font-mono);
    text-transform: uppercase;
  }
  .opponent-meter .body-memory {
    text-align: right;
  }
  .burst-status.spent {
    color: #667782;
  }
  .burst-status.zetsu {
    color: #ff9b8d;
  }
  .opponent-meter .burst-status {
    text-align: right;
  }
  .opponent-meter .meter-label,
  .opponent-meter .nen-status {
    flex-direction: row-reverse;
    text-align: right;
  }
  .opponent-meter .aura {
    transform: scaleX(-1);
  }
  .tower-score {
    container-type: inline-size;
    grid-column: 2;
    grid-row: 1;
    align-self: start;
    color: #edce7b;
    font: 700 var(--hud-font)/1.3 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .timer {
    padding: 0.3rem 0;
    border-bottom: 2px solid #d9b650;
    color: #fff;
    font: 800 min(calc(2.5rem * var(--hud-scale, 1)), 44cqi)/1 var(--font-display);
    text-align: center;
  }
  .timer.urgent {
    color: #ff9b8d;
    border-color: currentColor;
  }
  .point-score,
  .knockdown-score {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.2rem;
    margin-top: 0.35rem;
  }
  .knockdown-score {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    text-align: center;
  }
  .knockdown-score small {
    grid-column: 1 / -1;
    grid-row: 1;
  }
  .point-score strong {
    font-size: calc(1.1rem * var(--hud-scale, 1));
  }
  .tower-score small {
    color: #c2c8cc;
    font-size: 0.7rem;
  }
  @media (max-width: 600px) {
    .hud {
      margin: 0.35rem 0.3rem 0;
      gap: 0.45rem;
      padding: 0.45rem;
      grid-template-columns: minmax(0, 1fr) calc(54px * var(--hud-scale, 1)) minmax(0, 1fr);
    }
    .meter-label {
      align-items: start;
      flex-direction: column;
      font-size: calc(0.85rem * var(--hud-scale, 1));
    }
    .opponent-meter .meter-label {
      flex-direction: column;
      align-items: end;
    }
    .nen-status {
      align-items: start;
      flex-direction: column;
      gap: 0.1rem;
    }
    .opponent-meter .nen-status {
      flex-direction: column;
      align-items: end;
    }
    .nen-status small {
      display: none;
    }
  }
</style>
