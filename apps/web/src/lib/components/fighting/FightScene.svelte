<script lang="ts">
  import { fightGroundContact } from '$lib/fighting/fightGroundContact'
  import { createFinishedFallPresentation } from '$lib/fighting/finishedFallPresentation'
  import { createCinematicDirector, type CameraDetail } from '$lib/fighting/cinematicDirector'
  import { createFightImpactScene } from '$lib/fighting/fightImpactScene'
  import { createOnAwakeningClock } from '$lib/fighting/onAwakening'
  import { createOnAwakeningScene } from '$lib/fighting/onAwakeningScene'
  import { updateFightCameraFog } from '$lib/fighting/fightSceneFog'
  import { createCinematicDetailScene } from '$lib/fighting/cinematicDetailScene'
  import type { CinematicDirection } from '$lib/fighting/cinematicTypes'
  import { createFighterTrackingSilhouettes } from '$lib/fighting/fighterTrackingSilhouette'
  import { markFightRender } from '$lib/fighting/fightRenderObservation'
  import { cinematicDetailRect, type CameraDetailRect } from '$lib/fighting/cinematicDetailLayout'
  import FightCameraDetail from './FightCameraDetail.svelte'
  import FightTrackingMarkers from './FightTrackingMarkers.svelte'
  import { createCombatCamera } from '$lib/fighting/combatCamera'
  import { visibleSecondaryView } from '$lib/fighting/directionalComboCamera'
  import FightDirectionalShot from './FightDirectionalShot.svelte'
  import { visibleFutureBeastOwner } from '$lib/fighting/parallelFuturePresentation'
  import type { CinematicFrame } from '$lib/fighting/cinematicTrack'
  import { applyPresentationCamera } from '$lib/fighting/presentation/introCamera'
  import type { IntroFrame } from '$lib/fighting/presentation/introPlayback'
  import { createFightCollisionScene } from '$lib/fighting/fightCollisionScene'
  import { fightWorldX as worldX, fightWorldY as worldY } from '$lib/fighting/fightCoordinates'
  import { createFightReactionPresentation } from '$lib/fighting/fightReactionPresentation'
  import { createPresentedModelRefresh } from '$lib/fighting/refreshPresentedModel'
  import { createFightContactAlignment } from '$lib/fighting/fightContactAlignment'
  import FightStageDescription from './FightStageDescription.svelte'
  import { presentedFigures } from '$lib/fighting/presentation/figures'
  import { clashPresentation } from '$lib/fighting/presentation/profile'
  import { onMount } from 'svelte'
  import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
  import { camillaCameraSpan } from '$lib/fighting/camillaCamera'
  import { biscuitCameraFrame } from '$lib/fighting/biscuitCamera'
  import { sceneryCameraFrame } from '$lib/fighting/stageCamera'
  import { createLsdfScene } from '$lib/fighting/lsdfScene'
  import { createPredatorScene } from '$lib/fighting/predatorScene'
  import { createHanzoProjectionScene, projectionCameraSpan } from '$lib/fighting/kameos/stageScene'
  import { sleepingBody } from '$lib/fighting/hanzoProjection'
  import {
    createFighterFacing,
    trackFightOpponent,
    updateFighterFacing,
  } from '$lib/fighting/fighterFacing'
  import { fightSceneReaction } from '$lib/fighting/sceneReaction'
  import { victoryMotion } from '$lib/fighting/career/presentation'
  import { defaultAppearance, type CareerAppearance } from '$lib/fighting/career/types'
  import { introBodyMotion as fightBodyMotion } from '$lib/fighting/presentation/introMotion'
  import { defaultFightComfort, effectiveFightComfort } from '$lib/fighting/fightComfort'
  import { createFightPresentation } from '$lib/fighting/fightPresentationContext'
  import { resizeFightCanvas } from '$lib/fighting/fightSceneResize'
  import { createFightRenderResources, createFightPost } from '$lib/fighting/fightRenderer'
  import { motionOf } from '$lib/fighting/fighterMovement'
  import {
    FIGHT_MODEL_POSES,
    createStrideClocks,
    transitionSecondsFor,
    type FighterSceneAnimation,
  } from '$lib/fighting/sceneMotion'
  import { arsenalProjectilePresentation } from '$lib/fighting/retrospectivePresentation'
  import { createProjectileScene } from '$lib/fighting/projectileScene'
  import { createFeitanScene } from '$lib/fighting/feitanScene'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import { drawVictoryFrame } from '$lib/fighting/victory/draw'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { FightState } from '$lib/fighting/types'
  const presentation = createFightPresentation()
  const interpolatedPosition = presentation.position
  export let viewer: 'player' | 'opponent' = 'player'
  export let active = true
  export let comfort = defaultFightComfort()
  export let appearance: CareerAppearance = defaultAppearance()
  export let state: FightState
  export let stageId: FightStageId = DEFAULT_FIGHT_STAGE
  /** Authored video timing uses the same live scene and main-camera fitting. */
  export let cameraDirection: CinematicDirection | undefined = undefined
  export let cameraFrame: CinematicFrame | undefined = undefined
  export let detailLayout: CameraDetailRect | undefined = undefined
  export let presentationSeconds: number | undefined = undefined
  export let keepCombatantMarkers = true
  export let hideSecondaryView = false
  export let detailVisible = false
  export let viewRole: 'primary' | 'prediction' = 'primary'
  export let victoryFrame: VictoryFrame | null = null
  export let introFrame: IntroFrame | null = null
  export let onSceneReady: () => void = () => {}
  export let onSceneFailed: () => void = () => {}
  export let language: 'fr' | 'en' = 'fr'

  let canvas: HTMLCanvasElement
  let failed = false
  let ready = false
  let detail: CameraDetail | null = null
  let detailRect = cinematicDetailRect(1.7)
  onMount(() => {
    clashPresentation.ensureLoaded()
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const visualComfort = () => effectiveFightComfort(comfort, motionPreference.matches)
    const cinematicDirector = createCinematicDirector({ viewer: () => viewer })
    cinematicDirector.update(state, visualComfort().camera ?? 1)
    let disposed = false
    let animationFrame = 0
    let resize: ResizeObserver | null = null
    let teardown: () => void = () => undefined

    async function mountScene() {
      try {
        const THREE = await import('three')
        const { buildFightFigure, fightFigureKey } = await import('$lib/fighting/fighterFigure')
        const { buildFightScenery } = await import('$lib/fighting/stageScenery')
        const { createVictoryRenderer } = await import('$lib/fighting/victory/renderer')
        const { createFighterEffectScene } = await import('$lib/fighting/fighterEffectScene')
        if (disposed || !canvas) return

        const {
          renderer,
          glow,
          geometry,
          dispose: disposeRendering,
        } = createFightRenderResources(THREE, canvas, comfort.graphics)
        teardown = disposeRendering

        const scene = new THREE.Scene()
        scene.userData.fightView = viewRole
        const trackingSilhouettes = createFighterTrackingSilhouettes()
        scene.fog = new THREE.Fog(0x05090d, 8, 18)
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
        camera.position.set(0, 2.25, 9.2)
        const combatCamera = createCombatCamera()

        const scenery = await buildFightScenery({ THREE, glow, geometry }, stageId, {
          fight: () => state,
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        })
        if (disposed) {
          scenery.dispose()
          disposeRendering()
          return
        }
        renderer.localClippingEnabled = scenery.clipped
        renderer.setClearColor(scenery.fog.colour, 1)
        scene.fog =
          scenery.fog.kind === 'exp2'
            ? new THREE.FogExp2(scenery.fog.colour, scenery.fog.density)
            : new THREE.Fog(scenery.fog.colour, scenery.fog.near, scenery.fog.far)
        camera.far = Math.max(100, scenery.cameraFar)
        scene.add(scenery.root)
        const post = await createFightPost({
          ...{ THREE, renderer, scene, camera },
          bloom: scenery.bloom,
          graphics: comfort.graphics,
        })
        if (disposed) {
          post?.dispose()
          scenery.dispose()
          disposeRendering()
          return
        }

        const { buildFighter, nenKey, buildReference, models } = presentedFigures({
          build: buildFightFigure,
          key: fightFigureKey,
          resources: { THREE, glow },
          read: () => ({ state, viewer, preferences: $clashPresentation.preferences }),
        })
        scene.add(models.player.model.root, models.opponent.model.root)
        const onClock = createOnAwakeningClock(state)
        let onFrames = onClock(state)
        const onAwakening = createOnAwakeningScene({
          THREE,
          scene,
          figureOf: (side) => models[side].model.turns,
          comfort: visualComfort,
          reducedMotion: () => motionPreference.matches,
        })
        const victoryRenderer = createVictoryRenderer({ scene, camera, scenery: scenery.root })
        const detailScene = createCinematicDetailScene({
          scene,
          figureOf: (side) => models[side].model.root,
        })
        const collisions = createFightCollisionScene({ THREE, scene })
        const projectileScene = createProjectileScene({
          viewer: () => viewer,
          comfort: visualComfort,
          THREE,
          scene,
          glow,
          geometry,
          worldX,
          worldY,
        })
        const projectionScene = createHanzoProjectionScene({
          scene,
          buildFighter: buildReference,
          worldX,
        })
        const fighterEffects = createFighterEffectScene({
          comfort: visualComfort,
          viewer: () => viewer,
          THREE,
          scene,
          worldX,
          worldY,
          figureOf: (side) => models[side].model.turns,
          handAnchor: (side, hand) => {
            const lead = state[side].facing === 1 ? 'right' : 'left'
            const limb = hand === 'lead' ? lead : lead === 'right' ? 'left' : 'right'
            return models[side].model.root.getObjectByName(`hand-${limb}`)
          },
        })
        const lsdfScene = createLsdfScene({ THREE, scene, glow, worldX })
        const predatorScene = createPredatorScene({ THREE, scene, glow, worldX, worldY })
        const feitanScene = createFeitanScene({
          THREE,
          scene,
          worldX,
          worldY,
          figureOf: (side) => models[side].model.turns,
          comfort: visualComfort,
        })
        const modelOf = createPresentedModelRefresh({ scene, models, nenKey, buildFighter })
        const alignPhysicalContact = createFightContactAlignment(
          (side) => models[side].model.turns,
        )

        const impacts = createFightImpactScene({
          THREE,
          scene,
          initial: state,
          comfort: visualComfort,
          figureOf: (side) => models[side].model.turns,
          geometry,
          glow,
        })

        const fit = () => {
          resizeFightCanvas({ canvas, renderer, camera, post, graphics: comfort.graphics })
          // Resizing clears WebGL even when the presentation clock is paused.
          if (!active) {
            if (post) post.render()
            else renderer.render(scene, camera)
          }
        }
        fit()

        const reactionContext = createFightReactionPresentation()
        const finishedFall = createFinishedFallPresentation()
        const strideClock = createStrideClocks()
        let lastFrameAt: number | null = null
        let motionSeconds = 0
        const facings = {
          player: createFighterFacing(state.player.facing),
          opponent: createFighterFacing(state.opponent.facing),
        }
        const animateFighter = (options: FighterSceneAnimation) => {
          const { side, model, seconds } = options
          const falling = finishedFall(state, side, {
            fighter: presentation.fighter(state, side),
            position: presentation.bodyPosition(state, side),
            seconds,
          })
          const fighter = falling.fighter
          const opponent = presentation.fighter(state, side === 'player' ? 'opponent' : 'player')
          trackingSilhouettes.sync(model.root, { state, side, keep: keepCombatantMarkers })
          const reaction = reactionContext(state, side, {
            fighter,
            seconds,
            progress: falling.progress,
          })
          const { progress } = reaction
          const drawn = falling.position
          model.root.position.set(worldX(drawn.x), worldY(drawn.y), drawn.z ?? 0)
          const bodyAngle = updateFighterFacing(facings[side], fighter.facing, seconds)
          model.root.rotation.y = bodyAngle
          const fallback = fightSceneReaction({ fighter, state, progress, side })
          const motion = fightBodyMotion({
            introFrame: motionPreference.matches ? null : introFrame,
            side,
            fighter,
            seconds,
            fallback,
            ...reaction,
            onAwakeningFrame: onFrames[side],
            poseFraction: presentation.poseFraction(state),
          })
          const modelPose = motionOf(fighter).dash ? 'idle' : FIGHT_MODEL_POSES[fighter.pose]
          model.animate(seconds, modelPose, {
            motion: trackFightOpponent({
              fighter,
              opponent: sleepingBody(opponent),
              bodyAngle,
              seconds,
              motion: victoryMotion({
                state,
                side,
                victory: appearance.victory,
                seconds,
                fallback: motion,
              }),
            }),
            transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
            transitionSeconds: transitionSecondsFor(fighter),
            strideClock: strideClock(side, worldX(drawn.x), fighter.facing),
            afterMotion: fightGroundContact(fighter),
          })
        }

        const cameraIntensity = () => visualComfort().camera ?? 1
        const updateCombatCamera = (dt: number, now: number) => {
          if (
            applyPresentationCamera({
              camera,
              models,
              state,
              authored: cameraFrame,
              intro: introFrame,
              reduced: motionPreference.matches,
              intensity: cameraIntensity(),
            })
          ) {
            updateFightCameraFog(scene, camera, scenery)
            detail = null
            detailVisible = false
            return
          }
          const observed = hideSecondaryView
            ? cinematicDirector.update(state, cameraIntensity(), dt)
            : null
          const direction =
            cameraDirection ?? observed ?? cinematicDirector.update(state, cameraIntensity(), dt)
          detail = visibleSecondaryView(state, direction.detail, hideSecondaryView)
          detailRect = detailLayout ?? cinematicDetailRect(camera.aspect)
          const playerX = worldX(interpolatedPosition(state, 'player').x)
          const opponentX = worldX(interpolatedPosition(state, 'opponent').x)
          const { centre, gap } = projectionCameraSpan(state, [playerX, opponentX], worldX)
          const catSpan = camillaCameraSpan({ state, centre, gap, worldX })
          const framing = sceneryCameraFrame(
            biscuitCameraFrame({ state, ...catSpan, aspect: camera.aspect }),
            scenery,
          )
          const pose = combatCamera.update({
            state,
            base: framing,
            span: catSpan,
            aspect: camera.aspect,
            dt,
            direction,
            detail: Boolean(detail),
            detailRect,
            companion: visibleFutureBeastOwner(state, viewer),
            intensity: cameraIntensity(),
            minimumDistance: scenery.framing?.minimumDistance,
          })
          if (!pose.detailReady) detail = null
          detailVisible = Boolean(detail)
          camera.position.set(pose.x, pose.y, pose.z)
          updateFightCameraFog(scene, camera, scenery)
          impacts.shake(camera, now)
          camera.lookAt(pose.x, pose.lookY, 0)
        }

        const render = (now: number) => {
          if (disposed) return
          if (!active) {
            lastFrameAt = null
            animationFrame = requestAnimationFrame(render)
            return
          }
          const dt = Math.min(0.1, lastFrameAt === null ? 0 : (now - lastFrameAt) / 1000)
          motionSeconds += dt
          const seconds = presentationSeconds ?? motionSeconds
          lastFrameAt = now
          onFrames = onClock(state, motionPreference.matches)
          animateFighter({
            side: 'player',
            model: modelOf('player', state.player),
            seconds,
          })
          projectileScene.sync(arsenalProjectilePresentation(state), seconds, state[viewer])
          predatorScene.sync(state, seconds)
          lsdfScene.sync(state, seconds)
          feitanScene.sync(state, seconds)
          projectionScene.sync(state, seconds)
          animateFighter({
            side: 'opponent',
            model: modelOf('opponent', state.opponent),
            seconds,
          })
          alignPhysicalContact(state)
          impacts.emit(state, now)
          fighterEffects.sync(state, seconds)
          onAwakening.sync(state, onFrames)

          updateCombatCamera(dt, now)

          impacts.animate(now)

          collisions.sync(state)
          scenery.update?.(seconds)
          markFightRender(scene, state)
          drawVictoryFrame({
            victory: victoryRenderer,
            input: {
              state,
              frame: victoryFrame,
              comfort: visualComfort(),
              models: { player: models.player.model.root, opponent: models.opponent.model.root },
            },
            draw: () => (post ? post.render() : renderer.render(scene, camera)),
            failed: onSceneFailed,
          })
          if (!ready) onSceneReady()
          ready = true
          if (
            detail &&
            !hideSecondaryView &&
            !detailScene.draw({ renderer, state, detail, rect: detailRect })
          )
            detail = null
          animationFrame = requestAnimationFrame(render)
        }

        resize = new ResizeObserver(fit)
        resize.observe(canvas)
        animationFrame = requestAnimationFrame(render)
        teardown = () => {
          cancelAnimationFrame(animationFrame)
          resize?.disconnect()
          victoryRenderer.dispose()
          trackingSilhouettes.dispose()
          impacts.dispose()
          Object.values(models).forEach(({ model }) => disposeMountedVisitHatsu(model.root))
          collisions.dispose()
          projectileScene.dispose()
          fighterEffects.dispose()
          onAwakening.dispose()
          predatorScene.dispose()
          lsdfScene.dispose()
          feitanScene.dispose()
          projectionScene.dispose()
          post?.dispose()
          scenery.dispose()
          disposeRendering()
        }
      } catch {
        failed = true
        onSceneFailed()
      }
    }

    void mountScene()
    return () => {
      disposed = true
      teardown()
    }
  })
</script>

<FightStageDescription {state} {stageId} {language} />
<div class:failed class:ready class="fight-scene" aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
  <FightDirectionalShot {state} intensity={comfort.camera ?? 1} />
  <FightTrackingMarkers
    {state}
    {language}
    enabled={keepCombatantMarkers && !victoryFrame?.active && !introFrame}
  />
  {#if detail && !hideSecondaryView && !failed}<FightCameraDetail
      {detail}
      rect={detailRect}
      {language}
    />{/if}
  {#if failed}<span>3D</span>{/if}
</div>

<style>
  .fight-scene {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: radial-gradient(ellipse at 50% 42%, #162e3a, #05090d 70%);
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .failed {
    display: grid;
    place-items: center;
    color: #8096a3;
    font: 700 1rem/1 var(--font-mono);
  }
</style>
