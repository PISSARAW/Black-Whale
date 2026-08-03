<script lang="ts">
  import type { Arena } from '$lib/hunt/arena'
  import { movementsIn, type Actor, type TelemetryEvent } from '$lib/hunt/telemetry'
  import { interiorPoint } from '$lib/tour/geometry'

  interface Props {
    arena: Arena
    log: TelemetryEvent[]
    roomName: (id: string | null) => string
    labels: { title: string; player: string; hunter: string; entered: string }
  }

  let { arena, log, roomName, labels }: Props = $props()
  const pad = 1
  let points = $derived(arena.spaces.flatMap((space) => space.footprint))
  let minX = $derived(Math.min(...points.map(([x]) => x)) - pad)
  let minZ = $derived(Math.min(...points.map(([, z]) => z)) - pad)
  let width = $derived(Math.max(...points.map(([x]) => x)) - minX + pad)
  let height = $derived(Math.max(...points.map(([, z]) => z)) - minZ + pad)

  const center = (id: string | null) => {
    const space = arena.spaces.find((candidate) => candidate.id === id)
    return space ? interiorPoint(space.footprint) : null
  }
  const route = (actor: Actor) =>
    movementsIn(log, actor)
      .map((event) => center(event.where))
      .filter((point): point is readonly [number, number] => point !== null)
      .map(([x, z]) => `${x},${z}`)
      .join(' ')
  const events = (actor: Actor) => movementsIn(log, actor)
</script>

<section class="mt-10" aria-labelledby="hunt-trajectory-title">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h3 id="hunt-trajectory-title" class="text-xs uppercase tracking-[0.35em] text-white/40">
      {labels.title}
    </h3>
    <div class="flex gap-4 text-xs text-white/55" aria-hidden="true">
      <span><span class="mr-1 text-sky-300">●</span>{labels.player}</span>
      <span><span class="mr-1 text-rose-300">◆</span>{labels.hunter}</span>
    </div>
  </div>

  <svg
    class="mt-4 max-h-72 w-full rounded-xl border border-white/10 bg-white/[0.025] p-3"
    viewBox={`${minX} ${minZ} ${width} ${height}`}
    role="img"
    aria-labelledby="hunt-trajectory-title hunt-trajectory-description"
  >
    <desc id="hunt-trajectory-description">
      {labels.player}: {events('player')
        .map((event) => roomName(event.where))
        .join(', ')}.
      {labels.hunter}: {events('hunter')
        .map((event) => roomName(event.where))
        .join(', ')}.
    </desc>
    {#each arena.spaces as space (space.id)}
      <polygon
        points={space.footprint.map(([x, z]) => `${x},${z}`).join(' ')}
        fill="rgba(255,255,255,.035)"
        stroke="rgba(255,255,255,.22)"
        stroke-width=".08"
      />
    {/each}
    {#if route('player')}
      <polyline
        points={route('player')}
        fill="none"
        stroke="rgb(125 211 252)"
        stroke-width=".18"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/if}
    {#if route('hunter')}
      <polyline
        points={route('hunter')}
        fill="none"
        stroke="rgb(253 164 175)"
        stroke-width=".18"
        stroke-dasharray=".35 .22"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/if}
    {#each events('player') as event, index (`player-${index}`)}
      {@const at = center(event.where)}
      {#if at}<circle cx={at[0]} cy={at[1]} r=".22" fill="rgb(125 211 252)" />{/if}
    {/each}
    {#each events('hunter') as event, index (`hunter-${index}`)}
      {@const at = center(event.where)}
      {#if at}
        <rect x={at[0] - 0.2} y={at[1] - 0.2} width=".4" height=".4" fill="rgb(253 164 175)" />
      {/if}
    {/each}
  </svg>

  <div class="sr-only">
    <h4>{labels.player}</h4>
    <ol>
      {#each events('player') as event}
        <li>{Math.floor(event.at)} s — {labels.entered} {roomName(event.where)}</li>
      {/each}
    </ol>
    <h4>{labels.hunter}</h4>
    <ol>
      {#each events('hunter') as event}
        <li>{Math.floor(event.at)} s — {labels.entered} {roomName(event.where)}</li>
      {/each}
    </ol>
  </div>
</section>
