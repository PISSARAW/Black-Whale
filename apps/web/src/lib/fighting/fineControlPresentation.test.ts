import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { createFineControlClock } from './fineControlPresentation'
import { createCinematicDirector } from './cinematicDirector'
import { commandMary } from './bloodyMaryAction'
import { EMPTY_INPUT, type FightSide, type FighterId, type FightState } from './types'

function duel(id: FighterId, side: FightSide): FightState {
  const s = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: 42, aura: 100 },
    opponent: { ...s.opponent, x: 48, aura: 100 },
  }
}
function cast(state: FightState, side: FightSide, id: string, slot: string) {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `${id}:${slot}`,
    auraCharged: false,
  })
}
function frames(s: FightState, n: number, observe: (s: FightState) => unknown = () => {}) {
  for (let i = 0; i < n; i++) {
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    observe(s)
  }
  return s
}
const mary = (state: FightState, side: FightSide, command: 'bleed' | 'bind' | 'scout' | 'recall') =>
  commandMary({ state, side, command }, performAuraAttack)

describe('fine material control stays in type 1', () => {
  for (const side of ['player', 'opponent'] as const) {
    it.each(['forwardSpecial', 'downSpecial'])(
      `Machi ${side} %s accents only a real thread`,
      (slot) => {
        const clock = createFineControlClock(),
          camera = createCinematicDirector({ viewer: () => side })
        const s = duel('machi', side),
          other = side === 'player' ? 'opponent' : 'player'
        clock(s)
        camera.update(s)
        const started = cast(s, side, 'machi', slot)
        expect(clock(started)[side].thread).toBeNull()
        const ages: number[] = []
        const end = frames(started, 60, (next) => {
          const frozen = JSON.stringify(next),
            age = clock(next)[side].thread
          if (age !== null) ages.push(age)
          expect(camera.update(next).detail).toBeNull()
          expect(JSON.stringify(next)).toBe(frozen)
        })
        expect(end[other].machiThread?.owner).toBe(side)
        expect(ages).toEqual(Array.from({ length: 18 }, (_, i) => i))
        expect(createFineControlClock()(end)[side].thread).toBeNull()
      },
    )
    it(`Kalluto ${side} accents the emitted and actually implanted physical fragments`, () => {
      const clock = createFineControlClock(),
        camera = createCinematicDirector({ viewer: () => side })
      const s = duel('kalluto', side),
        other = side === 'player' ? 'opponent' : 'player'
      clock(s)
      camera.update(s)
      const seen = { launch: [] as number[], plant: [] as number[] }
      let end = frames(cast(s, side, 'kalluto', 'neutralSpecial'), 70, (next) => {
        const frame = clock(next)[side]
        if (frame.paperLaunch !== null) seen.launch.push(frame.paperLaunch)
        if (frame.paperPlant !== null) seen.plant.push(frame.paperPlant)
        expect(camera.update(next).detail).toBeNull()
      })
      expect(end[other].plantedPaper).toContainEqual({ owner: side, zone: 'torso' })
      expect(seen.launch).toEqual(Array.from({ length: 18 }, (_, i) => i))
      expect(seen.plant).toEqual(Array.from({ length: 18 }, (_, i) => i))
      end = frames(cast(end, side, 'kalluto', 'forwardSpecial'), 50, (next) =>
        expect(camera.update(next).detail).toBeNull(),
      )
      expect(end.nextProjectileId).toBe(3)
    })
    it(`Zakuro ${side} manipulates only its prepared blood, then recalls it without healing`, () => {
      const clock = createFineControlClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel('zakuro', side)
      clock(s)
      camera.update(s)
      expect(mary(s, side, 'scout')).toBe(s)
      s = mary(s, side, 'bleed')
      clock(s)
      camera.update(s)
      const hp = s[side].health
      s = mary(s, side, 'scout')
      expect(Object.values(clock(s)[side].drops)).toEqual([0, 0, 0])
      expect(camera.update(s).detail).toBeNull()
      s = frames(s, 20, (next) => {
        clock(next)
        expect(camera.update(next).detail).toBeNull()
      })
      expect(s[side].bloodyMary?.available).toBe(3)
      const recalled = mary(s, side, 'recall')
      expect(clock(recalled)[side].bloodReturn).toBe(0)
      s = frames(recalled, 60, (next) => {
        clock(next)
        expect(camera.update(next).detail).toBeNull()
      })
      expect(s[side].bloodyMary?.drops).toEqual([])
      expect(s[side].bloodyMary?.available).toBe(6)
      expect(s[side].health).toBe(hp)
      expect(clock(nextRound({ ...s, phase: 'finished', winner: side }))[side].drops).toEqual({})
    })
    it(`Zakuro ${side} winds a real tendril only after deployment and collision`, () => {
      const clock = createFineControlClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = mary(duel('zakuro', side), side, 'bleed')
      clock(s)
      camera.update(s)
      s = mary(s, side, 'bind')
      expect(clock(s)[side].blood).toBe(0)
      const other = side === 'player' ? 'opponent' : 'player'
      expect(s[other].maryCapture).toBeUndefined()
      s = frames(s, 60, (next) => {
        clock(next)
        expect(camera.update(next).detail).toBeNull()
      })
      expect(s[other].maryCapture?.owner).toBe(side)
      expect(s[other].nen.mode).toBe('ten')
    })
  }
  it('does not animate rejected, blocked or interrupted manipulation, and freezes its ages on pause', () => {
    const clock = createFineControlClock()
    let s = duel('machi', 'player')
    clock(s)
    const blocked = cast(s, 'player', 'machi', 'forwardSpecial')
    let guarded = blocked
    for (let i = 0; i < 50; i++) {
      guarded = tickFight(guarded, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, guard: true },
      })
      expect(clock(guarded).player.thread).toBeNull()
    }
    s = duel('kalluto', 'player')
    clock(s)
    expect(cast(s, 'player', 'kalluto', 'forwardSpecial')).toBe(s)
    const prepared = cast(s, 'player', 'kalluto', 'neutralSpecial')
    frames({ ...prepared, player: { ...prepared.player, attack: null, hitStun: 20 } }, 50, (next) =>
      expect(clock(next).player.paperLaunch).toBeNull(),
    )
    s = mary(duel('zakuro', 'player'), 'player', 'bleed')
    clock(s)
    s = mary(s, 'player', 'bind')
    const snapshot = clock(s)
    expect(clock(s)).toEqual(snapshot)
    expect(createFineControlClock()(s).player.blood).toBeNull()
  })
})
