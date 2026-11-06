import { describe, expect, it } from 'vitest'
import type { SceneRuntime } from './TourRenderer'
import { WalkTemporalState } from './walkPostEffects'
import type { Vec2 } from './types'

const pass = () => ({ accumulate: false }) as NonNullable<SceneRuntime['taa']>

describe('temporal sampling during the walk and Melody’s concert', () => {
  it('resumes accumulation after the concert when the camera is still', () => {
    const temporal = new WalkTemporalState()
    const taa = pass()
    const frame = { at: [0, 0] as Vec2, yaw: 0, pitch: 0, concert: false }
    temporal.update(taa, frame)
    expect(taa.accumulate).toBe(true)
    temporal.update(taa, { ...frame, concert: true })
    expect(taa.accumulate).toBe(false)
    temporal.update(taa, frame)
    expect(taa.accumulate).toBe(true)
  })

  it('resets sampling after walking or looking, including a reused position array', () => {
    const temporal = new WalkTemporalState()
    const taa = pass()
    const at: [number, number] = [0, 0]
    const frame = { at, yaw: 0, pitch: 0, concert: false }
    temporal.update(taa, frame)
    at[0] = 1
    temporal.update(taa, frame)
    expect(taa.accumulate).toBe(false)
    temporal.update(taa, frame)
    expect(taa.accumulate).toBe(true)
    temporal.update(taa, { ...frame, yaw: 0.1 })
    expect(taa.accumulate).toBe(false)
    temporal.update(taa, { ...frame, yaw: 0.1, pitch: 0.1 })
    expect(taa.accumulate).toBe(false)
  })
})
