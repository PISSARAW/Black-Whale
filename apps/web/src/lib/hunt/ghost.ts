import type { Vec2 } from '../tour/types'
import type { HuntReplayV3 } from './replay'

export interface GhostFrame {
  position: Vec2
  heading: number
  nen: 'ten' | 'zetsu'
}

export function ghostAt(replay: HuntReplayV3, at: number): GhostFrame | null {
  let before: { at: number; position: Vec2; heading: number } | null = null
  let after: { at: number; position: Vec2; heading: number } | null = null
  let nen: 'ten' | 'zetsu' = 'ten'

  for (const entry of replay.actions) {
    if (entry.action.type === 'ZETSU' && entry.at <= at) nen = nen === 'ten' ? 'zetsu' : 'ten'
    if (entry.action.type !== 'WALKED' || !entry.action.player.position) continue
    const frame = {
      at: entry.at,
      position: entry.action.player.position as Vec2,
      heading: entry.action.player.heading ?? 0,
    }
    if (entry.at <= at) before = frame
    else { after = frame; break }
  }
  if (!before) return null
  if (!after || after.at === before.at) return { position: before.position, heading: before.heading, nen }
  const ratio = Math.max(0, Math.min(1, (at - before.at) / (after.at - before.at)))
  return {
    position: [
      before.position[0] + (after.position[0] - before.position[0]) * ratio,
      before.position[1] + (after.position[1] - before.position[1]) * ratio,
    ],
    heading: before.heading + (after.heading - before.heading) * ratio,
    nen,
  }
}
