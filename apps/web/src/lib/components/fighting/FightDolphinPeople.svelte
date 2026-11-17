<script lang="ts">
  import FightLittleEyeScreen from './FightLittleEyeScreen.svelte'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: people = (state.battlefield?.entities ?? []).filter(
    (entry) => entry.person?.control.side === side,
  )
</script>

{#each people as entry (entry.id)}
  <div
    role="status"
    aria-label={language === 'fr' ? 'Oito · Nen et Dolphin' : 'Oito · Nen and Dolphin'}
  >
    <strong>Oito</strong>
    <p>
      {entry.person!.nen === 'semi-open'
        ? language === 'fr'
          ? 'Nœuds d’aura entrouverts : elle voit l’aura ; Ten et Hatsu personnels non acquis.'
          : 'Aura nodes partly open: she can see aura; no personal Ten or Hatsu acquired.'
        : language === 'fr'
          ? 'Nœuds d’aura fermés ; aucune maîtrise personnelle du Nen.'
          : 'Closed aura nodes; no personal Nen mastery.'}
    </p>
    {#if entry.person!.loan}
      {#if entry.person!.loan!.held.source === 'sayird'}
        <p>
          {language === 'fr'
            ? 'Dolphin · Little Eye : une boule d’aura doit atteindre un petit animal réel, au plus de la taille d’un hamster. Sa vue et son ouïe sont transmises ; les créatures de Nen sont exclues.'
            : 'Dolphin · Little Eye: an aura ball must reach a real small animal, at most hamster-sized. Its sight and hearing are transmitted; Nen creatures are excluded.'}
        </p>
      {:else if entry.person!.loan!.held.source === 'bill'}
        <p>
          {language === 'fr'
            ? 'Dolphin · Erigeron : transmettre l’aura prélevée à une graine vivante au contact pour accélérer sa croissance.'
            : 'Dolphin · Erigeron: transmit the stolen aura to a contacted living seed to accelerate its growth.'}
        </p>
      {/if}
      <p>
        {language === 'fr'
          ? 'Elle peut voir l’aura. L’application utilise l’aura prélevée au donneur ; le prêteur maintient Emperor Time.'
          : 'She can see aura. The application uses the stolen donor aura; the lender maintains Emperor Time.'}
      </p>
      {#if entry.person!.loan!.blackoutFrames}
        <p>
          {language === 'fr'
            ? 'Inconsciente avec le prêteur ; aucun nouvel ordre ni perception.'
            : 'Unconscious with the lender; no new command or perception.'}
        </p>
      {/if}
    {/if}
    <FightLittleEyeScreen screen={entry.person!.littleEyeScreen} {language} />
  </div>
{/each}
