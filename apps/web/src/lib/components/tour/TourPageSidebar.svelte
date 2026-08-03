<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import TourComfortPanel from './TourComfortPanel.svelte'
  import TourControlsPanel from './TourControlsPanel.svelte'
  import TourHatsuHud from './TourHatsuHud.svelte'
  import TourProvenancePanel from './TourProvenancePanel.svelte'
  import TourSidebarNavigation from './TourSidebarNavigation.svelte'
  import TourTargetIndex from './TourTargetIndex.svelte'

  interface Props {
    immersive: boolean
    panelOpen: boolean
    navigation: ComponentProps<typeof TourSidebarNavigation>
    hatsu: ComponentProps<typeof TourHatsuHud> | null
    targets: ComponentProps<typeof TourTargetIndex>
    controls: ComponentProps<typeof TourControlsPanel>
    calm: boolean
    provenance: ComponentProps<typeof TourProvenancePanel>
  }

  let { immersive, panelOpen, navigation, hatsu, targets, controls, calm, provenance }: Props =
    $props()
</script>

<aside
  class="flex flex-col gap-4 {immersive
    ? `min-h-0 overflow-y-auto border-l border-[#333] p-3 ${panelOpen ? '' : 'hidden'}`
    : ''}"
>
  <TourSidebarNavigation {...navigation} />

  {#if hatsu}
    <TourHatsuHud {...hatsu} />
  {/if}

  <TourTargetIndex {...targets} />
  <TourControlsPanel {...controls} />
  <TourComfortPanel {calm} />
  <TourProvenancePanel {...provenance} />
</aside>
