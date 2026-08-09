<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import type { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import TourScene from './TourScene.svelte'
  import TourSceneOverlay from './TourSceneOverlay.svelte'
  import TourExamineCard from './TourExamineCard.svelte'
  import TourAddressCard from './TourAddressCard.svelte'

  type SceneProps = ComponentProps<typeof TourScene>
  type OverlayProps = ComponentProps<typeof TourSceneOverlay>
  type ExamineProps = ComponentProps<typeof TourExamineCard>
  type AddressProps = ComponentProps<typeof TourAddressCard>

  interface Props {
    immersive: boolean
    navigation: TourNavigationState
    scene: Omit<
      SceneProps,
      | 'tierId'
      | 'currentSpace'
      | 'availableLink'
      | 'jumpTo'
      | 'jumpAt'
      | 'engaged'
      | 'touch'
      | 'position'
      | 'heading'
      | 'aimedAt'
      | 'aimedSolidAt'
    >
    overlay: OverlayProps
    /**
     * The evidence card, over the canvas rather than beside it: it answers a
     * question asked with the reticle, and reading the answer somewhere else
     * would mean looking away from the thing it is about.
     */
    examine: ExamineProps
    /**
     * And the exchange, in the same place and for the same reason: what a body
     * answers is about the body you are standing in front of.
     */
    address: AddressProps
    takeScreenshot?: (() => Promise<Blob | null>) | null
    gyoMode?: boolean
  }

  let { immersive, navigation, scene, overlay, examine, address, takeScreenshot = $bindable(null), gyoMode = $bindable(false) }: Props = $props()
</script>

<section
  id="tour-stage-container"
  class="relative overflow-hidden {immersive
    ? 'h-full min-h-0'
    : 'min-h-[420px] rounded-lg border border-[#333] lg:h-[70vh]'}"
>
  <TourScene
    bind:tierId={navigation.tierId}
    bind:currentSpace={navigation.currentSpace}
    bind:availableLink={navigation.availableLink}
    bind:jumpTo={navigation.jumpTo}
    bind:jumpAt={navigation.jumpAt}
    bind:engaged={navigation.engaged}
    bind:touch={navigation.touch}
    bind:position={navigation.position}
    bind:heading={navigation.heading}
    bind:lookPitch={navigation.lookPitch}
    bind:aimedAt={navigation.aimedAt}
    bind:aimedSolidAt={navigation.aimedSolidAt}
    bind:takeScreenshot
    bind:gyoMode
    {...scene}
  />
  <TourSceneOverlay {...overlay} />
  <TourExamineCard {...examine} />
  <TourAddressCard {...address} />
</section>
