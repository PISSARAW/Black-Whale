<script lang="ts">
  import FightHatsuPanels from './FightHatsuPanels.svelte'
  import FightLynchInterrogation from './FightLynchInterrogation.svelte'
  import FightBlinkyPanel from './FightBlinkyPanel.svelte'
  import FightResources from './FightResources.svelte'
  import FightDecisionReadout from './FightDecisionReadout.svelte'
  import FightEasterEggs from './FightEasterEggs.svelte'
  import { performAuraAttack } from '$lib/fighting/engine'
  import { askLynchQuestion } from '$lib/fighting/lynchAction'
  import { battleStageCallbacks } from '../../../routes/fighting/battleCallbacks'
  import type { FightState } from '$lib/fighting/types'
  import type { FightBattleActions } from '$lib/fighting/fightBattleActions'
  import { defaultEasterEggPreferences } from '$lib/fighting/easterEggPreferences'
  export let language: 'fr' | 'en'
  export let state: FightState
  export let actions: FightBattleActions
  export let replay = false
  export let queued = 0
  export let easterEggPreferences = defaultEasterEggPreferences()
</script>

<div class="pause-techniques">
  {#if !replay}<p class="technique-note" role="status">
      {language === 'fr'
        ? 'Choisis tes techniques ici. Les actions préparées seront exécutées à la reprise, si leurs conditions le permettent.'
        : 'Choose your techniques here. Prepared actions execute on resume when their conditions are met.'}{#if queued}<b
        >
          · {queued} {language === 'fr' ? 'en attente' : 'queued'}</b
        >{/if}
    </p>{/if}
  <FightLynchInterrogation
    {state}
    {language}
    paused={replay}
    onQuestion={(side, question) =>
      actions.queueAction((current) =>
        askLynchQuestion({ state: current, side, question }, performAuraAttack),
      )}
  />
  <FightHatsuPanels
    {state}
    {language}
    paused={replay}
    onAction={actions.queueAction}
    perform={performAuraAttack}
    onEditing={actions.resetFightInputs}
  />
  <FightBlinkyPanel
    {state}
    {language}
    onTarget={actions.blinkyTarget}
    onCommand={actions.blinkyCommand}
    onHold={() => {}}
  />
  <div class="pause-resource-details">
    <FightResources
      {state}
      {language}
      detailed
      onAura={() => {}}
      onEmperor={() => actions.queueCommand({ kind: 'emperor', side: 'player' })}
      {...battleStageCallbacks(actions.queueAction)}
    />
  </div>
  <FightDecisionReadout {state} {language} />
  <FightEasterEggs
    {state}
    {language}
    paused={replay}
    bind:preferences={easterEggPreferences}
    onPlay={(side, slot) => actions.queueCommand({ kind: 'easter', side, slot })}
  />
</div>

<style>
  .pause-techniques {
    display: grid;
    gap: 0.8rem;
  }
  .technique-note {
    margin: 0;
    padding: 0.8rem;
    border-left: 2px solid #ff864b;
    background: #ff864b0a;
    color: #cbb4db;
    font: 0.7rem/1.6 var(--font-mono);
  }
  .technique-note b {
    color: #ffbd98;
  }
  .pause-resource-details :global(.combat-resources) {
    display: grid;
    grid-template-columns: 1fr;
    padding: 0;
    background: transparent;
  }
  .pause-resource-details :global(.fighter-resources) {
    padding: 1rem;
    border: 1px solid #5b436b;
    background: #17101e;
  }
  .pause-resource-details :global(.nen-buttons),
  .pause-resource-details :global(.tactics),
  .pause-resource-details :global(.arena-status button),
  .pause-resource-details :global(.preparation-status button) {
    display: none;
  }
  .pause-techniques :global(.blinky-side button) {
    display: none;
  }
</style>
