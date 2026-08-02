<script lang="ts">
  import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte'

  type ReconstructionMarker = {
    id: string
    label: string
    tierId: string
    locationLabel: string | null
    certainty: 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'
    precision: 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'
    active: boolean
    change: 'arrived' | 'moved' | 'departed' | 'unchanged'
  }

  // Kept in the overview's own coordinate system. The section-map tests guard
  // the source drawing; these bands only determine how labels fan out inside it.
  const tierOverviewY: Record<string, number> = {
    'tier-1': 32.3,
    'tier-1-b': 28.8,
    'tier-1-c': 27.4,
    'tier-2': 45.1,
    'tier-3': 58.2,
    'tier-3-b': 54.9,
    'tier-3-c': 53.5,
    'tier-4': 71.1,
    'tier-4-b': 68,
    'tier-5': 83.8,
    'tier-5-b': 78.7,
  }
  const tierOverviewSpan: Record<string, [number, number]> = {
    'tier-1': [12.8, 72.9],
    'tier-1-b': [28.8, 72.9],
    'tier-1-c': [28.8, 63.5],
    'tier-2': [8.6, 77.1],
    'tier-3': [4.4, 81.2],
    'tier-3-b': [4.4, 81.2],
    'tier-3-c': [4.4, 81.2],
    'tier-4': [5, 80.5],
    'tier-4-b': [5, 80.5],
    'tier-5': [7.7, 70.7],
    'tier-5-b': [7.7, 70.7],
  }
  const tierOverviewBand: Record<string, number> = {
    'tier-1': 2,
    'tier-1-b': 1.2,
    'tier-1-c': 1.2,
    'tier-2': 2,
    'tier-3': 2.4,
    'tier-3-b': 1.2,
    'tier-3-c': 1.2,
    'tier-4': 1.8,
    'tier-4-b': 1.2,
    'tier-5': 1.8,
    'tier-5-b': 1.8,
  }

  let {
    markers,
    selectedId = null,
    onSelect,
  }: {
    markers: ReconstructionMarker[]
    selectedId?: string | null
    onSelect?: (id: string) => void
  } = $props()

  let positioned = $derived.by(() => {
    const grouped: Record<string, ReconstructionMarker[]> = {}
    for (const marker of markers) {
      const group = grouped[marker.tierId] ?? []
      group.push(marker)
      grouped[marker.tierId] = group
    }

    return markers.map((marker) => {
      const peers = (grouped[marker.tierId] ?? []).sort((a, b) => a.id.localeCompare(b.id))
      const index = peers.findIndex((peer) => peer.id === marker.id)
      const [start, end] = tierOverviewSpan[marker.tierId] ?? [12, 78]
      const columns = Math.max(1, Math.min(12, peers.length))
      const rows = Math.ceil(peers.length / columns)
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = columns === 1 ? (start + end) / 2 : start + ((end - start) * column) / (columns - 1)
      const band = tierOverviewBand[marker.tierId] ?? 2
      const y = (tierOverviewY[marker.tierId] ?? 46) + (row - (rows - 1) / 2) * band
      return { ...marker, x, y }
    })
  })
</script>

<div class="overview">
  <div class="map"><BlackWhaleOverview /></div>
  <div class="markers">
    {#each positioned as marker (marker.id)}
      <button
        type="button"
        class="marker"
        class:active={marker.active}
        class:selected={marker.id === selectedId}
        data-certainty={marker.certainty}
        data-precision={marker.precision}
        data-change={marker.change}
        style={`left:${marker.x}%;top:${marker.y}%`}
        title={marker.locationLabel ?? marker.label}
        aria-label={`${marker.label}${marker.locationLabel ? ` — ${marker.locationLabel}` : ''}`}
        onclick={() => onSelect?.(marker.id)}
      >
        <span class="pulse"></span>
        <span class="name">{marker.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .overview {
    position: relative;
    width: 100%;
    aspect-ratio: 10 / 7;
    min-height: 25rem;
    overflow: hidden;
    background: radial-gradient(circle at 45% 42%, rgba(34, 63, 72, 0.2), transparent 44%), #030608;
  }

  .map,
  .markers {
    position: absolute;
    inset: 0;
  }

  .map :global(svg) {
    width: 100%;
    height: 100%;
  }

  .marker {
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    transform: translate(-50%, -50%);
    max-width: 8.5rem;
    border: 1px solid rgba(144, 174, 178, 0.5);
    border-radius: 999px;
    background: rgba(7, 16, 20, 0.9);
    padding: 0.18rem 0.42rem 0.18rem 0.24rem;
    color: rgba(238, 244, 242, 0.86);
    font-size: 0.62rem;
    line-height: 1;
    box-shadow: 0 0.15rem 0.7rem rgba(0, 0, 0, 0.45);
    transition:
      border-color 160ms ease,
      background 160ms ease,
      transform 160ms ease;
  }

  .marker:hover,
  .marker:focus-visible,
  .marker.selected {
    z-index: 4;
    transform: translate(-50%, -50%) scale(1.08);
    border-color: #e5c57a;
    background: rgba(24, 29, 27, 0.96);
  }

  .marker[data-certainty='PROBABLE'] {
    border-style: dashed;
  }
  .marker[data-certainty='LAST_KNOWN'] {
    border-style: dotted;
    opacity: 0.72;
  }
  .marker[data-precision='TIER'],
  .marker[data-precision='ZONE'] {
    background: rgba(13, 26, 32, 0.84);
  }
  .marker[data-change='arrived'] {
    border-color: #78c6a3;
  }
  .marker[data-change='moved'] {
    border-color: #e5c57a;
    box-shadow: 0 0 0.8rem rgba(229, 197, 122, 0.22);
  }
  .marker[data-change='departed'] {
    border-color: #cf806c;
    opacity: 0.46;
    text-decoration: line-through;
  }

  .pulse {
    width: 0.42rem;
    height: 0.42rem;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #6faeb2;
  }

  .marker.active .pulse {
    background: #e5c57a;
    box-shadow: 0 0 0 0.2rem rgba(229, 197, 122, 0.2);
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .overview {
      min-height: 20rem;
    }
    .name {
      display: none;
    }
    .marker {
      padding: 0.28rem;
    }
  }
</style>
