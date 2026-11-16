import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import { ALL_CINEMATIC_RULES, CINEMATIC_CATALOGUE } from './cinematicCatalogue'
import { FIGHTER_CAMERA_PARTS } from './cinematicMoveLenses'
import { cinematicDuel, cinematicCommand, cinematicStep } from './cinematicFixtures'
import { cameraSnapshot, cinematicEvents } from './cinematicEvents'
import { createCinematicDirector } from './cinematicDirector'
import { respondMoonlightContract } from './moonlightContract'
import { beginFight, createFight, performMove } from './engine'
import { EMPTY_INPUT } from './types'
import { rig } from './cinematicRules'
import { cameraDetailAllowed } from './cinematicScheduling'

describe('forty-fighter cinematic coverage', () => {
  it('covers the exact selectable roster with unique audit ids and physical lenses', () => {
    const ids = FIGHTING_ROSTER.map((f) => f.id).sort()
    expect(ids).toHaveLength(40)
    expect(Object.keys(CINEMATIC_CATALOGUE).sort()).toEqual(ids)
    expect(Object.keys(FIGHTER_CAMERA_PARTS).sort()).toEqual(ids)
    expect(new Set(ALL_CINEMATIC_RULES.map((r) => r.id)).size).toBe(ALL_CINEMATIC_RULES.length)
  })
  for (const { id } of FIGHTING_ROSTER)
    it.each(['player', 'opponent'] as const)(
      `${id}, %s: films a real action without changing simulation`,
      (side) => {
        let state = cinematicDuel(id, side)
        const director = createCinematicDirector({ viewer: () => side })
        director.update(state)
        const before = cameraSnapshot(state)
        state = cinematicCommand(state, side)
        const events = cinematicEvents(state, before)
        const observed = [...events]
        let expected = state
        for (let i = 0; i < 95; i++) {
          const frozen = JSON.stringify(state)
          director.update(state)
          expect(JSON.stringify(state)).toBe(frozen)
          const previous = cameraSnapshot(state)
          state = cinematicStep(state)
          expected = cinematicStep(expected)
          observed.push(...cinematicEvents(state, previous))
        }
        expect(state).toEqual(expected)
        expect(
          observed.some((e) => e.detail?.source === id || e.detail?.eventId?.startsWith(`${id}.`)),
        ).toBe(true)
      },
    )
  it('does not invent successful abilities when prepared matter or conditions are missing', () => {
    for (const id of [
      'bill',
      'cluck',
      'sayird',
      'luini',
      'yokotani',
      'feitan',
      'halkenburg',
    ] as const) {
      const state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
      const next = performMove({ state, side: 'player', action: 'special' })
      const events = cinematicEvents(next, cameraSnapshot(state))
      expect(events.filter((e) => e.detail?.eventId?.startsWith(`${id}.`))).toEqual([])
    }
  })
  it('shows Moonlight signatures and a real breach separately from contact damage', () => {
    const initial = cinematicDuel('longhi')
    const offer = cinematicCommand(initial)
    expect(
      cinematicEvents(offer, cameraSnapshot(initial)).some(
        (e) => e.detail?.eventId === 'longhi.offer',
      ),
    ).toBe(true)
    const signed = respondMoonlightContract({ state: offer, side: 'opponent', accept: true })
    expect(
      cinematicEvents(signed, cameraSnapshot(offer)).some(
        (e) => e.detail?.eventId === 'longhi.signed',
      ),
    ).toBe(true)
    const breached = performMove({
      state: signed,
      side: 'opponent',
      action: 'light',
      input: EMPTY_INPUT,
    })
    expect(
      cinematicEvents(breached, cameraSnapshot(signed)).some(
        (e) => e.detail?.eventId === 'longhi.penalty',
      ),
    ).toBe(true)
  })
  it('keeps private and concealed information with its viewer, including the camera motion', () => {
    const state = cinematicDuel('musse', 'opponent')
    const director = createCinematicDirector()
    director.update(state)
    let next = cinematicCommand(state, 'opponent')
    for (let i = 0; i < 40; i++) {
      next = cinematicStep(next)
      director.update(next)
    }
    expect(director.update(next).detail?.privateTo).not.toBe('opponent')
    const detail = {
      kind: 'focus' as const,
      side: 'opponent' as const,
      labelFr: 'Secret',
      labelEn: 'Secret',
      anchors: [rig('opponent')],
      aura: true,
    }
    const hidden = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, in: true } },
    }
    expect(cameraDetailAllowed(detail, 'player', hidden)).toBe(false)
    expect(cameraDetailAllowed(detail, 'opponent', hidden)).toBe(true)
    hidden.player.nen.gyo = true
    expect(cameraDetailAllowed(detail, 'player', hidden)).toBe(true)
  })
})
