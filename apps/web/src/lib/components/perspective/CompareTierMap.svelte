<script lang="ts">
  import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte'
  import { t } from '$lib/i18n'

  interface CompareMarker {
    id: string
    subjectId: string
    label: string
    tier: string | null
    x: number
    y: number
    certainty: string
    code: '=' | '←' | '→' | '≠' | '~' | '⏱'
    selected?: boolean
  }

  let {
    title,
    tier,
    zoom,
    focusX = 500,
    focusY = 300,
    snapKey = 0,
    markers,
    onSelect,
  }: {
    title: string
    tier: string
    zoom: number
    focusX?: number
    focusY?: number
    snapKey?: number
    markers: CompareMarker[]
    onSelect?: (subjectId: string) => void
  } = $props()

  let markerLayer = $derived(markers.filter((marker) => marker.tier === tier))
  let transform = $derived(
    `translate(calc(50% - ${focusX * zoom}px), calc(50% - ${focusY * zoom}px)) scale(${zoom})`,
  )
  let snapActive = $state(false)

  $effect(() => {
    if (!snapKey) return

    snapActive = true
    const timer = setTimeout(() => {
      snapActive = false
    }, 320)

    return () => clearTimeout(timer)
  })
</script>

<section class="pane" aria-label={title}>
  <header>{title}</header>
  <div class="viewport">
    <div class="scene" class:snap={snapActive} style:transform>
      <div class="map-root">
        <BlackWhaleOverview />
      </div>

      <div class="overlay">
        {#each markerLayer as marker (marker.id)}
          <button
            type="button"
            class="dot"
            class:selected={marker.selected}
            style={`left:${marker.x}px;top:${marker.y}px`}
            onclick={() => onSelect?.(marker.subjectId)}
            aria-label={$t.perspectiveUi.markerAria(marker.label, marker.certainty)}
          >
            <span class="code">{marker.code}</span>
            <span>{marker.label}</span>
          </button>
        {/each}
      </div>

      {#if snapActive}
        <div class="snap-ring" aria-hidden="true"></div>
      {/if}
    </div>

    <aside class="legend" aria-label={$t.perspectiveUi.legendLabel}>
      <h3>{$t.perspectiveUi.codes}</h3>
      <p><strong>=</strong> {$t.perspectiveUi.codeLegend.same}</p>
      <p><strong>←</strong> {$t.perspectiveUi.codeLegend.leftOnly}</p>
      <p><strong>→</strong> {$t.perspectiveUi.codeLegend.rightOnly}</p>
      <p><strong>≠</strong> {$t.perspectiveUi.codeLegend.contradiction}</p>
      <p><strong>~</strong> {$t.perspectiveUi.codeLegend.confidenceGap}</p>
      <p><strong>⏱</strong> {$t.perspectiveUi.codeLegend.temporal}</p>
    </aside>
  </div>
</section>

<style>
  .pane {
    border: 1px solid var(--line);
    border-radius: 0.72rem;
    overflow: hidden;
    background: color-mix(in srgb, var(--panel) 88%, #0e1622 12%);
  }

  header {
    padding: 0.5rem 0.72rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 74%, #8ba7a1 26%);
  }

  .viewport {
    position: relative;
    height: 22rem;
    overflow: hidden;
    background: #05090f;
  }

  .scene {
    position: absolute;
    left: 0;
    top: 0;
    width: 1000px;
    height: 700px;
    transform-origin: 0 0;
    will-change: transform;
    transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .map-root {
    width: 1000px;
    height: 700px;
  }

  .overlay {
    position: absolute;
    inset: 0;
  }

  .dot {
    position: absolute;
    transform: translate(-50%, -50%);
    border: 1px solid color-mix(in srgb, var(--line) 60%, #f8f4e3 30%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 58%, #102332 42%);
    color: var(--ink);
    padding: 0.2rem 0.48rem;
    font-size: 0.64rem;
    max-width: 8.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dot.selected {
    border-color: var(--state-transferred);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--state-transferred) 45%, transparent);
  }

  .code {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    font-size: 0.7rem;
    line-height: 1;
    border: 1px solid color-mix(in srgb, var(--line) 70%, #9dbec0 30%);
    background: color-mix(in srgb, var(--panel) 42%, #22404a 58%);
  }

  .dot span {
    pointer-events: none;
  }

  .scene.snap {
    transition-duration: 360ms;
  }

  .snap-ring {
    position: absolute;
    left: calc(50% - 0.9rem);
    top: calc(50% - 0.9rem);
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 999px;
    border: 2px solid color-mix(in srgb, var(--state-transferred) 70%, #f6f6f6 30%);
    box-shadow: 0 0 1.2rem color-mix(in srgb, var(--state-transferred) 55%, transparent);
    animation: pulse-center 320ms ease-out;
    pointer-events: none;
  }

  .legend {
    position: absolute;
    right: 0.65rem;
    bottom: 0.65rem;
    background: color-mix(in srgb, var(--panel) 72%, #0a1320 28%);
    border: 1px solid color-mix(in srgb, var(--line) 60%, #8fb3b4 40%);
    border-radius: 0.55rem;
    padding: 0.45rem 0.55rem;
    font-size: 0.64rem;
    line-height: 1.35;
    max-width: 13rem;
  }

  .legend h3 {
    margin: 0 0 0.25rem;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 78%, #92acad 22%);
  }

  .legend p {
    margin: 0;
    color: color-mix(in srgb, var(--ink) 88%, #9ab7b8 12%);
  }

  @keyframes pulse-center {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    55% {
      opacity: 1;
      transform: scale(1.15);
    }
    100% {
      opacity: 0;
      transform: scale(1.4);
    }
  }

  @media (max-width: 800px) {
    .viewport {
      height: 16rem;
    }

    .legend {
      max-width: 10.8rem;
      font-size: 0.6rem;
    }
  }
</style>
