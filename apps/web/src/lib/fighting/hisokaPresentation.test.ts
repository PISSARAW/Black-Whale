import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { createHisokaPresentationClock, type HisokaFrames } from './hisokaPresentation'
import { createCinematicDirector } from './cinematicDirector'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(): FightState {
  const s = beginFight(
    createFight('hisoka', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...s,
    player: { ...s.player, x: 44, aura: 100 },
    opponent: { ...s.opponent, x: 54, aura: 100 },
  }
}
const cast = (s: FightState, side: FightSide, slot = 'neutralSpecial') =>
  performAuraAttack({
    state: s,
    side,
    kind: 'special',
    moveId: `hisoka:${slot}`,
    auraCharged: false,
  })
function frames(s: FightState, count: number, observe: (s: FightState) => unknown = () => {}) {
  for (let i = 0; i < count; i++) {
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    observe(s)
  }
  return s
}
function prepared(side: FightSide) {
  return frames(cast(duel(), side), 55)
}
describe('Hisoka type 1 accents', () => {
  it.each(['player', 'opponent'] as const)(
    'accents confirmed attachment for exactly 18 simulation frames on %s, without an inset',
    (side) => {
      const clock = createHisokaPresentationClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel(),
        first: FightState | null = null
      clock(s)
      camera.update(s)
      s = cast(s, side)
      expect(clock(s)[side].attach).toBeNull()
      expect(camera.update(s).detail).toBeNull()
      const ages: number[] = []
      s = frames(s, 55, (next) => {
        const shown = clock(next)[side]
        if (shown.attach !== null) {
          ages.push(shown.attach)
          first ??= next
        }
        expect(camera.update(next).detail).toBeNull()
      })
      expect(s.bungeeGum?.owner).toBe(side)
      expect(ages).toEqual(Array.from({ length: 18 }, (_, i) => i))
      const rebuilt = createHisokaPresentationClock()
      expect(rebuilt(s)[side].attach).toBeNull()
      expect(clock(s)).toEqual(clock(s))
      expect(clock(first!)[side].attach).toBeNull()
      expect(clock(nextRound({ ...s, phase: 'finished', winner: side }))[side].attach).toBeNull()
    },
  )
  it.each(['forwardSpecial', 'backSpecial'] as const)(
    'accents the real %s only after startup, preserving the engine’s motion',
    (slot) => {
      let s = prepared('player')
      expect(s.bungeeGum).toBeTruthy()
      s = { ...s, opponent: { ...s.opponent, x: 80 } }
      const clock = createHisokaPresentationClock(),
        camera = createCinematicDirector()
      clock(s)
      camera.update(s)
      s = cast(s, 'player', slot)
      const key = slot === 'forwardSpecial' ? 'pull' : 'rebound'
      expect(clock(s).player[key]).toBeNull()
      let seen = false
      s = frames(s, 45, (next) => {
        seen ||= clock(next).player[key] !== null
        expect(camera.update(next).detail).toBeNull()
      })
      expect(seen).toBe(true)
      expect(Math.abs(s.player.x - s.opponent.x)).toBeLessThanOrEqual(8.001)
    },
  )
  it('does not animate a failed, guarded or sealed attachment, or turn an ordinary strike into Gum', () => {
    for (const kind of ['miss', 'guard', 'sealed'] as const) {
      let s = duel()
      if (kind === 'miss') s = { ...s, opponent: { ...s.opponent, x: 90 } }
      if (kind === 'sealed')
        s = { ...s, player: { ...s.player, nen: { ...s.player.nen, mode: 'zetsu' } } }
      const clock = createHisokaPresentationClock()
      clock(s)
      s = cast(s, 'player')
      for (let i = 0; i < 45; i++) {
        s = tickFight(s, EMPTY_INPUT, {
          dt: 1 / 60,
          opponentInput: { ...EMPTY_INPUT, guard: kind === 'guard' },
        })
        expect(clock(s).player.attach).toBeNull()
      }
    }
    const s = prepared('player'),
      clock = createHisokaPresentationClock()
    clock(s)
    frames(performMove({ state: s, side: 'player', action: 'heavy' }), 40, (next) =>
      expect(clock(next).player.attach).toBeNull(),
    )
  })
  it.each(['player', 'opponent'] as const)(
    'sweeps Texture Surprise on the actual cloth after startup on %s',
    (side) => {
      const clock = createHisokaPresentationClock(),
        camera = createCinematicDirector({ viewer: () => side })
      const s = duel()
      clock(s)
      camera.update(s)
      const castState = cast(s, side, 'downSpecial')
      expect(clock(castState)[side].texture).toBeNull()
      const ages: number[] = []
      const end = frames(castState, 50, (next) => {
        const age = clock(next)[side].texture
        if (age !== null) ages.push(age)
        expect(camera.update(next).detail).toBeNull()
      })
      expect(end[side].textureSurprise).toMatchObject({
        surface: 'cloth',
        source: 'personal',
        theftId: undefined,
      })
      expect(end.player.health).toBe(s.player.health)
      expect(end.opponent.health).toBe(s.opponent.health)
      expect(ages).toEqual(Array.from({ length: 18 }, (_, i) => i))
      expect(clock(end)[side].texture).toBeNull()
    },
  )
  it('keeps the new snapshots independent when a caller mutates its state in place', () => {
    const s = duel(),
      clock = createHisokaPresentationClock()
    clock(s)
    s.player.textureSurprise = { surface: 'cloth' }
    const shown: HisokaFrames = clock(s).player
    expect(shown.texture).toBe(0)
    delete s.player.textureSurprise
    expect(clock(s).player).toMatchObject({ texture: null, textureEnd: 0 })
  })
})
