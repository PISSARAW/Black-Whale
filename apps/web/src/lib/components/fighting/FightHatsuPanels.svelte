<script lang="ts">
  import FightRetrospectiveArsenal from './FightRetrospectiveArsenal.svelte'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { observeFightCommand } from '$lib/fighting/commandFeedback'
  import FightKallutoPaper from './FightKallutoPaper.svelte'
  import { selectPaperTarget, selectPaperCommand } from '$lib/fighting/kallutoPaper'
  import { speakBattleWords } from '$lib/fighting/battleConversation'
  import { runOutsideEasterEgg } from '$lib/fighting/easterEggs'

  import FightBashoPoem from './FightBashoPoem.svelte'
  import FightMoonlightPanel from './FightMoonlightPanel.svelte'
  import FightBloodyMary from './FightBloodyMary.svelte'
  import { composeBashoPoem } from '$lib/fighting/bashoAction'
  import { commandMary } from '$lib/fighting/bloodyMaryAction'
  import { offerMoonlightContract, respondMoonlightContract } from '$lib/fighting/moonlightContract'
  import type { AuraAttackOptions } from '$lib/fighting/auraAttackAction'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let onAction: (action: (state: FightState) => FightState) => void
  export let onEditing: () => void
  export let perform: (options: AuraAttackOptions) => FightState
  function dispatch(side: FightSide, action: (state: FightState) => FightState) {
    onAction((current) =>
      observeFightCommand(current, { side, action: 'utility' }, (next) =>
        runOutsideEasterEgg(next, side, action),
      ),
    )
  }
</script>

<FightRetrospectiveArsenal
  {state}
  {language}
  {paused}
  onUse={(side, command) =>
    dispatch(side, (current) => performArsenalAction({ state: current, side, command }, perform))}
/>

<FightBloodyMary
  {state}
  {language}
  {paused}
  onCommand={(side, command) =>
    dispatch(side, (current) => commandMary({ state: current, side, command }, perform))}
/>
<FightBashoPoem
  {state}
  {language}
  {paused}
  {onEditing}
  onCompose={(side, text) =>
    dispatch(side, (current) => composeBashoPoem({ state: current, side, text }, perform))}
/>
<FightMoonlightPanel
  {state}
  {language}
  {paused}
  onOffer={(side) => dispatch(side, (current) => offerMoonlightContract({ state: current, side }))}
  onRespond={(side, accept) =>
    dispatch(side, (current) => respondMoonlightContract({ state: current, side, accept }))}
/>

<FightKallutoPaper
  {onEditing}
  {state}
  {language}
  {paused}
  onZone={(side, zone) => dispatch(side, (current) => selectPaperTarget(current, side, zone))}
  onCommand={(side, command) =>
    dispatch(side, (current) => selectPaperCommand(current, side, command))}
  onUse={(side, command) =>
    dispatch(side, (current) =>
      perform({
        state: current,
        side,
        kind: 'special',
        auraCharged: false,
        moveId: `kalluto:${command === 'plant' ? 'neutralSpecial' : command === 'serpent' ? 'forwardSpecial' : 'backSpecial'}`,
      }),
    )}
  onSpeak={(side, words) => dispatch(side, (current) => speakBattleWords(current, side, words))}
/>
