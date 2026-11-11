/**
 * The visitor's aura, as a quantity.
 *
 * Without a price the vocabulary has no decisions in it: a visitor who can hold
 * Ken, En and Gyo forever holds all three forever, and the stealth loop in
 * `cast/sensing.ts` collapses into "always sweep, always guard". This is the
 * price, and it is the manga's rather than a game's:
 *
 * - **Ten keeps.** It is the body holding its own aura, so it refills slowly.
 * - **Zetsu rests.** Closing the nodes is how a Nen user recovers fastest —
 *   which makes the discreet approach also the breathing one.
 * - **Everything raised spends.** Ren is aura pushed out; Ken is Ren held over
 *   the whole body; En is a sweep whose cost grows with its radius; Gyo, In,
 *   Ryu, Ko and Shu each shape aura that has to come from somewhere.
 * - **On costs nothing.** It is imposed and cannot be put down, so draining it
 *   would only ever end in an exhaustion the walker could not act on.
 *
 * Pure, one number per second, no clock of its own: the page's beat calls it.
 * Hunt keeps its own pool (`hunt/aura.ts`) with its own economy; the two are
 * different games and share the engine's states, not each other's prices.
 */
import {
  transitionNen,
  type NenTechnique,
  type NenTechniqueAction,
  type NenTechniqueState,
} from '@black-whale/nen-engine'

export const RESERVE_MAX = 100

/**
 * Below this, nothing that drains may be raised.
 *
 * Without a threshold a visitor at zero would raise Ren, be dropped to Ten the
 * next beat, raise it again — a flicker rather than a rule. Twenty is a few
 * seconds of Ken or most of a short sweep: enough to act, not enough to camp.
 */
export const RESUME_AT = 20

/** Per second. Positive refills, negative spends. */
const RATE = {
  zetsu: 6,
  ten: 2,
  ren: -3,
  ken: -5,
  /** Per metre of radius: the visitor's sweep of eight costs four a second. */
  enPerMetre: -0.5,
  gyo: -1,
  in: -1,
  ko: -4,
  ryu: -1,
  shuPerObject: -1,
} as const

/** What this state does to the reserve each second. */
export function flowOf(nen: NenTechniqueState): number {
  if (nen.mode === 'zetsu') return RATE.zetsu
  if (nen.on) return 0
  const base = nen.mode === 'ten' ? RATE.ten : RATE.ren
  return base + shapingCost(nen)
}

function shapingCost(nen: NenTechniqueState): number {
  const distributed = Object.keys(nen.ryu).length > 0
  return (
    (nen.ken ? RATE.ken : 0) +
    (nen.en ? nen.en.radius * RATE.enPerMetre : 0) +
    (nen.gyo ? RATE.gyo : 0) +
    (nen.in ? RATE.in : 0) +
    (nen.ko ? RATE.ko : distributed ? RATE.ryu : 0) +
    nen.shu.length * RATE.shuPerObject
  )
}

/** One beat of the reserve, clamped to what a body can hold. */
export function breathe(reserve: number, nen: NenTechniqueState, seconds = 1): number {
  return Math.min(RESERVE_MAX, Math.max(0, reserve + flowOf(nen) * seconds))
}

/**
 * What an emptied body lets go of, in order.
 *
 * Ten first, because the engine's Ten already drops Ken, Ko and Ryu; then the
 * shaping it keeps — the sweep, the eyes, the veil, the objects. Ten itself is
 * kept: it refills, and dropping a visitor into Zetsu for running dry would be
 * the walk choosing their stealth for them.
 */
export function exhaustionActions(nen: NenTechniqueState): NenTechniqueAction[] {
  if (flowOf(nen) >= 0) return []
  const actions: NenTechniqueAction[] = [{ type: 'TEN' }]
  if (nen.en) actions.push({ type: 'EN', radius: null })
  if (nen.gyo) actions.push({ type: 'GYO', on: false })
  if (nen.in) actions.push({ type: 'IN', on: false })
  for (const objectId of nen.shu) actions.push({ type: 'SHU', objectId, on: false })
  return actions
}

/**
 * Whether the reserve refuses this action.
 *
 * Only an action that makes the body spend, and spend more than it does now,
 * is refused — so letting go of something, or resting, is always allowed.
 */
export function refusedByReserve(
  reserve: number,
  nen: NenTechniqueState,
  action: NenTechniqueAction,
): boolean {
  if (reserve >= RESUME_AT) return false
  const next = transitionNen(nen, action)
  if (!next.accepted) return false
  const flow = flowOf(next.state)
  return flow < 0 && flow < flowOf(nen)
}

/** The press each button would make, to ask the reserve about it in advance. */
const PROBES: Partial<Record<NenTechnique, NenTechniqueAction>> = {
  ren: { type: 'REN' },
  ken: { type: 'KEN', on: true },
  en: { type: 'EN', radius: 8 },
  gyo: { type: 'GYO', on: true },
  in: { type: 'IN', on: true },
  ko: { type: 'KO', zone: 'hands' },
  ryu: { type: 'RYU', distribution: { hands: 0.55, torso: 0.45 } },
}

export const RESERVE_TOO_LOW = 'Réserve d’aura trop basse : reposez-vous en Ten ou en Zetsu.'

/** What the Nen panel should grey out, with the reason it shows on hover. */
export function reserveAvailability(
  reserve: number,
  nen: NenTechniqueState,
): Partial<Record<NenTechnique, string>> {
  const blocked: Partial<Record<NenTechnique, string>> = {}
  for (const [technique, action] of Object.entries(PROBES) as [NenTechnique, NenTechniqueAction][])
    if (refusedByReserve(reserve, nen, action)) blocked[technique] = RESERVE_TOO_LOW
  return blocked
}
