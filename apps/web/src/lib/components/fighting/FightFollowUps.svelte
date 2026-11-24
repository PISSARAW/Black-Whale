<script lang="ts">
  import { fightTouchBindings } from '$lib/fighting/fightTouchHints'
  import { useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  import { formatFollowUpRow } from '$lib/fighting/moveFollowUpDisplay'
  import type { MoveFollowUp } from '$lib/fighting/movesetTypes'

  export let followUps: readonly MoveFollowUp[] = []
  export let language: 'fr' | 'en'
  export let touch = false

  const bindings = useFightBindings()
  $: hints = touch ? fightTouchBindings(language) : $bindings
  $: rows = followUps.map((entry) => formatFollowUpRow(entry, language))
</script>

{#if rows.length}
  <div class="follow-ups" data-move-follow-ups>
    <h3>{language === 'fr' ? 'Suites contextuelles (Follow-ups)' : 'Contextual follow-ups'}</h3>
    {#each rows as row (row.id)}
      <p>
        <kbd>{moveInputHint(row.input, hints)}</kbd>
        <span class="name">{row.name}</span>
        <small class="details">
          {language === 'fr' ? 'Après' : 'After'}
          {row.sourceName} · {row.condition}{#if row.tags.length}
            · {row.tags.join(' · ')}{/if}
        </small>
      </p>
    {/each}
  </div>
{/if}

<style>
  .follow-ups {
    margin-top: 0.85rem;
    padding-top: 0.7rem;
    border-top: 1px dashed #31404c;
  }
  h3 {
    margin: 0 0 0.35rem;
    color: #f1d36d;
    font: 700 0.58rem/1.2 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  p {
    display: grid;
    grid-template-columns: minmax(58px, auto) 1fr;
    gap: 0.2rem 0.4rem;
    margin: 0.25rem 0;
  }
  kbd {
    color: #83ddff;
  }
  .name {
    color: #e6eff5;
  }
  .details {
    grid-column: 1 / -1;
    color: #a8bac5;
    font-size: 0.72rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
</style>
