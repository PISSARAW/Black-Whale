import type { ChrolloBookState, ChrolloPage } from '../../chrolloBook'
import { FIGHT_FPS } from '../../fightClock'
import { applyBlast } from '../crowd/actions'
import { spectatorById, updateSpectator } from '../crowd/create'
import { NO_MARKS, living, type CrowdState, type PuppetOrder, type Spectator } from '../crowd/types'
import type { Blast } from '../stands/damage'
import type { Vec3 } from '../stands/geometry'

/** Pages that act right now: the open page, plus the one held by the bookmark (Double Face). */
export function pageActive(book: ChrolloBookState, page: ChrolloPage): boolean {
  return book.bookmark === page || (book.open && book.pages[book.page] === page)
}

/** Black Voice has two antennas: never more than two people driven at once. */
export const BLACK_VOICE_ANTENNAS = 2
/** A Sun mark charged this long gives the strongest blast. */
export const FULL_SUN_CHARGE = 3 * FIGHT_FPS
const MAX_SUN_CHARGE = 5 * FIGHT_FPS

export interface CopyTouch {
  sourceId: string
  book: ChrolloBookState
  /** Hisoka could see the copy being made; otherwise it joins the hidden reserve. */
  hisokaSees: boolean
}

/** Gallery Fake: touching a real person makes a copy beside them, with the same look and face. */
export function copyByTouch(crowd: CrowdState, touch: CopyTouch): CrowdState {
  const source = spectatorById(crowd, touch.sourceId)
  if (
    !pageActive(touch.book, 'gallery-fake') ||
    !source ||
    !living(source) ||
    source.nature === 'copy'
  )
    return crowd
  const copy: Spectator = {
    ...source,
    id: `c${crowd.nextId}`,
    at: { ...source.at, x: source.at.x + 0.5 },
    velocity: { x: 0, y: 0, z: 0 },
    posture: 'standing',
    health: 100,
    nature: 'copy',
    copyOf: source.id,
    createdFrame: crowd.frame,
    madeInSight: touch.hisokaSees,
    marks: NO_MARKS,
    order: undefined,
    goal: undefined,
    route: [],
    routeIndex: 0,
    fear: 0,
    gum: false,
    revealedToHisoka: false,
    cause: undefined,
  }
  return { ...crowd, spectators: [...crowd.spectators, copy], nextId: crowd.nextId + 1 }
}

/** Applies a change to one living body; a refusal (null) leaves the crowd as it was. */
function mark(
  crowd: CrowdState,
  id: string,
  change: (spectator: Spectator) => Spectator | null,
): CrowdState {
  const spectator = spectatorById(crowd, id)
  const changed = spectator && living(spectator) ? change(spectator) : null
  return changed ? updateSpectator(crowd, id, () => changed) : crowd
}

export function markSun(crowd: CrowdState, id: string, book: ChrolloBookState): CrowdState {
  if (!pageActive(book, 'sun-and-moon')) return crowd
  return mark(crowd, id, (spectator) => ({
    ...spectator,
    marks: { ...spectator.marks, sun: true },
  }))
}

/** The second mark on a puppet: joining its own hands then detonates it on command. */
export function markMoon(crowd: CrowdState, id: string, book: ChrolloBookState): CrowdState {
  if (!pageActive(book, 'sun-and-moon')) return crowd
  return mark(crowd, id, (spectator) =>
    spectator.nature === 'copy' && spectator.marks.stamped
      ? { ...spectator, marks: { ...spectator.marks, moon: true } }
      : null,
  )
}

/** Order Stamp works on Gallery Fake copies only. */
export function stampCopy(crowd: CrowdState, id: string, book: ChrolloBookState): CrowdState {
  if (!pageActive(book, 'order-stamp')) return crowd
  return mark(crowd, id, (spectator) =>
    spectator.nature === 'copy'
      ? { ...spectator, marks: { ...spectator.marks, stamped: true } }
      : null,
  )
}

export function controlWithBlackVoice(
  crowd: CrowdState,
  id: string,
  book: ChrolloBookState,
): CrowdState {
  const driven = crowd.spectators.filter(
    (spectator) => spectator.marks.blackVoice && living(spectator),
  ).length
  if (!pageActive(book, 'black-voice') || driven >= BLACK_VOICE_ANTENNAS) return crowd
  return mark(crowd, id, (spectator) =>
    spectator.nature === 'human'
      ? { ...spectator, nature: 'controlled', marks: { ...spectator.marks, blackVoice: true } }
      : null,
  )
}

/** Convert Hands: the spectator now wears Chrollo's face — a false Chrollo. */
export function wearChrolloFace(crowd: CrowdState, id: string, book: ChrolloBookState): CrowdState {
  if (!pageActive(book, 'convert-hands')) return crowd
  return mark(crowd, id, (spectator) => ({ ...spectator, face: 'chrollo' }))
}

/** The order carried by one stamp: a single puppet, within reach of Chrollo's voice. */
export function orderPuppet(crowd: CrowdState, id: string, order: PuppetOrder): CrowdState {
  return mark(crowd, id, (spectator) => (spectator.marks.stamped ? { ...spectator, order } : null))
}

