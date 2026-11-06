<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import panzoom from 'panzoom'
  import { tourWords } from '$lib/tour/workspaceWords'
  import TourMinimap from './TourMinimap.svelte'

  let props: ComponentProps<typeof TourMinimap> = $props()
  let viewport: HTMLDivElement
  let controller: ReturnType<typeof panzoom> | undefined
  let percent = $state(100)
  let origin = { x: 0, y: 0 }
  let dragged = false

  function reset() {
    if (!controller) return
    controller.zoomTo(0, 0, 1 / controller.getTransform().scale)
    controller.moveTo(0, 0)
  }

  function zoom(factor: number) {
    controller?.zoomTo(viewport.clientWidth / 2, viewport.clientHeight / 2, factor)
  }

  function attach(element: HTMLDivElement) {
    const instance = panzoom(element, {
      minZoom: 1,
      maxZoom: 8,
      bounds: true,
      boundsPadding: 1,
      zoomDoubleClickSpeed: 1,
      filterKey: () => true,
    })
    controller = instance
    instance.on('transform', () => (percent = Math.round(instance.getTransform().scale * 100)))
    const observer = new ResizeObserver(reset)
    // The action mounts before the parent bind:this assignment is flushed.
    observer.observe(element.parentElement ?? element)
    return {
      destroy() {
        observer.disconnect()
        instance.dispose()
        controller = undefined
      },
    }
  }

  function start(event: PointerEvent) {
    origin = { x: event.clientX, y: event.clientY }
    dragged = false
  }

  function move(event: PointerEvent) {
    if (!event.buttons && event.pointerType !== 'touch') return
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 6) dragged = true
  }
</script>

<div class="plan-viewport">
  <div
    bind:this={viewport}
    class="drawing"
    onpointerdowncapture={start}
    onpointermovecapture={move}
    onclickcapture={(event) => {
      if (dragged && event.detail !== 0) {
        event.preventDefault()
        event.stopPropagation()
      }
    }}
    role="group"
    aria-label={props.label}
  >
    <div class="pan-surface" use:attach><TourMinimap {...props} fill /></div>
  </div>
  <div class="zoom-controls" role="group" aria-label={$tourWords.mapControls}>
    <button
      type="button"
      onclick={() => zoom(1 / 1.4)}
      aria-label={$tourWords.zoomOut}
      disabled={percent <= 100}>−</button
    >
    <button
      type="button"
      class="reset"
      onclick={reset}
      title={$tourWords.reset}
      aria-label={$tourWords.reset}>{percent}% <span aria-hidden="true">↺</span></button
    >
    <button
      type="button"
      onclick={() => zoom(1.4)}
      aria-label={$tourWords.zoomIn}
      disabled={percent >= 800}>+</button
    >
  </div>
</div>

<style>
  .plan-viewport {
    position: relative;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--line-default);
    border-radius: 5px;
    background: #08090c;
  }
  .drawing {
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;
  }
  .pan-surface {
    width: 100%;
    height: 100%;
  }
  .drawing :global(figure) {
    border: 0;
    border-radius: 0;
    background: transparent;
    margin: 0;
  }
  .drawing :global(figcaption) {
    visibility: hidden;
    height: 0;
    padding: 0;
  }
  .zoom-controls {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    border: 1px solid #454136;
    border-radius: 5px;
    overflow: hidden;
    background: #18191d;
    box-shadow: 0 6px 24px #0008;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  button:hover {
    background: #2b2a25;
    color: var(--accent-gold-bright);
  }
  button:disabled {
    opacity: 0.35;
  }
  .reset {
    min-width: 90px;
    border-inline: 1px solid var(--line-default);
    font-size: 0.75rem;
  }
  .reset span {
    margin-left: 0.5rem;
  }
</style>
