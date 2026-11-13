<script lang="ts">
  import AbilityCompositeView from '../AbilityCompositeView.svelte'
  import type { AbilityViewModel } from '../abilityPresentation'

  let { model }: { model: AbilityViewModel } = $props()
</script>

<AbilityCompositeView
  {model}
  variant="BanditsSecretBook"
  family="ledger"
  accent="hsl(206 68% 68%)"
/>
