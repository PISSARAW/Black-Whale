<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'
  import type { ShipDeltaKind, ShipEventDelta } from '../../../routes/ship/shipDelta'
  import type { MapWorldState } from './markerProjection'
  import { calculatePresencePosition, tierOverviewY } from './markerProjection'

  let { delta, world }: { delta: ShipEventDelta[]; world: MapWorldState } = $props()
  const deltaKinds: ShipDeltaKind[] = ['moved', 'appeared', 'disappeared', 'dead']

  function point(entityId: string, locationId: string | null) {
    if (!locationId || mapState.currentZoomLevel === 'LOCAL') return null
    const presence = {
      id: `delta:${entityId}`,
      entityType: 'BODY' as const,
      entityId,
      locationId,
      fromEventId: '',
      precision: 'EXACT_ROOM' as const,
      certainty: 'CONFIRMED' as const,
    }
    const projected = calculatePresencePosition(
      presence,
      [...world.presences, presence],
      world.locations,
    )
    if (!projected.tierId) return null
    if (mapState.currentZoomLevel === 'TIER' && projected.tierId !== mapState.selectedTier)
      return null
    if (mapState.currentZoomLevel === 'OVERVIEW') {
      return { x: 50, y: tierOverviewY[projected.tierId] ?? 46 }
    }
    return { x: projected.x / 10, y: projected.y / 6 }
  }

  let movements = $derived(
    delta.map((change) => ({
      ...change,
      from: point(change.entityId, change.fromLocationId),
      to: point(change.entityId, change.toLocationId),
    })),
  )
</script>

<div class="delta-overlay" aria-label={$t.mapUi.eventChanges(delta.length)}>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <marker id="delta-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
        <path d="M0,0 L5,2.5 L0,5 Z" />
      </marker>
    </defs>
    {#each movements as movement (movement.entityId)}
      {#if movement.from && movement.to && movement.kind === 'moved'}
        <line x1={movement.from.x} y1={movement.from.y} x2={movement.to.x} y2={movement.to.y} />
      {/if}
      {#if movement.to}
        <circle
          class:arrival={movement.kind === 'appeared'}
          cx={movement.to.x}
          cy={movement.to.y}
          r="1.6"
        />
      {:else if movement.from}
        <circle class="departure" cx={movement.from.x} cy={movement.from.y} r="1.6" />
      {/if}
    {/each}
  </svg>
  <p>
    {#each deltaKinds as kind (kind)}
      {@const count = delta.filter((change) => change.kind === kind).length}
      {#if count}<span>{$t.mapUi.delta[kind]} {count}</span>{/if}
    {/each}
  </p>
</div>

<style>
  .delta-overlay {
    position: absolute;
    z-index: 4;
    inset: 0;
    pointer-events: none;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  line {
    stroke: #f2c75c;
    stroke-width: 0.45;
    stroke-dasharray: 1.2 1;
    vector-effect: non-scaling-stroke;
    marker-end: url(#delta-arrow);
    animation: trace 1.2s linear infinite;
  }
  marker path {
    fill: #f2c75c;
  }
  circle {
    fill: rgba(242, 199, 92, 0.25);
    stroke: #f2c75c;
    stroke-width: 0.45;
    vector-effect: non-scaling-stroke;
    animation: delta-pulse 1.4s ease-out infinite;
  }
  circle.arrival {
    stroke: #65d6a1;
  }
  circle.departure {
    stroke: #eb816c;
    stroke-dasharray: 1 1;
  }
  p {
    position: absolute;
    left: 0.65rem;
    bottom: 0.65rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0;
  }
  p span {
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    padding: 0.25rem 0.4rem;
    background: rgba(8, 14, 18, 0.88);
    color: var(--text-secondary);
    font: 0.5rem var(--font-mono);
    text-transform: uppercase;
  }
  @keyframes trace {
    to {
      stroke-dashoffset: -4;
    }
  }
  @keyframes delta-pulse {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.15;
      transform: scale(1.35);
      transform-origin: center;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    line,
    circle {
      animation: none;
    }
  }
</style>
