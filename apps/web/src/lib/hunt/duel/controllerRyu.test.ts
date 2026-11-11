import { describe, expect, it } from 'vitest'
import { ryuFromController } from './controllerRyu'

describe('shared Ryu controller adapter', () => {
  it('keeps both the selected guard zone and its forward share', () => {
    expect(ryuFromController({ head: 0.7, torso: 0.3 }, 0.5)).toEqual({
      attack: 0.7,
      guard: 'head',
    })
    expect(ryuFromController({ feet: 0.4, torso: 0.6 }, 0.5).guard).toBe('legs')
  })
})
