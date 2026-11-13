<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView {model} variant="DesireTrapView" family="target" accent="hsl(254 68% 70%)" />
