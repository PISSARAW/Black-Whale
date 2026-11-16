<script lang="ts">
  import FightBashoPoem from './FightBashoPoem.svelte'
  import FightMoonlightPanel from './FightMoonlightPanel.svelte'
  import FightBloodyMary from './FightBloodyMary.svelte'
  import { composeBashoPoem } from '$lib/fighting/bashoAction'
  import { commandMary } from '$lib/fighting/bloodyMaryAction'
  import { offerMoonlightContract, respondMoonlightContract } from '$lib/fighting/moonlightContract'
  import type { AuraAttackOptions } from '$lib/fighting/auraAttackAction'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onAction: (action: (state: FightState) => FightState) => void
  export let onEditing: () => void
  export let perform: (options: AuraAttackOptions) => FightState
</script>

<FightBloodyMary
  {state}
  {language}
  {paused}
  onCommand={(side, command) =>
    onAction((current) => commandMary({ state: current, side, command }, perform))}
/>
<FightBashoPoem
  {state}
  {language}
  {paused}
  {onEditing}
  onCompose={(side, text) =>
    onAction((current) => composeBashoPoem({ state: current, side, text }, perform))}
/>
<FightMoonlightPanel
  {state}
  {language}
  {paused}
  onOffer={(side) => onAction((current) => offerMoonlightContract({ state: current, side }))}
  onRespond={(side, accept) =>
    onAction((current) => respondMoonlightContract({ state: current, side, accept }))}
/>
