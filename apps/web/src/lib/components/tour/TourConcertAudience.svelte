<script lang="ts">
  import { onMount } from 'svelte'
  import type * as Three from 'three'

  let { french }: { french: boolean } = $props()
  let canvas: HTMLCanvasElement

  const princes = [
    ['prince-benjamin', 'Benjamin'],
    ['prince-camilla', 'Camilla'],
    ['prince-zhanglei', 'Zhang Lei'],
    ['prince-tserriednich', 'Tserriednich'],
    ['prince-tubeppa', 'Tubeppa'],
    ['prince-tyson', 'Tyson'],
    ['prince-luzurus', 'Luzurus'],
    ['prince-halkenburg', 'Halkenburg'],
    ['prince-kacho', 'Kacho'],
    ['prince-fugetsu', 'Fugetsu'],
    ['prince-marayam', 'Marayam'],
  ] as const

  onMount(() => {
    let disposed = false
    let cleanup = () => {}
    void Promise.all([import('three'), import('$lib/tour/humanFigure')]).then(
      ([THREE, { buildHumanFigure }]) => {
        if (disposed) return
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.setClearColor(0xf5ede6)
        const scene = new THREE.Scene()
        const portraitY = 1.6
        const portraitHalfHeight = 0.42
        const camera = new THREE.OrthographicCamera(
          -4,
          4,
          portraitHalfHeight,
          -portraitHalfHeight,
          0.1,
          20,
        )
        camera.position.set(0, portraitY, 6)
        camera.lookAt(0, portraitY, 0)
        const roots: Three.Group[] = []
        for (const [index, [identity]] of princes.entries()) {
          const rig = buildHumanFigure({
            THREE,
            glow: (colour, opacity) =>
              new THREE.MeshBasicMaterial({
                color: colour,
                opacity,
                transparent: opacity < 1,
              }),
            seen: {
              id: `concert-portrait:${identity}`,
              kind: 'avatar',
              spaceId: 'concert-reaction-strip',
              tierId: 'tier-1',
              at: [0, 0],
              y: 0,
              size: 0.42,
              colour: 0xffffff,
              stage: 0,
              hidden: false,
              human: { role: 'witness', pose: 'idle', identity },
            },
          })
          rig.animate(index * 0.17)
          roots.push(rig.root)
          scene.add(rig.root)
        }
        const resize = () => {
          const width = Math.max(1, canvas.clientWidth)
          const height = Math.max(1, canvas.clientHeight)
          const halfHeight = portraitHalfHeight
          const halfWidth = halfHeight * (width / height)
          camera.left = -halfWidth
          camera.right = halfWidth
          camera.top = halfHeight
          camera.bottom = -halfHeight
          camera.updateProjectionMatrix()
          // The strip also lives inside the narrow tools drawer. Distribute
          // every portrait from the *actual* canvas width so neither edge
          // prince is clipped at desktop or mobile sizes.
          const usableHalfWidth = Math.max(0.1, halfWidth - 0.1)
          const cellWidth = (usableHalfWidth * 2) / roots.length
          roots.forEach((root, index) => {
            root.position.x = -usableHalfWidth + cellWidth * (index + 0.5)
          })
          renderer.setSize(width, height, false)
          renderer.render(scene, camera)
        }
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        resize()
        cleanup = () => {
          observer.disconnect()
          for (const root of roots)
            root.traverse((object) => {
              const mesh = object as Three.Mesh
              if (!mesh.isMesh) return
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
              for (const material of materials) material.dispose()
            })
          renderer.dispose()
        }
      },
    )
    return () => {
      disposed = true
      cleanup()
    }
  })
</script>

<div class="reaction-strip" aria-label={french ? 'Réactions des princes' : 'Princes reacting'}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <div class="labels">
    {#each princes as [, name] (name)}
      <span title={`Prince ${name}`} aria-label={`Prince ${name}`}></span>
    {/each}
  </div>
</div>

<style>
  .reaction-strip {
    position: absolute;
    left: 50%;
    bottom: 9rem;
    width: min(770px, calc(100% - 2rem));
    height: 82px;
    transform: translateX(-50%);
    z-index: 16;
    overflow: hidden;
    border: 2px solid #16120f;
    background: #f5ede6;
    box-shadow: 0 8px 28px #0008;
    pointer-events: none;
    animation: audience-cut 10s both;
  }
  canvas { display: block; width: 100%; height: 100%; }
  .labels {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(11, 1fr);
  }
  .labels span { border-right: 2px solid #16120f; }
  .labels span:last-child { border-right: 0; }
  @keyframes audience-cut {
    0% { opacity: 0; transform: translate(-50%, 12px); }
    12%, 82% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -8px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .reaction-strip { animation: none; }
  }
</style>
