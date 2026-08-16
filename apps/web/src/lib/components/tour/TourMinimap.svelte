<script lang="ts">
  /**
   * A plan view of the deck being walked, drawn straight from the same
   * footprints as the 3D geometry. It is a read-out of the tour, not a second
   * map: it shares no code with `/ship` and carries no passengers.
   *
   * It does share the drawing convention, though, because it is the same ship.
   * The deck maps of `/ship` are generated from this blueprint by
   * `scripts/generate-deck-maps.py`, and a visitor arriving from them should
   * recognise the deck under their feet: rooms in maroon on bone, circulation
   * dashed and nearly unlit, invented spaces in cold slate, the hull in gold,
   * and a name on every room wide enough to hold one.
   *
   * Where it departs is scale. `/ship` draws a fixed 1000 x 600 frame, one unit
   * to 0.35 m, and can set stroke widths and type sizes against it; this frames
   * whatever level is being walked — a whole deck, or the inside of one
   * apartment — so the same numbers are expressed in `unit`, the width of one
   * `/ship` plan unit in this view. A wall then reads at the same weight on a
   * deck and in a bedroom.
   */
  import type { Crossing, TierPlan } from '$lib/tour/blueprint'
  import type { Space, Tier, Vec2 } from '$lib/tour/types'

  interface Props {
    plan: TierPlan
    position: Vec2
    /** Facing, in radians, matching the camera's yaw. */
    heading: number
    currentSpaceId: string | null
    label: string
    /**
     * The stairs, lifts, bulkheads and interior doors that touch this level,
     * already placed in its coordinates by `crossingsOn`.
     */
    crossings?: Crossing[]
    /** The name to write on a room, in the language being read. */
    nameOf?: (space: Space | Tier | undefined) => string
    onSelect?: (space: Space) => void
    /**
     * What clicking a room does, in words: the plan travels while the visitor is
     * empty-handed and aims while a technique is up, and the two must not read
     * the same. One verb per widget.
     */
    selectLabel?: (room: string) => string
    /** What a crossing is called, for the marker's tooltip and its label. */
    crossingLabel?: (crossing: Crossing) => string
    /** Whether a technique is up, so the plan says it is aiming rather than going. */
    aiming?: boolean
    /**
     * Take the height offered rather than the one the drawing implies. The plan
     * in the column sizes itself; the full-screen one fills the dialog.
     */
    fill?: boolean
  }

  let {
    plan,
    position,
    heading,
    currentSpaceId,
    label,
    crossings = [],
    nameOf = (space) => {
      if (!space) return ''
      return space.name
    },
    onSelect,
    selectLabel = (room) => room,
    crossingLabel = () => '',
    aiming = false,
    fill = false,
  }: Props = $props()

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

  /**
   * One `/ship` plan unit, in metres, for a view of this size: the deck maps
   * are 1000 x 600 and this is `bounds`, so everything they set in plan units —
   * a 4-unit hull, a 1.5-unit wall, 12-point type — carries across unchanged.
   */
  const unit = $derived(Math.max(bounds.width / 1000, bounds.height / 600))

  const path = (points: readonly Vec2[]) =>
    points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ') +
    ' Z'

  /**
   * Circulation first, so the rooms it runs between are drawn over it — the
   * order `generate-deck-maps.py` writes the deck maps in.
   */
  const ordered = $derived(
    [...plan.spaces].sort(
      (a, b) => Number(a.category !== 'corridor') - Number(b.category !== 'corridor'),
    ),
  )

  const centroid = (footprint: readonly Vec2[]): Vec2 => {
    let area = 0
    let cx = 0
    let cz = 0
    for (let i = 0; i < footprint.length; i++) {
      const [x0, z0] = footprint[i]
      const [x1, z1] = footprint[(i + 1) % footprint.length]
      const cross = x0 * z1 - x1 * z0
      area += cross
      cx += (x0 + x1) * cross
      cz += (z0 + z1) * cross
    }
    area *= 0.5
    return area ? [cx / (6 * area), cz / (6 * area)] : [footprint[0][0], footprint[0][1]]
  }

  interface Caption {
    id: string
    text: string
    at: Vec2
    size: number
    turned: boolean
  }

  /**
   * A name only where it fits, by the rule the deck maps use: 6.5 plan units a
   * character across, 16 down, and a room taller than it is wide takes its name
   * on its side. A room too small for 9-point type goes unnamed rather than
   * spilling over its neighbours — the walk names it in the panel anyway.
   */
  const captions = $derived.by(() =>
    plan.spaces.reduce<Caption[]>((named, space) => {
      const text = nameOf(space)
      const xs = space.footprint.map((point) => point[0] / unit)
      const zs = space.footprint.map((point) => point[1] / unit)
      const width = Math.max(...xs) - Math.min(...xs)
      const height = Math.max(...zs) - Math.min(...zs)

      let size = width > text.length * 6.5 && height > 16 ? 12 : 0
      if (!size && width > text.length * 5 && height > 12) size = 9
      let turned = false
      if (!size && height > width) {
        size = height > text.length * 6.5 && width > 16 ? 12 : 0
        if (!size && height > text.length * 5 && width > 12) size = 9
        turned = Boolean(size)
      }
      if (!size) return named

      const [cx, cz] = centroid(space.footprint)
      named.push({
        id: space.id,
        text,
        at: [cx, cz + (size * unit) / 3],
        size: size * unit,
        turned,
      })
      return named
    }, []),
  )

  /**
   * How far up or down a crossing has to go before it is drawn as going up or
   * down. An interior sits at its deck's elevation, so its door is level.
   */
  const RISE = 0.5

  /**
   * The marker a crossing gets: up, down, or a threshold on the level.
   *
   * Three glyphs and no words, because the marker is 16 plan units across and
   * has to survive being drawn at a third of a millimetre in the column and at
   * a centimetre in the full-screen plan.
   */
  const glyphOf = (crossing: Crossing) =>
    crossing.rise > RISE ? '▲' : crossing.rise < -RISE ? '▼' : '◈'

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

