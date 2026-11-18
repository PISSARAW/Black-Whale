<script lang="ts">
  import { comboChoices } from '$lib/fighting/comboChoices'
  import { useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  const bindings = useFightBindings()
  const labels = {
    unavailable: ['Conditions manquantes', 'Requirements not met'],
    late: ['Trop tard', 'Too late'],
    confirm: ['Confirme la touche', 'Confirm the hit'],
    ready: ['Maintenant', 'Now'],
    wait: ['Attends la récupération', 'Wait for recovery'],
    blocked: ['Coup gardé · fin de pression', 'Blocked · pressure ends'],
  }
  const openings = {
    tip: ['Bout de portée', 'Tip hit'],
    'anti-air': ['Anti-air', 'Anti-air'],
    'corner-counter': ['Contre au coin', 'Corner counter'],
  }
  const rewards = {
    knockdown: ['Mise au sol proche', 'Close knockdown'],
    backfist: ['Avance pour prolonger', 'Steps in to extend'],
    chain: ['Reprise à la chaîne', 'Chain conversion'],
    attach: ['Pose une attache', 'Applies a tether'],
    tether: ['Consomme l’attache', 'Consumes the tether'],
    'short-burst': ['10 tirs · récupère plus vite', '10 shots · shorter recovery'],
    'long-burst': ['20 tirs · reste exposé plus longtemps', '20 shots · longer commitment'],
  }
  $: choices = comboChoices(state)
  $: index = language === 'fr' ? 0 : 1
</script>

{#if choices.length}
  <div
    class="combo-choices"
    aria-label={language === 'fr' ? 'Choix après la touche' : 'Choices after a hit'}
  >
    <strong>{language === 'fr' ? 'Choix après la touche' : 'Choices after a hit'}</strong>
    {#each choices as choice (choice.move.id)}
      <span
        class:unavailable={choice.status === 'unavailable' ||
          choice.status === 'late' ||
          choice.status === 'blocked'}
      >
        <kbd>{moveInputHint(choice.move.input, $bindings)}</kbd>
        · {language === 'fr' ? choice.move.nameFr : choice.move.nameEn}
        · {choice.link ? (language === 'fr' ? 'liaison' : 'link') : 'cancel'}
        {#if choice.opening}· {openings[choice.opening][index]}{/if}
        {#if choice.reward}· {rewards[choice.reward][index]}{/if}
        · {choice.cost} aura · {labels[choice.status][index]}
      </span>
    {/each}
  </div>
{/if}

<style>
  .combo-choices {
    display: grid;
    gap: 0.2rem;
    border-top: 1px solid #526878;
    margin-top: 0.3rem;
    padding-top: 0.3rem;
  }
  kbd {
    color: #a7dcff;
  }
  .unavailable {
    opacity: 0.65;
  }
</style>
