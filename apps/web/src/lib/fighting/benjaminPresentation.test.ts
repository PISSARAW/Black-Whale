import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { attackPhase } from './frameData'
import { createBenjaminPresentationClock } from './benjaminPresentation'
import { createCinematicDirector } from './cinematicDirector'
import { EMPTY_INPUT, type FightProjectile, type FightSide, type FightState } from './types'

function duel(side: FightSide = 'player'): FightState {
  const s = beginFight(
    createFight(
      side === 'player' ? 'benjamin' : 'franklin',
      side === 'opponent' ? 'benjamin' : 'franklin',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...s,
    player: { ...s.player, x: 42, aura: 100 },
    opponent: { ...s.opponent, x: 48, aura: 100 },
  }
}
function cast(state: FightState, side: FightSide, slot: string) {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `benjamin:${slot}`,
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
function incoming(
  s: FightState,
  side: FightSide,
  changes: Partial<FightProjectile> = {},
): FightState {
  const f = s[side]
  const shot: FightProjectile = {
    id: s.nextProjectileId,
    owner: side === 'player' ? 'opponent' : 'player',
    fighterId: 'franklin',
    x: f.x + f.facing * 2,
    y: 6.1,
    velocityX: -f.facing * 70,
    width: 0.6,
    height: 0.24,
    damage: 11,
    hitstun: 13,
    blockstun: 9,
    hitstop: 5,
    knockback: 2.2,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#ffffff',
    age: 0,
    lifetime: 120,
    matter: 'nen',
    ...changes,
  }
  return { ...s, projectiles: [...s.projectiles, shot], nextProjectileId: s.nextProjectileId + 1 }
}
function charged(s: FightState, side: FightSide) {
  s = cast(s, side, 'downSpecial')
  for (let i = 0; i < 50 && attackPhase(s[side]) !== 'active'; i++) s = frames(s, 1)
  expect(attackPhase(s[side])).toBe('active')
  return s
}
describe('Benjamin type 1 presentation', () => {
  it.each(['player', 'opponent'] as const)(
    'accents actual Air Blow after startup for %s without an inset or changing the duel',
    (side) => {
      const clock = createBenjaminPresentationClock(),
        camera = createCinematicDirector({ viewer: () => side })
      const s = duel(side)
      clock(s)
      camera.update(s)
      const started = cast(s, side, 'neutralSpecial')
      expect(clock(started)[side].air).toBeNull()
      expect(camera.update(started).detail).toBeNull()
      const ages: number[] = []
      const end = frames(started, 60, (next) => {
        const frozen = JSON.stringify(next),
          age = clock(next)[side].air
        if (age !== null) ages.push(age)
        expect(camera.update(next).detail).toBeNull()
        expect(JSON.stringify(next)).toBe(frozen)
      })
      expect(ages).toEqual(Array.from({ length: 18 }, (_, i) => i))
      expect(end).toEqual(frames(started, 60))
    },
  )
  it.each(['player', 'opponent'] as const)(
    'animates a real captured Nen projectile, then one proven restitution on %s',
    (side) => {
      let s = charged(duel(side), side)
      const clock = createBenjaminPresentationClock(),
        camera = createCinematicDirector({ viewer: () => side })
      clock(s)
      camera.update(s)
      s = frames(incoming(s, side), 1)
      expect(s[side].hatsuEffects.baton?.card).toBeTruthy()
      expect(clock(s)[side].capture).toBe(0)
      expect(camera.update(s).detail).toBeNull()
      expect(clock(s)[side].capture).toBe(0)
      const captureAges = [0]
      s = frames(s, 50, (next) => {
        const age = clock(next)[side].capture
        if (age !== null) captureAges.push(age)
      })
      expect(captureAges).toEqual(Array.from({ length: 18 }, (_, i) => i))
      const before = s.nextProjectileId
      s = cast(s, side, 'finisher')
      expect(clock(s)[side].release).toBeNull()
      expect(camera.update(s).detail).toBeNull()
      const releaseAges: number[] = []
      s = frames(s, 55, (next) => {
        const age = clock(next)[side].release
        if (age !== null) releaseAges.push(age)
        expect(camera.update(next).detail).toBeNull()
      })
      expect(releaseAges).toEqual(Array.from({ length: 18 }, (_, i) => i))
      expect(s.nextProjectileId).toBe(before + 1)
      expect(s[side].hatsuEffects.baton?.card).toBeNull()
      expect(createBenjaminPresentationClock()(s)[side].release).toBeNull()
      expect(clock(nextRound({ ...s, phase: 'finished', winner: side }))[side]).toEqual({
        air: null,
        capture: null,
        release: null,
      })
    },
  )
  it('does not mistake preparation, ordinary bullets, a second card or Halkenburg’s arrow for capture', () => {
    for (const change of [{ matter: 'object' as const }, { fighterId: 'halkenburg' as const }]) {
      let s = charged(duel(), 'player')
      const clock = createBenjaminPresentationClock()
      clock(s)
      s = frames(incoming(s, 'player', change), 1)
      expect(s.player.hatsuEffects.baton?.card).toBeNull()
      expect(clock(s).player.capture).toBeNull()
    }
    let s = charged(duel(), 'player')
    const clock = createBenjaminPresentationClock()
    clock(s)
    expect(clock(frames(s, 1)).player.capture).toBeNull()
    s = frames(incoming(s, 'player'), 1)
    clock(s)
    const rebuild = createBenjaminPresentationClock()
    expect(rebuild(s).player.capture).toBeNull()
    s = frames(incoming(s, 'player'), 1)
    expect(rebuild(s).player.capture).toBeNull()
  })
  it('does not replay an empty or interrupted restitution, lost card, missing inheritance or sealed Air Blow', () => {
    const clock = createBenjaminPresentationClock(),
      s = duel()
    clock(s)
    expect(clock(cast(s, 'player', 'finisher')).player.release).toBeNull()
    const held = frames(incoming(charged(s, 'player'), 'player'), 1)
    clock(held)
    const removed = {
      ...held,
      player: {
        ...held.player,
        hatsuEffects: {
          ...held.player.hatsuEffects,
          baton: { ...held.player.hatsuEffects.baton!, card: null },
        },
      },
    }
    expect(clock(removed).player.release).toBeNull()
    const ready = frames(held, 50)
    let interrupted = cast(ready, 'player', 'finisher')
    clock(interrupted)
    interrupted = { ...interrupted, player: { ...interrupted.player, attack: null, hitStun: 15 } }
    frames(interrupted, 40, (next) => expect(clock(next).player.release).toBeNull())
    for (const player of [
      { ...s.player, nen: { ...s.player.nen, mode: 'zetsu' as const } },
      {
        ...s.player,
        hatsuEffects: {
          ...s.player.hatsuEffects,
          baton: { ...s.player.hatsuEffects.baton!, inherited: [] },
        },
      },
    ]) {
      const invalid = { ...s, player }
      expect(cast(invalid, 'player', 'neutralSpecial')).toBe(invalid)
      expect(clock(invalid).player.air).toBeNull()
    }
  })
})
