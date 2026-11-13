<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView
  {model}
  variant="AstralDoubleView"
  family="target"
  accent="hsl(112 68% 70%)"
/>
