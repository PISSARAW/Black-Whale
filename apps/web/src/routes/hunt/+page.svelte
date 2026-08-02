<script lang="ts">
  /**
   * The hunt: a game played inside the reconstruction, on its own route.
   *
   * It reads `lib/tour` and changes nothing in it (I7). `TourScene` walks the
   * body, collides it against the apartment's own bulkheads and reports where it
   * ended up; everything this page adds — the reservoir, the hunter, what either
   * of them can perceive — is simulated in `lib/hunt` at a fixed step and drawn
   * on top. Nothing here extends `blueprint.json` (I6): the arena is a selection
   * of eight rooms that are already in it.
   *
   * The loop is an accumulator on the frame callback rather than an interval:
   * the simulation must advance in fixed ticks whatever the display is doing,
   * and a tab left in the background must not come back owing four thousand of
   * them.
   */
  import { onDestroy, onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { theShip } from '$lib/tour/blueprint'
  import { EMPTY_WORLD } from '$lib/tour/hatsu'
  import { interiorPoint } from '$lib/tour/geometry'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import type { Space, Vec2 } from '$lib/tour/types'

  import { buildArena } from '$lib/hunt/arena'
  import { buildNavGraph, shortestPath } from '$lib/hunt/navmesh'
  import { HUNT_DT, huntIsOver, updateHunt, type HuntWorld } from '$lib/hunt/loop'
  import { huntReducer, initialHuntState, type HuntAction } from '$lib/hunt/state'
  import { BODY_ZONES, type BodyZone } from '$lib/hunt/duel/state'
  import { STRIKE_THRESHOLD } from '$lib/hunt/duel/ryu'
  import { liveOf } from '$lib/hunt/nen/placed'
  import { cuesFor } from '$lib/hunt/veil'
  import { sightings } from '$lib/hunt/sighting'
  import { floorOf } from '$lib/tour/blueprint'
  import { prefersReducedMotion } from '$lib/tour/comfort'
  import NenVeil from '$lib/components/hunt/NenVeil.svelte'
  import HuntHud from '$lib/components/hunt/HuntHud.svelte'
  import DuelPanel from '$lib/components/hunt/DuelPanel.svelte'
  import Debrief from '$lib/components/hunt/Debrief.svelte'
  import HuntActions from '$lib/components/hunt/HuntActions.svelte'
  import HuntBriefing from '$lib/components/hunt/HuntBriefing.svelte'

  const ship = theShip()
  const plan = ship.plans.get(buildArena().tierId)!
  const arena = buildArena()
  const graph = buildNavGraph(arena)
  const world: HuntWorld = { dt: HUNT_DT, arena, graph }

  /**
   * Player and hunter start as far apart as the apartment allows, and the room
   * to reach is the far one — measured on the doorway graph rather than in
   * metres, because what matters is how many rooms have to be crossed.
   */
  const opening = farthestApart()

  function farthestApart(): { from: Space; to: Space } {
    let best = { from: arena.spaces[0], to: arena.spaces[1], rooms: 0 }
    for (const from of arena.spaces) {
      for (const to of arena.spaces) {
        const rooms = shortestPath(graph, from.id, to.id)?.length ?? 0
        if (rooms > best.rooms) best = { from, to, rooms }
      }
    }
    return best
  }

  const nameOf = (space: Space | undefined) =>
    space ? ($locale === 'fr' ? space.nameFr : space.name) : ''
  const spaceById = (id: string | null) => arena.spaces.find((space) => space.id === id)
  const roomName = (id: string | null) => nameOf(spaceById(id))

  function freshGame() {
    return initialHuntState({
      playerAt: { position: interiorPoint(opening.from.footprint), spaceId: opening.from.id },
      hunterAt: { position: interiorPoint(opening.to.footprint), spaceId: opening.to.id },
      targetSpaceId: opening.to.id,
      seed: 0x5eed,
    })
  }

  let game = $state(freshGame())

  // Bound out of TourScene: the walk is its job, not this page's. Seeded from
  // the spawn rather than from `game`, which is where it came from anyway — the
  // binding takes over on the first frame.
  let position = $state<Vec2>(interiorPoint(opening.from.footprint))
  let heading = $state(0)
  let currentSpace = $state<Space | null>(null)
  let engaged = $state(false)
  let tierId = $state(arena.tierId)

  let inDuel = $derived(game.duel !== null)
  let finished = $derived(huntIsOver(game.outcome))

  // Read once, on mount: this drives whether the veil moves, and a visitor who
  // has asked for less movement should not have it re-decided mid-game.
  let calm = $state(false)
  let briefed = $state(false)

  /**
   * What the principles currently look like. Derived from the same state the
   * HUD reads, and from nothing else — see the note at the top of `veil.ts` for
   * why that constraint matters more than the effect does.
   */
  /**
   * The hunter's body. Handed to the scene as an ordinary apparition so the
   * walk's own depth test decides when he is visible: down the line of a
   * doorway, yes; through a bulkhead, no. Nothing here works that out.
   */
  let figures = $derived(
    sightings({
      hunter: game.hunter,
      tierId: arena.tierId,
      floor: floorOf(spaceById(game.hunter.spaceId) ?? arena.spaces[0], plan.tier),
      duel: game.duel,
    }),
  )

  let cues = $derived(
    cuesFor({
      echoes: game.echoes,
      nen: game.player.nen,
      at: game.player.position,
      heading: game.player.heading,
      duel: game.duel,
    }),
  )

  function send(action: HuntAction) {
    game = huntReducer(game, action)
  }

  let canSweep = $derived(game.player.nen === 'ten' && game.ledger.pool.available >= 15)
  let canLay = $derived(
    game.player.spaceId !== null && game.ledger.pool.available >= 25 && game.player.nen === 'ten',
  )
  let canTake = $derived(
    game.ledger.placements.some(
      (placement) => placement.state === 'set' && placement.spaceId === game.player.spaceId,
    ),
  )

  // ── Input ────────────────────────────────────────────────────────────────
  //
  // Every key here is one `TourScene` does not already spend on walking: it owns
  // WASD and ZQSD both, the arrows, Shift, Tab and E. Taking one of those back
  // would mean editing the tour, and the tour is not to be edited (I7).

  const HUNT_KEYS: Record<string, HuntAction> = {
    KeyF: { type: 'SWEEP' },
    KeyX: { type: 'ZETSU' },
    KeyV: { type: 'LAY' },
    KeyR: { type: 'TAKE' },
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!briefed || finished || event.repeat || event.metaKey || event.ctrlKey) return
    const handled = game.duel ? duelKey(event.code) : huntKey(event.code)
    if (handled) event.preventDefault()
  }

  function huntKey(code: string): boolean {
    const action = HUNT_KEYS[code]
    if (!action) return false
    send(action)
    return true
  }

  function duelKey(code: string): boolean {
    const zone = zoneFor(code)
    if (zone) return duel({ type: 'RYU', side: 'player', setting: { guard: zone } })

    switch (code) {
      case 'Minus':
        return shiftRyu(-0.15)
      case 'Equal':
        return shiftRyu(0.15)
      case 'KeyG':
        return duel({ type: 'GYO', side: 'player', on: !game.duel!.player.gyo })
      case 'KeyI':
        return duel({ type: 'IN', side: 'player', on: !game.duel!.player.in })
      case 'KeyK':
        return duel({ type: 'KEN', side: 'player', on: !game.duel!.player.ken })
      case 'KeyX':
        return duel({ type: 'ZETSU', on: !game.duel!.player.zetsu })
      case 'KeyR':
        send({ type: 'TAKE_IN_DUEL' })
        return true
      case 'Space':
        return strike()
      default:
        return false
    }
  }

  function zoneFor(code: string): BodyZone | null {
    const index = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code)
    return index === -1 ? null : BODY_ZONES[index]
  }

  function duel(action: Extract<HuntAction, { type: 'DUEL' }>['action']): boolean {
    send({ type: 'DUEL', action })
    return true
  }

  function shiftRyu(by: number): boolean {
    return duel({
      type: 'RYU',
      side: 'player',
      setting: { attack: game.duel!.player.attack + by },
    })
  }

  /**
   * Space gathers; the blow lands by itself when the wind-up is done. There is
   * no second key for throwing, because there is no decision left to make: from
   * the moment it is gathered, three of your zones are open and the other one
   * has under a second to notice.
   */
  function strike(): boolean {
    const player = game.duel!.player
    if (player.attack < STRIKE_THRESHOLD) return true
    return duel({ type: 'KO', side: 'player', zone: player.guard })
  }

  // ── The fixed step ───────────────────────────────────────────────────────

  let frame = 0
  let owed = 0
  let last = 0

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    const elapsed = last === 0 ? 0 : (now - last) / 1000
    last = now

    // A backgrounded tab comes back owing a quarter of a second at most: the
    // hunter does not get to cross the apartment while nobody was looking.
    owed = Math.min(owed + elapsed, 0.25)

    if (!briefed) {
      owed = 0
      return
    }

    reportWalk()
    while (owed >= HUNT_DT && !huntIsOver(game.outcome)) {
      owed -= HUNT_DT
      game = updateHunt(game, world)
    }
  }

  /** Standing still is what regeneration is paid for, so it has to be observed. */
  function reportWalk() {
    const moved = Math.hypot(
      position[0] - game.player.position[0],
      position[1] - game.player.position[1],
    )
    if (moved === 0 && game.player.atRest && heading === game.player.heading) return
    send({
      type: 'WALKED',
      player: {
        position: position,
        heading,
        spaceId: currentSpace?.id ?? null,
        atRest: moved === 0,
      },
    })
  }

  onMount(() => {
    calm = prefersReducedMotion()
    window.addEventListener('keydown', onKeyDown)
    frame = requestAnimationFrame(tick)
  })

  onDestroy(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeyDown)
    cancelAnimationFrame(frame)
  })

  function again() {
    game = freshGame()
    position = game.player.position
    owed = 0
    last = 0
  }

  function begin() {
    briefed = true
  }
