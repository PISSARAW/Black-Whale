<script lang="ts">
  import type { AbilityPresentationProjection } from '@black-whale/nen-engine'
  import { locale, t } from '$lib/i18n'

  let {
    presentation,
    selected,
    onSelect,
    onDispatch,
    availability,
  }: {
    presentation: AbilityPresentationProjection
    selected: string | null
    onSelect: (actionId: string) => void
    onDispatch?: (actionId: string) => void
    availability?: (actionId: string) => { executable: boolean; reason?: string }
  } = $props()

  const visible = $derived(
    presentation.actions.filter(({ entry }) => entry.visibility !== 'hidden'),
  )
</script>

<div class="wheel" role="list" aria-label={$t.abilities.actionWheel}>
  {#each visible as action (action.entry.id)}
    {@const text = action.text[$locale]}
    {@const locked = action.entry.visibility !== 'available'}
    {@const surface = availability?.(action.entry.id)}
    {@const disabled = locked || surface?.executable === false}
    {@const reason = surface?.reason ?? text.hint}
    <div role="listitem">
      <button
        type="button"
        data-action-id={action.entry.id}
        class:current={selected === action.entry.id}
        class:locked={disabled}
        aria-disabled={disabled}
        title={reason}
        onclick={() => {
          onSelect(action.entry.id)
          if (!disabled) onDispatch?.(action.entry.id)
        }}
      >
        <span>{text.label}</span>
        {#if text.source}<small class="source">{text.source}</small>{/if}
        {#if disabled}<small>{reason ?? $t.abilities.conditionUnmet}</small>{/if}
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
