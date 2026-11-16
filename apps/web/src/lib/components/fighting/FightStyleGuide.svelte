<script lang="ts">
  import { styleMatchup } from '$lib/fighting/styleMatchups'
  import type { FighterId } from '$lib/fighting/types'
  export let fighterId: FighterId
  export let language: 'fr' | 'en'
  $: matchup = styleMatchup(fighterId)
  $: index = language === 'fr' ? 0 : 1
</script>

<details class="style-guide">
  <summary>{language === 'fr' ? 'Plan de jeu et contre-jeu' : 'Game plan and counterplay'}</summary>
  <p>
    <strong>{language === 'fr' ? 'Jouer ce style' : 'Playing this style'}</strong> · {matchup.plan[
      index
    ]}
  </p>
  <p>
    <strong>{language === 'fr' ? 'Y répondre' : 'Responding to it'}</strong> · {matchup.counter[
      index
    ]}
  </p>
  <small
    >{language === 'fr'
      ? 'Conseils pour les règles de Clash ; aucun prérequis de Nen n’est supprimé.'
      : 'Advice for Clash rules; Nen prerequisites still apply.'}</small
  >
</details>

<style>
  .style-guide {
    border-left: 2px solid #d7b86a;
    padding: 0.5rem 0.7rem;
    margin: 0.65rem 0;
    color: #d9e5eb;
  }
  summary {
    cursor: pointer;
    color: #f5d25c;
  }
  p {
    margin: 0.55rem 0;
    font-size: 0.8rem;
    line-height: 1.5;
  }
  small {
    color: #a9bbc7;
  }
</style>
