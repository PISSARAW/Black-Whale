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
    castablePages,
    adriftSolidIds,
    dancingSolidIds,
    SMOKE_FULL,
    dialReading,
    identityOf,
    solidById,
    twoPages,
    worksOnTheBody,
    type TourReport,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import type { Space, Structure } from '$lib/tour/types'
  import { locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import {
    HATSU_PROFILES,
    type HatsuInteractionKind,
    type HatsuProfile,
  } from '$lib/nen/hatsuRegistry'

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
    /** Walks the double on to her next watch — the same thing R does. */
    onCycleDouble: () => void
    /** Walks Secret Window on to its next bird — R again, under that aura. */
    onCycleOwl: () => void
    /** Walks Little Eye's insect on to its next order — R, under that aura. */
    onCycleEye: () => void
    /** Casts a page of the book at whatever the visitor is aiming at. */
    onCastPage: (kind: HatsuInteractionKind) => void
    /**
     * The cast the keys make, for a visitor working the panel instead.
     *
     * Two of them under Double Face, and three under the flute — where the
     * third is C, and the hand is which air is played rather than which page.
     */
    onCastHand: (hand: 'first' | 'second' | 'third') => void
    /** Moves Double Face's ribbon to the other page, which swaps the two keys. */
    onTurnTheBook: () => void
  }

  let {
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
    onCycleDouble,
    onCycleOwl,
    onCycleEye,
    onCastPage,
    onCastHand,
    onTurnTheBook,
  }: Props = $props()

  // The technique under the visitor's own name for it, as the dock names it.
  const named = $derived(localizeHatsu(profile, $locale))
  /** Whether this technique's target is a thing rather than a place. */
  const onSolids = $derived(aimsAtSolids(profile) || profile.kind === 'mimicry')
  /** Or whether it has no target at all, because the target is the visitor. */
  const onBody = $derived(worksOnTheBody(profile) && !onSolids)
  /** The pages of the book the visitor can actually play right now. */
  const pages = $derived(castablePages(world.book))

  /**
   * Double Face's two live pages, under the keys that play them.
   *
   * The bookmark is not cast at anything itself — it is what keeps a second
   * page alive beside the open one — so the panel does not offer one thing to
   * cast, it offers two, and says which key each is under. `null` under
   * everything else, and under a book that has not been dealt yet.
   */
  const bothPages = $derived(profile.kind === 'bookmark' ? twoPages(world.book) : null)
  /**
   * The two-handed technique in reach of a key, and which hint it needs.
   *
   * In hand it has both keys — F puts the sun on, R the moon. Held on a page of
   * the book it has only its own, because R is how the other page is cast, so
   * that one key alternates instead. Two different things to tell the visitor.
   */
  const marksBothHands = $derived(!bothPages && profile.kind === 'polarity')
  const marksOnOneKey = $derived(Boolean(bothPages?.includes('polarity')))

  const roomName = (id: string) => {
    const space = ship.spaces.get(id)
    // Named as the walk names it, so a room the arrow swapped is not called two
    // different things by two different panels.
    return space ? nameOf(identityOf(ship, world, space)) : id
  }

  /**
   * A stolen technique under the name of whoever it was taken from.
   *
   * The book holds kinds, not profiles — what was taken off a room is an
   * ability, not a person's copy of one — so the registry is asked for the
   * profile that carries that kind, and the visitor reads the name they know.
   */
  const pageName = (kind: string) => {
    const profile = HATSU_PROFILES.find((candidate) => candidate.kind === kind)
    return profile ? localizeHatsu(profile, $locale).name : kind
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
        return say.eyeRecalled(report.rooms)
      case 'eye-mode-changed':
        return say.eyeModeChanged($t.tour.hatsu.insect[report.mode])
      case 'eye-piloted':
        return say.eyePiloted(roomName(report.spaceId))
      case 'eye-flown':
        return say.eyeFlown(roomName(report.spaceId))
      case 'eye-filmed':
        return say.eyeFilmed(roomName(report.spaceId), report.seen)
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
      case 'swallowed':
        return say.swallowed(solidName(report.solidId), report.held)
      case 'coughed-up':
        return say.coughedUp(solidName(report.solidId), roomName(report.spaceId), report.held)
      case 'bag-empty':
        return say.bagEmpty
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
      case 'gum-trap-set':
        return say.gumTrapSet(roomName(report.spaceId))
      case 'gum-rebound':
        return say.gumRebound(roomName(report.spaceId))
      case 'gum-propulsion':
        return say.gumPropulsion
      case 'gum-healed':
        return say.gumHealed(report.healed)
      case 'forged':
        return say.forged(solidName(report.solidId))
      case 'wrapped':
        return say.wrapped(solidName(report.solidId))
      case 'unwrapped':
        return say.unwrapped(solidName(report.solidId))
      case 'pushed':
        return say.pushed(solidName(report.solidId), report.metres)
      case 'stamped':
        return say.stamped(solidName(report.solidId), report.puppets)
      case 'stamp-locked':
        return say.stampLocked(solidName(report.solidId), report.locked, report.locks)
      case 'ordered':
        return say.ordered(roomName(report.spaceId), report.puppets)
      case 'no-lock':
        return say.noLock(report.stamped)
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
      case 'lashed':
        return say.lashed(solidName(report.solidId), report.hits)
      case 'bound':
        return say.bound(solidName(report.solidId))
      case 'released':
        return say.released(solidName(report.solidId))
      case 'arms-full':
        return say.armsFull(report.solidIds.map(solidName).join(', '))
      case 'came-up-under':
        return say.cameUpUnder(solidName(report.solidId), solidName(report.otherId))
      case 'came-up-empty':
        return say.cameUpEmpty(roomName(report.spaceId))
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
      case 'hammered':
        return say.hammered(solidName(report.solidId))
      case 'bored':
        return say.bored(solidName(report.solidId))
      case 'halved':
        return say.halved(solidName(report.solidId), report.apart)
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
      case 'double-mode-changed':
        return say.doubleModeChanged($t.tour.hatsu.double[report.mode])
      case 'owl-mode-changed':
        return say.owlModeChanged($t.tour.hatsu.owl[report.mode])

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
      case 'tune-played':
        return say.tunePlayed(
          $t.tour.hatsu.tunes[report.tune],
          roomName(report.spaceId),
          report.on,
          report.solids,
        )
      // The Guardian Spirit Beasts. Every one of them says what it did to the
      // room rather than that it is there: the visitor can see that it is there.
      case 'beast-raised':
        return say.beastRaised(roomName(report.spaceId), report.solids)
      case 'beast-dismissed':
        return say.beastDismissed(roomName(report.spaceId), report.solids)
      case 'wheel-raised':
        return say.wheelRaised(roomName(report.spaceId), report.coin)
      case 'wheel-dismissed':
        return say.wheelDismissed(roomName(report.spaceId))
      case 'coin-taken':
        return say.coinTaken(report.value, report.gilded)
      case 'lie-pushed':
        return say.liePushed(solidName(report.solidId), report.metres)
      case 'lie-greened':
        return say.lieGreened(solidName(report.solidId))
      case 'lie-transformed':
        return say.lieTransformed(solidName(report.solidId))
      case 'gas-loosed':
        return say.gasLoosed(roomName(report.spaceId), report.solids)
      case 'gas-lifted':
        return say.gasLifted(roomName(report.spaceId))
      case 'melted':
        return say.melted(roomName(report.spaceId), report.melting, report.gone)
      case 'room-brightened':
        return say.roomBrightened(roomName(report.spaceId), report.levied)
      case 'halo-raised':
        return say.haloRaised(report.levied, report.halo)
      case 'reeled':
        return say.reeled(report.pulled, report.eaten)
      case 'smoke-loosed':
        return say.smokeLoosed(roomName(report.spaceId))
      case 'smoke-lifted':
        return say.smokeLifted(roomName(report.spaceId), report.filled)
      case 'smoke-spread':
        return say.smokeSpread(roomName(report.spaceId), report.filled, report.full)
      case 'flock-loosed':
        return say.flockLoosed(report.rooms, report.beasts)
      case 'flock-called-in':
        return say.flockCalledIn(report.rooms)
      case 'isolation-lifted':
        return say.isolationLifted(roomName(report.spaceId))
      case 'crushed-one':
        return say.crushedOne(solidName(report.solidId), report.left)

      case 'deduced':
        return say.deduced(report.what, report.strength)
      case 'nothing-to-deduce':
        return say.nothingToDeduce
      case 'armour-worn':
        return say.armourWorn
      case 'armour-holding':
        return say.armourHolding(report.packed)
      case 'packed-away':
        return say.packedAway(roomName(report.spaceId), report.packed)
      case 'sun-risen':
        return say.sunRisen(report.metres, report.solids)

      case 'owl-attached':
        return say.owlAttached(report.rooms)
      case 'owl-recalled':
        return say.owlRecalled(report.rooms)
      case 'owl-flown':
        return say.owlFlown(roomName(report.spaceId))
      case 'owl-expired':
        return say.owlExpired(report.rooms)
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

      case 'nothing-to-steal':
        return say.nothingToSteal(roomName(report.spaceId))
      case 'taken-into-the-book':
        return say.takenIntoTheBook(roomName(report.spaceId), pageName(report.technique))
      case 'needs-two-pages':
        return say.needsTwoPages
      case 'bookmarked':
        return say.bookmarked(pageName(report.technique))
      case 'acquisition-failed':
        return say.acquisitionFailed(roomName(report.spaceId))
      case 'carded':
        return say.carded(roomName(report.spaceId), pageName(report.technique))
      case 'not-eligible':
        return say.notEligible(roomName(report.spaceId))
      case 'inherited':
        return say.inherited(roomName(report.spaceId), pageName(report.technique))
      case 'drained':
        return say.drained(roomName(report.spaceId), pageName(report.technique))
      case 'needs-emperor-time':
        return say.needsEmperorTime
      case 'nothing-to-lend':
        return say.nothingToLend
      case 'lent':
        return say.lent(pageName(report.technique))
      case 'page-spent':
        return say.pageSpent(pageName(report.technique))
      case 'in-zetsu':
        return say.inZetsu(roomName(report.spaceId))
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
    // The insect: where it is and what it was told, and under it the route it
    // has filmed — which is the whole of what the sphere is for, and outlives
    // the insect being called in.
    if (world.eye) {
      rows.push({
        label: held.eye,
        value: `${roomName(world.eye)} · ${$t.tour.hatsu.insect[world.eyeMode ?? 'pilot']}`,
      })
    }
    if (world.eyeFilm.length) {
      rows.push({
        label: held.eyeFilm,
        value: [...new Set(world.eyeFilm.map((frame) => frame.spaceId))].map(roomName).join(' → '),
      })
    }
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
    const book = world.book
    if (book.pages.length)
      rows.push({ label: held.book, value: book.pages.map(pageName).join(', ') })
    if (book.open) rows.push({ label: held.openPage, value: pageName(book.open) })
    if (book.bookmark) rows.push({ label: held.bookmark, value: pageName(book.bookmark) })
    if (book.cards.length)
      rows.push({ label: held.hand, value: book.cards.map(pageName).join(', ') })
    for (const id of book.zetsu) rows.push({ label: held.zetsu, value: roomName(id) })
    if (book.loan) rows.push({ label: held.loan, value: pageName(book.loan) })
    // A bird that is out is a bird on a clock, so what it is holding is said
    // with the seconds it has left to hold it.
    if (world.owl) {
      rows.push({
        label: held.owl,
        value: `${world.trail.length} · ${$t.tour.hatsu.owl.left(Math.ceil(world.owlLife))}`,
      })
    }
    // And what it brought back stays readable after it has gone: the film in
    // words, for the ten seconds the corner is playing it in pictures.
    if (!world.owl && world.owlFilm.length) {
      rows.push({
        label: held.film,
        value: [...new Set(world.owlFilm.map((frame) => frame.spaceId))].map(roomName).join(' → '),
      })
    }
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
      rows.push({
        label: held.riding,
        value: `${body.passengers.map(solidName).join(', ') || '—'}`,
      })
    }
    if (body.eyes !== null) rows.push({ label: held.eyes, value: `${body.eyes.toFixed(2)} m` })
    if (body.projected)
      rows.push({ label: held.projected, value: roomName(body.projected.spaceId) })
    if (body.dance) rows.push({ label: held.dance, value: `${body.dance}` })
    if (body.mimic) rows.push({ label: held.mimic, value: solidName(body.mimic) })
    if (body.soothed) rows.push({ label: held.soothed, value: '♪' })
    // What the flute has left behind: which air last came out of it, the rooms
    // still holding a piece, and how much of the ship is dancing to one.
    if (body.playing) {
      rows.push({ label: held.playing, value: $t.tour.hatsu.tunes[body.playing] })
    }
    for (const id of world.flowered) rows.push({ label: held.flowered, value: roomName(id) })
    for (const id of world.scattered) rows.push({ label: held.scattered, value: roomName(id) })
    const dancing = dancingSolidIds(world)
    if (dancing.length) rows.push({ label: held.dancing, value: `${dancing.length}` })
    // What the two beasts that give something back left on the visitor.
    if (body.gilded) rows.push({ label: held.gilded, value: `${body.gilded}` })
    if (body.halo) rows.push({ label: held.halo, value: `${body.halo}` })
    if (body.deduced.length) rows.push({ label: held.deduced, value: `${body.deduced.length}` })
    if (body.packed !== null) rows.push({ label: held.packed, value: held.packedHits(body.packed) })
    for (const id of world.shut) rows.push({ label: held.shut, value: roomName(id) })
    for (const id of world.guarded) rows.push({ label: held.guarded, value: roomName(id) })
    if (world.pinned) rows.push({ label: held.pinned, value: roomName(world.pinned) })
    if (world.vow) rows.push({ label: held.vow, value: roomName(world.vow) })
    if (world.pact) rows.push({ label: held.pact, value: roomName(world.pact) })
    for (const id of world.devouring) rows.push({ label: held.devouring, value: roomName(id) })
    for (const [id, card] of Object.entries(world.cards)) {
      rows.push({ label: held.cards, value: `${roomName(id)} · ${['', '☐', '☒', '✕'][card]}` })
    }
    // The Guardian Spirit Beasts: where each of them is, and what it has done
    // so far. The two that leave something on the visitor rather than on a room
    // are further up, with the rest of the body.
    if (world.medusa) {
      rows.push({
        label: held.medusa,
        value: `${roomName(world.medusa)} · ${adriftSolidIds(world).length}`,
      })
    }
    if (world.chimera) rows.push({ label: held.chimera, value: roomName(world.chimera) })
    if (world.toad) rows.push({ label: held.toad, value: roomName(world.toad) })
    if (world.centipede) rows.push({ label: held.centipede, value: roomName(world.centipede) })
    if (world.cat) rows.push({ label: held.cat, value: roomName(world.cat) })
    if (world.dragon) rows.push({ label: held.dragon, value: roomName(world.dragon) })
    if (world.wheel) {
      rows.push({
        label: held.wheel,
        value: `${roomName(world.wheel.spaceId)} · ${world.wheel.coin}`,
      })
    }
    if (world.smoke) {
      rows.push({
        label: held.smoke,
        value: `${roomName(world.smoke.spaceId)} · ${world.smoke.filled} / ${SMOKE_FULL}`,
      })
    }
    if (world.menagerie.length) {
      rows.push({ label: held.menagerie, value: `${world.menagerie.length}` })
    }
    for (const id of world.lit) rows.push({ label: held.lit, value: roomName(id) })
    if (world.double) rows.push({ label: held.double, value: roomName(world.double) })
    if (world.trap) rows.push({ label: held.trap, value: roomName(world.trap) })
    for (const id of world.gumTraps) rows.push({ label: held.gumTrap, value: roomName(id) })
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
      rows.push({
        label: held.solid,
        value: $t.tour.hatsu.solids.pairing(solidName(world.pairing)),
      })
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
      {marksBothHands
        ? $t.tour.hatsu.solids.markHint
        : marksOnOneKey
          ? $t.tour.hatsu.solids.markPageHint
          : onBody
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

  <!-- Double Face has a panel of its own below, which says the same two pages
       under the keys that play them: listing them twice would be the walk
       offering the visitor a choice it has already made for them. -->
  {#if pages.length && !bothPages}
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/45">
      {$t.tour.hatsu.book.title}
    </p>
    <p class="text-[10px] leading-snug text-[#FFFFF0]/35">{$t.tour.hatsu.book.hint}</p>
    <div class="mt-1 flex flex-wrap gap-1">
      {#each pages as page, index (`${page}-${index}`)}
        <button
          type="button"
          onclick={() => onCastPage(page)}
          title={$t.tour.hatsu.book.cast}
          class="rounded border border-[#444] px-1.5 py-0.5 text-[11px] text-[#FFFFF0]/80 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
        >
          {pageName(page)}{world.book.cards.includes(page)
            ? ` · ${$t.tour.hatsu.book.card}`
            : world.book.loan === page
              ? ` · ${$t.tour.hatsu.book.loan}`
              : ''}
        </button>
      {/each}
    </div>
  {/if}

  {#if bothPages}
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/45">
      {$t.tour.hatsu.book.bothLive}
    </p>
    <p class="text-[10px] leading-snug text-[#FFFFF0]/35">{$t.tour.hatsu.book.bothHint}</p>
    <div class="mt-1 flex flex-wrap gap-1">
      {#each [{ key: 'F', hand: 'first' as const, page: bothPages[0], ribbon: false }, { key: 'R', hand: 'second' as const, page: bothPages[1], ribbon: true }] as live (live.key)}
        <button
          type="button"
          onclick={() => onCastHand(live.hand)}
          title={$t.tour.hatsu.book.cast}
          class="rounded border px-1.5 py-0.5 text-[11px] transition-colors {live.ribbon
            ? 'border-[#FFD700]/60 text-[#FFD700]'
            : 'border-[#444] text-[#FFFFF0]/80'} hover:border-[#FFD700] hover:text-[#FFFFF0]"
        >
          <span class="font-mono text-[#FFFFF0]/50">{live.key}</span>
          {pageName(live.page)}
        </button>
      {/each}
      <button
        type="button"
        onclick={onTurnTheBook}
        class="rounded border border-[#444] px-1.5 py-0.5 text-[11px] text-[#FFFFF0]/60 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
      >
        {$t.tour.hatsu.book.turn}
      </button>
    </div>
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

  <!-- The double's orders. Shown while the guardian is up rather than only once
       she has been posted, because the watch she will be posted under is a
       choice the visitor can make before the cast as well as after it. -->
  {#if profile.kind === 'guardian'}
    <button
      type="button"
      onclick={onCycleDouble}
      class="mt-3 flex w-full items-center justify-between rounded border border-[#444] px-2 py-1 text-[11px] text-[#FFFFF0]/80 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
    >
      <span
        >{$t.tour.hatsu.double.watch} · {$t.tour.hatsu.double[world.doubleMode ?? 'follow']}</span
      >
      <kbd class="text-[10px] text-[#FFD700]/70">R</kbd>
    </button>
  {/if}

  <!-- The flute's three airs. Not a cycle like the three above: an instrument
       is played, so each piece has a key of its own and pressing it is the
       playing. The row is the same either way — the panel is where a visitor
       finds out that a technique has more than one thing in it. -->
  {#if profile.kind === 'melody'}
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/45">
      {$t.tour.hatsu.tunes.title}
    </p>
    <p class="text-[10px] leading-snug text-[#FFFFF0]/35">{$t.tour.hatsu.tunes.hint}</p>
    {#each [{ hand: 'first' as const, air: 'dance' as const, key: 'F' }, { hand: 'second' as const, air: 'bloom' as const, key: 'R' }, { hand: 'third' as const, air: 'scatter' as const, key: 'C' }] as piece (piece.air)}
      <button
        type="button"
        onclick={() => onCastHand(piece.hand)}
        class="mt-1 flex w-full items-center justify-between rounded border px-2 py-1 text-[11px] transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0] {world
          .body.playing === piece.air
          ? 'border-[#FFD700]/70 text-[#FFD700]'
          : 'border-[#444] text-[#FFFFF0]/80'}"
      >
        <span>{$t.tour.hatsu.tunes[piece.air]}</span>
        <kbd class="text-[10px] text-[#FFD700]/70">{piece.key}</kbd>
      </button>
    {/each}
  {/if}

  <!-- Which bird Secret Window sends, on the same key and for the same reason:
       the aim only decides where the free one starts, so the visitor has to be
       able to say which of the three it is before they press F. -->
  {#if profile.kind === 'surveillance'}
    <button
      type="button"
      onclick={onCycleOwl}
      class="mt-3 flex w-full items-center justify-between rounded border border-[#444] px-2 py-1 text-[11px] text-[#FFFFF0]/80 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
    >
      <span>{$t.tour.hatsu.owl.watch} · {$t.tour.hatsu.owl[world.owlMode ?? 'wander']}</span>
      <kbd class="text-[10px] text-[#FFD700]/70">R</kbd>
    </button>
  {/if}

  <!-- Little Eye takes the same key and the same button: piloted, scouting, or
       filming, which is the difference between a camera left in a room and the
       roach Kurapika reads a deck with. Shown before the cast as well, because
       what the insect will be doing when it lands is part of where to send it. -->
  {#if profile.kind === 'scout'}
    <button
      type="button"
      onclick={onCycleEye}
      class="mt-3 flex w-full items-center justify-between rounded border border-[#444] px-2 py-1 text-[11px] text-[#FFFFF0]/80 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
    >
      <span>{$t.tour.hatsu.insect.orders} · {$t.tour.hatsu.insect[world.eyeMode ?? 'pilot']}</span>
      <kbd class="text-[10px] text-[#FFD700]/70">R</kbd>
    </button>
  {/if}

  <button
    type="button"
    onclick={onRelease}
    class="mt-3 w-full rounded border border-[#444] px-2 py-1 text-[11px] text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFFFF0]"
  >
    {$t.tour.hatsu.release}
  </button>
</section>
