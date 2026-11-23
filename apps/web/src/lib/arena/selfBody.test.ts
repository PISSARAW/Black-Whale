import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { initialFighter } from '../combat/types'
import { buildHumanFigure } from '../tour/humanFigure'
import { EYE_HEIGHT } from '../tour/sceneOptics'
import { arenaFighter } from './fighting'
import { arenaSelfBody, EYES_FORWARD } from './selfBody'
import type { FighterId } from '../fighting/types'

const glow = (colour: number) => new THREE.MeshBasicMaterial({ color: colour })
const place = { spaceId: 'hall', tierId: 'T1', ground: 0 }

function wornBody(fighterId: FighterId, pose: 'idle' | 'guard' | 'attack') {
  const seen = arenaSelfBody({
    fighter: arenaFighter(fighterId),
    state: initialFighter([0, 0]),
    motion: 'idle',
    at: [0, 0],
    heading: 0,
    place,
  })
  const figure = buildHumanFigure({
    THREE,
    glow,
    seen: { ...seen, at: [0, 0], heading: 0, human: { ...seen.human!, pose } } as never,
  })
  figure.animate(0, pose)
  figure.root.updateMatrixWorld(true)
  return figure
}

/** Degrees under the camera's eye line, the camera standing in front of the neck. */
function underEyes(figure: ReturnType<typeof wornBody>, name: string): number {
  const fist = figure.root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3())
  return (Math.atan2(EYE_HEIGHT - fist.y, fist.z - EYES_FORWARD) * 180) / Math.PI
}

describe("Arena's first-person body", () => {
  it('stands behind the eyes and faces where they look', () => {
    const seen = arenaSelfBody({
      fighter: arenaFighter('kurapika'),
      state: initialFighter([0, 0]),
      motion: 'idle',
      at: [2, 3],
      heading: 0,
      place,
    })
    // The camera at heading 0 looks towards −z; the neck is behind it, at +z.
    expect(seen.at[0]).toBeCloseTo(2)
    expect(seen.at[1]).toBeCloseTo(3 + EYES_FORWARD)
    expect(seen.heading).toBeCloseTo(Math.PI)
    expect(seen.pick).toBe(false)
    expect(seen.human?.firstPerson).toBe(true)
  })

  it('does not draw the head the camera is inside', () => {
    const figure = wornBody('kurapika', 'idle')
    const hidden: string[] = []
    figure.root.traverse((part) => {
      if (/head/.test(part.name) && !part.visible) hidden.push(part.name)
    })
    expect(hidden.length).toBeGreaterThan(0)
  })

  it('draws the complete fighter at the simulated body in third person', () => {
    const state = { ...initialFighter([4, 5]), mode: 'ren' as const }
    const seen = arenaSelfBody({
      fighter: arenaFighter('kurapika'),
      state,
      motion: 'guard',
      at: [3, 2],
      heading: 0.5,
      place,
      perspective: 'third-person',
    })

    expect(seen.at).toEqual([4, 5])
    expect(seen.heading).toBeCloseTo(0.5 + Math.PI)
    expect(seen.human?.firstPerson).toBe(false)
    expect(seen.human?.aura).toBe('ren')
    expect(seen.human?.pose).toBe('guard')
  })

  it.each(['kurapika', 'hisoka', 'chrollo'] as const)(
    "raises %s's guard and strike into the field of view",
    (fighterId) => {
      const guard = wornBody(fighterId, 'guard')
      for (const fist of ['hand-left', 'hand-right'])
        expect(underEyes(guard, fist)).toBeGreaterThan(5)
      for (const fist of ['hand-left', 'hand-right'])
        expect(underEyes(guard, fist)).toBeLessThan(22)

      const strike = wornBody(fighterId, 'attack')
      expect(underEyes(strike, 'hand-right')).toBeGreaterThan(3)
      expect(underEyes(strike, 'hand-right')).toBeLessThan(20)
    },
  )

  it('leaves the arms down at rest, the way eyes looking ahead do not see them', () => {
    expect(underEyes(wornBody('kurapika', 'idle'), 'hand-right')).toBeGreaterThan(45)
  })
})
