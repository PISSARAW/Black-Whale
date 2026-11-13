<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView
  {model}
  variant="CatsNameWarning"
  family="timeline"
  accent="hsl(316 68% 67%)"
/>
