import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { createFranklinPresentationClock, franklinShotHand } from './franklinPresentation'
import { createCinematicDirector } from './cinematicDirector'
import { franklinSalvo } from './franklinAttack'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(side: FightSide = 'player'): FightState {
  const s = beginFight(
    createFight(
      side === 'player' ? 'franklin' : 'benjamin',
      side === 'opponent' ? 'franklin' : 'benjamin',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...s,
    player: { ...s.player, x: 20, aura: 100 },
    opponent: { ...s.opponent, x: 76, aura: 100 },
  }
}
function cast(state: FightState, side: FightSide, slot: string) {
  return slot === 'ranged'
    ? performAttack(state, side, 'ranged')
    : performAuraAttack({
        state,
        side,
        kind: 'special',
        moveId: `franklin:${slot}`,
        auraCharged: false,
      })
}
const step = (s: FightState) =>
  tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })

describe('Franklin type 1 volley presentation', () => {
  for (const side of ['player', 'opponent'] as const)
    it.each([
      'ranged',
      'neutralSpecial',
      'forwardSpecial',
      'downSpecial',
      'backSpecial',
      'finisher',
    ])(`${side}: starts once and follows the real %s emissions without an inset`, (slot) => {
      const clock = createFranklinPresentationClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let state = duel(side)
      clock(state)
      camera.update(state)
      state = cast(state, side, slot)
      expect(state[side].attack).toBeTruthy()
      const total = franklinSalvo(state[side]).shots
      expect(clock(state)[side]).toEqual({ start: null, shots: [], count: 0 })
      expect(camera.update(state).detail).toBeNull()
      let expected = state
      const seen = new Set<number>(),
        starts: number[] = []
      for (let i = 0; i < 160; i++) {
        state = step(state)
        expected = step(expected)
        const frozen = JSON.stringify(state),
          shown = clock(state)[side]
        if (shown.start !== null) starts.push(shown.start)
        for (const shot of shown.shots) {
          expect(shot.index).toBeLessThan(state[side].attack?.projectilesSpawned ?? 0)
          expect(shot.age).toBeLessThan(4)
          seen.add(shot.index)
        }
        expect(camera.update(state).detail).toBeNull()
        expect(JSON.stringify(state)).toBe(frozen)
      }
      expect([...seen]).toEqual(Array.from({ length: total }, (_, i) => i))
      expect(starts).toEqual(Array.from({ length: 18 }, (_, i) => i))
      expect(state.nextProjectileId).toBe(total + 1)
      expect(state).toEqual(expected)
    })
  it('keeps the finger sequence on the same physical hands as the native rig', () => {
    for (const facing of [1, -1] as const) {
      const hands = Array.from(
        { length: 10 },
        (_, index) => `${franklinShotHand(facing, index)}:${Math.floor(index / 2) % 5}`,
      )
      expect(new Set(hands).size).toBe(10)
      expect(hands[0]).toBe(facing === 1 ? 'left:0' : 'right:0')
      expect(hands[1]).toBe(facing === 1 ? 'right:0' : 'left:0')
    }
  })
  it('does not replay an existing burst on rebuild or use wall time, and resets after interruption and the next round', () => {
    const clock = createFranklinPresentationClock()
    let s = duel()
    clock(s)
    s = cast(s, 'player', 'finisher')
    for (let i = 0; i < 35; i++) {
      s = step(s)
      clock(s)
    }
    expect(s.player.attack!.projectilesSpawned).toBeGreaterThan(0)
    expect(clock(s)).toEqual(clock(s))
    const rebuild = createFranklinPresentationClock()
    expect(rebuild(s).player.start).toBeNull()
    expect(rebuild(s).player.shots).toEqual([])
    const emitted = s.nextProjectileId,
      projectiles = s.projectiles
    const interrupted = { ...s, player: { ...s.player, attack: null, hitStun: 20 } }
    expect(clock(interrupted).player).toEqual({ start: null, shots: [], count: 0 })
    expect(interrupted.projectiles).toBe(projectiles)
    expect(step(interrupted).nextProjectileId).toBe(emitted)
    expect(clock(nextRound({ ...s, phase: 'finished', winner: 'player' })).player.shots).toEqual([])
  })
  it('rejects startup alone and sealed attacks, and clears an ongoing accent when Nen is lost', () => {
    for (const mode of ['zetsu', 'stolen'] as const) {
      const base = duel()
      const s = {
        ...base,
        player: {
          ...base.player,
          nen: {
            ...base.player.nen,
            mode: mode === 'zetsu' ? ('zetsu' as const) : ('ten' as const),
          },
          hatsuEffects: { ...base.player.hatsuEffects, hatsuStolen: mode === 'stolen' ? 60 : 0 },
        },
      }
      const clock = createFranklinPresentationClock()
      clock(s)
      expect(cast(s, 'player', 'neutralSpecial')).toBe(s)
      expect(clock(s).player.shots).toEqual([])
    }
    const clock = createFranklinPresentationClock()
    let s = duel()
    clock(s)
    s = cast(s, 'player', 'ranged')
    for (let i = 0; i < 10; i++) {
      s = step(s)
      clock(s)
    }
    const sealed = {
      ...s,
      player: { ...s.player, nen: { ...s.player.nen, mode: 'zetsu' as const } },
    }
    expect(clock(sealed).player.shots).toEqual([])
    expect(clock(sealed).player.start).toBeNull()
  })
})
