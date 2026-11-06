<script lang="ts">
  import type { Snippet } from 'svelte'
  import panzoom from 'panzoom'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  let { children }: { children: Snippet } = $props()
  let viewport: HTMLDivElement
  let controller: ReturnType<typeof panzoom> | undefined
  let percent = $state(100)
  let width = $state(1000)
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
    const frame = element.parentElement as HTMLDivElement
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
    const observer = new ResizeObserver(() => {
      width = Math.min(frame.clientWidth, (frame.clientHeight * 10) / 7)
      reset()
    })
    observer.observe(frame)
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

<div class="reconstruction-viewport">
  <div
    class="drawing"
    bind:this={viewport}
    role="group"
    aria-label={$reconstructionWords.overview}
    onpointerdowncapture={start}
    onpointermovecapture={move}
    onclickcapture={(event) => {
      if (dragged && event.detail !== 0) {
        event.preventDefault()
        event.stopPropagation()
      }
    }}
  >
    <div class="pan-surface" use:attach>
      <div class="map-plane" style:width="{width}px" style:height="{(width * 7) / 10}px">
        {@render children()}
      </div>
    </div>
  </div>
  <div class="zoom-controls" role="group" aria-label={$reconstructionWords.zoom} data-hatsu-pass>
    <button
      type="button"
      onclick={() => zoom(1 / 1.4)}
      aria-label={$reconstructionWords.zoomOut}
      disabled={percent <= 100}>−</button
    >
    <button type="button" class="reset" onclick={reset} aria-label={$reconstructionWords.reset}
      >{percent}% <span aria-hidden="true">↺</span></button
    >
    <button
      type="button"
      onclick={() => zoom(1.4)}
      aria-label={$reconstructionWords.zoomIn}
      disabled={percent >= 800}>+</button
    >
  </div>
</div>

<style>
  .reconstruction-viewport,
  .drawing,
  .pan-surface {
    width: 100%;
    height: 100%;
  }
  .reconstruction-viewport {
    position: relative;
    overflow: hidden;
    background: #03080b;
  }
  .drawing {
    overflow: hidden;
    touch-action: none;
  }
  .pan-surface {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .map-plane {
    position: relative;
    flex-shrink: 0;
  }
  .zoom-controls {
    position: absolute;
    bottom: 0.8rem;
    left: 0.8rem;
    display: flex;
    align-items: center;
    border: 1px solid #4c4940;
    border-radius: 5px;
    background: #141b20;
    box-shadow: 0 5px 25px #0009;
    overflow: hidden;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    color: #edf1ee;
    font-size: 1.15rem;
    padding: 0.5rem;
  }
  button:hover {
    background: #303328;
    color: #e5c57a;
  }
  button:disabled {
    opacity: 0.35;
  }
  .reset {
    min-width: 90px;
    font-size: 0.75rem;
    border-inline: 1px solid #343e43;
  }
  .reset span {
    margin-left: 0.5rem;
  }
  @media (max-width: 700px) {
    .zoom-controls {
      top: 0.5rem;
      bottom: auto;
      left: auto;
      right: 0.5rem;
    }
  }
</style>
