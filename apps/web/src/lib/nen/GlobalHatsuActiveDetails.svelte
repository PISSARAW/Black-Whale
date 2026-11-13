<script lang="ts">
  import { reducedMotion } from '$lib/tour/comfort'
  import { locale, t } from '$lib/i18n'
  import AbilityActionWheel from './AbilityActionWheel.svelte'
  import AbilityViewHost from './AbilityViewHost.svelte'
  import NenWhyPanel from './NenWhyPanel.svelte'
  import { presentationFor, previewSurfaceAdapter } from './abilityPresentation'

  let { abilityId, name, owner }: { abilityId: string; name: string; owner: string } = $props()
  let selectedActionId = $state('')
  const presentation = $derived(presentationFor(abilityId))
  const actions = $derived(
    presentation?.actions.filter(({ entry }) => entry.visibility !== 'hidden') ?? [],
  )
  const selectedAction = $derived(
    actions.find(({ entry }) => entry.id === selectedActionId) ?? actions[0] ?? null,
  )
  const model = $derived(
    presentation && selectedAction
      ? previewSurfaceAdapter({ name, owner, reducedMotion: $reducedMotion }).modelFor(
          presentation,
          selectedAction.entry.id,
        )
      : null,
  )
</script>

{#if presentation && selectedAction}
  <details>
    <summary>{$t.abilities.uses}</summary>
    <AbilityActionWheel
      {presentation}
      selected={selectedAction.entry.id}
      onSelect={(actionId) => (selectedActionId = actionId)}
    />
    <NenWhyPanel plan={selectedAction.plan} text={selectedAction.text[$locale]} compact />
    {#if model}<AbilityViewHost {model} />{/if}
  </details>
{/if}

<style>
  details {
    margin-top: 0.35rem;
  }
  summary {
    display: flex;
    min-height: 2rem;
    align-items: center;
    color: var(--accent-gold-bright);
    cursor: pointer;
    font-size: 0.62rem;
  }
  details[open] {
    display: grid;
    max-height: min(65vh, 36rem);
    gap: 0.55rem;
    overflow: auto;
    padding: 0.35rem 0.25rem 0.35rem 0;
  }
</style>
