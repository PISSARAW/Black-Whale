import { throwSpectator } from '../crowd/actions'
import { spectatorById } from '../crowd/create'
import { DT } from '../crowd/step'
import {
  chargeSun,
  controlWithBlackVoice,
  copyByTouch,
  detonateMark,
  giveCollectiveOrder,
  markMoon,
  markSun,
  orderPuppet,
  stampCopy,
  wearChrolloFace,
} from '../puppets/pipeline'
import { damageFromBlast, type Blast } from '../stands/damage'
import type { Vec3 } from '../stands/geometry'
import { applyBookStep, bookStepsTo, pagesServed, type BookStep } from './book'
import { PAGES_FOR, TOUCH, type ChrolloDecision, type ChrolloIntent } from './tactics'
import { distance, hisokaSees, type DeathMatchWorld } from './world'

export const CHROLLO_SPEED = 4.5
/** Without the speakers, a spoken order reaches only the puppets this close. */
export const VOICE_RANGE = 6

/** What one decision did: a page gesture, a change of the world, or a move for the fight engine. */
export interface ChrolloOutcome {
  world: DeathMatchWorld
  /** A gesture on the book shown in his hand this frame, instead of the intent. */
  bookStep: BookStep | null
  /** Intents the fight engine performs with Chrollo's own body (strikes, feints). */
  engineIntent: ChrolloIntent | null
  blast: Blast | null
}

function moveChrollo(world: DeathMatchWorld, to: Vec3): DeathMatchWorld {
  const gap = distance(world.chrollo.at, to)
  const step = CHROLLO_SPEED * DT
  const k = gap <= step ? 1 : step / gap
  const at = {
    x: world.chrollo.at.x + (to.x - world.chrollo.at.x) * k,
    y: world.chrollo.at.y + (to.y - world.chrollo.at.y) * k,
    z: world.chrollo.at.z + (to.z - world.chrollo.at.z) * k,
  }
  return { ...world, chrollo: { ...world.chrollo, at } }
}

const withCrowd = (world: DeathMatchWorld, crowd: DeathMatchWorld['crowd']) => ({ ...world, crowd })

function order(
  world: DeathMatchWorld,
  intent: Extract<ChrolloIntent, { kind: 'order' }>,
): DeathMatchWorld {
  if (world.chrollo.microphone)
    return withCrowd(world, giveCollectiveOrder(world.crowd, intent.order))
  let crowd = world.crowd
  for (const spectator of crowd.spectators)
    if (distance(spectator.at, world.chrollo.at) <= VOICE_RANGE)
      crowd = orderPuppet(crowd, spectator.id, intent.order)
  return withCrowd(world, crowd)
}

/** Convert Hands on a person hides Chrollo behind their face; on a copy it makes a false Chrollo. */
function convertHands(world: DeathMatchWorld, target: string): DeathMatchWorld {
  const crowd = wearChrolloFace(world.crowd, target, world.chrollo.book)
  if (crowd === world.crowd) return world
  const human = spectatorById(crowd, target)?.nature !== 'copy'
  return {
    ...world,
    crowd,
    chrollo: { ...world.chrollo, disguisedAs: human ? target : world.chrollo.disguisedAs },
  }
}

function detonate(
  world: DeathMatchWorld,
  target: string,
): { world: DeathMatchWorld; blast: Blast | null } {
  const body = spectatorById(world.crowd, target)
  // A body bearing both marks joins its own hands; otherwise the Moon is Chrollo's palm.
  if (!body || (!body.marks.moon && distance(body.at, world.chrollo.at) > TOUCH))
    return { world: body ? moveChrollo(world, body.at) : world, blast: null }
  const result = detonateMark(world.crowd, target)
  if (!result.blast) return { world, blast: null }
  return {
    world: {
      ...withCrowd(world, result.crowd),
      damage: damageFromBlast(world.damage, result.blast),
    },
    blast: result.blast,
  }
}

