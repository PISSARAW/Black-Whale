<script lang="ts">
  import { onMount } from 'svelte'
  import { attackProgress } from '$lib/fighting/frameData'
  import {
    createFighterFacing,
    trackFightOpponent,
    updateFighterFacing,
  } from '$lib/fighting/fighterFacing'
  import { fightMove, KO_DURATION } from '$lib/fighting/fightMoves'
  import { fighterDefinition } from '$lib/fighting/roster'
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
    hit: 'idle',
    ko: 'idle',
  }

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
        const { buildHumanFigure } = await import('$lib/tour/humanFigure')
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
        camera.far = scenery.cameraFar
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

        const buildFighter = (fighter: ArcadeFighter) => {
          const definition = fighterDefinition(fighter.id)
          return buildHumanFigure({
            THREE,
            glow,
            seen: {
              id: `fighting-scene:${definition.modelId}`,
              kind: 'combatant',
              spaceId: 'black-whale-clash',
              tierId: 'arcade-stage',
              at: [0, 0],
              y: 0,
              size: 1,
              colour: Number.parseInt(definition.colour.slice(1), 16),
              stage: 0,
              hidden: false,
              human: {
                role: definition.modelRole,
                identity: definition.modelId,
                pose: 'idle',
                aura: fighter.nen.mode,
                nen: fighter.nen,
              },
            },
          })
        }

        const playerModel = buildFighter(state.player)
        const opponentModel = buildFighter(state.opponent)
        scene.add(playerModel.root, opponentModel.root)

        const sparkGeometry = geometry(new THREE.SphereGeometry(0.045, 5, 4))
        const sparkMaterials = {
          hit: glow(0xffd36a, 1),
          block: glow(0x67d9ff, 1),
        }
        const sparks: Array<{
          mesh: import('three').Mesh
          velocity: import('three').Vector3
          born: number
        }> = []
        let lastImpact = state.impact?.sequence ?? 0
        let shakeUntil = 0

        const emitImpact = (now: number) => {
          const impact = state.impact
          if (!impact || impact.sequence === lastImpact) return
          lastImpact = impact.sequence
          shakeUntil = now + (impact.kind === 'special' ? 230 : 140)
          const origin = new THREE.Vector3(
            worldX(impact.position.x),
            worldY(impact.position.y),
            0.25,
          )
          const material = impact.blocked ? sparkMaterials.block : sparkMaterials.hit
          for (let index = 0; index < 12; index += 1) {
            const angle = (index / 12) * Math.PI * 2
            const mesh = new THREE.Mesh(sparkGeometry, material)
            mesh.position.copy(origin)
            scene.add(mesh)
            sparks.push({
              mesh,
              velocity: new THREE.Vector3(Math.cos(angle) * 0.018, Math.sin(angle) * 0.018, 0),
              born: now,
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
        const facings = {
          player: createFighterFacing(state.player.facing),
          opponent: createFighterFacing(state.opponent.facing),
        }
        interface AnimateFighterOptions {
          side: 'player' | 'opponent'
          fighter: ArcadeFighter
          opponent: ArcadeFighter
          model: typeof playerModel
          seconds: number
        }
        const animateFighter = (options: AnimateFighterOptions) => {
          const { side, fighter, opponent, model, seconds } = options
          const held = poseStarts[side]
          if (!held || held.pose !== fighter.pose)
            poseStarts[side] = { pose: fighter.pose, at: seconds }
          const started = poseStarts[side]?.at ?? seconds
          let progress = attackProgress(fighter)
          if (fighter.pose === 'jump')
            progress = Math.min(1, Math.max(0, (48 - fighter.velocityY) / 96))
          if (fighter.pose === 'hit') progress = Math.min(1, Math.max(0, 1 - fighter.hitStun / 26))
          if (fighter.pose === 'ko')
            progress = Math.min(1, (seconds - started) / (KO_DURATION * 1.35))
          model.root.position.set(worldX(fighter.x), worldY(fighter.y), 0)
          const bodyAngle = updateFighterFacing(facings[side], fighter.facing, seconds)
          model.root.rotation.y = bodyAngle
          model.animate(seconds, MODEL_POSES[fighter.pose], {
            motion: trackFightOpponent({
              fighter,
              opponent,
              bodyAngle,
              seconds,
              motion: fightMove(fighter, progress),
            }),
            transitionKey: fighter.pose,
          })
        }

        const render = (now: number) => {
          if (disposed) return
          const seconds = now / 1000
          emitImpact(now)
          animateFighter({
            side: 'player',
            fighter: state.player,
            opponent: state.opponent,
            model: playerModel,
            seconds,
          })
          animateFighter({
            side: 'opponent',
            fighter: state.opponent,
            opponent: state.player,
            model: opponentModel,
            seconds,
          })

          const playerX = worldX(state.player.x)
          const opponentX = worldX(state.opponent.x)
          const centre = (playerX + opponentX) / 2
          const gap = Math.abs(playerX - opponentX)
          const targetZ = state.phase === 'finished' ? 7.2 : 8.1 + gap * 0.16
          camera.position.x += (centre * 0.32 - camera.position.x) * 0.07
          camera.position.z += (targetZ - camera.position.z) * 0.07
          camera.position.y += (2.2 - camera.position.y) * 0.07
          if (now < shakeUntil) {
            camera.position.x += Math.sin(now * 0.12) * 0.035
            camera.position.y += Math.cos(now * 0.15) * 0.025
          }
          camera.lookAt(camera.position.x, 1.18, 0)

          for (let index = sparks.length - 1; index >= 0; index -= 1) {
            const spark = sparks[index]
            const age = now - spark.born
            spark.mesh.position.add(spark.velocity)
            spark.velocity.y -= 0.0008
            spark.mesh.scale.setScalar(Math.max(0.01, 1 - age / 360))
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
