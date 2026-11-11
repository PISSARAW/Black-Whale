<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte'
  import type { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import TourScene from './TourScene.svelte'
  import TourSceneOverlay from './TourSceneOverlay.svelte'
  import TourExamineCard from './TourExamineCard.svelte'
  import TourAddressCard from './TourAddressCard.svelte'
  import TourDialogueCard from './TourDialogueCard.svelte'
  import TourFrameBudget from './TourFrameBudget.svelte'
  import TourAuraReserve from './TourAuraReserve.svelte'

  type SceneProps = ComponentProps<typeof TourScene>
  type OverlayProps = ComponentProps<typeof TourSceneOverlay>
  type ExamineProps = ComponentProps<typeof TourExamineCard>
  type AddressProps = ComponentProps<typeof TourAddressCard>
  type DialogueProps = ComponentProps<typeof TourDialogueCard>

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
      | 'jumpHeading'
      | 'jumpPitch'
      | 'jumpEyeHeight'
      | 'jumpCameraDistance'
      | 'jumpVisibleSpaceIds'
      | 'engaged'
      | 'touch'
      | 'position'
      | 'heading'
      | 'aimedAt'
      | 'aimedSolidAt'
    > & {
      /** The visitor's aura reserve, drawn here because the scene does not own it. */
      reserve?: number
    }
    overlay: OverlayProps
    /**
     * The evidence card, over the canvas rather than beside it: it answers a
     * question asked with the reticle, and reading the answer somewhere else
     * would mean looking away from the thing it is about.
     */
    examine: ExamineProps
    dialogue: DialogueProps
    /**
     * And the exchange, in the same place and for the same reason: what a body
     * answers is about the body you are standing in front of.
     */
    address: AddressProps
    takeScreenshot?: (() => Promise<Blob | null>) | null
    gyoMode?: boolean
    concertPanel?: Snippet
  }

  let {
    immersive,
    navigation,
    scene,
    overlay,
    examine,
    dialogue,
    address,
    takeScreenshot = $bindable(null),
    gyoMode = false,
    concertPanel,
  }: Props = $props()
  const { reserve, ...sceneProps } = $derived(scene)
</script>

<section id="tour-stage-container" class="tour-stage" class:immersive>
  <TourScene
    bind:tierId={navigation.tierId}
    bind:currentSpace={navigation.currentSpace}
    bind:availableLink={navigation.availableLink}
    bind:jumpTo={navigation.jumpTo}
    bind:jumpAt={navigation.jumpAt}
    bind:jumpHeading={navigation.jumpHeading}
    bind:jumpPitch={navigation.jumpPitch}
    bind:jumpEyeHeight={navigation.jumpEyeHeight}
    bind:jumpCameraDistance={navigation.jumpCameraDistance}
    bind:jumpVisibleSpaceIds={navigation.jumpVisibleSpaceIds}
    bind:engaged={navigation.engaged}
    bind:touch={navigation.touch}
    bind:position={navigation.position}
    bind:heading={navigation.heading}
    bind:lookPitch={navigation.lookPitch}
    bind:aimedAt={navigation.aimedAt}
    bind:aimedSolidAt={navigation.aimedSolidAt}
    bind:takeScreenshot
    {gyoMode}
    {...sceneProps}
  />
  {#if reserve !== undefined}<TourAuraReserve {reserve} />{/if}
  <TourSceneOverlay {...overlay} tools={concertPanel} />
  <TourExamineCard {...examine} />
  <TourDialogueCard {...dialogue} />
  <TourAddressCard {...address} />
  <!--
    The cost of the frame the other four are drawn over. Unconditional, and it
    costs nothing to mount: without `?frames` nothing measures and this renders
    empty. It belongs to the stage rather than to `TourSceneOverlay` because it
    is not part of the walk's HUD — it takes no prop from the tour and answers
    to a query string rather than to anything the visit knows about.
  -->
  <TourFrameBudget />
</section>

<style>
  .tour-stage {
    position: relative;
    min-width: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--line-default);
    border-radius: 3px;
  }
  .tour-stage.immersive {
    height: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }
</style>
