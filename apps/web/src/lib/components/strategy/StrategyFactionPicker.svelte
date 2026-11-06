<script lang="ts">
  import type { StrategyFaction } from '$lib/strategy/types'
  import type { StrategySave } from '$lib/strategy/persistence'
  import { scenarioDoctrineForFaction } from '$lib/strategy/scenario'
  import { doctrineLabel } from '$lib/strategy/localization'
  import { locale, t } from '$lib/i18n'

  let {
    chapterNumber,
    factions,
    saved,
    onselect,
    onresume,
  }: {
    chapterNumber?: number
    factions: StrategyFaction[]
    saved: StrategySave | null
    onselect: (id: string) => void
    onresume: () => void
  } = $props()
</script>

<section class="faction-choice-page">
  <header class="archive-page-heading">
    <p class="scenario">{$t.strategy.ui.picker.scenario(chapterNumber)}</p>
    <h1>{$t.strategy.ui.picker.title}</h1>
    <p>{$t.strategy.ui.picker.intro}</p>
  </header>
  {#if saved}<button type="button" class="resume" onclick={onresume}
      >{$t.strategy.ui.picker.resume(saved.turns.length + 1)}</button
    >{/if}
  {#if factions.length}
    <div class="faction-options">
      {#each factions as faction (faction.id)}
        <button type="button" onclick={() => onselect(faction.id)}>
          <strong>{faction.name}</strong>
          <span class="members">{$t.strategy.ui.picker.activeUnits(faction.members.length)}</span>
          <span class="doctrine"
            >{doctrineLabel(scenarioDoctrineForFaction(faction.id), $locale)}</span
          >
          <span class="begin">{$t.strategy.ui.picker.begin} <span aria-hidden="true">→</span></span>
        </button>
      {/each}
    </div>
  {:else}<p>{$t.strategy.ui.picker.none}</p>{/if}
</section>

<style>
  .faction-choice-page {
    max-width: 1280px;
    margin: auto;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 5rem;
  }
  header {
    margin-bottom: 2rem;
  }
  .faction-choice-page header h1 {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    line-height: 1.1;
    font-weight: 500;
  }
  .faction-choice-page header > p {
    font: 400 0.9rem/1.75 var(--font-sans);
    color: var(--text-secondary);
    text-transform: none;
    letter-spacing: 0;
    margin-top: 0.8rem;
  }
  header .scenario {
    margin-bottom: 0.75rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .resume {
    min-height: 44px;
    padding: 0.6rem 1rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--line-default);
    border-radius: 3px;
    background: none;
    color: var(--accent-gold-bright);
    cursor: pointer;
  }
  .faction-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 2rem;
  }
  .faction-options > button {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: start;
    gap: 0.75rem;
    padding: 1.5rem 0;
    border: 0;
    border-top: 1px solid var(--line-default);
    background: none;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
  }
  strong {
    font-size: 1rem;
    font-weight: 500;
  }
  .members {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .doctrine {
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.7;
  }
  .begin {
    display: flex;
    min-height: 44px;
    align-items: center;
    gap: 1rem;
    color: var(--accent-gold-bright);
    font-size: 0.8rem;
  }
  @media (max-width: 900px) {
    .faction-options {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .faction-options {
      grid-template-columns: 1fr;
    }
  }
</style>
