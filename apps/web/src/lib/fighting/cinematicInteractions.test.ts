import { selectPaperTarget } from './kallutoPaper'
import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
  performMove,
} from './engine'
import { cinematicEvents, cameraSnapshot } from './cinematicEvents'
import { cinematicDuel, cinematicStep } from './cinematicFixtures'
import { recordFightInjuries } from './feitanPain'
import { DOOR_FRAMES, doorBodyPositions, transportDoorBodies } from './voconteDoors'
import { EMPTY_INPUT } from './types'
import type { FightState } from './types'
import { cameraDetailAllowed, createCameraScheduler } from './cinematicScheduling'
import { createCinematicDirector } from './cinematicDirector'

function track(state: FightState, frames: number) {
  const ids: string[] = []
  for (let i = 0; i < frames; i++) {
    const before = cameraSnapshot(state)
    state = cinematicStep(state)
    ids.push(
      ...cinematicEvents(state, before).flatMap((e) =>
        e.detail?.eventId ? [e.detail.eventId] : [],
      ),
    )
  }
  return { state, ids }
}

describe('confirmed cinematic interactions', () => {
  it('observes Sun and Moon detonating when the second mark resolves inside the same engine tick', () => {
    let state = cinematicDuel('chrollo')
    const ids: string[] = []
    for (const [slot, frames] of [
      ['neutralSpecial', 65],
      ['downSpecial', 50],
      ['finisher', 90],
    ] as const) {
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        auraCharged: false,
        moveId: `chrollo:${slot}`,
      })
      const result = track(state, frames)
      state = result.state
      ids.push(...result.ids)
    }
    expect(ids).toContain('chrollo.detonation')
  })
  it.each(['player', 'opponent'] as const)(
    'follows all four real post-mortem phases for %s',
    (side) => {
      const other = side === 'player' ? 'opponent' : 'player'
      const s = beginFight(
        createFight(
          side === 'player' ? 'camilla' : 'hisoka',
          side === 'opponent' ? 'camilla' : 'hisoka',
          { mode: 'versus-local', formatId: 'knockout' },
        ),
      )
      const prepared = {
        ...s,
        [side]: { ...s[side], x: 50, health: 1 },
        [other]: { ...s[other], x: side === 'player' ? 55 : 45 },
      }
      const attack = performAttack(prepared, other, 'heavy')
      const result = track(attack, 200)
      expect(result.ids).toEqual(
        expect.arrayContaining([
          'camilla.cat-summon',
          'camilla.cat-capture',
          'camilla.cat-absorb',
          'camilla.cat-revive',
          'camilla.revived',
        ]),
      )
      expect(result.state[side].health).toBe(result.state[side].maxHealth)
      expect(result.state.winner).toBe(side)
    },
  )
  it.each(['player', 'opponent'] as const)(
    'tracks copied Pain Packer on Chrollo’s own body, %s',
    (side) => {
      const initial = beginFight(
        createFight(
          side === 'player' ? 'chrollo' : 'hisoka',
          side === 'opponent' ? 'chrollo' : 'hisoka',
          { mode: 'versus-local' },
        ),
      )
      let state: FightState = {
        ...initial,
        [side]: {
          ...initial[side],
          aura: 100,
          chrolloBook: { pages: ['feitan'], page: 0, open: true, bookmark: null },
        },
      }
      state = recordFightInjuries(state, {
        ...state,
        [side]: { ...state[side], health: state[side].health - 30 },
      })
      const before = cameraSnapshot(state)
      const next = performAttack(state, side, 'special')
      const events = [
        ...cinematicEvents(next, before),
        ...track(next, 60).ids.map((id) => ({ detail: { eventId: id } })),
      ]
      expect(events.some((e) => e.detail?.eventId === 'feitan.armour')).toBe(true)
      const shot = cinematicEvents(next, before).find((e) => e.detail?.eventId === 'feitan.armour')
      if (shot) expect(shot.detail?.side).toBe(side)
      expect(next[side].id).toBe('chrollo')
    },
  )
  it('distinguishes connecting Door from actually transporting the other fighter', () => {
    let state = cinematicDuel('voconte')
    state = performAttack(state, 'player', 'special')
    state = track(state, 35).state
    const old = cameraSnapshot(state)
    const frame = DOOR_FRAMES[0]
    const previous = { ...doorBodyPositions(state), opponent: { x: frame.x - 1, y: 0 } }
    const crossed = transportDoorBodies({
      ...state,
      opponent: { ...state.opponent, x: frame.x + 1, y: 0 },
      voconteDoors: { ...state.voconteDoors!, origins: previous, transported: [] },
    })
    expect(crossed.opponent.x).not.toBe(frame.x + 1)
    expect(
      cinematicEvents(crossed, old).some((e) => e.detail?.eventId === 'voconte.transit-opponent'),
    ).toBe(true)
  })
  it('frames possession even when the real arrow passed through a guard', () => {
    let state = cinematicDuel('halkenburg')
    state = performAttack(state, 'player', 'special')
    const ids: string[] = []
    for (let i = 0; i < 80; i++) {
      const old = cameraSnapshot(state)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, guard: true },
        ai: false,
      })
      ids.push(
        ...cinematicEvents(state, old).flatMap((e) =>
          e.detail?.eventId ? [e.detail.eventId] : [],
        ),
      )
    }
    expect(ids).toContain('halkenburg.possession')
  })
  it('coalesces repeated observations and presents a second consequential event after the awakening', () => {
    const state = cinematicDuel('kurapika')
    const scheduler = createCameraScheduler()
    const base = {
      cue: { frame: 0, side: 'player' as const, strength: 1, hold: 22, release: 44 },
      duration: 108,
      priority: 3,
      detail: {
        kind: 'body' as const,
        side: 'player' as const,
        labelFr: 'Awake',
        labelEn: 'Awake',
        eventId: 'awake',
      },
    }
    const held = scheduler.update(null, [base], { state, frame: 0, viewer: 'player' })
    const next = {
      ...base,
      priority: 2.5,
      duration: 54,
      detail: { ...base.detail, eventId: 'capture' },
    }
    expect(
      scheduler.update(held, [next], { state, frame: 5, viewer: 'player' })?.detail.eventId,
    ).toBe('awake')
    expect(scheduler.update(held, [], { state, frame: 90, viewer: 'player' })?.detail.eventId).toBe(
      'capture',
    )
  })
  it('keeps private future readiness from changing an opponent’s camera', () => {
    let state = cinematicDuel('tserriednich', 'opponent')
    const director = createCinematicDirector()
    director.update(state)
    state = performMove({ state, side: 'opponent', action: 'special' })
    const early = director.update(state)
    state = track(state, 30).state
    const later = director.update(state)
    if (later.detail) expect(cameraDetailAllowed(later.detail, 'player', state)).toBe(true)
    expect(later.strength).toBeLessThanOrEqual(early.strength)
  })
  it('does not identify the enemy Laplace activation through an automatic close-up', () => {
    const base = cinematicDuel('tserriednich', 'opponent')
    const observer = createCinematicDirector({ viewer: () => 'player' })
    const owner = createCinematicDirector({ viewer: () => 'opponent' })
    observer.update(base)
    owner.update(base)
    const preparing = performMove({ state: base, side: 'opponent', action: 'special' })
    expect(owner.update(preparing).detail?.eventId).toBe('tserriednich.zetsu')
    expect(observer.update(preparing).detail?.eventId ?? '').not.toMatch(/^tserriednich\./)
    let state = preparing
    for (let frame = 0; frame < 32; frame++) {
      state = cinematicStep(state)
      expect(observer.update(state).detail?.eventId ?? '').not.toMatch(/^tserriednich\./)
    }
  })
  it('waits for actual Predator readiness instead of treating a newly discovered prey as completed analysis', () => {
    const s = beginFight(createFight('rihan', 'hisoka', { mode: 'versus-local' }))
    const ready: FightState = {
      ...s,
      player: { ...s.player, x: 48, aura: 100 },
      opponent: { ...s.opponent, x: 53 },
      bungeeGum: { owner: 'opponent', target: 'player', hidden: false, retracting: false },
    }
    const watching = performAttack(ready, 'player', 'special')
    const early = track(watching, 30)
    expect(early.state.player.predator?.known).toContain('bungee-gum')
    expect(early.ids).not.toContain('rihan.ready')
    expect(track(early.state, 160).ids).toContain('rihan.ready')
  })
  it('frames Melody’s completed heartbeat listening at the engine’s real listening threshold', () => {
    const state = cinematicDuel('melody')
    const result = track(state, 20)
    expect(result.ids).toContain('melody.heart')
    expect(result.state.player.melodyHearing?.frames).toBe(12)
  })
  it.each(['head', 'feet'] as const)('frames Kalluto’s actual implanted zone: %s', (zone) => {
    let state = cinematicDuel('kalluto')
    state = selectPaperTarget(state, 'player', zone)
    state = performMove({ state, side: 'player', action: 'special' })
    let planted
    for (let i = 0; i < 80; i++) {
      const old = cameraSnapshot(state)
      state = cinematicStep(state)
      planted =
        planted ?? cinematicEvents(state, old).find((e) => e.detail?.eventId === 'kalluto.plant')
    }
    expect(planted?.detail?.anchors).toContainEqual({ type: 'rig', side: 'opponent', part: zone })
  })
})
