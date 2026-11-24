import { isBiscuitTrueForm } from './biscuitForm'
import { BISCUIT_NATURAL_STANDING_STRIKES } from './standingStrikesWaveSeven'
import { addPoses, scalePose } from './fightPose'
import type { MoveTimeline, PhaseFrames } from './keyPoseTimeline'
import { STANDING_STRIKES } from './standingStrikeDirections'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

function direction(id: FighterId, slot: MoveSlot) {
  if (slot !== 'standingLight' && slot !== 'standingHeavy') return undefined
  return STANDING_STRIKES[id]?.[slot]
}

const CACHE = new Map<string, MoveTimeline>()

function naturalStandingStrike(slot: MoveSlot) {
  if (slot === 'standingLight' || slot === 'standingHeavy')
    return BISCUIT_NATURAL_STANDING_STRIKES[slot]
}

export function biscuitNaturalStandingTimeline(slot: MoveSlot): MoveTimeline | undefined {
  const strike = naturalStandingStrike(slot)
  if (!strike) return
  const key = `biscuit:natural:${slot}`
  const timeline = CACHE.get(key) ?? compileStrike(strike)
  CACHE.set(key, timeline)
  return timeline
}

export function standingStrikeTimeline(
  id: FighterId,
  slot: MoveSlot,
  native: MoveTimeline | null,
): MoveTimeline | null {
  const strike = direction(id, slot)
  if (!strike) return native
  const key = `${id}:${slot}`
  const cached = CACHE.get(key)
  if (cached) return cached
  const timeline = compileStrike(strike)
  CACHE.set(key, timeline)
  return timeline
}

function compileStrike({
  load,
  contact,
  release,
  chamberAt,
}: NonNullable<ReturnType<typeof direction>>): MoveTimeline {
  return [
    { phase: 'startup', at: 0.22, pose: scalePose(load, 0.47), ease: 'out' },
    {
      phase: 'startup',
      at: chamberAt,
      pose: load,
      ease: 'smooth',
      jointEase: { pelvis: 'out', chest: 'in' },
    },
    {
      phase: 'active',
      at: 0,
      pose: contact,
      ease: 'snap',
      jointEase: { pelvis: 'out', leadKnee: 'out', rearKnee: 'out' },
    },
    { phase: 'active', at: 1, pose: contact },
    {
      phase: 'recovery',
      at: 0.15,
      pose: addPoses(scalePose(contact, 0.68), scalePose(release, 0.32)),
      ease: 'out',
    },
    { phase: 'recovery', at: 0.52, pose: release, ease: 'smooth' },
    { phase: 'recovery', at: 0.87, pose: scalePose(release, 0.19), ease: 'out' },
  ]
}

export function standingStrikeSupport(fighter: ArcadeFighter, slot: MoveSlot, frames: PhaseFrames) {
  const strike = isBiscuitTrueForm(fighter)
    ? naturalStandingStrike(slot)
    : direction(fighter.id, slot)
  if (!fighter.attack || !strike) return undefined
  const supportFoot = strike.support
  const pressure = Math.min(1, fighter.attack.frame / Math.max(1, frames.startup))
  const recovery = Math.max(0, fighter.attack.frame - frames.startup - frames.active)
  const release = 1 - Math.min(1, recovery / Math.max(1, frames.recovery))
  return {
    supportFoot,
    pivotFoot: supportFoot === 'lead' ? ('rear' as const) : ('lead' as const),
    pivotAngle: (strike.contact.pelvis?.[1] ?? 0) * pressure * release * 0.6,
  }
}
