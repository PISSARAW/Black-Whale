<script lang="ts">
  import { onMount } from 'svelte'
  import { camillaCameraSpan } from '$lib/fighting/camillaCamera'
  import { fightFigureVisible } from '$lib/fighting/fightFigureVisibility'
  import { biscuitCameraFrame } from '$lib/fighting/biscuitCamera'
  import { createLsdfScene } from '$lib/fighting/lsdfScene'
  import { createPredatorScene } from '$lib/fighting/predatorScene'
  import {
    createHanzoProjectionScene,
    projectionCameraSpan,
  } from '$lib/fighting/hanzoProjectionScene'
  import { sleepingBody } from '$lib/fighting/hanzoProjection'
  import {
    createFighterFacing,
    trackFightOpponent,
    updateFighterFacing,
  } from '$lib/fighting/fighterFacing'
  import { fightMove } from '$lib/fighting/fightMoves'
  import { fightBodyMotion } from '$lib/fighting/fightBodyMotion'
  import { impactPresentation } from '$lib/fighting/fightImpactPresentation'
  import { interpolatedPosition } from '$lib/fighting/fightInterpolation'
  import { motionOf } from '$lib/fighting/fighterMovement'
  import {
    createStrideClocks,
    easeFactor,
    poseProgress,
    transitionSecondsFor,
  } from '$lib/fighting/sceneMotion'
  import {
    impactReaction,
    isThrowTech,
    knockdownMotion,
    throwTechMotion,
    wakeupMotion,
  } from '$lib/fighting/reactionMotion'
  import { createProjectileScene } from '$lib/fighting/projectileScene'
  import { createFighterEffectScene } from '$lib/fighting/fighterEffectScene'
  import { createFeitanScene } from '$lib/fighting/feitanScene'
  import { DEFAULT_FIGHT_STAGE, type FightStageId } from '$lib/fighting/stages'
  import type { ArcadeFighter, FightState, FighterPose } from '$lib/fighting/types'
  import type { HumanPose } from '$lib/tour/humanAnimation'

  export let state: FightState
  export let stageId: FightStageId = DEFAULT_FIGHT_STAGE

  let canvas: HTMLCanvasElement
  let failed = false

  const MODEL_POSES: Record<FighterPose, HumanPose> = {
    idle: 'idle',
    walk: 'walk',
    jump: 'idle',
    guard: 'guard',
    light: 'idle',
    heavy: 'idle',
    special: 'idle',
    ranged: 'idle',
    hit: 'idle',
    down: 'fallen',
    wakeup: 'idle',
    ko: 'idle',
  }

  /** Per-second ease of the camera; 6 is a touch snappier than the old 0.07/frame at 60 Hz. */
  const CAMERA_RATE = 6
  const worldX = (value: number) => (value - 50) * 0.115
  const worldY = (value: number) => value * 0.12

  onMount(() => {
    let disposed = false
    let animationFrame = 0
    let resize: ResizeObserver | null = null
    let teardown: () => void = () => undefined

    async function mountScene() {
      try {
        const THREE = await import('three')
        const { buildFightFigure, fightFigureKey } = await import('$lib/fighting/fighterFigure')
        const { buildFightScenery } = await import('$lib/fighting/stageScenery')
        if (disposed || !canvas) return

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        })
        renderer.setClearColor(0x05090d, 1)
        renderer.outputColorSpace = THREE.SRGBColorSpace

        const scene = new THREE.Scene()
        scene.fog = new THREE.Fog(0x05090d, 8, 18)
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
        camera.position.set(0, 2.25, 9.2)
        let cameraLookY = 1.18

        const materials: Array<[string, import('three').MeshBasicMaterial]> = []
        const geometries: import('three').BufferGeometry[] = []
        const glow = (colour: number, opacity: number) => {
          const key = `${colour}:${opacity}`
          const held = materials.find(([candidate]) => candidate === key)?.[1]
          if (held) return held
          const material = new THREE.MeshBasicMaterial({
            color: colour,
            opacity,
            transparent: opacity < 1,
            depthWrite: opacity >= 1,
          })
          materials.push([key, material])
          return material
        }

        const geometry = <T extends import('three').BufferGeometry>(made: T): T => {
          geometries.push(made)
          return made
        }

        const scenery = await buildFightScenery({ THREE, glow, geometry }, stageId)
        if (disposed) {
          scenery.dispose()
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
        let post: import('$lib/fighting/stagePost').StagePost | null = null
        if (scenery.bloom) {
          const { createStagePost } = await import('$lib/fighting/stagePost')
          post = await createStagePost({ THREE, renderer, scene, camera })
          if (disposed) {
            post.dispose()
            scenery.dispose()
            return
          }
        }

        const buildFighter = (fighter: ArcadeFighter) =>
          buildFightFigure({
            THREE,
            glow,
            fighter,
            observer: fighter === state.player ? undefined : state.player,
          })

        // Rebuild only the fighter whose aura or body form changes; keep the stage.
        const nenKey = (fighter: ArcadeFighter) =>
          fightFigureKey(fighter) + String(state.player.nen.gyo)
        const models = {
          player: { model: buildFighter(state.player), nen: nenKey(state.player) },
          opponent: { model: buildFighter(state.opponent), nen: nenKey(state.opponent) },
        }
        scene.add(models.player.model.root, models.opponent.model.root)
        const projectileScene = createProjectileScene({
          THREE,
          scene,
          glow,
          geometry,
          worldX,
          worldY,
        })
        const projectionScene = createHanzoProjectionScene({ scene, buildFighter, worldX })
        const fighterEffects = createFighterEffectScene({ THREE, scene, worldX, worldY, figureOf: (side) => models[side].model.turns })
        const lsdfScene = createLsdfScene({ THREE, scene, glow, worldX })
        const predatorScene = createPredatorScene({ THREE, scene, glow, worldX, worldY })
        const feitanScene = createFeitanScene({
          THREE,
          scene,
          worldX,
          worldY,
          figureOf: (side) => models[side].model.turns,
        })
        const modelOf = (side: 'player' | 'opponent', fighter: ArcadeFighter) => {
          const held = models[side]
          const nen = nenKey(fighter)
          if (held.nen === nen) return held.model
          scene.remove(held.model.root)
          held.model = buildFighter(fighter)
          held.nen = nen
          scene.add(held.model.root)
          return held.model
        }

        const sparkGeometry = geometry(new THREE.SphereGeometry(0.045, 5, 4))
        const sparkMaterials = {
          hit: glow(0xffd36a, 1),
          block: glow(0x67d9ff, 1),
        }
        const sparks: Array<{
          mesh: import('three').Mesh
          velocity: import('three').Vector3
          born: number
          size: number
        }> = []
        let lastImpact = state.impact?.sequence ?? 0
        let shakeStarted = 0
        let shakeUntil = 0
        let shakeX = 0
        let shakeY = 0

        const emitImpact = (now: number) => {
          const impact = state.impact
          if (!impact || impact.sequence === lastImpact) return
          lastImpact = impact.sequence
          const profile = impactPresentation(impact, state[impact.attacker].id)
          shakeStarted = now
          shakeUntil = now + profile.shakeMs
          shakeX = profile.shakeX
          shakeY = profile.shakeY
          const origin = new THREE.Vector3(
            worldX(impact.position.x),
            worldY(impact.position.y),
            0.25,
          )
          const material = impact.blocked ? sparkMaterials.block : sparkMaterials.hit
          for (let index = 0; index < profile.sparks; index += 1) {
            const angle = (index / profile.sparks) * Math.PI * 2
            const mesh = new THREE.Mesh(sparkGeometry, material)
            mesh.position.copy(origin)
            scene.add(mesh)
            sparks.push({
              mesh,
              velocity: new THREE.Vector3(
                Math.cos(angle) * profile.sparkSpeed,
                Math.sin(angle) * profile.sparkSpeed,
                0,
              ),
              born: now,
              size: profile.sparkSize,
            })
          }
        }

        const fit = () => {
          if (!canvas) return
          const width = Math.max(1, canvas.clientWidth)
          const height = Math.max(1, canvas.clientHeight)
          const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
          renderer.setPixelRatio(ratio)
          renderer.setSize(width, height, false)
          post?.resize(width, height, ratio)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }
        fit()

        const poseStarts: Record<'player' | 'opponent', { pose: FighterPose; at: number } | null> =
          {
            player: null,
            opponent: null,
          }
        const strideClock = createStrideClocks()
        let lastFrameAt: number | null = null
        const facings = {
          player: createFighterFacing(state.player.facing),
          opponent: createFighterFacing(state.opponent.facing),
        }
        interface AnimateFighterOptions {
          side: 'player' | 'opponent'
          fighter: ArcadeFighter
          opponent: ArcadeFighter
          model: ReturnType<typeof buildFighter>
          seconds: number
        }
        function reactionMotion(
          fighter: ArcadeFighter,
          progress: number,
          side: 'player' | 'opponent',
        ) {
          let motion = fightMove(fighter, progress)
          if (fighter.pose === 'hit' && state.impact?.attacker !== side)
            motion = impactReaction(state.impact?.zone ?? 'torso', progress)
          if (fighter.pose === 'down') motion = knockdownMotion(progress)
          if (fighter.pose === 'wakeup') motion = wakeupMotion(progress)
          if (isThrowTech(state)) motion = throwTechMotion(side)
          return motion
        }

        const animateFighter = (options: AnimateFighterOptions) => {
          const { side, fighter, opponent, model, seconds } = options
          model.root.visible = fightFigureVisible(state, side)
          const held = poseStarts[side]
          if (!held || held.pose !== fighter.pose)
            poseStarts[side] = { pose: fighter.pose, at: seconds }
          const started = poseStarts[side]?.at ?? seconds
          const progress = poseProgress(fighter, { seconds, started })
          const drawn = interpolatedPosition(state, side)
          model.root.position.set(worldX(drawn.x), worldY(drawn.y), 0)
          const bodyAngle = updateFighterFacing(facings[side], fighter.facing, seconds)
          model.root.rotation.y = bodyAngle
          const fallback = reactionMotion(fighter, progress, side)
          const impact = state.impact
          const hitZone = impact && impact.attacker !== side ? impact.zone : undefined
          const motion = fightBodyMotion({ fighter, seconds, fallback, progress, hitZone })
          const modelPose = motionOf(fighter).dash ? 'idle' : MODEL_POSES[fighter.pose]
          model.animate(seconds, modelPose, {
            motion: trackFightOpponent({
              fighter,
              opponent: sleepingBody(opponent),
              bodyAngle,
              seconds,
              motion,
            }),
            transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
            transitionSeconds: transitionSecondsFor(fighter),
            strideClock: strideClock(side, worldX(drawn.x), fighter.facing),
          })
        }

        // Pulling back on a narrow viewport must not bury fighters in the stage fog.
        const updateCameraFog = () => {
          if (scene.fog instanceof THREE.Fog && scenery.fog.kind === 'linear') {
            const setback = Math.max(0, camera.position.z - 9.2)
            scene.fog.near = scenery.fog.near + setback
            scene.fog.far = scenery.fog.far + setback
          }
          if (scene.fog instanceof THREE.FogExp2 && scenery.fog.kind === 'exp2') {
            scene.fog.density = scenery.fog.density * Math.min(1, 9.2 / camera.position.z)
          }
        }

        const render = (now: number) => {
          if (disposed) return
          const seconds = now / 1000
          const dt = Math.min(0.1, lastFrameAt === null ? 0 : (now - lastFrameAt) / 1000)
          lastFrameAt = now
          emitImpact(now)
          animateFighter({
            side: 'player',
            fighter: state.player,
            opponent: state.opponent,
            model: modelOf('player', state.player),
            seconds,
          })
          projectileScene.sync(state.projectiles, seconds, state.player)
          predatorScene.sync(state, seconds)
          lsdfScene.sync(state, seconds)
          feitanScene.sync(state, seconds)
          projectionScene.sync(state, seconds)
          animateFighter({
            side: 'opponent',
            fighter: state.opponent,
            opponent: state.player,
            model: modelOf('opponent', state.opponent),
            seconds,
          })
          fighterEffects.sync(state, seconds)

          const playerX = worldX(interpolatedPosition(state, 'player').x)
          const opponentX = worldX(interpolatedPosition(state, 'opponent').x)
          const { centre, gap } = projectionCameraSpan(state, [playerX, opponentX], worldX)
          const catSpan = camillaCameraSpan({ state, centre, gap, worldX })
          const framing = biscuitCameraFrame({ state, ...catSpan, aspect: camera.aspect })
          const ease = easeFactor(CAMERA_RATE, dt)
          camera.position.x += (framing.x - camera.position.x) * ease
          camera.position.z += (framing.z - camera.position.z) * ease
          camera.position.y += (framing.y - camera.position.y) * ease
          cameraLookY += (framing.lookY - cameraLookY) * ease
          updateCameraFog()
          if (now < shakeUntil) {
            const fade = (shakeUntil - now) / Math.max(1, shakeUntil - shakeStarted)
            camera.position.x += Math.sin(now * 0.15) * shakeX * fade
            camera.position.y += Math.cos(now * 0.19) * shakeY * fade
          }
          camera.lookAt(camera.position.x, cameraLookY, 0)

          for (let index = sparks.length - 1; index >= 0; index -= 1) {
            const spark = sparks[index]
            const age = now - spark.born
            spark.mesh.position.add(spark.velocity)
            spark.velocity.y -= 0.0008
            spark.mesh.scale.setScalar(spark.size * Math.max(0.01, 1 - age / 360))
            if (age > 360) {
              scene.remove(spark.mesh)
              sparks.splice(index, 1)
            }
          }

          scenery.update?.(seconds)
          if (post) post.render()
          else renderer.render(scene, camera)
          animationFrame = requestAnimationFrame(render)
        }

        resize = new ResizeObserver(fit)
        resize.observe(canvas)
        animationFrame = requestAnimationFrame(render)
        teardown = () => {
          cancelAnimationFrame(animationFrame)
          resize?.disconnect()
          materials.forEach(([, material]) => material.dispose())
          geometries.forEach((item) => item.dispose())
          projectileScene.dispose()
          fighterEffects.dispose()
          predatorScene.dispose()
          lsdfScene.dispose()
          feitanScene.dispose()
          projectionScene.dispose()
          post?.dispose()
          scenery.dispose()
          renderer.dispose()
        }
      } catch {
        failed = true
      }
    }

    void mountScene()
    return () => {
      disposed = true
      teardown()
    }
  })
</script>

<div class:failed class="fight-scene" aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
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
