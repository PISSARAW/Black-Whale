<script lang="ts">
  import FightHalkenburgStatus from './FightHalkenburgStatus.svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import { hasPrinceSidearm, PRINCE_SIDEARM_ROUNDS } from '$lib/fighting/princeSidearm'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: actor = state[side]
  const weapons = {
    fr: {
      switchblade: 'Couteau de Leorio',
      wristblade: 'Lame de poignet',
      'ben-knife': 'Couteau de Ben',
      bokken: 'Armes de l’examen',
    },
    en: {
      switchblade: 'Leorio’s knife',
      wristblade: 'Wrist blade',
      'ben-knife': 'Ben’s knife',
      bokken: 'Exam weapons',
    },
  }
</script>

<FightHalkenburgStatus {state} {side} {language} />

<div class="multi-status" aria-live="polite">
  {#if state[side].battleCantabile?.selectedModel}
    <p role="status">
      Metamorphosen · {language === 'fr' ? 'Modèle choisi' : 'Selected model'} :
      {fighterDefinition(state[side].battleCantabile!.selectedModel!).name}
    </p>
  {/if}
  {#if state[side].corpsePreparation}
    <p role="status">
      Illumi · {language === 'fr' ? 'Implantation du cadavre' : 'Corpse implantation'} ·
      {(state[side].corpsePreparation!.frames / 60).toFixed(1)} s
    </p>
  {/if}
  {#if state[side].heardCorpse && state.frame - state[side].heardCorpse!.frame < 240}
    <p role="status">
      {language === 'fr' ? 'Voix du corps manipulé' : 'Controlled body’s voice'} : {state[side]
        .heardCorpse!.text}
    </p>
  {/if}

  {#if actor.historicalWeapon}<span>{weapons[language][actor.historicalWeapon]}</span>{/if}
  {#if actor.historicalWeaponSpent}<span
      >{language === 'fr' ? 'Couteau lancé · objet dépensé' : 'Knife thrown · object spent'}</span
    >{/if}
  {#if hasPrinceSidearm(actor)}<span
      >{language === 'fr' ? 'Pistolet · Cartouches' : 'Pistol · Rounds'} : {actor.princeSidearmRounds ??
        PRINCE_SIDEARM_ROUNDS}</span
    >{/if}
  {#if actor.paralyticPoison}<span
      >{language === 'fr' ? 'Poison du couteau' : 'Knife poison'} · {actor.paralyticPoison.contained
        ? language === 'fr'
          ? 'contenu'
          : 'contained'
        : language === 'fr'
          ? 'exposition en cours'
          : 'exposure in progress'}</span
    >{/if}
  {#if actor.conditionedNeedle}<span
      >{language === 'fr'
        ? 'Aiguille de conditionnement · fuite devant une menace'
        : 'Conditioning needle · retreat from threats'}</span
    >{/if}
  {#if actor.needleRemoval}<progress
      max="30"
      value={30 - actor.needleRemoval.frames}
      aria-label={language === 'fr' ? 'Retrait de l’aiguille' : 'Needle removal'}
    ></progress>{/if}
  {#if actor.illumiMask}<span
      >{language === 'fr' ? 'Masque sans aiguilles' : 'Needleless mask'} · {(
        actor.illumiMask.remaining / 3600
      ).toFixed(1)} min</span
    >{/if}
  {#if actor.guardianWords}<span>{actor.guardianWords.text}</span>{/if}
  {#if actor.gumHeartPreparation}<span
      >{language === 'fr' ? 'Préparation du massage de gomme' : 'Preparing gum massage'}</span
    >{/if}
  {#if actor.gumHeartArmed}<span
      >{language === 'fr'
        ? 'Ordre post-mortem préparé · asphyxie uniquement'
        : 'Post-mortem order prepared · asphyxia only'}</span
    >{/if}
  {#if actor.gumHeartSpent}<span
      >{language === 'fr'
        ? 'Massage de gomme utilisé · blessures conservées'
        : 'Gum massage used · wounds remain'}</span
    >{/if}
  {#if actor.futureStoredFrames !== undefined}<span
      >{language === 'fr' ? 'Réserve du monde illusoire' : 'Illusion world reserve'} · {(
        actor.futureStoredFrames / 60
      ).toFixed(1)} s</span
    >{/if}
  {#if actor.blinkyEvidence}<span
      >{language === 'fr' ? 'Blinky · Effacement des preuves' : 'Blinky · Removing evidence'}</span
    >{/if}
</div>

<style>
  .multi-status {
    display: grid;
    gap: 0.25rem;
    color: #b9c7d5;
    font: 600 0.72rem/1.4 var(--font-mono);
    overflow-wrap: anywhere;
  }
  progress {
    width: 100%;
    height: 0.35rem;
  }
</style>