type Applier = (world: DeathMatchWorld, intent: never) => DeathMatchWorld

const APPLY: Partial<Record<ChrolloIntent['kind'], Applier>> = {
  move: (world, intent: { to: Vec3 }) => moveChrollo(world, intent.to),
  retreat: (world, intent: { to: Vec3 }) => moveChrollo(world, intent.to),
  'take-microphone': (world) => ({ ...world, chrollo: { ...world.chrollo, microphone: true } }),
  'black-voice': (world, intent: { target: string }) =>
    withCrowd(world, controlWithBlackVoice(world.crowd, intent.target, world.chrollo.book)),
  copy: (world, intent: { target: string }) =>
    withCrowd(
      world,
      copyByTouch(world.crowd, {
        sourceId: intent.target,
        book: world.chrollo.book,
        hisokaSees: hisokaSees(world, world.chrollo.at),
      }),
    ),
  'mark-sun': (world, intent: { target: string }) =>
    withCrowd(world, markSun(world.crowd, intent.target, world.chrollo.book)),
  'mark-moon': (world, intent: { target: string }) =>
    withCrowd(world, markMoon(world.crowd, intent.target, world.chrollo.book)),
  stamp: (world, intent: { target: string }) =>
    withCrowd(world, stampCopy(world.crowd, intent.target, world.chrollo.book)),
  'convert-hands': (world, intent: { target: string }) => convertHands(world, intent.target),
  'charge-sun': (world, intent: { targets: string[] }) =>
    withCrowd(world, chargeSun(world.crowd, intent.targets, 1)),
  order,
  'order-one': (world, intent: { target: string; order: Parameters<typeof orderPuppet>[2] }) =>
    withCrowd(world, orderPuppet(world.crowd, intent.target, intent.order)),
  throw: (world, intent: { target: string; at: Vec3 }) => {
    const from = spectatorById(world.crowd, intent.target)?.at ?? world.chrollo.at
    const flat = Math.hypot(intent.at.x - from.x, intent.at.z - from.z) || 1
    const velocity = {
      x: ((intent.at.x - from.x) / flat) * 8,
      y: 3,
      z: ((intent.at.z - from.z) / flat) * 8,
    }
    return withCrowd(world, throwSpectator(world.crowd, intent.target, velocity))
  },
}

const ENGINE_INTENTS: ReadonlySet<ChrolloIntent['kind']> = new Set([
  'feint-kicks',
  'present-abilities',
  'surprise-strike',
])

/** Each surprise blow is followed by this long a fall back into the crowd. */
export const WITHDRAWAL_FRAMES = 3 * 60

/** Turns a decision into one frame of action: the book first, then the gesture itself. */
export function executeChrollo(world: DeathMatchWorld, decision: ChrolloDecision): ChrolloOutcome {
  const { intent } = decision
  const pages = PAGES_FOR[intent.kind]
  if (pages && !pagesServed(world.chrollo.book, pages)) {
    const [step] = bookStepsTo(world.chrollo.book, pages[0], pages[1])
    if (step) {
      const book = applyBookStep(world.chrollo.book, step)
      return {
        world: { ...world, chrollo: { ...world.chrollo, book } },
        bookStep: step,
        engineIntent: null,
        blast: null,
      }
    }
  }
  if (intent.kind === 'detonate')
    return { ...detonate(world, intent.target), bookStep: null, engineIntent: null }
  if (intent.kind === 'surprise-strike') {
    const chrollo = { ...world.chrollo, withdrawal: WITHDRAWAL_FRAMES }
    return { world: { ...world, chrollo }, bookStep: null, engineIntent: intent, blast: null }
  }
  const apply = APPLY[intent.kind] as
    ((world: DeathMatchWorld, intent: ChrolloIntent) => DeathMatchWorld) | undefined
  return {
    world: apply ? apply(world, intent) : world,
    bookStep: null,
    engineIntent: ENGINE_INTENTS.has(intent.kind) ? intent : null,
    blast: null,
  }
}
