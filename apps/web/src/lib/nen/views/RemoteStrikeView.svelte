<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView
  {model}
  variant="RemoteStrikeView"
  family="target"
  accent="hsl(130 68% 70%)"
/>
