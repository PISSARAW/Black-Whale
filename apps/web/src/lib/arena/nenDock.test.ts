import { describe, expect, it } from 'vitest'
import { initialFighter, type FighterState } from '../combat/types'
import { arenaNen } from '../nen/tourAdapters'
import { dockTechniqueCommand, nenDockButtons } from './nenDock'

const fighter = (overrides: Partial<FighterState> = {}): FighterState => ({
  ...initialFighter([0, 0]),
  ...overrides,
})
const lit = (state: FighterState) =>
  nenDockButtons(state)
    .filter((button) => button.active)
    .map((button) => button.id)

describe("Arena's Clash Nen bar", () => {
  it('starts in Ten, with Ko off', () => {
    expect(lit(fighter())).toEqual(['ten'])
  })

  it('lights what is held, and Ko only once engaged', () => {
    expect(lit(fighter({ mode: 'ren', gyo: true }))).toEqual(['ren', 'gyo'])
    expect(lit(fighter({ ken: true }))).toEqual(['ken'])
    expect(lit(fighter({ ko: { zone: 'arms', remaining: 1 } }))).toEqual(['ko'])
  })

  it('falls back to Ten when Ren or Zetsu is pressed again', () => {
    expect(dockTechniqueCommand(fighter(), 'ren', 'torso').action).toEqual({
      type: 'MODE',
      side: 'player',
      mode: 'ren',
    })
    expect(dockTechniqueCommand(fighter({ mode: 'ren' }), 'ren', 'torso').action).toMatchObject({
      mode: 'ten',
    })
  })

  it('toggles Gyo, and engages Ko on the limb that strikes', () => {
    expect(dockTechniqueCommand(fighter({ gyo: true }), 'gyo', 'head').action).toMatchObject({
      type: 'GYO',
      on: false,
    })
    expect(dockTechniqueCommand(fighter(), 'ko', 'legs').action).toMatchObject({ zone: 'legs' })
    expect(dockTechniqueCommand(fighter(), 'ko', 'head').action).toMatchObject({ zone: 'arms' })
  })
})

describe("Arena's aura as the scene draws it", () => {
  it('shows a resting body as Ten, not as the flux of a Ko or a Ryu', () => {
    const nen = arenaNen(fighter())
    expect(nen.mode).toBe('ten')
    expect(nen.ko).toBeNull()
    expect(nen.ryu).toEqual({})
  })

  it('shows the flux once Ryu is moved or a Ko engaged', () => {
    expect(arenaNen(fighter({ attackShare: 0.8, guard: 'head' })).ryu).toEqual({
      hands: 0.8,
      head: expect.closeTo(0.2),
    })
    expect(arenaNen(fighter({ ko: { zone: 'legs', remaining: 1 } })).ryu).toEqual({ feet: 1 })
  })
})
