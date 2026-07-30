import { describe, expect, it } from 'vitest'
import {
  FOV_RANGE,
  SENSITIVITY_RANGE,
  SNAP_ANGLE_RANGE,
  comfortDefaults,
  readComfort,
} from './comfort'

describe('comfortDefaults', () => {
  it('starts the walk wide and continuous by default', () => {
    const lively = comfortDefaults(false)
    expect(lively.snapTurn).toBe(false)
    expect(lively.jumpOnly).toBe(false)
  })

  it('starts calm when the system asks for reduced motion', () => {
    const calm = comfortDefaults(true)
    expect(calm.snapTurn).toBe(true)
    expect(calm.jumpOnly).toBe(true)
    expect(calm.fov).toBeLessThan(comfortDefaults(false).fov)
    expect(calm.sensitivity).toBeLessThan(comfortDefaults(false).sensitivity)
  })

  it('hands back a copy, so one caller cannot edit the preset', () => {
    const first = comfortDefaults(false)
    first.fov = 99
    expect(comfortDefaults(false).fov).not.toBe(99)
  })
})

describe('readComfort', () => {
  it('falls back to the defaults with nothing stored', () => {
    expect(readComfort(null, false)).toEqual(comfortDefaults(false))
  })

  it('falls back to the defaults on nonsense', () => {
    expect(readComfort('{not json', false)).toEqual(comfortDefaults(false))
    expect(readComfort('null', false)).toEqual(comfortDefaults(false))
    expect(readComfort('"a string"', false)).toEqual(comfortDefaults(false))
  })

  it('keeps what was stored', () => {
    const stored = readComfort(JSON.stringify({ fov: 80, snapTurn: true }), false)
    expect(stored.fov).toBe(80)
    expect(stored.snapTurn).toBe(true)
  })

  it('fills in a field the stored entry does not carry', () => {
    const stored = readComfort(JSON.stringify({ fov: 80 }), false)
    expect(stored.jumpOnly).toBe(comfortDefaults(false).jumpOnly)
  })

  it('clamps a value an older entry could hold out of range', () => {
    const stored = readComfort(JSON.stringify({ fov: 0, sensitivity: 999, snapAngle: -20 }), false)
    expect(stored.fov).toBe(FOV_RANGE[0])
    expect(stored.sensitivity).toBe(SENSITIVITY_RANGE[1])
    expect(stored.snapAngle).toBe(SNAP_ANGLE_RANGE[0])
  })

  it('ignores a field of the wrong type rather than handing it to the camera', () => {
    const stored = readComfort(JSON.stringify({ fov: 'wide', snapTurn: 'yes' }), false)
    expect(stored.fov).toBe(comfortDefaults(false).fov)
    expect(stored.snapTurn).toBe(false)
  })
})