<figure
  class="rounded-lg border border-[#333] bg-[#050505]/90 p-2 {fill ? 'flex h-full flex-col' : ''}"
>
  <figcaption class="px-1 pb-1 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {label}
  </figcaption>
  <svg
    viewBox="{bounds.minX} {bounds.minZ} {bounds.width} {bounds.height}"
    class="w-full {fill ? 'min-h-0 flex-1' : 'h-full'}"
    class:aiming
    style="--unit: {unit}"
    role="img"
    aria-label={label}
  >
    <path class="hull" d={path(plan.tier.hull)} />

    {#each ordered as space (space.id)}
      {#if onSelect}
        <path
          d={path(space.footprint)}
          class="zone clickable"
          class:through={space.category === 'corridor'}
          class:inferred={space.provenance === 'inferred'}
          class:selected={space.id === currentSpaceId}
          role="button"
          tabindex="0"
          aria-label={selectLabel(nameOf(space))}
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
          class="zone"
          class:through={space.category === 'corridor'}
          class:inferred={space.provenance === 'inferred'}
          class:selected={space.id === currentSpaceId}
        />
      {/if}
    {/each}

    <!-- The openings, drawn over the walls they were cut out of. A doorway is
         derived from a shared wall and so exists nowhere in the blueprint to
         read off; the plan is where it becomes visible, and "where is the door"
         is the question a plan is for. -->
    {#each plan.doorways as door (`${door.a}|${door.b}|${door.start[0]}|${door.start[1]}`)}
      <line
        class="doorway"
        x1={door.start[0]}
        y1={door.start[1]}
        x2={door.end[0]}
        y2={door.end[1]}
      />
    {/each}

    {#each captions as caption (caption.id)}
      <text
        class="label"
        x={caption.at[0]}
        y={caption.at[1]}
        font-size={caption.size}
        transform={caption.turned ? `rotate(-90 ${caption.at[0]} ${caption.at[1]})` : ''}
        >{caption.text}</text
      >
    {/each}

    <!-- The four stairwells, the bulkhead and the doors into the interiors. Over
         the legends on purpose: a name you cannot read is worth less than the
         only way off the deck. -->
    {#each crossings as crossing (`${crossing.link.from}|${crossing.link.to}`)}
      <g class="crossing">
        <title>{crossingLabel(crossing)}</title>
        <circle cx={crossing.at[0]} cy={crossing.at[1]} r={unit * 9} />
        <text x={crossing.at[0]} y={crossing.at[1] + unit * 4} font-size={unit * 12}>
          {glyphOf(crossing)}
        </text>
      </g>
    {/each}

    <path d={cone} fill="#FFFFF0" opacity="0.55" />
    <circle cx={position[0]} cy={position[1]} r={unit * 5} fill="#FFFFF0" />
  </svg>
</figure>

<style>
  /* The deck-plan convention of `/ship`, in plan units of this view. */
  .hull {
    fill: #1a0f0f;
    stroke: #ffd700;
    stroke-width: calc(var(--unit) * 4);
  }
  .zone {
    fill: #2a1515;
    stroke: #fffff0;
    stroke-width: calc(var(--unit) * 1.5);
    transition: fill 0.2s;
  }
  .zone.clickable {
    cursor: pointer;
  }
  .zone.clickable:hover {
    fill: #3d1c1c;
  }
  /* Aiming is not travelling, so the plan does not glow gold for it. */
  .aiming .zone.clickable:hover {
    fill: #2a2536;
    stroke: #c6b3ff;
  }
  .zone.through {
    fill: #150b0b;
    stroke: #ffd700;
    stroke-opacity: 0.35;
    stroke-width: var(--unit);
    stroke-dasharray: calc(var(--unit) * 4) calc(var(--unit) * 4);
  }
  .zone.inferred {
    fill: #16171c;
    stroke: #9dc4e0;
    stroke-opacity: 0.4;
  }
  /* The room being stood in reads the way a selected region reads on `/ship`. */
  .zone.selected {
    fill: #4d2020;
    stroke: #ffd700;
    stroke-opacity: 1;
    stroke-width: calc(var(--unit) * 2.5);
    stroke-dasharray: none;
  }
  .label {
    fill: #fffff0;
    font-family: sans-serif;
    pointer-events: none;
    text-anchor: middle;
  }
  /* An opening reads as a gap in the wall: gold, and thicker than the wall it
     interrupts, which is how the deck maps of `/ship` mark the hull. */
  .doorway {
    stroke: #ffd700;
    stroke-width: calc(var(--unit) * 3);
    stroke-linecap: round;
    pointer-events: none;
  }
  .crossing {
    pointer-events: none;
  }
  .crossing circle {
    fill: #0b0b0b;
    stroke: #ffd700;
    stroke-width: calc(var(--unit) * 1.5);
  }
  .crossing text {
    fill: #ffd700;
    font-family: sans-serif;
    text-anchor: middle;
  }
</style>
