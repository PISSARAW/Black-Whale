/**
 * The stable next action for techniques that take more than one cast.
 *
 * Reports say what just happened. A guide says what remains to do after that
 * report disappears, so it belongs to the Hatsu state rather than to the HUD
 * that happens to render it.
 */
import type { Messages } from '$lib/i18n'
import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import { daysLeft, daysNeeded, isBuilt, isDeciphered } from './decipher'
import { HOURS_IN_A_YEAR } from './emperor'
import {
  lockedPuppets,
  STAMP_LIMIT,
  stampedPuppets,
  techniqueHolding,
  twoPages,
  type TourWorld,
} from './hatsu'
import { RIPPER_ANT_TURNS, ripperReach } from './ripper'

export interface HatsuTechniqueGuide {
  title: string
  status: string
  badge: string | null
  detail: string | null
  warning: string | null
  note: string | null
}

interface GuideContext {
  copy: Messages['tour']['hatsu']
  kind: HatsuProfile['kind']
  world: TourWorld
  touch: boolean
  standingIn: string | null
  aimedAtId: string | null
  personName: (characterId: string) => string
  roomName: (spaceId: string) => string
  pageName: (kind: string) => string
}

function guide(
  options: Pick<HatsuTechniqueGuide, 'title' | 'status'> &
    Partial<Omit<HatsuTechniqueGuide, 'title' | 'status'>>,
): HatsuTechniqueGuide {
  return { badge: null, detail: null, warning: null, note: null, ...options }
}

function controlFor(context: GuideContext): string {
  const copy = context.copy.comboMaster
  return context.touch ? copy.touchControl : copy.control
}

function decipherGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world, standingIn, personName } = context
  const control = controlFor(context)
  const copy = hatsu.comboMaster
  const reading = world.decipher
  const build = world.fabrication
  if (!reading) {
    return guide({
      title: copy.title,
      badge: copy.clock,
      status: copy.chooseTarget(control),
      note: copy.lock,
    })
  }
  if (!isDeciphered(reading)) {
    const total = daysNeeded(reading.reading)
    return guide({
      title: copy.title,
      badge: copy.clock,
      status: copy.deciphering(personName(reading.characterId), total - daysLeft(reading), total),
      detail: standingIn === reading.spaceId ? copy.decipherRunning : copy.decipherPaused,
      note: copy.lock,
    })
  }
  if (!build) {
    return guide({
      title: copy.title,
      badge: copy.clock,
      status: copy.readyToBuild(control),
      note: copy.lock,
    })
  }
  if (isBuilt(build)) {
    return guide({
      title: copy.title,
      badge: copy.clock,
      status: copy.fabricationReady(control),
      note: copy.lock,
    })
  }
  return guide({
    title: copy.title,
    badge: copy.clock,
    status: copy.fabricating(build.days, build.needs),
    detail: copy.fabricationRunning,
    warning: copy.fabricationWarning,
    note: copy.lock,
  })
}

function scarletGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world } = context
  const control = controlFor(context)
  const copy = hatsu.guides.emperorTime
  if (world.forcedZetsu > 0) {
    return guide({
      title: copy.title,
      badge: copy.clock,
      status: copy.zetsu(world.forcedZetsu),
      detail: copy.zetsuDetail,
    })
  }
  if (!world.scarlet) {
    return guide({
      title: copy.title,
      badge: copy.clock,
      status: copy.start(control),
      detail: copy.threshold,
    })
  }
  return guide({
    title: copy.title,
    badge: copy.clock,
    status: copy.active(world.scarlet.hours, HOURS_IN_A_YEAR),
    detail: copy.stop(control),
    warning: copy.threshold,
  })
}

function windupGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world } = context
  const control = controlFor(context)
  const copy = hatsu.guides.ripper
  if (!world.windup) {
    return guide({ title: copy.title, status: copy.empty(control), warning: copy.shatter })
  }
  return guide({
    title: copy.title,
    status: copy.charged(world.windup, RIPPER_ANT_TURNS, ripperReach(world.windup)),
    detail: copy.next(control),
    warning: copy.shatter,
  })
}

function portalGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world, roomName } = context
  const control = controlFor(context)
  const copy = hatsu.guides.worm
  if (!world.worm) {
    return guide({ title: copy.title, status: copy.first(control), warning: copy.spent })
  }
  if (!world.worm.b) {
    return guide({
      title: copy.title,
      status: copy.second(roomName(world.worm.a), control),
      warning: copy.spent,
    })
  }
  return guide({
    title: copy.title,
    status: copy.linked(roomName(world.worm.a), roomName(world.worm.b), world.worm.crossings),
    detail: copy.cross,
    warning: copy.spent,
  })
}

function chainRuleGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world, personName, pageName } = context
  const control = controlFor(context)
  const copy = hatsu.guides.chain
  const owner = world.book.stolenFrom
  if (!owner) return guide({ title: copy.title, status: copy.steal(control) })
  const ability = pageName(world.book.open ?? world.book.pages[0] ?? '')
  return guide({
    title: copy.title,
    status: copy.held(personName(owner), ability),
    detail: copy.return(personName(owner), control),
  })
}

function abilityLoanGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world, pageName } = context
  const control = controlFor(context)
  const copy = hatsu.guides.chain
  const abilityKind = world.book.open ?? world.book.pages[0] ?? null
  if (!abilityKind) return guide({ title: copy.title, status: copy.dolphinNeedsTheft })
  const ability = pageName(abilityKind)
  if (!world.laidOpen) return guide({ title: copy.title, status: copy.dolphinNeedsEyes })
  if (!world.book.loan) {
    return guide({ title: copy.title, status: copy.dolphinLoad(ability, control) })
  }
  return guide({ title: copy.title, status: copy.dolphinReady(pageName(world.book.loan)) })
}

function bookTargetGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, kind, world, aimedAtId, pageName } = context
  const control = controlFor(context)
  const copy = hatsu.guides.book
  const exposed = aimedAtId ? techniqueHolding(world, aimedAtId) : null
  if (kind === 'theft' && world.book.open) {
    return guide({ title: copy.title, status: copy.stolen(pageName(world.book.open)) })
  }
  if (exposed) return guide({ title: copy.title, status: copy.aimed(pageName(exposed), control) })
  if (kind === 'capture' && world.book.cards.length) {
    return guide({
      title: copy.title,
      status: copy.card(world.book.cards.length),
      detail: copy.target(control),
    })
  }
  return guide({ title: copy.title, status: copy.target(control) })
}

function bookmarkGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world, pageName } = context
  const control = controlFor(context)
  const copy = hatsu.guides.book
  const pair = twoPages(world.book)
  return pair
    ? guide({
        title: copy.title,
        status: copy.double(pageName(pair[0]), pageName(pair[1])),
        detail: copy.turn,
      })
    : guide({ title: copy.title, status: copy.target(control) })
}

function curseGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world, roomName } = context
  const control = controlFor(context)
  const copy = hatsu.guides.curse
  if (!world.curse) return guide({ title: copy.title, status: copy.choose(control) })
  return guide({
    title: copy.title,
    status: copy.victim(roomName(world.curse.victim)),
    detail: world.laidOpen ? copy.revealed(roomName(world.curse.sacrifice)) : copy.hidden,
    warning: world.laidOpen ? copy.warning : null,
  })
}

function snakesGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world } = context
  const control = controlFor(context)
  const copy = hatsu.guides.majority
  if (!world.snakes) return guide({ title: copy.title, status: copy.start(control) })
  if (!world.snakes.fed) {
    return guide({
      title: copy.title,
      status: copy.hungry(world.snakes.rooms.length),
      warning: copy.rebound,
    })
  }
  return guide({ title: copy.title, status: copy.fed })
}

function commandGuide(context: GuideContext): HatsuTechniqueGuide {
  const { copy: hatsu, world } = context
  const control = controlFor(context)
  const copy = hatsu.guides.stamp
  const stamped = stampedPuppets(world).length
  const locked = lockedPuppets(world).length
  if (!stamped) return guide({ title: copy.title, status: copy.start(control) })
  if (!locked) {
    return guide({
      title: copy.title,
      status: copy.stamped(stamped, STAMP_LIMIT),
      detail: copy.lock(control),
      note: copy.toggle,
    })
  }
  return guide({
    title: copy.title,
    status: copy.locked(locked, stamped, control),
    detail: copy.toggle,
  })
}

type GuideResolver = (context: GuideContext) => HatsuTechniqueGuide

const GUIDE_RESOLVERS: Partial<Record<HatsuProfile['kind'], GuideResolver>> = {
  decipher: decipherGuide,
  scarlet: scarletGuide,
  windup: windupGuide,
  portal: portalGuide,
  'chain-rule': chainRuleGuide,
  'ability-loan': abilityLoanGuide,
  theft: bookTargetGuide,
  capture: bookTargetGuide,
  bookmark: bookmarkGuide,
  curse: curseGuide,
  snakes: snakesGuide,
  command: commandGuide,
}

export function hatsuTechniqueGuide(context: GuideContext): HatsuTechniqueGuide | null {
  return GUIDE_RESOLVERS[context.kind]?.(context) ?? null
}
