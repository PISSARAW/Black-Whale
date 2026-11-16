<script lang="ts">
  import { CYCLOTRON_ROTATION_FRAMES, cyclotronNenActive } from '$lib/fighting/phinksCyclotron'
  import type { ArcadeFighter, FightSide } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
  export let side: FightSide
  $: turns = fighter.hatsuEffects.cyclotronTurns
  $: windup = fighter.cyclotronWindup
  $: committed = fighter.attack?.cyclotronTurns ?? 0
  $: show = fighter.id === 'phinks' || windup || turns > 0 || committed > 0
</script>

{#if show}
  <div class="cyclotron-status" aria-label="Ripper Cyclotron">
    <strong>Ripper Cyclotron · {language === 'fr' ? 'bras droit' : 'right arm'}</strong>
    <span>{turns} {language === 'fr' ? 'tours complets en réserve' : 'completed turns stored'}</span
    >
    {#if windup}
      <label>
        {language === 'fr' ? 'Rotation en cours' : 'Current rotation'}
        <progress max={CYCLOTRON_ROTATION_FRAMES} value={windup.frame}></progress>
      </label>
      <small
        >{language === 'fr'
          ? 'Préparation exposée, sans garde.'
          : 'Exposed wind-up, without guard.'}</small
      >
    {:else if committed > 0}
      <span
        >{language === 'fr' ? 'Charge libérée' : 'Charge released'} · {committed}
        {language === 'fr' ? 'tours' : 'turns'}</span
      >
    {/if}
    {#if fighter.id === 'phinks'}<small>
        {side === 'player' ? 'L' : ','} : {language === 'fr'
          ? 'mouliner / arrêter'
          : 'wind / pause'} ·
        {side === 'player' ? 'H' : 'B'} : {language === 'fr' ? 'libérer le poing' : 'release punch'}
      </small>{:else}<small
        >{language === 'fr'
          ? 'Copie : réutiliser la capacité après un tour complet pour frapper.'
          : 'Copy: use the ability again after a full turn to punch.'}</small
      >{/if}
    {#if !cyclotronNenActive(fighter)}
      <small>{language === 'fr' ? 'Nen actif requis.' : 'Active Nen required.'}</small>
    {/if}
    <small
      >{language === 'fr'
        ? 'Aucun bonus aux autres attaques. Cadence, coût et dégâts adaptés au duel.'
        : 'Other attacks gain no bonus. Cadence, cost and damage are duel tuning.'}</small
    >
  </div>
{/if}

<style>
  .cyclotron-status {
    display: grid;
    gap: 0.3rem;
    padding: 0.55rem;
    border: 1px solid #806b3b;
    color: #f0cf83;
    overflow-wrap: anywhere;
  }
  label {
    display: grid;
    gap: 0.2rem;
  }
  progress {
    width: 100%;
    min-width: 0;
    height: 0.4rem;
    accent-color: #f0cf83;
  }
  small {
    color: #bec8ce;
  }
</style>
