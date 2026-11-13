<script lang="ts">
  import type { AbilityViewComponent } from './abilityComponents'
  import { componentFor } from './abilityComponents'
  import type { AbilityViewModel } from './abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
  let View = $state<AbilityViewComponent | null>(null)

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
  <View {model} />
{/if}
