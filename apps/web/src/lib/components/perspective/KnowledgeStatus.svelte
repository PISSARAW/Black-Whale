<script lang="ts">
  import type { KnowledgeVisualState } from './types'

  const iconByState: Record<KnowledgeVisualState, string> = {
    known: '✓',
    confirmed: '◉',
    reported: '📄',
    believed: '◐',
    suspected: '?',
    rumor: '◌',
    rejected: '⨯',
    outdated: '⏱',
    contradicted: '≠',
    unknown: '—',
  }

  let {
    state,
    label,
    details = '',
  }: {
    state: KnowledgeVisualState
    label: string
    details?: string
  } = $props()
</script>

<div class="knowledge-status" data-state={state} role="status" aria-label={`${label}: ${state}`}>
  <span class="icon" aria-hidden="true">{iconByState[state]}</span>
  <span class="label">{label}</span>
  {#if details}
    <span class="details">{details}</span>
  {/if}
</div>

<style>
  .knowledge-status {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    border: 1px solid color-mix(in srgb, var(--line) 74%, #f7f5ea 12%);
    background: color-mix(in srgb, var(--panel) 86%, #081717 14%);
    border-radius: 0.5rem;
    padding: 0.28rem 0.5rem;
    font-size: 0.76rem;
    max-width: 100%;
  }

  .icon {
    width: 1rem;
    display: inline-flex;
    justify-content: center;
    font-weight: 700;
  }

  .label {
    color: var(--ink);
    font-weight: 650;
    text-transform: capitalize;
  }

  .details {
    color: color-mix(in srgb, var(--ink) 72%, #80908a 28%);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 16rem;
  }

  .knowledge-status[data-state='suspected'],
  .knowledge-status[data-state='rumor'] {
    border-style: dashed;
  }

  .knowledge-status[data-state='outdated'] {
    text-decoration: underline;
    text-decoration-style: dotted;
  }

  .knowledge-status[data-state='rejected'] .label {
    text-decoration: line-through;
  }
</style>
