<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import type { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import TourScene from './TourScene.svelte'
  import TourSceneOverlay from './TourSceneOverlay.svelte'

  type SceneProps = ComponentProps<typeof TourScene>
  type OverlayProps = ComponentProps<typeof TourSceneOverlay>

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
  }

  let { immersive, navigation, scene, overlay }: Props = $props()
</script>

<section
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
    bind:aimedAt={navigation.aimedAt}
    bind:aimedSolidAt={navigation.aimedSolidAt}
    {...scene}
  />
  <TourSceneOverlay {...overlay} />
</section>
