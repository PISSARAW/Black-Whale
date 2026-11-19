<script lang="ts">
  import { activePaperOwner, paperDollMarked, paperDolls } from '$lib/fighting/kallutoSurveillance'
  import { paperObserverReady } from '$lib/fighting/kallutoSpeech'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: visible = side === 'player' || state.mode === 'versus-local' || state.mode === 'training'
  $: dolls = visible ? paperDolls(state[side]) : []
  $: owner = activePaperOwner(state, side)
  $: active = paperObserverReady(state[side])
</script>

{#if dolls.length}
  <div
    class="paper-receivers"
    aria-label={language === 'fr' ? 'Récepteurs de papier' : 'Paper receivers'}
  >
    {#each dolls as doll (`${doll.target}:${doll.targetMember ?? 0}`)}
      <p>
        <strong
          >{language === 'fr' ? 'Poupée' : 'Doll'} · {doll.target === 'player' ? 'P1' : 'P2'} · {language ===
          'fr'
            ? 'membre'
            : 'member'}
          {(doll.targetMember ?? 0) + 1}</strong
        >
        <span
          >{active && doll.active !== false && paperDollMarked(state, owner, doll)
            ? language === 'fr'
              ? 'Écoute active'
              : 'Listening'
            : language === 'fr'
              ? 'Écoute interrompue'
              : 'Listening interrupted'}</span
        >
        {#if doll.heard}<span>« {doll.heard.text} »</span>{/if}
      </p>
    {/each}
  </div>
{/if}

<style>
  .paper-receivers {
    display: grid;
    gap: 0.4rem;
  }
  p {
    display: grid;
    gap: 0.2rem;
    padding: 0.5rem;
    margin: 0;
    border: 1px solid #968d8a;
    overflow-wrap: anywhere;
  }
</style>
