<script lang="ts">
  import { moonlightClauseText } from '$lib/fighting/moonlightClauseText'
  import type { MoonlightClauseId } from '$lib/fighting/moonlightClauses'

  export let clause: MoonlightClauseId
  export let language: 'fr' | 'en'
  $: text = moonlightClauseText(clause, language)
  $: fr = language === 'fr'
</script>

<div class="clause" data-moonlight-clause={clause}>
  <strong>{text.name}</strong>
  <dl>
    <dt>{fr ? 'Termes' : 'Terms'}</dt>
    <dd>{text.terms}</dd>
    <dt>{fr ? 'Durée' : 'Duration'}</dt>
    <dd>{text.duration}</dd>
    <dt>{fr ? 'Récompense' : 'Reward'}</dt>
    <dd>{text.reward}</dd>
    <dt>{fr ? 'Sanction' : 'Penalty'}</dt>
    <dd>{text.penalty}</dd>
  </dl>
  <slot />
</div>

<style>
  .clause {
    display: grid;
    gap: 0.3rem;
    padding: 0.5rem 0.6rem;
    border: 1px solid #3a4760;
    border-radius: 0.35rem;
    background: #0c141d;
  }
  strong {
    color: #ecedff;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.15rem 0.6rem;
    margin: 0;
  }
  dt {
    color: #aab8cd;
  }
  dd {
    margin: 0;
  }
</style>
