<script lang="ts">
  import { t } from '$lib/i18n'
  import panzoom from 'panzoom'
  import { tick } from 'svelte'
  import { mapState } from '$lib/state/mapState.svelte'
  import { getMapAsset, resolveMapAssetKey } from '$lib/map/mapAssetRegistry'
  import MapOverlay from './MapOverlay.svelte'

  let containerEl: HTMLElement | undefined = $state()
  let pz: any
  let zoomPercent = $state(100)

  function syncZoom() {
    if (!pz) return
    zoomPercent = Math.round(pz.getTransform().scale * 100)
  }

  function zoomBy(factor: number) {
    if (!pz || !containerEl) return
    pz.smoothZoom(containerEl.clientWidth / 2, containerEl.clientHeight / 2, factor)
    window.setTimeout(syncZoom, 180)
  }

  function resetView() {
    if (!pz) return
    pz.moveTo(0, 0)
    pz.zoomAbs(0, 0, 1)
    zoomPercent = 100
  }

  function handleMapKeydown(event: KeyboardEvent) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomBy(1.25)
    } else if (event.key === '-') {
      event.preventDefault()
      zoomBy(0.8)
    } else if (event.key === '0') {
      event.preventDefault()
      resetView()
    }
  }

  $effect(() => {
    if (containerEl) {
      pz = panzoom(containerEl, {
        maxZoom: 5,
        minZoom: 0.5,
        bounds: true,
        boundsPadding: 0.1,
      })
      pz.on('zoom', syncZoom)
      pz.on('transform', syncZoom)

      return () => {
        pz.dispose()
      }
    }
  })

  // Re-center or adjust zoom when level changes
  $effect(() => {
    if (pz && mapState.currentZoomLevel) {
      resetView()
    }
  })

  // Follow the selected observer after the perspective overlay has rendered.
  // The physical target stays the same across modes; the marker label switches
  // between consciousness, body and public appearance.
  $effect(() => {
    const perspectiveId = mapState.selectedPerspectiveId
    const perspectiveKind = mapState.selectedPerspectiveKind
    const followMode = mapState.followMode
    const zoomLevel = mapState.currentZoomLevel

    if (!pz || !containerEl) return

    if (perspectiveKind === 'reader') {
      pz.moveTo(0, 0)
      pz.zoomAbs(0, 0, 1)
      return
    }

    void tick().then(() => {
      if (
        !containerEl ||
        mapState.selectedPerspectiveId !== perspectiveId ||
        mapState.followMode !== followMode
      )
        return
      const marker = containerEl.querySelector<HTMLElement>('[data-follow-target="true"]')
      if (!marker) return

      const transform = pz.getTransform()
      const scale = Math.max(transform.scale, zoomLevel === 'OVERVIEW' ? 1.2 : 1)
      const markerLayer = marker.offsetParent as HTMLElement | null
      const markerX = marker.offsetLeft + (markerLayer?.offsetLeft || 0)
      const markerY = marker.offsetTop + (markerLayer?.offsetTop || 0)
      pz.zoomAbs(0, 0, scale)
      pz.moveTo(
        containerEl.clientWidth / 2 - markerX * scale,
        containerEl.clientHeight / 2 - markerY * scale,
      )
    })
  })

  let isLocalZoom = $derived(mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId)
  let mapAssetKey = $derived(
    resolveMapAssetKey(
      mapState.currentZoomLevel,
      mapState.selectedTier,
      mapState.selectedLocationId,
    ),
  )
  let MapAsset = $derived(getMapAsset(mapAssetKey))
  let hasDetailedMap = $derived(Boolean(isLocalZoom && MapAsset))
  let selectedLocationLabel = $derived(
    (mapState.selectedLocationId || $t.mapUi.unmappedArea).replaceAll('-', ' '),
  )
</script>

