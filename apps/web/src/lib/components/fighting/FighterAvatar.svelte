<script lang="ts">
  import {
    createFighterFacing,
    trackFightOpponent,
    updateFighterFacing,
  } from '$lib/fighting/fighterFacing'
  import { MODEL_POSES, avatarPoseProgress } from '$lib/fighting/fighterAvatarPose'
  import { snapshotFighterPreview } from '$lib/fighting/fighterPreviewSnapshot'
  import { fightMove } from '$lib/fighting/fightMoves'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { ArcadeFighter, FighterPose } from '$lib/fighting/types'
  import { onMount } from 'svelte'

  export let fighter: ArcadeFighter
  export let preview = false

  let canvas: HTMLCanvasElement
  let snapshot: string | null = null
  let failed = false

  $: definition = fighterDefinition(fighter.id)

  onMount(() => {
    let disposed = false
    let frame = 0
    let resize: ResizeObserver | null = null
    let teardown: () => void = () => undefined

    // Portraits share one offscreen context: a roster would exhaust the browser's cap.
    async function mountPreview() {
      try {
        const still = await snapshotFighterPreview({
          fighter,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          cancelled: () => disposed,
        })
        if (!disposed && still) snapshot = still
      } catch {
        failed = true
      }
    }

    async function mountModel() {
      try {
        const THREE = await import('three')
        const [{ buildFightFigure }, { fightBodyMotion }, { disposeMountedVisitHatsu }] =
          await Promise.all([
            import('$lib/fighting/fighterFigure'),
            import('$lib/fighting/fightBodyMotion'),
            import('$lib/fighting/visitHatsuModel'),
          ])
        if (disposed || !canvas) return

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        })
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 20)
        camera.position.set(0, 1, 4.15)
        camera.lookAt(0, 0.92, 0)

        const materials: Array<[string, import('three').MeshBasicMaterial]> = []
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

        const model = buildFightFigure({ THREE, glow, fighter })
        scene.add(model.root)
        let renderedPose: FighterPose = fighter.pose
        let poseStarted = performance.now() / 1000
        const facing = createFighterFacing(fighter.facing, poseStarted)

        const fit = () => {
          if (!canvas) return
          const width = Math.max(1, canvas.clientWidth)
          const height = Math.max(1, canvas.clientHeight)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }
        fit()

        const render = (time: number) => {
          if (disposed) return
          const seconds = time / 1000
          if (fighter.pose !== renderedPose) {
            renderedPose = fighter.pose
            poseStarted = seconds
          }
          const progress = avatarPoseProgress(fighter, seconds - poseStarted)
          const bodyAngle = updateFighterFacing(facing, fighter.facing, seconds)
          model.root.rotation.y = bodyAngle
          const motion = fightBodyMotion({
            fighter,
            seconds,
            progress,
            fallback: fightMove(fighter, progress),
          })
          model.animate(seconds, MODEL_POSES[fighter.pose], {
            motion: trackFightOpponent({ fighter, bodyAngle, seconds, motion }),
            transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
          })
          renderer.render(scene, camera)
          frame = requestAnimationFrame(render)
        }
        render(performance.now())

        teardown = () => {
          cancelAnimationFrame(frame)
          resize?.disconnect()
          disposeMountedVisitHatsu(model.root)
          materials.forEach(([, material]) => material.dispose())
          renderer.dispose()
        }
        resize = new ResizeObserver(fit)
        resize.observe(canvas)
      } catch {
        failed = true
      }
    }

    void (preview ? mountPreview() : mountModel())
    return () => {
      disposed = true
      teardown()
    }
  })
</script>

<div class:preview class:failed class="fighter-model" aria-hidden="true">
  {#if snapshot}
    <img src={snapshot} alt="" />
  {:else}
    <canvas bind:this={canvas}></canvas>
  {/if}
  {#if failed}
    <span>{definition.name.slice(0, 1)}</span>
  {/if}
</div>

<style>
  .fighter-model {
    position: relative;
    left: 50%;
    width: 172px;
    height: 285px;
    filter: drop-shadow(0 16px 9px rgb(0 0 0 / 55%));
    pointer-events: none;
    transform: translateX(-50%);
  }

  canvas,
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .preview {
    width: 118px;
    height: 178px;
  }

  .failed {
    display: grid;
    place-items: center;
    border-radius: 45%;
    background: radial-gradient(circle, #34404a, #11171c 70%);
  }

  .failed span {
    color: #d9b95f;
    font: 700 4rem/1 var(--font-display);
  }

  @media (max-width: 700px) {
    .fighter-model:not(.preview) {
      width: 125px;
      height: 220px;
    }
  }
</style>
