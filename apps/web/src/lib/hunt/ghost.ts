import type { Vec2 } from '../tour/types'
import type { HuntReplayV3 } from './replay'
import type { Apparition } from '../tour/apparitions'

export interface GhostFrame {
  position: Vec2
  heading: number
  nen: 'ten' | 'zetsu'
  spaceId: string | null
}

export function ghostAt(replay: HuntReplayV3, at: number): GhostFrame | null {
  let before: { at: number; position: Vec2; heading: number; spaceId: string | null } | null = null
  let after: { at: number; position: Vec2; heading: number; spaceId: string | null } | null = null
  let nen: 'ten' | 'zetsu' = 'ten'

  for (const entry of replay.actions) {
    if (entry.action.type === 'ZETSU' && entry.at <= at) nen = nen === 'ten' ? 'zetsu' : 'ten'
    if (entry.action.type !== 'WALKED' || !entry.action.player.position) continue
    const frame = {
      at: entry.at,
      position: entry.action.player.position as Vec2,
      heading: entry.action.player.heading ?? 0,
      spaceId: entry.action.player.spaceId ?? null,
    }
    if (entry.at <= at) before = frame
    else { after = frame; break }
  }
  if (!before) return null
  if (!after || after.at === before.at) return { position: before.position, heading: before.heading, nen, spaceId: before.spaceId }
  const ratio = Math.max(0, Math.min(1, (at - before.at) / (after.at - before.at)))
  return {
    position: [
      before.position[0] + (after.position[0] - before.position[0]) * ratio,
      before.position[1] + (after.position[1] - before.position[1]) * ratio,
    ],
    heading: before.heading + (after.heading - before.heading) * ratio,
    nen,
    spaceId: before.spaceId,
  }
}

export function ghostFigure(
  frame: GhostFrame | null,
  scene: { tierId: string; floor: number },
): Apparition | null {
  if (!frame?.spaceId) return null
  return {
    id: 'hunt:ghost', kind: 'combatant', spaceId: frame.spaceId, tierId: scene.tierId,
    at: frame.position, heading: frame.heading, y: scene.floor, size: 1, colour: 0x67e8f9,
    stage: frame.nen === 'zetsu' ? 2 : 0, hidden: false,
    human: { role: 'fighter', pose: 'walk', aura: frame.nen, identity: 'previous-run' },
  }
}
