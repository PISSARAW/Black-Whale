<script lang="ts">
  import { activeRivalryRules } from '$lib/fighting/rivalryRules'
  import type { FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let compact = false
  $: rules = activeRivalryRules(state)
  $: fr = language === 'fr'
</script>

{#if rules.length}
  <section
    class:compact
    class="rivalry-rules"
    aria-label={fr ? 'Règles de rivalité' : 'Rivalry rules'}
  >
    <p class="eyebrow">{fr ? 'RÈGLES DE RIVALITÉ' : 'RIVALRY RULES'}</p>
    <ul>
      {#each rules as rule (rule.id)}
        <li class={`tone-${rule.tone}`}>
          <strong>{fr ? rule.titleFr : rule.titleEn}</strong>
          <span>{fr ? rule.descriptionFr : rule.descriptionEn}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .rivalry-rules {
    width: min(42rem, calc(100% - 2rem));
    margin: 0.75rem auto;
    padding: 0.85rem;
    border: 1px solid #d69b644d;
    background: #100d13e8;
    color: #eadfeb;
    text-align: left;
  }
  .eyebrow {
    margin: 0 0 0.55rem;
    color: #ffb477;
    font: 800 0.62rem/1 var(--font-mono);
    letter-spacing: 0.12em;
  }
  ul {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: minmax(8rem, 0.35fr) minmax(0, 1fr);
    gap: 0.75rem;
    padding-left: 0.65rem;
    border-left: 3px solid #8ca6ba;
  }
  .tone-vow {
    border-color: #d1b661;
  }
  .tone-death {
    border-color: #d05b68;
  }
  strong {
    color: #fff4e8;
    font: 700 0.72rem/1.35 var(--font-mono);
  }
  span {
    color: #c9bbc9;
    font: 0.68rem/1.45 var(--font-mono);
  }
  .compact {
    width: auto;
    margin: 1rem 0;
    background: #1a101fd1;
  }
  .compact li {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
  @media (max-width: 600px) {
    .rivalry-rules {
      max-height: 34vh;
      overflow: auto;
    }
    li {
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }
</style>
