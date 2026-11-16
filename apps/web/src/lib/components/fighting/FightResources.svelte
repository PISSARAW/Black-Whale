<script lang="ts">
  import FightMelodyStatus from './FightMelodyStatus.svelte'
  import FightNenReadout from './FightNenReadout.svelte'
  import type { FightInput } from '$lib/fighting/types'
  import FightOutsideDuelStatus from './FightOutsideDuelStatus.svelte'
  import FightComboMaster from './FightComboMaster.svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { bungeeVisible } from '$lib/fighting/hisokaTechnique'
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { finisherReady, moveForSlot, movesetFor } from '$lib/fighting/movesets'
  import { canUseRangedAttack, projectileProfile, rangedAuraCost } from '$lib/fighting/projectiles'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import FightBenjaminStatus from './FightBenjaminStatus.svelte'
  import FightChrolloStatus from './FightChrolloStatus.svelte'
  import FightGrudge from './FightGrudge.svelte'
  import FightCamillaStatus from './FightCamillaStatus.svelte'
  import FightKurapikaStatus from './FightKurapikaStatus.svelte'
  import FightPainPacker from './FightPainPacker.svelte'
  import FightNenControls from './FightNenControls.svelte'
  import FightLsdfStatus from './FightLsdfStatus.svelte'
  import FightPredatorStatus from './FightPredatorStatus.svelte'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let detailed = false
  export let showControls = false
  export let onControl: (key: keyof FightInput, held: boolean) => void = () => {}
  export let onAura: (active: boolean) => void
  export let onEmperor: () => void

  const sides: FightSide[] = ['player', 'opponent']
  $: special = fightSpecialPresentation(state, language)
  $: finisher = moveForSlot(state.player.id, 'finisher')
  $: moveset = movesetFor(state.player.id)
  $: ranged = projectileProfile(state.player.id)
</script>

<div class="combat-resources">
  {#each sides as side (side)}
    {@const fighter = state[side]}
    <section
      class="fighter-resources"
      aria-label={`${fighterDefinition(fighter.id).name} · ${language === 'fr' ? 'ressources et états' : 'resources and status'}`}
    >
      <div class="resource-owner">
        {side === 'player'
          ? 'P1'
          : state.mode === 'versus-ai'
            ? 'CPU'
            : state.mode === 'training'
              ? 'DUMMY'
              : 'P2'} · {fighterDefinition(fighter.id).name}
      </div>
      <FightNenReadout {state} {side} {language} {detailed} />
      <FightGrudge {fighter} {language} />
      <FightMelodyStatus {state} {side} {language} />
      <FightCamillaStatus {fighter} {language} />
      {#if side === 'player'}
        <FightNenControls {fighter} {language} {detailed} {showControls} {onAura} {onEmperor} {onControl} />
        <div class="ability-readiness">
          <span
            class:ready={canUseRangedAttack(fighter)}
            title={`${language === 'fr' ? ranged.labelFr : ranged.labelEn} · ${rangedAuraCost(fighter.id)} aura`}
          >
            U · {language === 'fr' ? ranged.labelFr : ranged.labelEn} · {canUseRangedAttack(fighter)
              ? language === 'fr'
                ? 'prêt'
                : 'ready'
              : language === 'fr'
                ? 'indisponible'
                : 'unavailable'}
          </span>
          {#if fighter.id !== 'camilla'}
          <span class:ready={special.ready} title={special.hint}
            >L · {special.label} · {special.ready
              ? language === 'fr'
                ? 'prêt'
                : 'ready'
              : language === 'fr'
                ? 'indisponible'
                : 'unavailable'}</span
          >
          {/if}
          {#if moveset && finisher}
            <span
              class:ready={finisherReady(state, 'player')}
              title={language === 'fr' ? moveset.finisherConditionFr : moveset.finisherConditionEn}
            >
              H · {language === 'fr' ? finisher.nameFr : finisher.nameEn} · {finisherReady(
                state,
                'player',
              )
                ? language === 'fr'
                  ? 'prêt'
                  : 'ready'
                : language === 'fr'
                  ? 'indisponible'
                  : 'unavailable'}
            </span>
          {/if}
        </div>
        {#if fighter.id === 'kurapika'}
          <div class="critical-rule">
            {language === 'fr'
              ? 'Chain Jail · hors Brigade : mort'
              : 'Chain Jail · non-Troupe target: death'}
          </div>
        {/if}
        {#if state.opponent.hanzoProjection}
          <div>
            {language === 'fr'
              ? 'T · interpeller le corps endormi à proximité'
              : 'T · call to the nearby sleeping body'}
          </div>
        {/if}
      {/if}
      <FightKurapikaStatus {state} {side} {language} {detailed} />
      <FightPainPacker {fighter} {language} {side} local={state.mode === 'versus-local'} />
      <FightBenjaminStatus {state} {side} {language} {detailed} />
      <FightChrolloStatus {state} {side} {language} {detailed} />
      <FightPredatorStatus {state} {side} {language} />
      <FightComboMaster {state} {side} {language} />
      <FightOutsideDuelStatus {fighter} {language} />
      {#if fighter.textureSurprise}
        <div class="secret-status">
          Texture Surprise · {language === 'fr' ? 'tissu masqué' : 'cloth disguised'}
        </div>
      {/if}
      {#if side === 'player' && bungeeVisible(state)}
        <div class="secret-status">
          Bungee Gum · {state.bungeeGum?.retracting
            ? state.bungeeGum.rebounding
              ? language === 'fr'
                ? 'rebond'
                : 'rebound'
              : language === 'fr'
                ? 'rappel'
                : 'recall'
            : state.bungeeGum?.owner === 'player'
              ? language === 'fr'
                ? 'attaché'
                : 'attached'
              : language === 'fr'
                ? 'détecté'
                : 'detected'}
        </div>
      {/if}
    </section>
  {/each}
  <FightLsdfStatus {state} {language} />
</div>

<style>
  .combat-resources {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem 2rem;
    padding: 0.8rem 1rem;
    border-top: 1px solid #3f4442;
    background: #080f15;
    color: #d9e3e9;
    font: 600 var(--hud-font, 0.75rem)/1.45 var(--font-mono);
  }
  .fighter-resources {
    display: grid;
    align-content: start;
    gap: 0.45rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .resource-owner {
    color: #aab9c4;
    font-size: var(--hud-font, 0.75rem);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .fighter-resources :global(.chain-status),
  .fighter-resources :global(.pain-packer),
  .fighter-resources :global(.baton-status),
  .fighter-resources :global(.book-status) {
    margin: 0;
    font-size: var(--hud-font, 0.75rem);
    line-height: 1.45;
    text-shadow: none;
    text-align: start;
  }
  .ability-readiness {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .ability-readiness span {
    padding: 0.2rem 0.4rem;
    border: 1px solid #3a4651;
    color: #b0bdc7;
  }
  .ability-readiness .ready {
    border-color: #617b69;
    color: #bbebcb;
  }
  .critical-rule {
    color: #ffc6a7;
  }
  .secret-status {
    color: #efb1e0;
  }
  @media (max-width: 600px) {
    .combat-resources {
      gap: 0.75rem;
      padding: 0.7rem;
    }
  }
  @media (max-width: 420px) {
    .combat-resources {
      grid-template-columns: minmax(0, 1fr);
    }
    .fighter-resources + .fighter-resources {
      border-top: 1px solid #35414c;
      padding-top: 0.65rem;
    }
  }
</style>
