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
    solidById,
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
    nameOf,
    sourceOf,
    onRelease,
  }: Props = $props()

  // The technique under the visitor's own name for it, as the dock names it.
  const named = $derived(localizeHatsu(profile, $locale))
  /** Whether this technique's target is a thing rather than a place. */
  const onSolids = $derived(aimsAtSolids(profile))

  const roomName = (id: string) => {
    const space = ship.spaces.get(id)
    return space ? nameOf(space) : id
  }

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
      ? ` · ${onSolids ? $t.tour.hatsu.solids.reach : $t.tour.hatsu.reach}`
      : ` · ${$t.tour.hatsu.inertShort}`}
  </p>

  {#if castable}
    <p class="mt-2 text-xs text-[#FFFFF0]/80">
      {#if onSolids}
        {aimedSolidAt
          ? $t.tour.hatsu.solids.aiming(nameOf(aimedSolidAt))
          : $t.tour.hatsu.solids.aimingNothing}
      {:else}
        {aimedAt ? $t.tour.hatsu.aiming(nameOf(aimedAt)) : $t.tour.hatsu.aimingNothing}
      {/if}
    </p>
    <p class="text-[11px] text-[#FFFFF0]/45">
      {onSolids ? $t.tour.hatsu.solids.castHint : $t.tour.hatsu.castHint}
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

  <button
    type="button"
    onclick={onRelease}
    class="mt-3 w-full rounded border border-[#444] px-2 py-1 text-[11px] text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
  >
    {$t.tour.hatsu.release}
  </button>
</section>
