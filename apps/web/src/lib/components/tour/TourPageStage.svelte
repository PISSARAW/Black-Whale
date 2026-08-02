<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import TourScene from './TourScene.svelte'
  import TourSceneOverlay from './TourSceneOverlay.svelte'

  type SceneProps = ComponentProps<typeof TourScene>
  type OverlayProps = ComponentProps<typeof TourSceneOverlay>

  interface Props {
    immersive: boolean
    tierId: SceneProps['tierId']
    currentSpace?: SceneProps['currentSpace']
    availableLink?: SceneProps['availableLink']
    jumpTo?: SceneProps['jumpTo']
    jumpAt?: SceneProps['jumpAt']
    engaged?: SceneProps['engaged']
    touch?: SceneProps['touch']
    position?: SceneProps['position']
    heading?: SceneProps['heading']
    aimedAt?: SceneProps['aimedAt']
    aimedSolidAt?: SceneProps['aimedSolidAt']
    scene: Omit<SceneProps,
      | 'tierId' | 'currentSpace' | 'availableLink' | 'jumpTo' | 'jumpAt'
      | 'engaged' | 'touch' | 'position' | 'heading' | 'aimedAt' | 'aimedSolidAt'>
    overlay: OverlayProps
  }

  let {
    immersive,
    tierId = $bindable(),
    currentSpace = $bindable(null),
    availableLink = $bindable(null),
    jumpTo = $bindable(null),
    jumpAt = $bindable(null),
    engaged = $bindable(false),
    touch = $bindable(false),
    position = $bindable([0, 0]),
    heading = $bindable(0),
    aimedAt = $bindable(null),
    aimedSolidAt = $bindable(null),
    scene,
    overlay,
  }: Props = $props()
</script>

<section
  class="relative overflow-hidden {immersive
    ? 'h-full min-h-0'
    : 'min-h-[420px] rounded-lg border border-[#333] lg:h-[70vh]'}"
>
  <TourScene
    bind:tierId
    bind:currentSpace
    bind:availableLink
    bind:jumpTo
    bind:jumpAt
    bind:engaged
    bind:touch
    bind:position
    bind:heading
    bind:aimedAt
    bind:aimedSolidAt
    {...scene}
  />
  <TourSceneOverlay {...overlay} />
</section>
