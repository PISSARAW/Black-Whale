<script lang="ts">
  import type { AbilityActionPlan } from '@black-whale/nen-engine'
  import { t } from '$lib/i18n'

  /**
   * Section 14 — the "Why?" panel, fed by the same `AbilityActionPlan` the
   * server would execute. Nothing here is written by hand: the conditions are
   * the module's own predicates and the effects are projected by running its
   * effect builders, so the panel cannot drift from what activation does.
   */
  let { plan }: { plan: AbilityActionPlan } = $props()

  let STATUS_LABEL: Record<AbilityActionPlan['status'], string> = $derived($t.nen.planStatus)

  const MARK = { MET: '✓', UNMET: '✗', UNKNOWN: '?' }
</script>

<div class="why" data-status={plan.status}>
  <div class="head">
    <span class="tag">{$t.nen.why}</span>
    <span class="verdict">{STATUS_LABEL[plan.status]}</span>
  </div>

  <ul>
    {#each plan.conditions as condition (condition.id)}
      <li data-status={condition.status}>
        <span class="mark">{MARK[condition.status]}</span>
        <span class="label">{condition.label}</span>
        {#if condition.reason}<small>{condition.reason}</small>{/if}
      </li>
    {/each}
  </ul>

  {#if plan.cost}
    <p class="cost">
      {$t.nen.cost(plan.cost.label)}{#if plan.cost.amount !== undefined}
        — {plan.cost.amount}{plan.cost.unit ? ` ${plan.cost.unit}` : ''}{/if}
    </p>
  {/if}

  <div class="projection">
    <span class="tag">{$t.nen.projectedEffects}</span>
    {#if plan.projectedEffects.length}
      <ul class="effects">
        {#each plan.projectedEffects as effect, index (`${effect.event}-${index}`)}
          <li>
            <!-- An aura effect names its kind; a knowledge grant or a move
                 names the world event it would propose. -->
            <strong>{effect.kind ?? effect.event}</strong>
            {#if effect.state}<code>{effect.state}</code>{/if}
            <span>{effect.targets.length ? effect.targets.join(', ') : $t.nen.noTarget}</span>
            {#if effect.masked}<em title={$t.nen.maskedTitle}>{$t.nen.masked}</em>{/if}
            {#if effect.postMortem}<em title={$t.nen.postMortemTitle}>{$t.nen.postMortem}</em>{/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">{$t.nen.noProjectedEffects}</p>
    {/if}
  </div>
</div>

<style>
  .why {
    display: grid;
    gap: 0.9rem;
    border: 1px solid var(--line-subtle);
    border-left: 2px solid var(--accent-gold);
    border-radius: 0.4rem;
    background: color-mix(in srgb, var(--surface-void) 60%, transparent);
    padding: 0.9rem;
  }
  .why[data-status='LOCKED'] {
    border-left-color: #8e3f43;
  }
  .why[data-status='UNKNOWN'] {
    border-left-color: var(--text-muted);
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.8rem;
  }
  .tag {
    color: var(--accent-gold);
    font: 600 0.58rem/1 var(--font-mono);
    letter-spacing: 0.14em;
  }
  .verdict {
    color: var(--text-primary);
    font-size: 0.72rem;
  }
  ul {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: 1rem 1fr;
    gap: 0.5rem;
    font-size: 0.72rem;
  }
  .mark {
    font-family: var(--font-mono);
  }
  li[data-status='MET'] .mark {
    color: #6fbf8b;
  }
  li[data-status='UNMET'] .mark {
    color: #ff8b8b;
  }
  li[data-status='UNKNOWN'] {
    color: var(--text-muted);
    font-style: italic;
  }
  li small {
    grid-column: 2;
    color: var(--text-muted);
    font-size: 0.62rem;
    font-style: italic;
  }
  .cost {
    margin: 0;
    color: var(--text-muted);
    font: 0.65rem var(--font-mono);
  }
  .projection {
    display: grid;
    gap: 0.5rem;
    border-top: 1px solid var(--line-subtle);
    padding-top: 0.8rem;
  }
  .effects li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.6rem;
    border-left: 2px solid #f06bb5;
    background: rgba(240, 107, 181, 0.06);
    padding: 0.45rem 0.6rem;
    font: 0.65rem var(--font-mono);
  }
  .effects code {
    color: #f06bb5;
  }
  .effects span {
    color: var(--text-muted);
  }
  .effects em {
    border: 1px solid var(--line-strong);
    border-radius: 0.2rem;
    padding: 0 0.3rem;
    color: var(--accent-gold);
    font-size: 0.58rem;
    font-style: normal;
  }
  .empty {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.7rem;
  }
</style>
