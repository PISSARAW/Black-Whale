<script lang="ts">
  import { createFightStageEffects } from './fightStageEffects'
  import { fightGroundContact } from '$lib/fighting/fightGroundContact'
  import { createFinishedFallPresentation } from '$lib/fighting/finishedFallPresentation'
  import { createCinematicDirector, type CameraDetail } from '$lib/fighting/cinematicDirector'
  import { createFightImpactScene } from '$lib/fighting/fightImpactScene'
  import { createFightStagingScene } from '$lib/fighting/fightStagingScene'
  import { createOnAwakeningClock } from '$lib/fighting/onAwakening'
  import { createOnAwakeningScene } from '$lib/fighting/onAwakeningScene'
  import { updateFightCameraFog } from '$lib/fighting/fightSceneFog'
  import { createCinematicDetailScene } from '$lib/fighting/cinematicDetailScene'
  import type { CinematicDirection } from '$lib/fighting/cinematicTypes'
  import { createFighterTrackingSilhouettes } from '$lib/fighting/fighterTrackingSilhouette'
  import { createParallelFutureInset } from '$lib/fighting/parallelFutureInsetRenderer'
  import type { FutureCameraView } from '$lib/fighting/parallelFutureCamera'
  import { markFightRender } from '$lib/fighting/fightRenderObservation'
  import { cinematicDetailRect, type CameraDetailRect } from '$lib/fighting/cinematicDetailLayout'
  import FightCameraDetail from './FightCameraDetail.svelte'
  import FightPursuitRecovery from './FightPursuitRecovery.svelte'
  import FightTrackingMarkers from './FightTrackingMarkers.svelte'
  import { createCombatCamera } from '$lib/fighting/combatCamera'
  import { visibleSecondaryView } from '$lib/fighting/directionalComboCamera'
  import FightDirectionalShot from './FightDirectionalShot.svelte'
  import { visibleFutureBeastOwner } from '$lib/fighting/parallelFuturePresentation'
  import type { CinematicFrame } from '$lib/fighting/cinematicTrack'
  import { applyPresentationCamera } from '$lib/fighting/presentation/introCamera'
  import type { IntroFrame } from '$lib/fighting/presentation/introPlayback'
  import { fightCameraBodyBounds } from '$lib/fighting/fightCameraBodyBounds'
  import { fightWorldX as worldX, fightWorldY as worldY } from '$lib/fighting/fightCoordinates'
  import { createFightReactionPresentation } from '$lib/fighting/fightReactionPresentation'
  import { createPresentedModelRefresh } from '$lib/fighting/refreshPresentedModel'
  import { auraPsychology } from '$lib/fighting/nenPsychology'
  import { syncRenExpression } from '$lib/fighting/nenRenPresentation'
  import { createFightContactAlignment } from '$lib/fighting/fightContactAlignment'
  import FightStageDescription from './FightStageDescription.svelte'
  import { presentedFigures } from '$lib/fighting/presentation/figures'
  import { clashPresentation } from '$lib/fighting/presentation/profile'
  import { onMount } from 'svelte'
  import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
  import { liveCameraFraming } from '$lib/fighting/liveCameraFraming'
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
  import {
    createFightPresentation,
    fightFrameDeltaSeconds,
  } from '$lib/fighting/fightPresentationContext'
  import { resizeFightCanvas } from '$lib/fighting/fightSceneResize'
  import { loadFightStage } from '$lib/fighting/loadFightStage'
  import { motionOf } from '$lib/fighting/fighterMovement'
  import { feitanHeatVictimLift } from '$lib/fighting/feitanHeatLift'
  import {
    FIGHT_MODEL_POSES,
    createStrideClocks,
    transitionSecondsFor,
    type FighterSceneAnimation,
  } from '$lib/fighting/sceneMotion'
  import { arsenalProjectilePresentation } from '$lib/fighting/retrospectivePresentation'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import { drawFightScene } from '$lib/fighting/drawFightScene'
  import { createPhinksLens, type PhinksFocus } from '$lib/fighting/victory/phinksLens'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { FightState } from '$lib/fighting/types'
  import './FightScene.css'
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
  export let prediction: FutureCameraView | null = null
  export let victoryFrame: VictoryFrame | null = null
  export let introFrame: IntroFrame | null = null
  export let onSceneReady: () => void = () => {}
  export let onSceneFailed: () => void = () => {}
  export let language: 'fr' | 'en' = 'fr'

  export let showRecovery = false
  let recovery: FightPursuitRecovery
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
        const { buildFightFigure, fightFigureKey } = await import('$lib/fighting/fighterFigure')
        const { createVictoryRenderer } = await import('$lib/fighting/victory/renderer')
        if (disposed || !canvas) return
        const loaded = await loadFightStage({
          canvas,
          graphics: comfort.graphics,
          stageId,
          state: () => state,
          reducedMotion: motionPreference.matches,
          disposed: () => disposed,
        })
        if (!loaded || disposed) {
          loaded?.dispose()
          return
        }
        const { THREE, renderer, glow, geometry, dispose, scene, camera, scenery, post } = loaded
        teardown = dispose
        const trackingSilhouettes = createFighterTrackingSilhouettes()
        const combatCamera = createCombatCamera()

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
        const {
          collisions,
          projectileScene,
          projectionScene,
          fighterEffects,
          lsdfScene,
          predatorScene,
          feitanScene,
          motionTrails,
          feitanSpeed,
          kurapikaSpeed,
        } = createFightStageEffects({
          THREE,
          scene,
          glow,
          geometry,
          visualComfort,
          worldX,
          worldY,
          viewer: () => viewer,
          readState: () => state,
          buildReference,
          throwFrame: presentation.throwFrame,
          figureOf: (side) => models[side].model.turns,
          rootOf: (side) => models[side].model.root,
        })
        const inset = createParallelFutureInset({
          resources: { THREE, glow, geometry },
          build: buildFightFigure,
          key: fightFigureKey,
          comfort: visualComfort,
          preferences: () => $clashPresentation.preferences,
        })
        const modelOf = createPresentedModelRefresh({ scene, models, nenKey, buildFighter })
        const alignPhysicalContact = createFightContactAlignment((side) => models[side].model.turns)
        const staging = createFightStagingScene({
          THREE,
          scene,
          figureOf: (side) => models[side].model.root,
          comfort: visualComfort,
        })

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
        const finishedFall = createFinishedFallPresentation(presentation.throwFrame)
        const strideClock = createStrideClocks()
        let lastFrameAt: number | null = null
        let motionSeconds = 0
        const facings = {
          player: createFighterFacing(state.player.facing),
          opponent: createFighterFacing(state.opponent.facing),
        }
        const animateFighter = (options: FighterSceneAnimation) => {
          const { side, model, seconds } = options
          syncRenExpression(model.root, auraPsychology(state, side))
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
          model.root.position.y += feitanHeatVictimLift(state, side)
          const bodyAngle = updateFighterFacing(facings[side], fighter.facing, seconds)
          model.root.rotation.y = bodyAngle
          const fallback = fightSceneReaction({ fighter, state, progress, side })
          const motion = fightBodyMotion({
            throwFrame: presentation.throwFrame(),
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
          const minimumDistance = scenery.framing?.minimumDistance
          const observed = hideSecondaryView
            ? cinematicDirector.update(state, cameraIntensity(), dt)
            : null
          const direction =
            cameraDirection ?? observed ?? cinematicDirector.update(state, cameraIntensity(), dt)
          const pursuit = combatCamera.pursuit(state)
          detail = visibleSecondaryView(
            state,
            direction.detail,
            (hideSecondaryView && !detailLayout) || pursuit,
          )
          detailRect = detailLayout ?? cinematicDetailRect(camera.aspect)
          const playerX = worldX(interpolatedPosition(state, 'player').x)
          const opponentX = worldX(interpolatedPosition(state, 'opponent').x)
          const framing = liveCameraFraming({
            state,
            positions: [playerX, opponentX],
            aspect: camera.aspect,
            scenery,
          })
          const pose = combatCamera.update({
            state,
            base: framing.base,
            span: framing.span,
            aspect: camera.aspect,
            dt,
            direction,
            pursuit,
            detail: Boolean(detail),
            detailRect,
            fallenBounds: fightCameraBodyBounds(state, models),
            companion: visibleFutureBeastOwner(state, viewer),
            intensity: cameraIntensity(),
            minimumDistance,
          })
          if (!pose.detailReady) detail = null
          detailVisible = Boolean(detail)
          camera.position.set(pose.x, pose.y, pose.z)
          updateFightCameraFog(scene, camera, scenery)
          camera.lookAt(pose.x, pose.lookY, 0)
          if (
            applyPresentationCamera({
              camera,
              combatReady: true,
              models,
              state,
              authored: cameraFrame,
              minimumDistance,
              throwFrame: presentation.throwFrame(),
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
          impacts.shake(camera, now)
        }

        let phinksLens: ReturnType<typeof createPhinksLens> | undefined
        const finishCombatFrame = (now: number) => {
          drawFightScene({
            victory: victoryRenderer,
            state,
            frame: victoryFrame,
            comfort: visualComfort(),
            models: { player: models.player.model.root, opponent: models.opponent.model.root },
            THREE,
            renderer,
            scene,
            camera,
            draw: () => {
              const focus = scene.userData.phinksFocus as PhinksFocus | undefined
              if (focus && comfort.graphics !== 'performance') {
                phinksLens ??= createPhinksLens(renderer)
                phinksLens.render(scene, camera, focus)
              } else if (post) post.render()
              else renderer.render(scene, camera)
            },
            failed: onSceneFailed,
          })
          inset.draw(renderer, { prediction, rect: detailRect, visible: detailVisible, now })
          recovery?.locate(camera, (side) => models[side].model.root)
          if (!ready) onSceneReady()
          ready = true
          if (
            detail &&
            !hideSecondaryView &&
            !detailScene.draw({ renderer, state, detail, rect: detailRect })
          )
            detail = null
        }
        let drawnState: FightState | undefined
        const render = (now: number) => {
          if (disposed) return
          if (!active && (!showRecovery || drawnState === state)) {
            lastFrameAt = null
            animationFrame = requestAnimationFrame(render)
            return
          }
          const dt =
            lastFrameAt === null
              ? fightFrameDeltaSeconds(drawnState?.frame, state.frame)
              : Math.min(0.1, (now - lastFrameAt) / 1000)
          motionSeconds += dt
          drawnState = state
          const seconds = presentationSeconds ?? motionSeconds
          presentation.observe(state, seconds, {
            reduced: motionPreference.matches,
            victory: victoryFrame,
          })
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
          projectionScene.sync(state, seconds)
          animateFighter({
            side: 'opponent',
            model: modelOf('opponent', state.opponent),
            seconds,
          })
          staging.sync(state)
          motionTrails.sync(state, now)
          feitanSpeed.sync(state, now)
          kurapikaSpeed.sync(state, now)
          alignPhysicalContact(state)
          feitanScene.sync(state, seconds)
          impacts.emit(state, now)
          fighterEffects.sync(state, seconds)
          onAwakening.sync(state, onFrames)

          updateCombatCamera(dt, now)

          impacts.animate(now)
          motionTrails.animate(now)
          feitanSpeed.animate(now)
          kurapikaSpeed.animate(now)

          collisions.sync(state)
          scenery.update?.(seconds)
          markFightRender(scene, state)
          finishCombatFrame(now)
          animationFrame = requestAnimationFrame(render)
        }

        resize = new ResizeObserver(fit)
        resize.observe(canvas)
        animationFrame = requestAnimationFrame(render)
        teardown = () => {
          cancelAnimationFrame(animationFrame)
          resize?.disconnect()
          inset.dispose()
          phinksLens?.dispose()
          victoryRenderer.dispose()
          trackingSilhouettes.dispose()
          impacts.dispose()
          motionTrails.dispose()
          feitanSpeed.dispose()
          kurapikaSpeed.dispose()
          staging.dispose()
          Object.values(models).forEach(({ model }) => disposeMountedVisitHatsu(model.root))
          collisions.dispose()
          projectileScene.dispose()
          fighterEffects.dispose()
          onAwakening.dispose()
          predatorScene.dispose()
          lsdfScene.dispose()
          feitanScene.dispose()
          projectionScene.dispose()
          dispose()
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
  <FightPursuitRecovery bind:this={recovery} {state} {language} enabled={showRecovery} />
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
