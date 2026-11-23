import { describe, expect, it } from 'vitest'
import { sampleGamepad, type FightPad } from '../fightGamepad'
import { createFightState } from '../fightState'
import { applyAuraContext } from '../nen'
function pad(...held: number[]): FightPad {
  return {
    index: 0,
    id: 'Xbox',
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, (_, i) => ({
      pressed: held.includes(i),
      value: Number(held.includes(i)),
    })),
  }
}
describe('Xbox Nen chords', () => {
  it.each(['en', 'conceal', 'shu', 'gyo'] as const)(
    'View + D-pad accesses %s without calling or moving',
    (key) => {
      const direction = ['en', 'conceal', 'shu', 'gyo'].indexOf(key) + 12
      const frame = sampleGamepad(pad(8, direction), pad())
      expect(frame.input[key]).toBe(true)
      expect(
        ['call', 'jump', 'down', 'left', 'right'].some(
          (k) => frame.input[k as keyof typeof frame.input],
        ),
      ).toBe(false)
      expect(frame.actions).toEqual([])
    },
  )
  it.each(['focusHead', 'focusTorso', 'focusHands', 'focusFeet'] as const)(
    'R3 + D-pad selects %s and permits ordinary attack inputs',
    (key) => {
      const direction = ['focusHead', 'focusTorso', 'focusHands', 'focusFeet'].indexOf(key) + 12
      const frame = sampleGamepad(pad(11, direction, 0), pad())
      expect(frame.input.gyo).toBe(true)
      expect(frame.input[key]).toBe(true)
      expect(
        ['call', 'jump', 'down', 'left', 'right'].some(
          (k) => frame.input[k as keyof typeof frame.input],
        ),
      ).toBe(false)
      expect(frame.actions).toEqual(['light'])
    },
  )
  it('keeps movement on the left stick and resets every modifier on release', () => {
    const p = pad(8, 12)
    p.axes = [1, 0]
    expect(sampleGamepad(p, pad()).input).toMatchObject({ en: true, right: true, jump: false })
    expect(sampleGamepad(pad(), p).neutral).toBe(true)
  })
  it('keeps Aura + D-pad directional Nen free from the body-Gyo modifier', () => {
    const down = sampleGamepad(pad(5, 13), pad()).input
    expect(down).toMatchObject({
      aura: true,
      down: true,
      gyo: false,
    })
    expect(down.focusTorso).not.toBe(true)
    expect(applyAuraContext(createFightState('kurapika', 'hisoka').player, down).nen.mode).toBe(
      'zetsu',
    )
    const back = sampleGamepad(pad(5, 14), pad()).input
    expect(back).toMatchObject({
      aura: true,
      left: true,
      gyo: false,
    })
    expect(back.focusHands).not.toBe(true)
  })
  it('preserves the existing ears/wounds and pause shortcuts', () => {
    expect(sampleGamepad(pad(8, 4), pad()).input.coverEars).toBe(true)
    expect(sampleGamepad(pad(8, 5), pad()).input.plugWounds).toBe(true)
    expect(sampleGamepad(pad(9), pad()).actions).toEqual(['pause'])
  })
})