/** One order for every stamped copy at once — given through the hall's speakers. */
export function giveCollectiveOrder(crowd: CrowdState, order: PuppetOrder): CrowdState {
  const spectators = crowd.spectators.map((spectator) =>
    spectator.marks.stamped && living(spectator) ? { ...spectator, order } : spectator,
  )
  return { ...crowd, spectators }
}

/** Closing Gallery Fake ends every copy except those carrying a Sun mark. */
export function closeGalleryFake(crowd: CrowdState): CrowdState {
  const spectators = crowd.spectators.map((spectator) =>
    spectator.nature === 'copy' && !spectator.marks.sun && spectator.posture !== 'vanished'
      ? { ...spectator, posture: 'vanished' as const, gum: false }
      : spectator,
  )
  return { ...crowd, spectators }
}

/** Charging a mark: Chrollo holds it while pretending to have been hit. */
export function chargeSun(crowd: CrowdState, ids: readonly string[], frames: number): CrowdState {
  let next = crowd
  for (const id of ids)
    next = updateSpectator(next, id, (spectator) =>
      spectator.marks.sun
        ? {
            ...spectator,
            marks: {
              ...spectator.marks,
              sunCharge: Math.min(MAX_SUN_CHARGE, spectator.marks.sunCharge + frames),
            },
          }
        : spectator,
    )
  return next
}

/** 1 for an instant mark, up to 3 for a full charge of three seconds or more. */
export function sunPower(spectator: Spectator): number {
  return 1 + 2 * Math.min(1, spectator.marks.sunCharge / FULL_SUN_CHARGE)
}

export function isBomb(spectator: Spectator): boolean {
  const { stamped, sun, moon } = spectator.marks
  return spectator.nature === 'copy' && stamped && sun && moon && living(spectator)
}

/** Each stamped copy walks toward where its order sends it. */
export function steerPuppets(
  crowd: CrowdState,
  targets: { hisoka: Vec3; chrollo: Vec3 },
): CrowdState {
  let slot = 0
  const spectators = crowd.spectators.map((spectator) => {
    if (spectator.marks.blackVoice && !spectator.order && living(spectator))
      return { ...spectator, goal: targets.hisoka }
    if (
      !spectator.order ||
      !living(spectator) ||
      spectator.posture === 'airborne' ||
      spectator.posture === 'held'
    )
      return spectator
    slot += 1
    return { ...spectator, goal: orderGoal(spectator.order, targets, slot) }
  })
  return { ...crowd, spectators }
}

function orderGoal(
  order: PuppetOrder,
  targets: { hisoka: Vec3; chrollo: Vec3 },
  slot: number,
): Vec3 | undefined {
  const angle = slot * 2.39996
  const around = (centre: Vec3, radius: number) => ({
    x: centre.x + Math.cos(angle) * radius,
    y: centre.y,
    z: centre.z + Math.sin(angle) * radius,
  })
  switch (order) {
    case 'surround-hisoka':
      return around(targets.hisoka, 2 + (slot % 4) * 0.6)
    case 'explode-near-hisoka':
    case 'charge':
      return targets.hisoka
    case 'shield-chrollo':
      return around(targets.chrollo, 1.5)
    default:
      return undefined
  }
}

export const BOMB_TRIGGER_DISTANCE = 1.2

const armedBeside = (hisoka: Vec3) => (spectator: Spectator) =>
  isBomb(spectator) &&
  spectator.order === 'explode-near-hisoka' &&
  Math.hypot(spectator.at.x - hisoka.x, spectator.at.y - hisoka.y, spectator.at.z - hisoka.z) <=
    BOMB_TRIGGER_DISTANCE

/**
 * "Explode when you are beside Hisoka": bombs close enough join hands and go off together,
 * once at least `quorum` of them stand beside him (1 sets each one off on arrival).
 */
export function triggerBombs(
  crowd: CrowdState,
  hisoka: Vec3,
  quorum = 1,
): { crowd: CrowdState; blasts: Blast[] } {
  const beside = armedBeside(hisoka)
  if (crowd.spectators.filter(beside).length < quorum) return { crowd, blasts: [] }
  const blasts: Blast[] = []
  const spectators = crowd.spectators.map((spectator) => {
    if (!beside(spectator)) return spectator
    blasts.push({ at: spectator.at, power: sunPower(spectator) })
    return { ...spectator, health: 0, posture: 'dead' as const, cause: 'blast' as const }
  })
  return { crowd: blasts.reduce(applyBlast, { ...crowd, spectators }), blasts }
}

/** The Moon touches a Sun mark (Chrollo's hand): that one body detonates. */
export function detonateMark(
  crowd: CrowdState,
  id: string,
): { crowd: CrowdState; blast: Blast | null } {
  const body = spectatorById(crowd, id)
  if (!body?.marks.sun || body.posture === 'vanished') return { crowd, blast: null }
  const blast = { at: body.at, power: sunPower(body) }
  const spent = updateSpectator(crowd, id, (spectator) => ({
    ...spectator,
    health: 0,
    posture: 'dead',
    cause: 'blast',
    marks: { ...spectator.marks, sun: false },
  }))
  return { crowd: applyBlast(spent, blast), blast }
}
