<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { seesCombatBody } from '$lib/fighting/fightCounterplay'
  import { canSpeak } from '$lib/fighting/saiyuSenses'
  import { HANZO_CALL_RANGE } from '$lib/fighting/hanzoBodyCall'
  import type { FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let onCall: () => void
  $: knownBody = seesCombatBody(state.player) && state.opponent.hanzoProjection
  $: callReady =
    canSpeak(state.player) &&
    state.player.hitStun === 0 &&
    Boolean(
      knownBody && Math.hypot(state.player.x - knownBody.bodyX, state.player.y) <= HANZO_CALL_RANGE,
    )
</script>

{#if knownBody}
  <button
    type="button"
    disabled={!callReady}
    title={language === 'fr'
      ? 'Interpeller le corps endormi à proximité'
      : 'Call to the nearby sleeping body'}
    onclick={onCall}
    ><kbd>{$bindings.playerCall}</kbd> {language === 'fr' ? 'Interpeller' : 'Call out'}</button
  >
{/if}

<style>
  button {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    height: 46px;
    padding: 0 0.7rem;
    border: 1px solid rgb(255 255 255 / 34%);
    border-radius: 24px;
    background: rgb(6 10 14 / 72%);
    color: #fff;
    font: 700 0.65rem/1 var(--font-mono);
    backdrop-filter: blur(5px);
  }
  button:active {
    background: #c7952d;
    color: #080a0c;
  }
  button:disabled {
    opacity: 0.35;
  }
  @media (max-width: 700px) {
    button {
      height: 42px;
    }
  }
</style>
