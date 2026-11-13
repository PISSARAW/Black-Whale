<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView
  {model}
  variant="BungeeGumInteraction"
  family="target"
  accent="hsl(222 68% 70%)"
/>
