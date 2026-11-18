import type { FighterId, FightSide, FightState } from './types'
import { fighterAnchored } from './fighterAnchors'

const CROWDED_FIGHTERS: Partial<Record<FighterId, number>> = {
  franklin: 2.35,
  illumi: 1.4,
  shizuku: 1.8,
  kurapika: 1.2,
}
type Position = { x: number; y: number }

/** Give close-contact silhouettes room on the render plane. Combat coordinates stay authoritative. */
export function closeFightPosition(
  state: FightState,
  side: FightSide,
  positions: { body: Position; rival: Position },
): Position & { z: number } {
  const other = side === 'player' ? 'opponent' : 'player'
  const { body, rival } = positions
  const delta = rival.x - body.x
  const ownSpace = spaceFor(state[side].id)
  const rivalSpace = spaceFor(state[other].id)
  const clearance = Math.max(ownSpace, rivalSpace)
  if (!clearance || state.phase !== 'fighting' || state.catsName) return { ...body, z: 0 }
  const ground = Math.max(0, 1 - Math.abs(body.y - rival.y) / 3)
  const spread = 3.2 * clearance
  const near = Math.min(1, Math.max(0, (4.5 + spread - Math.abs(delta)) / spread))
  const weight = near * near * (3 - 2 * near) * ground
  if (!weight) return { ...body, z: 0 }
  if (
    [state[side], state[other]].some(
      (fighter) =>
        fighterAnchored(fighter) ||
        fighter.hanzoProjection ||
        fighter.clothCapture ||
        fighter.maryCapture ||
        fighter.biohazardRestraint ||
        fighter.attack?.variant === 'throw',
    )
  )
    return { ...body, z: 0 }
  const direction = Math.sign(delta) || state[side].facing
  const lane =
    ownSpace === rivalSpace ? (side === 'player' ? 1 : -1) : Math.sign(ownSpace - rivalSpace)
  return { ...body, x: body.x - direction * clearance * weight, z: lane * 0.12 * weight }
}

function spaceFor(id: FighterId): number {
  return CROWDED_FIGHTERS[id] ?? 0
}
