<script lang="ts">
  import FightGumNetwork from './FightGumNetwork.svelte'
  import { ownedGumLinks } from '$lib/fighting/bungeeNetwork'
  import { performArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
  import { observeFightCommand } from '$lib/fighting/commandFeedback'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let side: FightSide = 'player'
  export let actions: { queueAction: (action: (state: FightState) => FightState) => void }
  let open = false
  function use(seat: FightSide, command: ArsenalCommand) {
    actions.queueAction((current) =>
      observeFightCommand(current, { side: seat, action: 'utility' }, (next) =>
        performArsenalCommand(next, seat, command),
      ),
    )
  }
</script>

<details
  class="live-gum"
  class:opponent={side === 'opponent'}
  bind:open
  aria-label={language === 'fr' ? 'Bungee Gum en combat' : 'Combat Bungee Gum'}
>
  <summary
    >{side === 'player' ? 'P1' : 'P2'} · Bungee Gum · {ownedGumLinks(state, side).length}</summary
  >
  {#if open}
    <div class="gum-panel"><FightGumNetwork {state} {side} {language} onUse={use} /></div>
  {/if}
</details>

<style>
  .live-gum {
    position: absolute;
    top: 8.6rem;
    left: 0.8rem;
    z-index: 28;
    width: min(320px, 43vw);
    color: #f6d8eb;
    font: 0.7rem/1.4 var(--font-mono);
  }
  .live-gum.opponent {
    left: auto;
    right: 0.8rem;
  }
  summary {
    cursor: pointer;
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #ac648c;
    background: #211020ed;
  }
  .gum-panel {
    max-height: min(56vh, 480px);
    overflow: auto;
    background: #211020f5;
    padding: 0.4rem;
  }
  @media (max-width: 600px) {
    .live-gum {
      top: 6rem;
      left: 0.3rem;
      width: min(300px, 75vw);
    }
    .live-gum.opponent {
      right: 0.3rem;
    }
  }
</style>
