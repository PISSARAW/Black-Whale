import { describe, expect, it } from 'vitest'
import {
  FOV_RANGE,
  HEAD_BOB_RANGE,
  NIGHT_LIGHT_RANGE,
  SENSITIVITY_RANGE,
  SNAP_ANGLE_RANGE,
  WALK_PACE_RANGE,
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

  /**
   * The light the visitor carries, which is the only setting whose interesting
   * value is zero: a visitor who wants the ship exactly as lit as the ship is has
   * asked for nothing, and nothing must not be read as "unset".
   */
  it('keeps the light put out, rather than treating off as unset', () => {
    const stored = readComfort(JSON.stringify({ nightLight: 0 }), false)
    expect(stored.nightLight).toBe(0)
    expect(comfortDefaults(false).nightLight).toBeGreaterThan(0)
  })

  it('clamps the light to a reach and never to a torch', () => {
    expect(readComfort(JSON.stringify({ nightLight: 900 }), false).nightLight).toBe(
      NIGHT_LIGHT_RANGE[1],
    )
    expect(readComfort(JSON.stringify({ nightLight: -4 }), false).nightLight).toBe(
      NIGHT_LIGHT_RANGE[0],
    )
    expect(readComfort(JSON.stringify({ nightLight: 'bright' }), false).nightLight).toBe(
      comfortDefaults(false).nightLight,
    )
  })

  it('leaves the light alone for a visitor who asked for less movement', () => {
    // Reduced motion is a request about movement. A darker ship is not implied by
    // it, and a dark stairwell is no easier to read for jumping into it.
    expect(comfortDefaults(true).nightLight).toBe(comfortDefaults(false).nightLight)
  })

  /**
   * The head's rise and fall, which is the second setting whose interesting
   * value is zero — and the one `prefers-reduced-motion` is literally about.
   */
  it('keeps the head held still, rather than treating none of it as unset', () => {
    expect(readComfort(JSON.stringify({ headBob: 0 }), false).headBob).toBe(0)
    expect(comfortDefaults(false).headBob).toBeGreaterThan(0)
    expect(comfortDefaults(true).headBob).toBe(0)
  })

  it('clamps the head and the pace to what a body does', () => {
    expect(readComfort(JSON.stringify({ headBob: 40 }), false).headBob).toBe(HEAD_BOB_RANGE[1])
    expect(readComfort(JSON.stringify({ walkPace: 0 }), false).walkPace).toBe(WALK_PACE_RANGE[0])
    expect(readComfort(JSON.stringify({ walkPace: 99 }), false).walkPace).toBe(WALK_PACE_RANGE[1])
    // A pace of zero is not a preference, it is being unable to leave the room.
    expect(WALK_PACE_RANGE[0]).toBeGreaterThan(0)
  })

  it('never lets a stored setting stop the visitor walking at all', () => {
    for (const raw of ['{"walkPace":null}', '{"walkPace":"slow"}', '{"walkPace":-3}']) {
      expect(readComfort(raw, false).walkPace).toBeGreaterThan(0)
    }
  })
})
