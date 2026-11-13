<script lang="ts">
  import type { AbilityPresentationProjection } from '@black-whale/nen-engine'
  import { t } from '$lib/i18n'

  let {
    presentation,
    selected,
    onSelect,
    onDispatch,
  }: {
    presentation: AbilityPresentationProjection
    selected: string | null
    onSelect: (actionId: string) => void
    onDispatch?: (actionId: string) => void
  } = $props()

  const visible = $derived(
    presentation.actions.filter(({ entry }) => entry.visibility !== 'hidden'),
  )
</script>

<div class="wheel" role="list" aria-label={$t.abilities.actionWheel}>
  {#each visible as action (action.entry.id)}
    {@const locked = action.entry.visibility !== 'available'}
    <div role="listitem">
      <button
        type="button"
        class:current={selected === action.entry.id}
        class:locked
        aria-disabled={locked}
        title={action.entry.hint}
        onclick={() => {
          onSelect(action.entry.id)
          if (!locked) onDispatch?.(action.entry.id)
        }}
      >
        <span>{action.entry.label}</span>
        {#if action.entry.source}<small class="source">{action.entry.source.label}</small>{/if}
        {#if locked}<small>{action.entry.hint ?? $t.abilities.conditionUnmet}</small>{/if}
      </button>
    </div>
  {/each}
</div>

<style>
  .wheel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.35rem;
  }
  button {
    width: 100%;
    min-height: 2.7rem;
    padding: 0.45rem 0.55rem;
    border: 1px solid var(--line-subtle);
    border-radius: 0.35rem;
    background: transparent;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
    font-size: 0.68rem;
  }
  button.current {
    border-color: var(--accent-gold);
    color: var(--text-primary);
    background: color-mix(in srgb, var(--accent-gold) 8%, transparent);
  }
  button.locked {
    opacity: 0.55;
    border-style: dashed;
  }
  small {
    display: block;
    margin-top: 0.2rem;
    color: var(--text-muted);
    font-size: 0.55rem;
    line-height: 1.35;
  }
  .source {
    color: var(--accent-gold);
    opacity: 0.72;
  }
</style>
