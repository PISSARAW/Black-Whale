<script lang="ts">
  import {
    comboMasterMonitoring,
    comboMasterNenActive,
  } from '$lib/fighting/comboMasterAvailability'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let compact = false

  $: fighter = state[side]
  $: console = fighter.comboMaster
  $: active = state.phase === 'fighting' && comboMasterMonitoring(fighter)
  $: alert = active ? console?.alert : null
  $: key = side === 'opponent' && state.mode === 'versus-local' ? ',' : 'L'
  $: signature = alert?.signature ? fighterDefinition(alert.signature).name : '?'
  $: affected = alert?.affected
    .map((target) =>
      target === side || fighter.nen.gyo || !state[target].nen.in
        ? fighterDefinition(state[target].id).name
        : '?',
    )
    .join(', ')
</script>

{#if compact}
  {#if alert}
    <div class="combo-master alert compact" aria-hidden="true">
      <strong>{language === 'fr' ? 'ALERTE NEN' : 'NEN ALERT'}</strong>
      <span>Combo Master · {signature}</span>
    </div>
  {/if}
{:else if fighter.id === 'furykov' || active}
  <div class="combo-master" class:alert={Boolean(alert)} role="status" aria-live="polite">
    <strong
      >Combo Master · {alert
        ? language === 'fr'
          ? 'ALERTE'
          : 'ALERT'
        : active
          ? language === 'fr'
            ? 'veille'
            : 'monitoring'
          : language === 'fr'
            ? 'console inactive'
            : 'console inactive'}</strong
    >
    {#if alert}
      <span
        >{alert.incoming
          ? language === 'fr'
            ? 'Nen dissimulé dirigé contre vous'
            : 'Concealed Nen targeting you'
          : language === 'fr'
            ? 'Effet de Nen dissimulé actif'
            : 'Concealed Nen effect active'}</span
      >
      <span>{language === 'fr' ? 'Signature' : 'Signature'} : {signature}</span>
      <span
        >{language === 'fr' ? 'Personnes affectées' : 'Affected users'} : {affected ||
          (language === 'fr' ? 'aucune confirmée' : 'none confirmed')}</span
      >
    {:else if active}
      <span
        >{language === 'fr'
          ? 'Aucun Nen dissimulé détecté · aucune protection automatique'
          : 'No concealed Nen detected · no automatic protection'}</span
      >
    {:else}
      <span
        >{comboMasterNenActive(fighter)
          ? language === 'fr'
            ? `${key} · ouvrir la console`
            : `${key} · open console`
          : language === 'fr'
            ? 'Nen utilisable requis'
            : 'Usable Nen required'}</span
      >
    {/if}
  </div>
{/if}

<style>
  .combo-master {
    display: grid;
    gap: 0.15rem;
    color: #a8c9e8;
    overflow-wrap: anywhere;
  }
  .combo-master.alert {
    color: #ffda83;
    padding: 0.4rem;
    border: 1px solid #9a733a;
    background: #241c12;
  }
  .combo-master.compact {
    margin-top: 0.3rem;
    padding: 0.25rem;
    font: 600 var(--hud-small-font, 0.65rem)/1.35 var(--font-mono);
  }
  strong {
    font-weight: 700;
  }
</style>
