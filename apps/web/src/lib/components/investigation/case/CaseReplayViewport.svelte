<script lang="ts">
  import { onMount } from 'svelte'
  import type { ReplayFrame } from '$lib/investigation/replay'

  let { frame, playing, label }: { frame: ReplayFrame; playing: boolean; label: string } = $props()

  let canvas = $state<HTMLCanvasElement>()
  let unavailable = $state(false)
  let ready = $state(false)
  let draw = $state<((frame: ReplayFrame, seconds: number) => void) | null>(null)
  let reducedMotion = $state(false)

  onMount(() => {
    const surface = canvas
    if (!surface) return
    let mounted = true
    let release: (() => void) | undefined
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => (reducedMotion = preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    void Promise.all([import('three'), import('$lib/investigation/silentMajorityReplayScene')])
      .then(([THREE, { createSilentMajorityReplay }]) => {
        if (!mounted) return
        const renderer = new THREE.WebGLRenderer({ canvas: surface, antialias: true })
        release = () => {
          renderer.dispose()
          renderer.forceContextLoss()
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
        const replay = createSilentMajorityReplay(THREE)
        let aspect = 1
        const render = (current: ReplayFrame, seconds: number) => {
          replay.update(current, seconds, aspect)
          renderer.render(replay.scene, replay.camera)
        }
        const fit = () => {
          const { width, height } = surface.getBoundingClientRect()
          if (!width || !height) return
          aspect = width / height
          renderer.setSize(width, height, false)
          render(frame, frame.second)
        }
        const observer = new ResizeObserver(fit)
        const releaseRenderer = release
        release = () => {
          observer.disconnect()
          replay.dispose()
          releaseRenderer()
        }
        fit()
        observer.observe(surface)
        draw = render
        ready = true
      })
      .catch(() => {
        if (mounted) unavailable = true
        release?.()
        release = undefined
      })
    return () => {
      mounted = false
      preference.removeEventListener('change', updatePreference)
      release?.()
    }
  })

  $effect(() => {
    const render = draw
    const current = frame
    if (!render) return
    render(current, current.second)
    if (!playing || reducedMotion) return
    const start = performance.now()
    let request: number
    const step = (now: number) => {
      render(current, current.second + Math.min(0.7, (now - start) / 1000))
      request = requestAnimationFrame(step)
    }
    request = requestAnimationFrame(step)
    return () => cancelAnimationFrame(request)
  })
</script>

{#if !unavailable}
  <div
    class="relative h-52 border-b border-[#d6b35a]/25 bg-[#181716] sm:h-64"
    class:pending={!ready}
    role="img"
    aria-label={label}
  >
    <canvas
      bind:this={canvas}
      class="block h-full w-full"
      aria-hidden="true"
      data-replay-stage={frame.stage}
      data-replay-creatures={frame.snakes}
    ></canvas>
  </div>
{/if}

<style>
  .pending canvas {
    visibility: hidden;
  }
</style>