</script>

<Seo
  title={$t.hunt.seoTitle}
  description={$t.hunt.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.hunt.breadcrumb, path: $link('/hunt') },
  ])}
/>

<div class="relative h-screen w-full overflow-hidden bg-black text-white">
  <TourScene
    {ship}
    bind:tierId
    bind:position
    bind:heading
    bind:currentSpace
    bind:engaged
    world={EMPTY_WORLD}
    extras={figures}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  {#if !finished}
    <NenVeil {cues} {calm} />
  {/if}

  {#if !finished}
    <HuntHud
      pool={game.duel ? game.duel.player.pool : game.ledger.pool}
      feedback={game.feedback}
      reading={{
        nen: game.player.nen,
        roomName: roomName(game.player.spaceId),
        targetName: roomName(game.targetSpaceId),
        entraves: liveOf(game.ledger.placements).length,
        heading: game.player.heading,
      }}
      labels={{ hud: $t.hunt.hud, feel: $t.hunt.feel }}
    />
  {/if}

  {#if briefed && !inDuel && !finished}
    <HuntActions
      nen={game.player.nen}
      {canSweep}
      {canLay}
      {canTake}
      labels={$t.hunt.actions}
      onSweep={() => send({ type: 'SWEEP' })}
      onToggleNen={() => send({ type: 'ZETSU' })}
      onLay={() => send({ type: 'LAY' })}
      onTake={() => send({ type: 'TAKE' })}
    />
  {/if}

  {#if inDuel && !finished}
    <DuelPanel duel={game.duel!} labels={$t.hunt.duel} />
  {/if}

  {#if !engaged && !inDuel && !finished}
    <p class="pointer-events-none absolute inset-x-0 top-8 text-center text-sm text-white/70">
      {$t.hunt.enter}
    </p>
  {/if}

  {#if finished}
    <div class="absolute inset-0 overflow-y-auto bg-black/95">
      <Debrief
        report={{
          outcome: game.outcome,
          clock: game.clock,
          log: game.log,
          playerPool: game.ledger.pool,
          hunterPool: game.hunter.pool,
          laid: game.ledger.placements.length,
          sprung: game.ledger.placements.filter((placement) => placement.state === 'sprung').length,
          recovered: game.ledger.placements.filter((placement) => placement.state === 'recovered')
            .length,
          roomName,
        }}
        labels={$t.hunt.debrief}
        outcomeLabel={$t.hunt.outcome[
          game.outcome === 'playing' || game.outcome === 'contact' ? 'timeUp' : game.outcome
        ]}
      />
      <div class="pb-16 text-center">
        <button
          class="rounded border border-white/25 px-6 py-2 text-sm uppercase tracking-widest text-white/80 transition hover:border-white/60 hover:text-white"
          onclick={again}
        >
          {$t.hunt.debrief.again}
        </button>
      </div>
    </div>
  {/if}

  {#if !briefed}
    <HuntBriefing labels={$t.hunt.briefing} onBegin={begin} />
  {/if}
</div>
