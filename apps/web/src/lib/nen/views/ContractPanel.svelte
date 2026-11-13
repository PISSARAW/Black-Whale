<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView {model} variant="ContractPanel" family="steps" accent="hsl(19 68% 66%)" />
