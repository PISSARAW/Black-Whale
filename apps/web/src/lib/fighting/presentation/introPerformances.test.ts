import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { rightHandedPose } from '../fightHandedPose'
import { fightWorldX } from '../fightCoordinates'
import { INTRO_PERFORMANCES, introPerformance } from './introPerformances'
import { sampleIntroCamera, sampleIntroPose } from './introPerformanceSample'
import { applyIntroFreeCamera, introActorHeight, introInFrame } from './introFreeCamera'
import { applyPresentationCamera } from './introCamera'
import type { Turn } from '../fightPose'

function expectTurn(actual: Turn | undefined, expected: Turn) {
  expected.forEach((value, index) => expect(actual?.[index]).toBeCloseTo(value, 10))
}

describe('individual entrance direction', () => {
  it('authors a distinct choreography and orbit for exactly the forty selectable fighters', () => {
    expect(Object.keys(INTRO_PERFORMANCES).sort()).toEqual(FIGHTING_ROSTER.map((f) => f.id).sort())
    const performances = Object.values(INTRO_PERFORMANCES)
    expect(new Set(performances.map((p) => JSON.stringify(p.camera))).size).toBe(40)
    expect(new Set(performances.map((p) => JSON.stringify(p.poses))).size).toBe(40)
    expect(new Set(performances.map((p) => p.intention)).size).toBe(40)
    expect(introPerformance('marayam')).toBeUndefined()
  })

  it.each(FIGHTING_ROSTER.map((f) => f.id))(
    '%s moves through authored beats and settles into guard',
    (id) => {
      const p = introPerformance(id)!
      expect(p.beats[0]).toBeGreaterThan(0)
      expect(p.beats[0]).toBeLessThan(p.beats[1])
      expect(p.beats[1]).toBeLessThan(p.beats[2])
      expect(p.beats[2]).toBeLessThan(1)
      const standing = { head: [0, 0, 0] as const, leadKnee: [0.3, 0, 0] as const }
      const base = { standing, mirrorHands: false }
      expect(sampleIntroPose(p, base, 0)).toEqual(standing)
      expect(sampleIntroPose(p, base, 1)).toEqual(standing)
      const signature = sampleIntroPose(p, base, p.beats[1])
      for (const [joint, turn] of Object.entries(p.poses[1]))
        expectTurn(signature[joint as keyof typeof signature], turn)
      const mirrored = sampleIntroPose(p, { ...base, mirrorHands: true }, p.beats[1])
      for (const [joint, turn] of Object.entries(rightHandedPose(p.poses[1])))
        expectTurn(mirrored[joint as keyof typeof mirrored], turn)
      expect(sampleIntroCamera(p, p.beats[1])).toEqual([
        ...p.camera[1].slice(0, 4),
        p.camera[1][4] ?? 0,
      ])
      expect(sampleIntroCamera(p, 0)).not.toEqual(sampleIntroCamera(p, 1))
    },
  )

  it.each([16 / 9, 390 / 720, 320 / 720])(
    'fits every orbit and both seats at aspect %s',
    (aspect) => {
      const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
      for (const { id } of FIGHTING_ROSTER) {
        const state = createFight(id, id)
        const before = structuredClone(state)
        for (const side of ['player', 'opponent'] as const) {
          const fighter = state[side]
          const bounds = { x: fightWorldX(fighter.x), height: introActorHeight(fighter) }
          for (const progress of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
            expect(applyIntroFreeCamera(camera, { fighter, progress, intensity: 1 })).toBe(true)
            expect(camera.position.toArray().every(Number.isFinite)).toBe(true)
            expect(camera.quaternion.toArray().every(Number.isFinite)).toBe(true)
            expect(introInFrame(camera, bounds), `${id}:${side}:${progress}`).toBe(true)
          }
        }
        expect(state).toEqual(before)
      }
    },
  )

  it('keeps camera movement continuous rather than stepping between fitting distances', () => {
    const camera = new PerspectiveCamera(34, 320 / 720, 0.1, 100)
    const previous = new Vector3()
    for (const { id } of FIGHTING_ROSTER) {
      const fighter = createFight(id, 'hisoka').player
      applyIntroFreeCamera(camera, { fighter, progress: 0, intensity: 1 })
      previous.copy(camera.position)
      for (let frame = 1; frame <= 144; frame++) {
        applyIntroFreeCamera(camera, { fighter, progress: frame / 144, intensity: 1 })
        expect(camera.position.distanceTo(previous), `${id}:${frame}`).toBeLessThan(0.3)
        previous.copy(camera.position)
      }
    }
  })

  it('mirrors the orbit with facing and preserves existing authored film cameras', () => {
    const state = createFight('hisoka', 'hisoka')
    const a = new PerspectiveCamera(34, 16 / 9, 0.1, 100)
    const b = a.clone()
    applyIntroFreeCamera(a, { fighter: state.player, progress: 0.55, intensity: 1 })
    applyIntroFreeCamera(b, { fighter: state.opponent, progress: 0.55, intensity: 1 })
    expect(a.position.x + b.position.x).toBeCloseTo(0)
    expect(a.position.y).toBeCloseTo(b.position.y)
    expect(a.position.z).toBeCloseTo(b.position.z)
    const options = {
      camera: a,
      state,
      intro: null,
      authored: { x: 0, lookY: 1.3, z: 8, intensity: 0 },
      intensity: 1,
      reduced: false,
    }
    expect(applyPresentationCamera(options)).toBe(true)
    expect(a.position.x).toBe(0)
    expect(a.position.y).toBeCloseTo(1.85)
  })
})
