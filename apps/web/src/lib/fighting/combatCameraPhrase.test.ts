import { describe, expect, it } from 'vitest'
import { PerspectiveCamera } from 'three'
import { beginFight, createFight, performMove, performThrow, tickFight } from './engine'
import { resolveFightImpacts } from './combatImpact'
import { attackData } from './frameData'
import { createCombatCameraPhrase } from './combatCameraPhrase'
import { dominantCameraAccent, REST_CAMERA_ACCENT } from './combatCameraAccent'
import { createCombatCamera } from './combatCamera'
import { createCinematicDirector } from './cinematicDirector'
import { createCombatImpactShake } from './combatImpactShake'
import { impactPresentation } from './fightImpactPresentation'
import { applyThrowCamera } from './throwCinematicCamera'
import { confirmedThrow } from './throwCinematic'
import { fightWorldX } from './fightCoordinates'
import { FIGHTING_ROSTER } from './roster'
import { WAKEUP_LESSONS } from './wakeupLessons'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function nativeChain(id: FighterId, side: FightSide = 'player', air = false) {
  const rival = WAKEUP_LESSONS.find((x) => x.id === `${id}:wakeup-sweep`)!.wakeup!
  const base = beginFight(
    createFight(side === 'player' ? id : rival, side === 'player' ? rival : id, {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  const facing = side === 'player' ? 1 : -1
  let state: FightState = {
    ...base,
    player: { ...base.player, x: 44, aura: 0, weaponsConfiscated: base.player.id === 'theta' },
    opponent: {
      ...base.opponent,
      x: 50,
      aura: 0,
      weaponsConfiscated: base.opponent.id === 'theta',
    },
  }
  const trace = [state]
  for (let count = 1; count <= 3; count++) {
    state = performMove({
      state,
      side,
      action: 'light',
      input: {
        ...EMPTY_INPUT,
        jump: air && count === 3,
        right: !air && count === 3 && facing === 1,
        left: !air && count === 3 && facing === -1,
      },
    })
    trace.push(state)
    for (let tick = 0; tick < 105 && (state.impact?.comboHits ?? 0) < count; tick++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      trace.push(state)
    }
    expect(state.impact).toMatchObject({ attacker: side, comboHits: count, blocked: false })
  }
  for (let tick = 0; tick < 140; tick++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    trace.push(state)
  }
  return trace
}

function cameraOptions(state: FightState) {
  return {
    state,
    base: { x: 0, y: 2.2, z: 8.2, lookY: 1.18 },
    span: {
      centre: fightWorldX((state.player.x + state.opponent.x) / 2),
      gap: Math.abs(state.player.x - state.opponent.x) * 0.115,
    },
    aspect: 16 / 9,
    intensity: 1,
    dt: 1 / 60,
  }
}

describe('one camera phrase per native combo', () => {
  it.each(FIGHTING_ROSTER.map((f) => f.id))(
    '%s preserves the phrase over cancels in either seat',
    (id) => {
      for (const side of ['player', 'opponent'] as const) {
        const trace = nativeChain(id, side),
          read = createCombatCameraPhrase()
        const camera = createCombatCamera(),
          director = createCinematicDirector()
        let previous = REST_CAMERA_ACCENT,
          last = previous
        for (const state of trace) {
          const before = JSON.stringify(state)
          const accent = read(state)
          if (
            (state.impact?.comboHits ?? 0) >= 2 &&
            state[side].attack &&
            state.phase === 'fighting'
          )
            expect(accent.push + 1e-8).toBeGreaterThanOrEqual(previous.push)
          expect(Math.abs(accent.push - previous.push)).toBeLessThan(0.12)
          expect(accent.push).toBeLessThanOrEqual(0.7)
          expect(
            Object.values(
              camera.update({ ...cameraOptions(state), direction: director.update(state) }),
            ).every((v) => typeof v !== 'number' || Number.isFinite(v)),
          ).toBe(true)
          expect(JSON.stringify(state)).toBe(before)
          previous = last = accent
        }
        expect(last.push).toBeLessThan(0.001)
      }
    },
  )

  it('freezes its envelope on pause and hitstop and clears on rewind, round or disabled camera', () => {
    const trace = nativeChain('hisoka'),
      read = createCombatCameraPhrase()
    const index = trace.findIndex((s) => s.impact?.comboHits === 2)
    for (const state of trace.slice(0, index + 1)) read(state)
    const state = trace[index],
      held = read(state)
    for (let repeat = 0; repeat < 60; repeat++) expect(read(state)).toEqual(held)
    for (let frame = 1; frame <= 6; frame++)
      expect(read({ ...state, frame: state.frame + frame, hitstop: 6 - frame + 1 })).toEqual(held)
    expect(read({ ...state, frame: 0 })).toEqual(REST_CAMERA_ACCENT)
    expect(read({ ...state, roundNumber: 2 })).toEqual(REST_CAMERA_ACCENT)
    expect(read(state, false)).toEqual(REST_CAMERA_ACCENT)
  })

  it('releases after a verdict even when the simulation frame stops', () => {
    const trace = nativeChain('hisoka'),
      read = createCombatCameraPhrase()
    const index = trace.findIndex((s) => s.impact?.comboHits === 3)
    for (const state of trace.slice(0, index + 1)) read(state)
    const ended = { ...trace[index], phase: 'finished' as const }
    let accent = read(ended)
    expect(accent.push).toBeGreaterThan(0)
    for (let i = 0; i < 90; i++) accent = read(ended, true, 1)
    expect(accent.push).toBeLessThan(0.001)
  })

  it('does not add zooms for aura reallocations, hitstop or simultaneous director cues', () => {
    const trace = nativeChain('hisoka'),
      state = trace.find((s) => s.impact?.comboHits === 3)!
    const options = cameraOptions(state),
      accent = { ...REST_CAMERA_ACCENT, push: 0.6, side: 'player' as const }
    const common = dominantCameraAccent(accent, { strength: 1.2, side: 'opponent', detail: null })
    expect(common).toEqual(accent)
    const special = dominantCameraAccent(accent, {
      strength: 1.2,
      side: 'player',
      detail: { kind: 'impact', side: 'opponent', labelFr: '', labelEn: '' },
    })
    expect(special.push).toBeCloseTo(0.6)
    const stable = createCombatCamera()
    const enabled = stable.update({ ...options, intensity: 0 })
    expect(enabled.z).toBeGreaterThanOrEqual(options.base.z)
  })

  it('opens the frame before an actual launcher and keeps the airborne pair visible', () => {
    const trace = nativeChain('hisoka', 'player', true),
      camera = createCombatCamera()
    const poses = trace.map((state) => camera.update(cameraOptions(state)))
    const takeoff = trace.findIndex((state) => state.opponent.y > 0)
    expect(takeoff).toBeGreaterThan(0)
    expect(poses[takeoff - 1].z).toBeGreaterThan(poses[0].z)
    for (let i = takeoff; i < trace.length; i++) {
      expect(poses[i].z).toBeLessThan(50)
      expect(poses[i].lookY).toBeGreaterThanOrEqual(1.18)
    }
  })

  it('does not change the lens trajectory when Nen changes during the same attacks', () => {
    const trace = nativeChain('hisoka'),
      a = createCombatCamera(),
      b = createCombatCamera()
    const director = createCinematicDirector()
    for (const original of trace) {
      const state = {
        ...original,
        player: {
          ...original.player,
          nen: { ...original.player.nen, ryu: original.frame % 2 ? { hands: 0.7 } : { feet: 0.7 } },
        },
      }
      expect(a.update(cameraOptions(original))).toEqual(
        b.update({ ...cameraOptions(state), direction: director.update(state) }),
      )
    }
  })
})

describe('short ranked camera impulses', () => {
  it('gives light hits less camera travel than heavy hits and never stacks them', () => {
    const trace = nativeChain('hisoka')
    const light = trace.find((s) => s.impact?.comboHits === 1)!,
      heavy = trace.find((s) => s.impact?.comboHits === 3)!
    const shake = createCombatImpactShake()
    const hit = (state: FightState) => {
      shake.observe(state)
      shake.hit(state.impact!, { profile: impactPresentation(state.impact!), facing: 1 })
      return shake.offset()
    }
    const weak = hit(light)
    const strong = hit(heavy)
    expect(Math.abs(strong.y)).toBeGreaterThan(Math.abs(weak.y))
    const mixed = { ...heavy, impact: { ...light.impact!, sequence: 999 } }
    expect(hit(mixed)).toEqual(strong)
    for (let i = 0; i < 20; i++) {
      shake.observe(heavy)
      expect(shake.offset()).toEqual(strong)
    }
    shake.observe({ ...heavy, frame: heavy.frame + 20 })
    expect(shake.offset()).toEqual({ x: 0, y: 0 })
    shake.observe(light)
    expect(shake.offset()).toEqual({ x: 0, y: 0 })
  })
})

it('hands a throw back to the updated combat frame instead of its entrance frame', () => {
  let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
  state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 51 } }
  state = performThrow(state, 'player')
  state = {
    ...state,
    player: {
      ...state.player,
      attack: {
        ...state.player.attack!,
        frame: attackData(state.player.attack!.kind, state.player).startup,
      },
    },
  }
  state = resolveFightImpacts(state, [])
  const frame = confirmedThrow(state)!,
    camera = new PerspectiveCamera(34, 16 / 9, 0.1, 100)
  camera.position.set(0, 2.2, 8.2)
  camera.lookAt(0, 1.18, 0)
  applyThrowCamera(camera, { state, frame, intensity: 1, returnToCombat: true })
  camera.position.set(2, 2.5, 11)
  camera.lookAt(2, 1.48, 0)
  const position = camera.position.clone(),
    rotation = camera.quaternion.clone()
  frame.age = frame.duration * 0.99999
  applyThrowCamera(camera, { state, frame, intensity: 1, returnToCombat: true })
  expect(camera.position.distanceTo(position)).toBeLessThan(0.001)
  expect(camera.quaternion.angleTo(rotation)).toBeLessThan(0.001)
})
