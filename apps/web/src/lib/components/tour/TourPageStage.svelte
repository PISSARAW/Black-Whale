<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte'
  import type { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import type { GangwayPresentation } from '$lib/tour/gangwayLockdownView'
  import { routeCheckpoint, type TserriednichRouteStep } from '$lib/tour/tserriednichRoute'
  import TourScene from './TourScene.svelte'
  import TourSceneOverlay from './TourSceneOverlay.svelte'
  import TourExamineCard from './TourExamineCard.svelte'
  import TourAddressCard from './TourAddressCard.svelte'
  import TourDialogueCard from './TourDialogueCard.svelte'
  import TourFrameBudget from './TourFrameBudget.svelte'
  import TourAuraReserve from './TourAuraReserve.svelte'
  import TourRouteGuide from './TourRouteGuide.svelte'

  type SceneProps = ComponentProps<typeof TourScene>
  type OverlayProps = ComponentProps<typeof TourSceneOverlay>
  type ExamineProps = ComponentProps<typeof TourExamineCard>
  type AddressProps = ComponentProps<typeof TourAddressCard>
  type DialogueProps = ComponentProps<typeof TourDialogueCard>
  type RouteProps = Omit<
    ComponentProps<typeof TourRouteGuide>,
    'heading' | 'pitch' | 'gangways' | 'onVisitStep' | 'onLockdownChange'
  >

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
      | 'retractableGangwayOpen'
      | 'gangwayLockdown'
      | 'gangwayPresentation'
      | 'guidedRoute'
      | 'engaged'
      | 'touch'
      | 'position'
      | 'heading'
      | 'aimedAt'
      | 'aimedSolidAt'
      | 'aimedDetailAt'
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
    route?: RouteProps | null
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
    route = null,
  }: Props = $props()
  const { reserve, ...sceneProps } = $derived(scene)
  let routeLockdown = $state(false)
  let gangways = $state<GangwayPresentation>('open')

  function visitRouteStep(step: TserriednichRouteStep) {
    const checkpoint = routeCheckpoint(step)
    const space = scene.ship.spaces.get(checkpoint.spaceId)
    if (!space) return
    navigation.jumpHeading = checkpoint.heading
    navigation.jumpPitch = checkpoint.pitch
    navigation.goToSpace(space, checkpoint.at)
  }
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
    bind:aimedDetailAt={navigation.aimedDetailAt}
    bind:takeScreenshot
    {gyoMode}
    {...sceneProps}
    retractableGangwayOpen={!route || !routeLockdown}
    gangwayLockdown={Boolean(route && routeLockdown)}
    guidedRoute={Boolean(route)}
    bind:gangwayPresentation={gangways}
  />
  {#if gangways === 'cutaway'}
    <p class="lockdown-status" role="status">
      {route?.french
        ? 'Confinement · Rétraction des trois passerelles'
        : 'Lockdown · Retracting the three gangways'}
    </p>
  {:else}
    {#if reserve !== undefined}<TourAuraReserve {reserve} french={scene.french ?? false} />{/if}
    <TourSceneOverlay {...overlay} tools={concertPanel} />
    <TourExamineCard {...examine} />
    <TourDialogueCard {...dialogue} />
    <TourAddressCard {...address} />
  {/if}
  {#if route}
    <TourRouteGuide
      {...route}
      heading={navigation.heading}
      pitch={navigation.lookPitch}
      {gangways}
      onVisitStep={visitRouteStep}
      onLockdownChange={(active) => (routeLockdown = active)}
    />
  {/if}
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
  .lockdown-status {
    position: absolute;
    inset: 0.75rem 0.75rem auto;
    width: fit-content;
    max-width: calc(100% - 1.5rem);
    margin: 0 auto;
    padding: 0.4rem 0.65rem;
    background: #050505;
    color: #f2d58b;
    font-size: 0.8rem;
    text-align: center;
    pointer-events: none;
  }
</style>
