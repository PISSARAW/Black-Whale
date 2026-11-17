<script lang="ts">
  import FightRetrospectiveArsenal from './FightRetrospectiveArsenal.svelte'
  import FightBloodyMary from './FightBloodyMary.svelte'
  import FightBashoPoem from './FightBashoPoem.svelte'
  import FightMoonlightPanel from './FightMoonlightPanel.svelte'
  import FightKallutoPaper from './FightKallutoPaper.svelte'
  import FightLynchInterrogation from './FightLynchInterrogation.svelte'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import type { PvpCommand } from '$lib/fighting/pvp/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onCommand: (command: PvpCommand) => void
  export let onEditing: () => void
  function send(side: FightSide, command: PvpCommand) {
    if (side === 'player') onCommand(command)
  }
</script>

<FightRetrospectiveArsenal
  {state}
  {language}
  {paused}
  onUse={(side, command) => send(side, { kind: 'arsenal', command })}
/>

<FightBloodyMary
  {state}
  {language}
  {paused}
  onCommand={(side, command) => send(side, { kind: 'mary', command })}
/>
<FightBashoPoem
  {state}
  {language}
  {paused}
  {onEditing}
  onCompose={(side, text) => send(side, { kind: 'poem', text })}
/>
<FightMoonlightPanel
  {state}
  {language}
  {paused}
  onOffer={(side) => send(side, { kind: 'offer' })}
  onRespond={(side, accept) => send(side, { kind: 'respond', accept })}
/>
<FightLynchInterrogation
  {state}
  {language}
  {paused}
  onQuestion={(side, question) => send(side, { kind: 'question', question })}
/>
<FightKallutoPaper
  {state}
  {language}
  {paused}
  {onEditing}
  onZone={(side, zone) => send(side, { kind: 'paper-target', zone })}
  onCommand={(side, command) => send(side, { kind: 'paper-command', command })}
  onUse={(side, command) => send(side, { kind: 'paper-use', command })}
  onSpeak={(side, words) => send(side, { kind: 'talk', words })}
/>
