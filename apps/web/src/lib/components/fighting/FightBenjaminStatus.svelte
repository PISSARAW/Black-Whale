<script lang="ts">
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  import { benjaminNenActive } from '$lib/fighting/benjaminBaton'
  import { moveById } from '$lib/fighting/movesets'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let detailed = false

  $: fighter = state[side]
  $: baton = fighter.hatsuEffects.baton
  $: active = benjaminNenActive(fighter)
  $: cardKey = side === 'player' ? $bindings.playerFinisher : $bindings.opponentFinisher
  $: target = baton?.markedTarget ? state[baton.markedTarget] : null
  $: move = moveById(target?.attack?.moveId)
  $: action = target?.attack?.concealed
    ? language === 'fr'
      ? 'Mouvement observé'
      : 'Observed movement'
    : move
      ? language === 'fr'
        ? move.nameFr
        : move.nameEn
      : target?.attack?.kind === 'ranged'
        ? language === 'fr'
          ? 'Tir'
          : 'Ranged attack'
        : target?.blocking
          ? language === 'fr'
            ? 'Garde'
            : 'Guard'
          : target?.y
            ? language === 'fr'
              ? 'Saut'
              : 'Jump'
            : language === 'fr'
              ? 'Déplacement / attente'
              : 'Movement / idle'
</script>

{#if fighter.id === 'benjamin' && baton}
  <div class="baton-status">
    <span
      >Benjamin Baton · {'★'.repeat(baton.inherited.length)} · {language === 'fr'
        ? 'héritages connus'
        : 'known inheritances'}</span
    >
    {#if detailed}<span>Air Blow · Secret Window · Culdcept</span>{/if}
    {#if !active}
      <span>{language === 'fr' ? 'Héritages suspendus' : 'Inherited abilities suspended'}</span>
    {:else}
      <span
        >Culdcept · {baton.card
          ? language === 'fr'
            ? `carte prête [${cardKey}]`
            : `card ready [${cardKey}]`
          : language === 'fr'
            ? 'sans carte'
            : 'no card'}</span
      >
      {#if target}<span>Secret Window · {action}</span>{/if}
    {/if}
  </div>
{/if}

<style>
  .baton-status {
    display: grid;
    gap: 0.12rem;
    color: #f1d36d;
    font: 600 0.58rem/1.4 var(--font-mono);
    margin-top: 0.3rem;
  }
</style>
