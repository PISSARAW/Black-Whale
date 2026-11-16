import { describe, expect, it } from 'vitest'
import { addPoses, lerpPose, pickJoints } from './fightPose'
import { heldFrame, keyFrameOf, sampleTimeline, type MoveTimeline } from './keyPoseTimeline'
import { keyedSlots, keyPoseTimeline } from './keyPoseMoves'
import { moveForSlot } from './movesets'

const frames = { startup: 6, active: 4, recovery: 12 }
const contact = { leadShoulder: [-1.5, 0, 0] as const }
const timeline: MoveTimeline = [
  { phase: 'startup', at: 0.5, pose: { leadShoulder: [0.3, 0, 0] }, ease: 'out' },
  { phase: 'active', at: 0, pose: contact, ease: 'snap' },
  { phase: 'active', at: 1, pose: contact },
]

const shoulderAt = (frame: number) =>
  sampleTimeline(timeline, { frame, frames }).leadShoulder?.[0] ?? 0

describe('key pose timeline', () => {
  it('pins keys to the phase they belong to', () => {
    expect(keyFrameOf(timeline[0], frames)).toBe(3)
    expect(keyFrameOf(timeline[1], frames)).toBe(6)
    expect(keyFrameOf({ phase: 'recovery', at: 0.5, pose: {} }, frames)).toBe(16)
  })

  it('reaches contact on the first active frame and holds it through the active frames', () => {
    for (let frame = 6; frame < 10; frame += 1) expect(shoulderAt(frame)).toBeCloseTo(-1.5)
  })

  it('winds up against the strike before snapping into it', () => {
    expect(shoulderAt(2)).toBeGreaterThan(0.1)
  })

  it('holds frames on twos outside the active window', () => {
    expect(heldFrame(3, frames)).toBe(2)
    expect(heldFrame(7, frames)).toBe(7)
    expect(heldFrame(13, frames)).toBe(12)
    expect(shoulderAt(12)).toBe(shoulderAt(13))
  })

  it('settles back into the stance by the end of recovery', () => {
    expect(Math.abs(shoulderAt(22))).toBeLessThan(1e-6)
    expect(shoulderAt(14)).toBeLessThan(-0.3)
  })
})

describe('fight poses', () => {
  it('blends and sums joints, treating a missing joint as rest', () => {
    expect(lerpPose({ chest: [0, 1, 0] }, {}, 0.25).chest).toEqual([0, 0.75, 0])
    expect(addPoses({ leadKnee: [0.5, 0, 0] }, { leadKnee: [0.25, 0, 0] }).leadKnee).toEqual([
      0.75, 0, 0,
    ])
    expect(pickJoints({ chest: [0, 1, 0], leadKnee: [1, 0, 0] }, ['chest'])).toEqual({
      chest: [0, 1, 0],
    })
  })
})

describe('keyed moves', () => {
  it.each(['kurapika', 'hisoka'] as const)('keys the six normals of %s', (id) => {
    expect(keyedSlots(id).sort()).toEqual(
      ['airHeavy', 'airLight', 'lowHeavy', 'lowLight', 'standingHeavy', 'standingLight'].sort(),
    )
    for (const slot of keyedSlots(id)) {
      expect(moveForSlot(id, slot)).not.toBeNull()
      const keys = keyPoseTimeline(id, slot) ?? []
      expect(keys.some((key) => key.phase === 'active' && key.at === 0)).toBe(true)
    }
  })
})