<div class="map-frame" role="region" aria-label={$t.mapUi.regionLabel}>
  <!-- Panzoom target -->
  <div bind:this={containerEl} class="relative w-full h-full transform-origin-top-left">
    <!-- SVG Map Render -->
    {#if MapAsset}
      <MapAsset />
    {:else if isLocalZoom}
      <section class="cartographic-gap" aria-live="polite">
        <div class="gap-mark" aria-hidden="true"><span></span><i></i></div>
        <p>{$t.mapUi.gapEyebrow}</p>
        <h2 class="capitalize">{selectedLocationLabel}</h2>
        <span>{$t.mapUi.gapCopy}</span>
        <button type="button" onclick={() => mapState.selectLocation(null)}
          >{$t.mapUi.returnToTierMap}</button
        >
      </section>
    {:else}
      <!-- Fallback for other tiers -->
      <div class="flex items-center justify-center w-full h-full text-[#FFFFF0]">
        <h2>{$t.mapUi.mapNotFound(mapState.selectedTier ?? '')}</h2>
      </div>
    {/if}

    {#if isLocalZoom && hasDetailedMap}
      <button
        class="absolute top-4 left-4 px-3 py-1 bg-[#1a202c] text-[#e2e8f0] border border-[#4a5568] rounded shadow hover:bg-[#2d3748] z-10 font-bold pointer-events-auto"
        onclick={() => mapState.selectLocation(null)}
      >
        {$t.mapUi.backToTier}
      </button>
    {/if}

    {#if MapAsset && mapState.currentZoomLevel !== 'OVERVIEW'}
      <p class="canon-note" title={$t.mapUi.canonNoteTitle}>
        {$t.mapUi.canonNote}
      </p>
    {/if}

    <!-- Dynamic Overlay for characters -->
    <MapOverlay />
  </div>

  <div class="zoom-controls" data-hatsu-pass aria-label={$t.mapUi.zoomControls}>
    <button
      type="button"
      onclick={() => zoomBy(1.25)}
      onkeydown={handleMapKeydown}
      aria-label={$t.mapUi.zoomIn}>+</button
    >
    <span aria-live="polite">{zoomPercent}%</span>
    <button
      type="button"
      onclick={() => zoomBy(0.8)}
      onkeydown={handleMapKeydown}
      aria-label={$t.mapUi.zoomOut}>−</button
    >
    <button
      class="reset"
      type="button"
      onclick={resetView}
      onkeydown={handleMapKeydown}
      aria-label={$t.mapUi.resetView}>⌖</button
    >
  </div>

  <div class="keyboard-hint" aria-hidden="true">
    <kbd>+</kbd><kbd>−</kbd>
    {$t.mapUi.keyboardZoom} <kbd>0</kbd>
    {$t.mapUi.keyboardReset}
  </div>
</div>

<style>
  .map-frame {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid rgba(83, 105, 113, 0.28);
    border-radius: 0.65rem;
    background: #080c10;
  }
  .zoom-controls {
    position: absolute;
    z-index: 20;
    top: 1rem;
    right: 1rem;
    display: grid;
    grid-template-columns: 2rem 3.4rem 2rem 2rem;
    align-items: center;
    overflow: hidden;
    border: 1px solid rgba(101, 126, 133, 0.35);
    border-radius: 0.45rem;
    background: rgba(8, 14, 18, 0.9);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
  }
  .zoom-controls button {
    display: grid;
    height: 2rem;
    place-items: center;
    border: 0;
    border-right: 1px solid rgba(101, 126, 133, 0.2);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .zoom-controls button:hover {
    background: rgba(200, 169, 86, 0.1);
    color: var(--accent-gold-bright);
  }
  .zoom-controls span {
    color: var(--text-muted);
    font: 0.5rem/1 var(--font-mono);
    text-align: center;
  }
  .zoom-controls .reset {
    border-right: 0;
    border-left: 1px solid rgba(101, 126, 133, 0.2);
    color: var(--accent-gold);
  }
  .keyboard-hint {
    position: absolute;
    z-index: 15;
    right: 1rem;
    bottom: 1rem;
    color: var(--text-faint);
    font: 0.48rem/1 var(--font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .canon-note {
    position: absolute;
    z-index: 15;
    top: 3.55rem;
    left: 1rem;
    margin: 0;
    padding: 0.34rem 0.48rem;
    border: 1px solid rgba(200, 169, 86, 0.28);
    border-radius: 0.25rem;
    background: rgba(8, 14, 18, 0.86);
    color: var(--text-muted);
    font: 0.46rem/1 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
  }
  .keyboard-hint kbd {
    display: inline-grid;
    min-width: 1rem;
    height: 1rem;
    margin: 0 0.15rem;
    place-items: center;
    border: 1px solid rgba(101, 126, 133, 0.3);
    border-radius: 0.2rem;
    background: rgba(8, 14, 18, 0.75);
    color: var(--text-secondary);
  }
  .cartographic-gap {
    position: absolute;
    inset: 0;
    display: grid;
    max-width: 32rem;
    height: fit-content;
    margin: auto;
    justify-items: center;
    padding: 2rem;
    color: var(--text-secondary);
    text-align: center;
  }
  .cartographic-gap .gap-mark {
    position: relative;
    width: 5rem;
    height: 5rem;
    margin-bottom: 1.4rem;
    border: 1px dashed rgba(200, 169, 86, 0.35);
    border-radius: 50%;
  }
  .gap-mark::before,
  .gap-mark::after {
    position: absolute;
    inset: 50% 12%;
    height: 1px;
    background: rgba(200, 169, 86, 0.24);
    content: '';
  }
  .gap-mark::after {
    transform: rotate(90deg);
  }
  .gap-mark span {
    position: absolute;
    inset: 30%;
    border: 1px solid var(--accent-gold);
    border-radius: 50%;
  }
  .gap-mark i {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: var(--accent-gold-bright);
    box-shadow: 0 0 12px var(--accent-gold-glow);
    transform: translate(-50%, -50%);
  }
  .cartographic-gap p {
    margin: 0 0 0.6rem;
    color: var(--accent-gold);
    font: 0.52rem/1 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .cartographic-gap h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 2rem;
  }
  .cartographic-gap > span {
    max-width: 27rem;
    margin-top: 0.7rem;
    color: var(--text-muted);
    font-size: 0.72rem;
    line-height: 1.6;
  }
  .cartographic-gap button {
    margin-top: 1.4rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.35rem;
    background: rgba(200, 169, 86, 0.08);
    color: var(--accent-gold-bright);
    font-size: 0.65rem;
    cursor: pointer;
  }
  @media (max-width: 720px) {
    .keyboard-hint {
      display: none;
    }
    .zoom-controls {
      top: 0.65rem;
      right: 0.65rem;
    }
  }
</style>
