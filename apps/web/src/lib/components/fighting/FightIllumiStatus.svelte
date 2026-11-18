<script lang="ts">
  import { ownsIllumiNeedles } from '$lib/fighting/illumiAccess'
  import { needleOrderLabel } from '$lib/fighting/illumiPresentation'
  import { ILLUMI_DISGUISE_FRAMES } from '$lib/fighting/illumiState'
  import { hasIllumiNeedles } from '$lib/fighting/illumiEquipment'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: fighter = state[side]
  $: fr = language === 'fr'
  $: preparation = fighter.illumi?.preparation ?? 0
</script>

{#if ownsIllumiNeedles(fighter) || fighter.illumi}
  <div class="illumi-status">
    <strong>Needle People · {fr ? 'Aiguille et consigne' : 'Needle and order'}</strong>
    {#if !hasIllumiNeedles(fighter)}
      <span class="warning"
        >{fr
          ? 'Needle People : aiguilles physiques requises ; la copie ne les fournit pas.'
          : 'Needle People requires physical needles; copying does not supply them.'}</span
      >
    {/if}
    <span
      >{fr ? 'Consigne préparée' : 'Selected order'} : {needleOrderLabel(
        fighter.illumi?.order ?? 'stay',
        language,
      )}</span
    >
    {#if preparation > 0}
      <progress
        max={ILLUMI_DISGUISE_FRAMES}
        value={ILLUMI_DISGUISE_FRAMES - preparation}
        aria-label={fr ? 'Remodelage du visage' : 'Face alteration'}
      ></progress>
      <span
        >{fr
          ? 'Remodelage en cours · interrompu par mouvement ou blessure'
          : 'Altering face · interrupted by movement or injury'}</span
      >
    {:else if fighter.illumi?.disguised}
      {#if fighter.illumi.disguiseMode === 'unpinned-hisoka'}
        <span
          >{fr
            ? 'Visage d’Hisoka · sans aiguilles · yeux d’origine'
            : 'Hisoka’s face · no needles · original eyes'}</span
        >
        {#if fighter.illumi.disguiseExpiresAt !== undefined}
          <span
            >{fr ? 'Retour dans' : 'Reverts in'}
            {Math.max(0, Math.ceil((fighter.illumi.disguiseExpiresAt - state.frame) / 3600))} min</span
          >
        {/if}
      {:else}
        <span
          >{fr
            ? 'Visage remodelé · aucune protection supplémentaire'
            : 'Altered face · no extra protection'}</span
        >
      {/if}
    {/if}
    <small
      >{fr
        ? 'L : implantation / Reste · → + L : Approche · ↓ + L : Éloigne-toi · ← + L : déguisement'
        : 'L: implant / Stay · → + L: Approach · ↓ + L: Retreat · ← + L: disguise'}</small
    >
  </div>
{/if}
{#if fighter.needleFace}
  <div class="illumi-status" role="status">
    <strong>{fr ? 'Trois aiguilles au front' : 'Three forehead needles'}</strong>
    <span
      >{fighter.needleFace.reshaping
        ? fr
          ? 'Visage déformé · autonomie conservée'
          : 'Distorted face · autonomy retained'
        : fr
          ? 'Remodelage terminé · aiguilles toujours présentes'
          : 'Shaping ended · needles remain'}</span
    >
    <small
      >{fr
        ? 'Une main libre permet de retirer les aiguilles après la douleur d’impact.'
        : 'A free hand can remove the needles after impact pain.'}</small
    >
  </div>
{/if}
{#if fighter.needlePuppet}
  <div class="illumi-status controlled" role="status">
    <strong>{fr ? 'Needle People · Autonomie perdue' : 'Needle People · Autonomy lost'}</strong>
    <span
      >{fighter.needlePuppet.needleEmbedded
        ? `${fr ? 'Aiguille implantée · ordre' : 'Embedded needle · order'} : ${needleOrderLabel(fighter.needlePuppet.order, language)}`
        : fr
          ? 'Aiguille détruite · les séquelles ne disparaissent pas'
          : 'Needle destroyed · permanent injury remains'}</span
    >
    <small
      >{fr
        ? 'Aucune libération après deux secondes. Corps réinitialisé à la manche suivante.'
        : 'No two-second release. Body resets next round.'}</small
    >
  </div>
{/if}

<style>
  .illumi-status {
    display: grid;
    gap: 0.3rem;
    color: #c8bce0;
    overflow-wrap: anywhere;
  }
  strong {
    color: #e3d2f5;
    font-weight: 650;
  }
  progress {
    width: 100%;
    height: 0.4rem;
    accent-color: #b99ed6;
  }
  small {
    color: #aab9c4;
    font: inherit;
  }
  .warning,
  .controlled {
    color: #f3c6b4;
  }
</style>
