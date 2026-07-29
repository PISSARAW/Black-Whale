<script lang="ts">
  /**
   * A plan view of the deck being walked, drawn straight from the same
   * footprints as the 3D geometry. It is a read-out of the tour, not a second
   * map: it shares no code with `/ship` and carries no passengers.
   */
  import type { TierPlan } from '$lib/tour/blueprint'
  import type { Space, Vec2 } from '$lib/tour/types'

  interface Props {
    plan: TierPlan
    position: Vec2
    /** Facing, in radians, matching the camera's yaw. */
    heading: number
    currentSpaceId: string | null
    label: string
    onSelect?: (space: Space) => void
  }

  let { plan, position, heading, currentSpaceId, label, onSelect }: Props = $props()

  const PADDING = 20

  const bounds = $derived.by(() => {
    const points = [...plan.tier.hull, ...plan.spaces.flatMap((space) => space.footprint)]
    const xs = points.map((point) => point[0])
    const zs = points.map((point) => point[1])
    const minX = Math.min(...xs) - PADDING
    const minZ = Math.min(...zs) - PADDING
    return {
      minX,
      minZ,
      width: Math.max(...xs) - minX + PADDING,
      height: Math.max(...zs) - minZ + PADDING,
    }
  })

  const path = (points: readonly Vec2[]) =>
    points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ') +
    ' Z'

  const fillFor = (space: Space) => {
    if (space.id === currentSpaceId) return '#FFD700'
    if (space.provenance === 'inferred') return '#2b3a4a'
    if (space.provenance === 'panel') return '#4a3320'
    return '#2a1f1f'
  }

  // The camera looks along (-sin, -cos); the cone on the map has to agree.
  const cone = $derived.by(() => {
    const spread = 0.5
    const reach = Math.max(bounds.width, bounds.height) * 0.05
    const arm = (offset: number): Vec2 => [
      position[0] - Math.sin(heading + offset) * reach,
      position[1] - Math.cos(heading + offset) * reach,
    ]
    return path([position, arm(-spread), arm(spread)])
  })
</script>

<figure class="rounded-lg border border-[#333] bg-[#050505]/90 p-2">
  <figcaption class="px-1 pb-1 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {label}
  </figcaption>
  <svg
    viewBox="{bounds.minX} {bounds.minZ} {bounds.width} {bounds.height}"
    class="h-full w-full"
    role="img"
    aria-label={label}
  >
    <path d={path(plan.tier.hull)} fill="#0d0808" stroke="#FFD700" stroke-width="2" />

    {#each plan.spaces as space (space.id)}
      {#if onSelect}
        <path
          d={path(space.footprint)}
          fill={fillFor(space)}
          stroke="#FFFFF0"
          stroke-width="0.8"
          opacity={space.id === currentSpaceId ? 1 : 0.75}
          class="cursor-pointer transition-opacity hover:opacity-100"
          role="button"
          tabindex="0"
          aria-label={space.name}
          onclick={() => onSelect?.(space)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect?.(space)
            }
          }}
        />
      {:else}
        <path
          d={path(space.footprint)}
          fill={fillFor(space)}
          stroke="#FFFFF0"
          stroke-width="0.8"
          opacity="0.75"
        />
      {/if}
    {/each}

    <path d={cone} fill="#FFFFF0" opacity="0.55" />
    <circle cx={position[0]} cy={position[1]} r="4" fill="#FFFFF0" />
  </svg>
</figure>
