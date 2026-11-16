<script lang="ts">
  import type { TrainingHistoryEntry } from '$lib/fighting/trainingTypes'
  import { trainingInputLabel, trainingOutcomeLabel } from '$lib/fighting/trainingLabels'
  export let history: readonly TrainingHistoryEntry[]
  const sides = ['player', 'opponent'] as const
  export let language: 'fr' | 'en'
</script>

<details class="history" open data-fight-scroll>
  <summary
    >{language === 'fr' ? 'Historique des commandes · P1 / P2' : 'Input history · P1 / P2'}</summary
  >
  <div class="columns">
    {#each sides as side, index (side)}
      <section aria-label={`P${index + 1} ${language === 'fr' ? 'historique' : 'history'}`}>
        <strong>P{index + 1}</strong>
        <ol>
          {#each history
            .filter((entry) => entry.side === side)
            .slice(-12)
            .reverse() as entry (entry.id)}
            <li class:refused={entry.outcome === 'refused'}>
              <span>F{entry.frame}</span><b>{trainingInputLabel(entry.label, language)}</b>
              <span
                >{entry.outcome === 'input'
                  ? `${entry.duration}f`
                  : trainingOutcomeLabel(entry.outcome, language)}</span
              >
            </li>
          {:else}<li>—</li>{/each}
        </ol>
      </section>
    {/each}
  </div>
</details>

<style>
  summary {
    cursor: pointer;
    padding: 0.5rem 0;
    color: #d9e4e9;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0.75rem;
  }
  section {
    min-width: 0;
  }
  ol {
    margin: 0.3rem 0 0;
    padding: 0;
    max-height: 13rem;
    overflow: auto;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr) auto;
    gap: 0.4rem;
    padding: 0.25rem;
    border-bottom: 1px solid #253640;
  }
  li span {
    color: #a6b8c2;
  }
  b {
    overflow-wrap: anywhere;
  }
  .refused b {
    color: #ff9c92;
  }
</style>
