<script context="module" lang="ts">
  // Build roster snapshots sequentially so the selection screen never exceeds
  // the browser's concurrent WebGL-context limit.
  let previewQueue: Promise<void> = Promise.resolve()
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { attackProgress } from '$lib/fighting/frameData'
  import {
    createFighterFacing,
    trackFightOpponent,
    updateFighterFacing,
  } from '$lib/fighting/fighterFacing'
  import { fightMove, KO_DURATION } from '$lib/fighting/fightMoves'
  import type { ArcadeFighter, FighterPose } from '$lib/fighting/types'
  import type { HumanPose } from '$lib/tour/humanAnimation'

  export let fighter: ArcadeFighter
  export let preview = false

  let canvas: HTMLCanvasElement
  let snapshot: string | null = null
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
    ko: 'idle',
  }

  $: definition = fighterDefinition(fighter.id)

  onMount(() => {
    let disposed = false
    let frame = 0
    let resize: ResizeObserver | null = null
    let teardown: () => void = () => undefined

    async function mountModel() {
      try {
        const THREE = await import('three')
        const { buildHumanFigure } = await import('$lib/tour/humanFigure')
        if (disposed || !canvas) return

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: !preview,
          powerPreference: preview ? 'low-power' : 'high-performance',
          preserveDrawingBuffer: preview,
        })
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(preview ? 24 : 27, 1, 0.1, 20)
        camera.position.set(0, preview ? 1.05 : 1, preview ? 5.2 : 4.15)
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

        const model = buildHumanFigure({
          THREE,
          glow,
          seen: {
            id: `fighting:${definition.modelId}`,
            kind: 'combatant',
            spaceId: 'black-whale-clash',
            tierId: 'arcade-stage',
            at: [0, 0],
            y: 0,
            size: preview ? 0.9 : 1,
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
        scene.add(model.root)
        let renderedPose: FighterPose = fighter.pose
        let poseStarted = performance.now() / 1000
        const facing = createFighterFacing(fighter.facing, poseStarted)

        const fit = () => {
          if (!canvas) return
          const width = Math.max(1, canvas.clientWidth)
          const height = Math.max(1, canvas.clientHeight)
          const ratio = Math.min(window.devicePixelRatio || 1, preview ? 1.25 : 1.75)
          renderer.setPixelRatio(ratio)
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
          const pose = MODEL_POSES[fighter.pose]
          let progress = attackProgress(fighter)
          if (fighter.pose === 'jump') {
            progress = Math.min(1, Math.max(0, (48 - fighter.velocityY) / 96))
          } else if (fighter.pose === 'hit') {
            progress = Math.min(1, Math.max(0, 1 - fighter.hitStun / 26))
          } else if (fighter.pose === 'ko') {
            // The match loop stops on K.O.; the fall finishes on the render clock.
            progress = Math.max(progress, Math.min(1, (seconds - poseStarted) / KO_DURATION))
          }
          const bodyAngle = preview ? -0.28 : updateFighterFacing(facing, fighter.facing, seconds)
          model.root.rotation.y = bodyAngle
          model.animate(seconds, pose, {
            motion: preview
              ? fightMove(fighter, progress)
              : trackFightOpponent({
                  fighter,
                  bodyAngle,
                  seconds,
                  motion: fightMove(fighter, progress),
                }),
            transitionKey: fighter.pose,
          })
          renderer.render(scene, camera)
          if (!preview) frame = requestAnimationFrame(render)
        }
        render(performance.now())

        const release = () => {
          cancelAnimationFrame(frame)
          resize?.disconnect()
          materials.forEach(([, material]) => material.dispose())
          renderer.dispose()
          if (preview) renderer.getContext().getExtension('WEBGL_lose_context')?.loseContext()
        }
        teardown = release

        if (preview) {
          snapshot = canvas.toDataURL('image/webp', 0.9)
          release()
          teardown = () => undefined
        } else {
          resize = new ResizeObserver(fit)
          resize.observe(canvas)
        }
      } catch {
        failed = true
      }
    }

    if (preview) previewQueue = previewQueue.then(mountModel, mountModel)
    else void mountModel()
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
