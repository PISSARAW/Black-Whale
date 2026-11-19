<script lang="ts">
  import { halkenburgMode } from '$lib/fighting/halkenburgSoulTypes'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState, FightSide } from '$lib/fighting/types'
  import FightHalkenburgChain from './FightHalkenburgChain.svelte'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: actor = state[side]
  $: relevant =
    actor.id === 'halkenburg' || actor.halkSoul || state.halkSoulOrigins?.[side] === 'halkenburg'
</script>

{#if relevant}
  <div class="soul-status" aria-live="polite">
    <span
      >{language === 'fr' ? 'Halkenburg · Mode' : 'Halkenburg · Mode'} : {halkenburgMode(
        state,
        side,
      ) === 'souls' || actor.halkSoul
        ? language === 'fr'
          ? 'Transfert de conscience'
          : 'Mind transfer'
        : language === 'fr'
          ? 'Variante du roster'
          : 'Roster variant'}</span
    >
    {#if actor.halkSoul}
      <span
        >{language === 'fr' ? 'Corps matériel' : 'Physical body'} : {actor.halkCohortBody
          ? language === 'fr'
            ? 'Partisan du scénario'
            : 'Scenario supporter'
          : fighterDefinition(actor.id).name}</span
      >
      {#if actor.halkSoul.mind?.identity}<span
          >{language === 'fr' ? 'Conscience' : 'Mind'} : {fighterDefinition(
            actor.halkSoul.mind.identity,
          ).name}</span
        >{/if}
      {#if actor.halkSoulSleep}<span
          >{language === 'fr'
            ? 'Conscience assoupie · corps vulnérable'
            : 'Sleeping mind · vulnerable body'}</span
        >{/if}
      {#if actor.health <= 0 && actor.halkSoulAlive}<span
          >{language === 'fr'
            ? 'Corps mort · conscience encore vivante dans l’autre corps'
            : 'Body dead · mind still alive in the other body'}</span
        >{/if}
      {#if actor.halkForeignMind}<span
          >{language === 'fr'
            ? 'Aucun Hatsu du corps obtenu par le transfert'
            : 'No host Hatsu acquired by transfer'}</span
        >{/if}
    {/if}
    {#each state.halkSoulLinks?.filter((link) => link.owner === side) ?? [] as link (link.id)}
      <span
        >{language === 'fr' ? 'Échange' : 'Exchange'}
        {link.id} · {link.phase === 'swapped'
          ? language === 'fr'
            ? 'Corps de départ et d’arrivée vivants'
            : 'Departure and arrival bodies alive'
          : link.phase === 'cohabiting'
            ? language === 'fr'
              ? 'Corps de départ mort · retour de conscience'
              : 'Departure body dead · returning mind'
            : language === 'fr'
              ? 'Corps occupé perdu'
              : 'Occupied body lost'}</span
      >
      {#if link.preparedSedative > 0}<span
          >{language === 'fr'
            ? 'Préparation de scénario · sommeil au retour'
            : 'Scenario preparation · sleep upon return'} · {(link.preparedSedative / 60).toFixed(
            1,
          )} s</span
        >{/if}
    {/each}
    <FightHalkenburgChain {state} {language} />
  </div>
{/if}

<style>
  .soul-status {
    display: grid;
    gap: 0.25rem;
    color: #b9c7d5;
    font: 600 0.72rem/1.4 var(--font-mono);
    overflow-wrap: anywhere;
  }
</style>
