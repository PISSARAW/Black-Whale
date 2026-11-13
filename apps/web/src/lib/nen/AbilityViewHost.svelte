<script lang="ts">
  import type { AbilityViewComponent } from './abilityComponents'
  import { componentFor, familyFor } from './abilityComponents'
  import type { AbilityViewModel } from './abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
  let View = $state<AbilityViewComponent | null>(null)
  const family = $derived(familyFor(model.componentKey))

  $effect(() => {
    const loader = componentFor(model.componentKey)
    View = null
    if (!loader) return
    let current = true
    loader().then((module) => {
      if (current) View = module.default
    })
    return () => {
      current = false
    }
  })
</script>

{#if View}
  <View {model} variant={model.componentKey} family={family ?? undefined} />
{/if}
