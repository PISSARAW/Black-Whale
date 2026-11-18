<script lang="ts">
  import { canAct } from '$lib/fighting/fightActorState'
  import { voluntaryNenAvailable } from '$lib/fighting/nenAccess'
  import { implantedJudgmentLabel } from '$lib/fighting/judgmentPresentation'
  import type { LiveBookActions } from '$lib/fighting/chrolloLiveBook'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let actions: LiveBookActions
  export let side: FightSide = 'player'
  export let replay = false
  $: fighter = state[side]
  $: other = (side === 'player' ? 'opponent' : 'player') as FightSide
  $: chain = fighter.kurapika
  $: locked = Boolean(chain?.held?.loaded)
  $: ready =
    !replay &&
    canAct(fighter) &&
    (Boolean(chain?.emperorTime) || voluntaryNenAvailable(fighter)) &&
    !locked
</script>

{#if chain}
  <aside
    class="live-chains"
    aria-label={language === 'fr' ? 'Chaînes de Kurapika en combat' : 'Kurapika combat chains'}
  >
    <button
      type="button"
      disabled={!ready}
      onclick={() => actions.queueCommand({ kind: 'emperor', side })}
    >
      Emperor Time · {chain.emperorTime
        ? language === 'fr'
          ? 'Actif'
          : 'On'
        : language === 'fr'
          ? 'Inactif'
          : 'Off'}
    </button>
    {#if chain.emperorTime || chain.lifespanFrames > 0}<small
        >Emperor Time · {Math.floor(chain.lifespanFrames / 60)} h {language === 'fr'
          ? 'de vie perdues'
          : 'of lifespan lost'}</small
      >{/if}
    {#if chain.held}<small
        >{chain.held.loaded ? 'Stealth Dolphin' : 'Steal Chain'} · {language === 'fr'
          ? 'capacité retenue'
          : 'ability retained'}</small
      >{/if}
    {#if chain.held?.source === 'chrollo'}<small
        >{language === 'fr'
          ? 'Skill Hunter : livre et conditions requis.'
          : 'Skill Hunter: book and conditions required.'}</small
      >{/if}
    {#if state[other].chainJail}<small>Chain Jail · Zetsu</small>{/if}
    {#if state[other].judgmentChain}<small
        >Judgment Chain · {implantedJudgmentLabel(state[other], language)}</small
      >{/if}
    {#if locked}<small
        >{language === 'fr'
          ? 'Emperor Time verrouillé : terminer Dolphin.'
          : 'Emperor Time locked: finish Dolphin.'}</small
      >{/if}
  </aside>
{/if}

<style>
  .live-chains {
    position: absolute;
    top: 8.6rem;
    left: 0.8rem;
    z-index: 27;
    max-width: min(290px, 36vw);
    padding: 0.45rem 0.6rem;
    color: #e8d9b9;
    background: #171018df;
    border-left: 2px solid #be7785;
  }
  button {
    min-height: 36px;
    padding: 0.3rem 0.5rem;
    color: #ffb2bb;
    background: #301723;
    border: 1px solid #8c5264;
    cursor: pointer;
    font: 0.65rem var(--font-mono);
  }
  button:disabled {
    opacity: 0.55;
    cursor: default;
  }
  small {
    display: block;
    font: 0.55rem/1.4 var(--font-mono);
  }
  button:focus-visible {
    outline: 2px solid #edcb8a;
    outline-offset: 2px;
  }
</style>
