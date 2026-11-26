import { DT } from './step'
import { spectatorById, updateSpectator } from './create'
import type { CrowdState, DetachedHead, HisokaLimb } from './types'
import { living } from './types'
import type { Blast } from '../stands/damage'
import type { Vec3 } from '../stands/geometry'

const GRAVITY = 9.8
/** Height of a standing head above the feet. */
const HEAD_HEIGHT = 1.55

export function headsOf(crowd: CrowdState): readonly DetachedHead[] {
  return crowd.heads ?? []
}

function withHeads(crowd: CrowdState, heads: readonly DetachedHead[]): CrowdState {
  return { ...crowd, heads }
}

export function headOfBody(crowd: CrowdState, bodyId: string): DetachedHead | undefined {
  return headsOf(crowd).find((head) => head.bodyId === bodyId && !head.spent)
}

/**
 * A card through the neck: the body falls, the head goes on with its own mark and its
 * tie to the body. A copy's head is matter like the rest of it.
 */
export function decapitate(crowd: CrowdState, id: string): CrowdState {
  const body = spectatorById(crowd, id)
  if (!body || body.headless || body.posture === 'vanished') return crowd
  const head: DetachedHead = {
    id: `h${id}`,
    bodyId: id,
    at: { ...body.at, y: body.at.y + HEAD_HEIGHT },
    velocity: { x: 0, y: 1.2, z: 0.4 },
    tiedTo: null,
    flying: true,
    sun: body.marks.sun && body.marks.sunSite === 'head',
    spent: false,
  }
  const cut = updateSpectator(crowd, id, (spectator) => ({
    ...spectator,
    headless: true,
    health: 0,
    posture: 'dead',
    cause: 'trauma',
    revealedToHisoka: true,
  }))
  return withHeads(cut, [...headsOf(cut), head])
}

function changeHead(
  crowd: CrowdState,
  id: string,
  change: (head: DetachedHead) => DetachedHead,
): CrowdState {
  return withHeads(
    crowd,
    headsOf(crowd).map((head) => (head.id === id ? change(head) : head)),
  )
}

/** Bungee Gum on a head: it now follows one of Hisoka's limbs. */
export function tieHead(crowd: CrowdState, id: string, limb: HisokaLimb): CrowdState {
  return changeHead(crowd, id, (head) => ({ ...head, tiedTo: limb, flying: false }))
}

export function replaceTiedHead(crowd: CrowdState, id: string, limb: HisokaLimb): CrowdState {
  const heads = headsOf(crowd).map((head) =>
    head.id !== id && head.tiedTo === limb ? { ...head, tiedTo: null, flying: true } : head,
  )
  return tieHead(withHeads(crowd, heads), id, limb)
}

/** The gum lets go and the head flies at `target`: a hammer, or a thrown stone. */
export function launchHead(crowd: CrowdState, id: string, target: Vec3): CrowdState {
  return changeHead(crowd, id, (head) => {
    const dx = target.x - head.at.x
    const dz = target.z - head.at.z
    const flat = Math.hypot(dx, dz) || 1
    const time = flat / 12
    return {
      ...head,
      tiedTo: null,
      flying: true,
      velocity: {
        x: dx / time,
        y: (target.y + 1.2 - head.at.y) / time + (GRAVITY * time) / 2,
        z: dz / time,
      },
    }
  })
}

const LIMB_OFFSET: Record<HisokaLimb, Vec3> = {
  'left-hand': { x: -0.35, y: 1.05, z: 0.1 },
  'right-hand': { x: 0.35, y: 1.05, z: 0.1 },
  'left-foot': { x: -0.15, y: 0.08, z: 0.05 },
  'right-foot': { x: 0.15, y: 0.08, z: 0.05 },
}

export function limbPosition(hisoka: Vec3, limb: HisokaLimb): Vec3 {
  const offset = LIMB_OFFSET[limb]
  return { x: hisoka.x + offset.x, y: hisoka.y + offset.y, z: hisoka.z + offset.z }
}

/** Heads tied to Hisoka follow his limbs; loose ones fly and fall. */
export function stepHeads(crowd: CrowdState, hisoka: Vec3): CrowdState {
  if (!crowd.heads?.length) return crowd
  return withHeads(
    crowd,
    crowd.heads.map((head) => {
      if (head.spent) return head
      if (head.tiedTo) return { ...head, at: limbPosition(hisoka, head.tiedTo) }
      if (!head.flying) return head
      const velocity = { ...head.velocity, y: head.velocity.y - GRAVITY * DT }
      const at = {
        x: head.at.x + velocity.x * DT,
        y: head.at.y + velocity.y * DT,
        z: head.at.z + velocity.z * DT,
      }
      return at.y <= 0 && velocity.y < 0
        ? { ...head, at: { ...at, y: 0 }, flying: false }
        : { ...head, at, velocity }
    }),
  )
}

/** A flying head that reaches `point` this frame strikes it once. */
export function headStriking(crowd: CrowdState, point: Vec3): DetachedHead | undefined {
  return headsOf(crowd).find(
    (head) =>
      head.flying &&
      !head.spent &&
      Math.hypot(head.at.x - point.x, head.at.y - point.y - 1, head.at.z - point.z) < 0.7,
  )
}

export function spendHead(crowd: CrowdState, id: string): CrowdState {
  return changeHead(crowd, id, (head) => ({ ...head, spent: true, flying: false }))
}

/**
 * The body is detonated and its head with it, wherever the head is: in Hisoka's hand,
 * the blast goes off in his hand.
 */
export function detonateBodyAndHead(
  crowd: CrowdState,
  bodyId: string,
  power: number,
): { crowd: CrowdState; blasts: Blast[] } {
  const body = spectatorById(crowd, bodyId)
  const head = headOfBody(crowd, bodyId)
  if (!body || !body.marks.sun || !head) return { crowd, blasts: [] }
  const blasts = [
    { at: body.at, power },
    { at: head.at, power },
  ]
  const spent = spendHead(
    updateSpectator(crowd, bodyId, (spectator) => ({
      ...spectator,
      marks: { ...spectator.marks, sun: false },
      posture: living(spectator) ? 'dead' : spectator.posture,
    })),
    head.id,
  )
  return { crowd: spent, blasts }
}
