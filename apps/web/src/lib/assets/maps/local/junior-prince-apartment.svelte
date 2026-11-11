<script lang="ts">
  import FugetsuApartment from './fugetsu-apartment.svelte'
  import MomozeApartment from './momoze-apartment.svelte'
  import MarayamApartment from './marayam-apartment.svelte'
  import WobleApartment from './woble-apartment.svelte'
  import { mapState } from '$lib/state/mapState.svelte'

  const roomNumber = $derived(mapState.selectedLocationId?.match(/10(?:0[1-9]|1[0-4])/)?.[0])
</script>

{#if roomNumber === '1011'}
  <FugetsuApartment />
{:else if roomNumber === '1012'}
  <MomozeApartment />
{:else if roomNumber === '1013'}
  <MarayamApartment />
{:else}
  <WobleApartment />
{/if}
