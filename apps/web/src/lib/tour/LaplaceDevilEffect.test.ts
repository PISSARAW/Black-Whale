import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  LAPLACE_RADIUS_METRES,
  LaplaceDevilEffect,
  outsideLaplaceField,
  type LaplaceFrame,
} from './LaplaceDevilEffect'

const frame = (changes: Partial<LaplaceFrame> = {}): LaplaceFrame => ({
  clock: 0,
  tierId: 'tier-1',
  position: [2, 3],
  yaw: 0.4,
  pitch: -0.1,
  ground: 7,
  delta: 0,
  reducedMotion: true,
  visionActive: true,
  abilityActive: true,
  ...changes,
})

describe('Laplace Devil in the Tour', () => {
  it('returns the visitor to the activation instant and removes the dream from world time', () => {
    const scene = new THREE.Scene()
    const effect = new LaplaceDevilEffect(THREE, scene)

    expect(effect.update(frame())).toBeNull()
    for (let second = 1; second <= 10; second++) {
      effect.update(frame({ clock: second, position: [2 + second, 3], yaw: 0.4 + second / 20 }))
    }

    expect(effect.update(frame({ clock: 10, position: [12, 3], visionActive: false }))).toEqual({
      tierId: 'tier-1',
      position: [2, 3],
      yaw: 0.4,
      pitch: -0.1,
      ground: 7,
    })
    expect(effect.clockOffset).toBe(10)
    effect.dispose()
  })

  it('keeps the boundary inclusive and ends the field beyond 36 metres or another deck', () => {
    const anchor = { tierId: 'tier-1', at: [0, 0] as [number, number] }
    expect(
      outsideLaplaceField(anchor, {
        tierId: 'tier-1',
        at: [LAPLACE_RADIUS_METRES, 0],
      }),
    ).toBe(false)
    expect(
      outsideLaplaceField(anchor, {
        tierId: 'tier-1',
        at: [LAPLACE_RADIUS_METRES + 0.01, 0],
      }),
    ).toBe(true)
    expect(outsideLaplaceField(anchor, { tierId: 'tier-2', at: [0, 0] })).toBe(true)
  })
})
