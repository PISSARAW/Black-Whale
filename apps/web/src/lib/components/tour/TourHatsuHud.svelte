<script lang="ts">
  /**
   * What the technique is doing to the ship, said in words.
   *
   * The walk draws the aura — outlines through the hull, an emptied room, the
   * eye's feed in the corner — and this panel is the account of it: what was
   * cast last, and everything Nen is still holding. Reading it should be enough
   * to know what would change if the technique were released.
   */
  import type { Ship } from '$lib/tour/blueprint'
  import {
    TOUR_HATSU_KINDS,
    aimsAtSolids,
    dialReading,
    identityOf,
    solidById,
    worksOnTheBody,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Space, Structure } from '$lib/tour/types'
  import { locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import type { HatsuProfile } from '$lib/nen/hatsuRegistry'

  interface Props {
    ship: Ship
    profile: HatsuProfile
    /**
     * Whether this technique is one the walk can honour. A technique that works
     * on what a page says still gets the panel — it has to say why nothing is
     * happening, and what the aura is still holding from before it.
     */
    castable: boolean
    world: TourWorld
    report: TourReport | null
    /** The room down the reticle, or `null` when the walk is not engaged. */
    aimedAt: Space | null
    /** The solid down the reticle, for the techniques that work on solids. */
    aimedSolidAt: Structure | null
    /** Where the visitor stands, which the dial reads a distance off. */
    at: [number, number]
    standingIn: string | null
    nameOf: (entity: { name: string; nameFr: string }) => string
    /** What a room rests on, in the visitor's language: the flock brings it back. */
    sourceOf: (entity: { source: string; sourceFr: string }) => string
    onRelease: () => void
  }

  const {
    ship,
    profile,
    castable,
    world,
    report,
    aimedAt,
    aimedSolidAt,
    at,
    standingIn,
    nameOf,
    sourceOf,
    onRelease,
  }: Props = $props()

  // The technique under the visitor's own name for it, as the dock names it.
  const named = $derived(localizeHatsu(profile, $locale))
  /** Whether this technique's target is a thing rather than a place. */
  const onSolids = $derived(aimsAtSolids(profile) || profile.kind === 'mimicry')
  /** Or whether it has no target at all, because the target is the visitor. */
  const onBody = $derived(worksOnTheBody(profile) && !onSolids)

  const roomName = (id: string) => {
    const space = ship.spaces.get(id)
    // Named as the walk names it, so a room the arrow swapped is not called two
    // different things by two different panels.
    return space ? nameOf(identityOf(ship, world, space)) : id
  }

  /** What the dial reads from where the visitor is standing, this instant. */
  const dial = $derived(dialReading(ship, world, at, standingIn))

  /** The verses, as lines rather than as indices. */
  const written = $derived(
    world.verses.map((verse) => ({
      room: roomName(verse.spaceId),
      lines: [
        $t.tour.hatsu.verse.provenance[verse.lines[0]],
        $t.tour.hatsu.verse.ways[verse.lines[1]],
        $t.tour.hatsu.verse.standing[verse.lines[2]],
        $t.tour.hatsu.verse.level[verse.lines[3]],
      ],
    })),
  )

  const solidName = (id: string) => {
    const solid = solidById(ship, world, id)
    if (!solid) return id
    // A Gallery Fake copy carries its original's name, and has to say it is one.
    return world.solids[id]?.copyOf
      ? `${nameOf(solid)} (${$t.tour.hatsu.solids.copy})`
      : nameOf(solid)
  }

  const line = $derived.by(() => {
    const say = $t.tour.hatsu.reports
    if (!report) return null
    switch (report.kind) {
      case 'no-target':
        return say.noTarget
      case 'inert':
        return $t.tour.hatsu.inertShort
      case 'teleported':
        return say.teleported(roomName(report.spaceId))
      case 'door-armed':
        return say.doorArmed(roomName(report.spaceId))
      case 'doors-paired':
        return say.doorsPaired(roomName(report.spaceId), roomName(report.otherId))
      case 'doors-rearmed':
        return say.doorsRearmed(roomName(report.spaceId))
      case 'phasing':
        return report.on ? say.phasingOn : say.phasingOff
      case 'eye-sent':
        return say.eyeSent(roomName(report.spaceId))
      case 'eye-recalled':
        return say.eyeRecalled
      case 'sealed':
        return [say.sealedReleased, say.sealedSight, say.sealedHearing, say.sealedSpeech][
          report.stage
        ]
      case 'dowsed':
        return say.dowsed(roomName(report.spaceId), report.distance, report.decks)
      case 'watching':
        return say.watching(roomName(report.spaceId))
      case 'isolated':
        return report.occupant
          ? say.isolatedInside(roomName(report.spaceId))
          : say.isolatedOutside(roomName(report.spaceId))
      case 'stripped':
        return say.stripped(roomName(report.spaceId), report.count)
      case 'laid-open':
        return say.laidOpen(report.spaces, report.decks)
      case 'emptied':
        return say.emptied(roomName(report.spaceId), report.structures)
      case 'refused':
        return say.refused(roomName(report.spaceId))
      case 'dispatched':
        return say.dispatched(roomName(report.spaceId))

      case 'no-solid':
        return say.noSolid
      case 'bound-fast':
        return say.boundFast(solidName(report.solidId))
      case 'gum-set':
        return say.gumSet(solidName(report.solidId))
      case 'gum-pulled':
        return say.gumPulled(solidName(report.solidId), solidName(report.otherId))
      case 'forged':
        return say.forged(solidName(report.solidId))
      case 'wrapped':
        return say.wrapped(solidName(report.solidId))
      case 'unwrapped':
        return say.unwrapped(solidName(report.solidId))
      case 'pushed':
        return say.pushed(solidName(report.solidId), report.metres)
      case 'copied':
        return say.copied(solidName(report.solidId))
      case 'crushed':
        return say.crushed(solidName(report.solidId))
      case 'volley':
        return say.volley(solidName(report.solidId), report.hits)
      case 'shattered':
        return say.shattered(solidName(report.solidId))
      case 'wound-up':
        return say.woundUp(report.turns)
      case 'launched':
        return say.launched(solidName(report.solidId), report.metres)
      case 'struck':
        return say.struck(solidName(report.solidId))
      case 'bound':
        return say.bound(solidName(report.solidId))
      case 'released':
        return say.released(solidName(report.solidId))
      case 'came-up-under':
        return say.cameUpUnder(solidName(report.solidId), solidName(report.otherId))
      case 'stitched':
        return say.stitched(solidName(report.solidId))
      case 'nothing-to-stitch':
        return say.nothingToStitch(solidName(report.solidId))
      case 'animated':
        return say.animated(solidName(report.solidId))
      case 'shred-stuck':
        return say.shredStuck(solidName(report.solidId))
      case 'shred-cut':
        return say.shredCut(solidName(report.solidId), report.left)
      case 'grown':
        return say.grown(solidName(report.solidId))
      case 'growth-refused':
        return say.growthRefused(solidName(report.solidId))
      case 'marked':
        return say.marked(solidName(report.solidId), report.mark === 'sun')
      case 'detonated':
        return say.detonated(solidName(report.solidId), solidName(report.otherId))
      case 'swapped':
        return say.swapped(solidName(report.solidId), solidName(report.otherId))
      case 'cargo-taken':
        return say.cargoTaken(solidName(report.solidId))
      case 'cargo-landed':
        return say.cargoLanded(solidName(report.solidId), roomName(report.spaceId))

      case 'jailed':
        return say.jailed(roomName(report.spaceId), report.doors)
      case 'jail-refused':
        return say.jailRefused(roomName(report.spaceId))
      case 'fish-loosed':
        return say.fishLoosed(roomName(report.spaceId))
      case 'fish-fed':
        return say.fishFed(roomName(report.spaceId), solidName(report.solidId))
      case 'guards-posted':
        return say.guardsPosted(roomName(report.spaceId))
      case 'expelled':
        return say.expelled(roomName(report.spaceId), roomName(report.toId))
      case 'card-blue':
        return say.cardBlue(roomName(report.spaceId))
      case 'card-yellow':
        return say.cardYellow(roomName(report.spaceId))
      case 'card-red':
        return say.cardRed(roomName(report.spaceId))
      case 'vow-declared':
        return say.vowDeclared(roomName(report.spaceId))
      case 'vow-broken':
        return say.vowBroken(roomName(report.spaceId))
      case 'pact-taken':
        return say.pactTaken(roomName(report.spaceId))
      case 'pact-met':
        return say.pactMet(roomName(report.spaceId), report.released)
      case 'bait-set':
        return say.baitSet(roomName(report.spaceId))
      case 'trapped':
        return say.trapped(roomName(report.spaceId))
      case 'held-fast':
        return say.heldFast(roomName(report.spaceId))
      case 'snakes-loosed':
        return say.snakesLoosed(report.rooms)
      case 'snakes-fed':
        return say.snakesFed(roomName(report.spaceId))
      case 'snakes-rebound':
        return say.snakesRebound
      case 'worm-set':
        return say.wormSet(roomName(report.spaceId))
      case 'worm-open':
        return say.wormOpen(roomName(report.a), roomName(report.b))
      case 'worm-crossed':
        return say.wormCrossed(roomName(report.spaceId), report.crossings)
      case 'worm-spent':
        return say.wormSpent
      case 'double-posted':
        return say.doublePosted(roomName(report.spaceId))
      case 'double-spent':
        return say.doubleSpent(roomName(report.spaceId))

      case 'reinforced':
        return say.reinforced(report.committed)
      case 'boarded':
        return say.boarded
      case 'alighted':
        return say.alighted(report.spaceId ? roomName(report.spaceId) : '—', report.passengers)
      case 'loaded':
        return say.loaded(solidName(report.solidId), report.passengers)
      case 'hold-full':
        return say.holdFull
      case 'projected':
        return say.projected(roomName(report.spaceId))
      case 'returned':
        return say.returned(roomName(report.spaceId))
      case 'body-disturbed':
        return say.bodyDisturbed(roomName(report.spaceId))
      case 'reshaped':
        return say.reshaped(report.metres)
      case 'rested':
        return say.rested(report.hours)
      case 'mended':
        return say.mended(report.spaceId ? roomName(report.spaceId) : '', report.solids)
      case 'dance-played':
        return say.dancePlayed(report.bars)
      case 'dance-needed':
        return say.danceNeeded
      case 'mimicked':
        return say.mimicked(solidName(report.solidId))
      case 'unmimicked':
        return say.unmimicked
      case 'soothed':
        return say.soothed(report.opened)
      case 'deduced':
        return say.deduced(report.what, report.strength)
      case 'nothing-to-deduce':
        return say.nothingToDeduce

      case 'owl-attached':
        return say.owlAttached(report.rooms)
      case 'owl-recalled':
        return say.owlRecalled(report.rooms)
      case 'foreseen':
        return say.foreseen(roomName(report.spaceId))
      case 'diverged':
        return say.diverged(roomName(report.spaceId), roomName(report.wentTo))
      case 'written':
        return say.written(roomName(report.spaceId))
      case 'line-taken':
        return say.lineTaken(roomName(report.spaceId), report.lines)
      case 'poem-read':
        return say.poemRead(report.strength)
      case 'dial-set':
        return say.dialSet(roomName(report.spaceId))
      case 'dial-read':
        return say.dialRead(roomName(report.spaceId), report.reading)
      case 'droplet-sent':
        return say.dropletSent(roomName(report.spaceId), report.left)
      case 'droplets-dry':
        return say.dropletsDry
      case 'droplet-expired':
        return say.dropletExpired(roomName(report.spaceId))
      case 'name-taken':
        return say.nameTaken(roomName(report.spaceId))
      case 'counterattack':
        return say.counterattack(roomName(report.spaceId), report.released)
      case 'marked-victim':
        return say.markedVictim(roomName(report.spaceId))
      case 'sacrifice-found':
        return say.sacrificeFound(roomName(report.spaceId))
      case 'curse-fell':
        return say.curseFell(roomName(report.victim), roomName(report.sacrifice))
      case 'souls-swapped':
        return say.soulsSwapped(roomName(report.a), roomName(report.b))
      case 'arrow-drawn':
        return say.arrowDrawn(roomName(report.spaceId))
    }
  })

  /** Everything the aura is holding, as one list the visitor can read down. */
  const holds = $derived.by(() => {
    const held = $t.tour.hatsu.holds
    const rows: { label: string; value: string }[] = []
    if (world.laidOpen) rows.push({ label: held.laidOpen, value: `${ship.spaces.size}` })
    if (world.isolated) {
      rows.push({
        label: held.isolated,
        value: roomName(world.isolated.spaceId),
      })
    }
    if (world.doors.length) {
      rows.push({
        label: held.doors,
        value:
          world.doors.length === 1
            ? `${roomName(world.doors[0])} · ${held.armed}`
            : world.doors.map(roomName).join(' ⇄ '),
      })
    }
    if (world.eye) rows.push({ label: held.eye, value: roomName(world.eye) })
    for (const doll of world.watched) {
      rows.push({
        label: held.watched,
        value: `${roomName(doll.spaceId)} · ${held.visits(doll.visits)}`,
      })
    }
    for (const id of world.emptied) rows.push({ label: held.emptied, value: roomName(id) })
    if (world.dowsing) rows.push({ label: held.dowsing, value: roomName(world.dowsing) })
    if (world.phasing) rows.push({ label: held.phasing, value: '—' })
    if (world.sealed) {
      rows.push({
        label: held.sealed,
        value: ['', '👁', '👁 👂', '👁 👂 🗣'][world.sealed],
      })
    }
    if (world.owl) rows.push({ label: held.owl, value: `${world.trail.length}` })
    if (world.foreseen) rows.push({ label: held.foreseen, value: roomName(world.foreseen.spaceId) })
    if (world.poem.length) {
      rows.push({ label: held.poem, value: world.poem.map(roomName).join(' → ') })
    }
    if (world.dial) {
      rows.push({
        label: held.dial,
        value: dial ? `${roomName(world.dial)} · ${dial.reading}` : roomName(world.dial),
      })
    }
    for (const drop of world.droplets) {
      rows.push({ label: held.droplets, value: `${roomName(drop.spaceId)} · ${drop.life}` })
    }
    for (const id of world.ninelives) rows.push({ label: held.ninelives, value: roomName(id) })
    if (world.curse) rows.push({ label: held.curse, value: roomName(world.curse.victim) })
    for (const [a, b] of world.souls) {
      rows.push({ label: held.souls, value: `${roomName(a)} ⇄ ${roomName(b)}` })
    }
    const body = world.body
    if (body.enhance) rows.push({ label: held.enhance, value: `${body.enhance} / 6` })
    if (body.riding) {
      rows.push({ label: held.riding, value: `${body.passengers.map(solidName).join(', ') || '—'}` })
    }
    if (body.eyes !== null) rows.push({ label: held.eyes, value: `${body.eyes.toFixed(2)} m` })
    if (body.projected) rows.push({ label: held.projected, value: roomName(body.projected.spaceId) })
    if (body.dance) rows.push({ label: held.dance, value: `${body.dance}` })
    if (body.mimic) rows.push({ label: held.mimic, value: solidName(body.mimic) })
    if (body.soothed) rows.push({ label: held.soothed, value: '♪' })
    if (body.deduced.length) rows.push({ label: held.deduced, value: `${body.deduced.length}` })
    for (const id of world.shut) rows.push({ label: held.shut, value: roomName(id) })
    for (const id of world.guarded) rows.push({ label: held.guarded, value: roomName(id) })
    if (world.pinned) rows.push({ label: held.pinned, value: roomName(world.pinned) })
    if (world.vow) rows.push({ label: held.vow, value: roomName(world.vow) })
    if (world.pact) rows.push({ label: held.pact, value: roomName(world.pact) })
    for (const id of world.devouring) rows.push({ label: held.devouring, value: roomName(id) })
    for (const [id, card] of Object.entries(world.cards)) {
      rows.push({ label: held.cards, value: `${roomName(id)} · ${['', '☐', '☒', '✕'][card]}` })
    }
    if (world.double) rows.push({ label: held.double, value: roomName(world.double) })
    if (world.trap) rows.push({ label: held.trap, value: roomName(world.trap) })
    if (world.worm) {
      rows.push({
        label: held.worm,
        value: world.worm.b
          ? `${roomName(world.worm.a)} ⇄ ${roomName(world.worm.b)} · ${held.crossings(world.worm.crossings)}`
          : `${roomName(world.worm.a)} · ${held.armed}`,
      })
    }
    if (world.snakes) {
      rows.push({
        label: held.snakes,
        value: `${world.snakes.rooms.length} · ${world.snakes.fed ? '✓' : '—'}`,
      })
    }
    if (world.pairing) {
      rows.push({ label: held.solid, value: $t.tour.hatsu.solids.pairing(solidName(world.pairing)) })
    }
    if (world.wound) rows.push({ label: held.wound, value: solidName(world.wound) })
    if (world.windup) rows.push({ label: held.solid, value: held.windup(world.windup) })
    for (const id of Object.keys(world.solids)) {
      if (id === world.pairing) continue
      rows.push({ label: held.solid, value: solidName(id) })
    }
    for (const id of world.dispatches) {
      const space = ship.spaces.get(id)
      rows.push({
        label: held.dispatches,
        value: space ? `${nameOf(space)} — ${sourceOf(space)}` : id,
      })
    }
    return rows
  })
</script>

<section
  class="rounded border p-3"
  style:border-color="color-mix(in srgb, {profile.color} 45%, #333)"
  style:background="color-mix(in srgb, {profile.color} 6%, transparent)"
>
  <p class="text-[10px] uppercase tracking-widest" style:color={profile.color}>
    {$t.tour.hatsu.title}
  </p>
  <p class="mt-1 text-sm font-semibold text-[#FFFFF0]">{named.name}</p>
  <p class="text-[11px] text-[#FFFFF0]/50">
    {named.owner}{castable
      ? ` · ${onBody ? $t.tour.hatsu.body.reach : onSolids ? $t.tour.hatsu.solids.reach : $t.tour.hatsu.reach}`
      : ` · ${$t.tour.hatsu.inertShort}`}
  </p>

  {#if castable}
    <p class="mt-2 text-xs text-[#FFFFF0]/80">
      {#if onBody}
        {$t.tour.hatsu.body.noTarget}
      {:else if onSolids}
        {aimedSolidAt
          ? $t.tour.hatsu.solids.aiming(nameOf(aimedSolidAt))
          : $t.tour.hatsu.solids.aimingNothing}
      {:else}
        {aimedAt ? $t.tour.hatsu.aiming(nameOf(aimedAt)) : $t.tour.hatsu.aimingNothing}
      {/if}
    </p>
    <p class="text-[11px] text-[#FFFFF0]/45">
      {onBody
        ? $t.tour.hatsu.body.castHint
        : onSolids
          ? $t.tour.hatsu.solids.castHint
          : $t.tour.hatsu.castHint}
    </p>
  {:else}
    <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/60">
      {$t.tour.hatsu.inert(named.name, TOUR_HATSU_KINDS.length)}
    </p>
  {/if}

  {#if line && castable}
    <p
      class="mt-2 border-l-2 pl-2 text-xs leading-snug text-[#FFFFF0]"
      style:border-color={profile.color}
    >
      {line}
    </p>
  {/if}

  <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/45">
    {$t.tour.hatsu.holding}
  </p>
  {#if holds.length}
    <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
      {#each holds as hold, index (`${hold.label}-${hold.value}-${index}`)}
        <dt class="text-[#FFFFF0]/50">{hold.label}</dt>
        <dd class="truncate text-[#FFFFF0]/85">{hold.value}</dd>
      {/each}
    </dl>
  {:else}
    <p class="mt-1 text-[11px] text-[#FFFFF0]/40">{$t.tour.hatsu.nothingHeld}</p>
  {/if}

  {#if written.length}
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/45">
      {$t.tour.hatsu.holds.verses}
    </p>
    {#each written as verse (verse.room)}
      <div class="mt-1 border-l-2 border-[#FFFFF0]/15 pl-2">
        <p class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/40">{verse.room}</p>
        {#each verse.lines as line (line)}
          <p class="text-[11px] italic leading-snug text-[#FFFFF0]/70">{line}</p>
        {/each}
      </div>
    {/each}
  {/if}

  <button
    type="button"
    onclick={onRelease}
    class="mt-3 w-full rounded border border-[#444] px-2 py-1 text-[11px] text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
  >
    {$t.tour.hatsu.release}
  </button>
</section>
