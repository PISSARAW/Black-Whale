import { keyedMove } from './keyPoseMoves'
import { addPoses, pickJoints, scalePose, type FightPose } from './fightPose'
import { groundStrikeMove, rosterMotionStyle } from './rosterStrikeMotion'

const CACHE = new Map<string, FightPose>()

/** Shape the passage with the incoming gesture and the fighter's own load and release. */
export function rosterComboBridge(fromId: string, toId: string): FightPose | undefined {
  const from = groundStrikeMove(fromId),
    to = groundStrikeMove(toId)
  if (!from || !to || from.fighterId !== to.fighterId) return undefined
  const style = rosterMotionStyle(to.fighterId)
  if (!style) return undefined
  const key = `${fromId}>${toId}`
  const cached = CACHE.get(key)
  if (cached) return cached
  const incoming = keyedMove(to.fighterId, to.slot).timeline
  const windup = incoming.filter((pose) => pose.phase === 'startup').at(-1)?.pose ?? style.load
  const outgoing = keyedMove(from.fighterId, from.slot).timeline
  const follow = outgoing.find((pose) => pose.phase === 'recovery')?.pose ?? style.release
  const load = addPoses(
    scalePose(windup, 0.6),
    scalePose(style.load, 0.3 * style.amplitude),
    scalePose(pickJoints(follow, ['body', 'chest', 'leadHip', 'rearHip']), 0.12),
  )
  CACHE.set(key, load)
  return load
}
