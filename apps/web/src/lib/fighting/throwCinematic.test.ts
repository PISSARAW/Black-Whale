import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { PerspectiveCamera } from 'three'
import { beginFight, createFight, performThrow, tickFight } from './engine'
import { toggleChrolloBookmark } from './chrolloBook'
import { attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { confirmedThrow, createThrowCinematic, throwVictoryDelay } from './throwCinematic'
import { throwBodyPlan, throwBodyPosition, thrownVisualFighter } from './throwCinematicMotion'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { createFinishedFallPresentation } from './finishedFallPresentation'
import { applyThrowCamera } from './throwCinematicCamera'
import { createVictoryPlayback } from './victory/playback'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function grabbed(id: FighterId = 'hisoka', side: FightSide = 'player') {
  const base = beginFight(
    createFight(side === 'player' ? id : 'kurapika', side === 'opponent' ? id : 'kurapika', {
      mode: 'versus-local',
    }),
  )
  let state = { ...base, player: { ...base.player, x: 46 }, opponent: { ...base.opponent, x: 51 } }
  const book = state[side].chrolloBook
  if (book?.open)
    state = { ...state, [side]: { ...state[side], chrolloBook: toggleChrolloBookmark(book) } }
  state = performThrow(state, side)
  const actor = state[side]
  if (!actor.attack) throw new Error(`No throw for ${id}`)
  state = {
    ...state,
    [side]: {
      ...actor,
      attack: { ...actor.attack, frame: attackData(actor.attack.kind, actor).startup },
    },
  }
  return resolveFightImpacts(state, [])
}
const enabled = { enabled: true }

describe('confirmed throw cinematic', () => {
  it('lets a KO victim complete the authored lift instead of overriding it with a generic fall', () => {
    const real = grabbed()
    const frame = confirmedThrow(real)!
    const state: FightState = { ...real, phase: 'finished', winner: 'player' }
    const fall = createFinishedFallPresentation(() => frame)
    for (const [seconds, y] of [
      [0, 0],
      [0.3, 8],
      [0.5, 11],
      [0.8, 0],
    ]) {
      const position = { x: state.opponent.x, y }
      const fighter = thrownVisualFighter({ ...state.opponent, health: 0 }, position)
      expect(fall(state, 'opponent', { fighter, position, seconds }).position).toEqual(position)
    }
  })
  it.each(FIGHTING_ROSTER.map((f) => f.id))('recognizes the real confirmed throw for %s', (id) => {
    const state = grabbed(id)
    expect(state.impact?.knockdown).toBe(true)
    expect(confirmedThrow(state)).toMatchObject({
      attacker: 'player',
      victim: 'opponent',
      age: 0,
      active: true,
    })
  })

  it('only plays real throws, with either seat, and rejects failed or countered contacts', () => {
    const state = grabbed('hisoka', 'opponent')
    expect(confirmedThrow(state)?.victim).toBe('player')
    expect(confirmedThrow(beginFight(createFight('hisoka', 'kurapika')))).toBeNull()
    for (const flag of ['blocked', 'parried', 'avoided', 'invulnerable'] as const)
      expect(confirmedThrow({ ...state, impact: { ...state.impact!, [flag]: true } })).toBeNull()
    expect(confirmedThrow({ ...state, impact: { ...state.impact!, projectileId: 1 } })).toBeNull()
    const side = state.impact!.attacker
    expect(
      confirmedThrow({
        ...state,
        [side]: { ...state[side], attack: { ...state[side].attack!, confirmedHit: false } },
      }),
    ).toBeNull()
  })

  it('freezes with simulation and hitstop and samples a late render without restarting the grab', () => {
    const state = grabbed()
    const film = createThrowCinematic()
    film.observe(state, 0, enabled)
    const age = film.current()!.age
    film.observe(state, 3, enabled)
    expect(film.current()!.age).toBe(age)
    const actor = state.player
    const late = {
      ...state,
      frame: state.frame + 12,
      player: { ...actor, attack: { ...actor.attack!, frame: actor.attack!.frame + 12 } },
    }
    film.observe(late, 4, enabled)
    expect(film.current()!.age).toBe(12)
    film.observe(late, 10, enabled)
    expect(film.current()!.age).toBe(12)
  })

  it('cancels on a new hit, new round, rewind, wakeup or reduced motion', () => {
    const state = grabbed()
    for (const next of [
      { ...state, impact: null },
      { ...state, opponent: { ...state.opponent, pose: 'wakeup' as const } },
      createFight('hisoka', 'kurapika'),
    ]) {
      const film = createThrowCinematic()
      film.observe(state, 0, enabled)
      film.observe(next, 1, enabled)
      expect(film.current()).toBeNull()
    }
    const film = createThrowCinematic()
    film.observe(state, 0, enabled)
    film.observe(state, 1, { enabled: false })
    expect(film.current()).toBeNull()
  })

  it('keeps the landing at the authoritative location and never mutates combat state', () => {
    const state = grabbed()
    const before = structuredClone(state)
    const frame = confirmedThrow(state)!
    for (const age of [0, 5, 11, 18, frame.duration + 1]) {
      const shot = { ...frame, age, active: age < frame.duration }
      for (const side of ['player', 'opponent'] as const) {
        const fallback = { x: state[side].x, y: state[side].y }
        const position = throwBodyPosition({ state, side, frame: shot, fallback })
        expect(Object.values(position).every(Number.isFinite)).toBe(true)
        if (age > frame.duration) expect(position).toEqual(fallback)
        const plan = throwBodyPlan({
          fighter: state[side],
          seconds: age / 60,
          progress: 0,
          side,
          throwFrame: shot,
        })
        if (plan) expect(Object.values(plan.pose).flat().every(Number.isFinite)).toBe(true)
      }
    }
    expect(state).toEqual(before)
  })

  it('ends the articulated victim on the floor instead of returning to a standing pose', () => {
    const state = grabbed()
    const contact = confirmedThrow(state)!
    const frame = { ...contact, age: contact.duration * 0.95 }
    const fighter = thrownVisualFighter(state.opponent, state.opponent)
    const context = createFightReactionPresentation()(state, 'opponent', { fighter, seconds: 1 })
    const plan = throwBodyPlan({
      ...context,
      fighter,
      seconds: 1,
      side: 'opponent',
      throwFrame: frame,
    })!
    expect(plan.pose.body?.[0]).toBeLessThan(-1.2)
  })

  it.each([16 / 9, 390 / 720, 320 / 720])('produces finite pair cameras at aspect %s', (aspect) => {
    const state = grabbed()
    const frame = confirmedThrow(state)!
    const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
    for (const age of [0, 4, 10, 17, 23]) {
      camera.position.set(0, 2.25, 9.2)
      camera.lookAt(0, 1.2, 0)
      expect(applyThrowCamera(camera, { state, frame: { ...frame, age }, intensity: 1 })).toBe(true)
      expect(camera.position.toArray().every(Number.isFinite)).toBe(true)
      expect(camera.quaternion.toArray().every(Number.isFinite)).toBe(true)
    }
    expect(applyThrowCamera(camera, { state, frame, intensity: 0 })).toBe(false)
  })

  it('finishes a KO throw before playing the victory film, including pause and skip', () => {
    const real = grabbed()
    const state: FightState = {
      ...real,
      phase: 'finished',
      winner: 'player',
      matchWinner: 'player',
    }
    const delay = throwVictoryDelay(state)
    expect(delay).toBeGreaterThan(0)
    const playback = createVictoryPlayback()
    playback.observe(state)
    playback.sceneReady()
    expect(get(playback)?.active).toBe(false)
    expect(get(playback)?.pendingThrow).toBe(delay)
    playback.advance(1, true)
    expect(get(playback)?.pendingThrow).toBe(delay)
    playback.advance(delay / 2)
    expect(get(playback)?.active).toBe(false)
    playback.advance(delay / 2)
    expect(get(playback)?.active).toBe(true)
    expect(get(playback)?.elapsed).toBe(0)
    playback.skip()
    expect(get(playback)?.pendingThrow).toBe(0)
    expect(get(playback)?.active).toBe(false)
  })

  it('returns to the starting combat camera without accumulating the cinematic orbit', () => {
    const state = grabbed()
    const frame = confirmedThrow(state)!
    const camera = new PerspectiveCamera(34, 16 / 9, 0.1, 100)
    camera.position.set(0, 2.25, 9.2)
    camera.lookAt(0, 1.2, 0)
    const position = camera.position.clone()
    const rotation = camera.quaternion.clone()
    for (const t of [0, 0.2, 0.5, 0.8, 0.95, 0.99999]) {
      frame.age = frame.duration * t
      applyThrowCamera(camera, { state, frame, intensity: 1 })
    }
    expect(camera.position.distanceTo(position)).toBeLessThan(0.001)
    expect(camera.quaternion.angleTo(rotation)).toBeLessThan(0.001)
  })

  it('continues through a real duel without changing the deterministic simulation', () => {
    let state = grabbed()
    const film = createThrowCinematic()
    for (let index = 0; index < 80; index++) {
      const before = structuredClone(state)
      film.observe(state, index / 60, enabled)
      expect(state).toEqual(before)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    }
    expect(film.current()).toBeNull()
  })
})
