<script lang="ts">
  import FightHalkenburgStatus from './FightHalkenburgStatus.svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
</script>

<FightHalkenburgStatus {state} {side} {language} />

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
