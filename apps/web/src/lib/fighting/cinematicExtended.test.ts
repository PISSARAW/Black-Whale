import { describe, expect, it } from 'vitest'
import { createCameraScheduler } from './cinematicScheduling'
import { cameraSnapshot, cinematicEvents } from './cinematicEvents'
import { createCinematicDirector } from './cinematicDirector'
import { beginFight, createFight, performMove } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { cinematicDuel, cinematicStep, cinematicCommand } from './cinematicFixtures'
import { FIGHTING_ROSTER } from './roster'
import type { CameraEvent } from './cinematicTypes'

describe('extended live cameras at normal combat speed', () => {
  it.each(FIGHTING_ROSTER.map((f) => f.id).filter((id) => id !== 'kurapika'))(
    '%s: gives an actual engine event a prolonged window',
    (id) => {
      const initial = cinematicDuel(id),
        before = cameraSnapshot(initial)
      const state = cinematicCommand(initial)
      const event = cinematicEvents(state, before).find((e) => e.detail?.source === id)
      expect(event, `${id}: no activation`).toBeDefined()
      const scheduler = createCameraScheduler()
      const shot = scheduler.update(null, [event!], {
        state,
        frame: state.frame,
        viewer: 'player',
      })!
      expect(shot.until - shot.started).toBeGreaterThanOrEqual(180)
    },
  )
  it('follows the current face when Emperor Time ends instead of freezing or showing obsolete red eyes', () => {
    let state = toggleEmperorTime(cinematicDuel('kurapika'), 'player')
    const scheduler = createCameraScheduler()
    const event = cinematicEvents(state, cameraSnapshot(cinematicDuel('kurapika'))).find(
      (e) => e.detail?.kind === 'eyes',
    )!
    const shot = scheduler.update(null, [event], { state, frame: 0, viewer: 'player' })
    state = toggleEmperorTime(state, 'player')
    const next = scheduler.update(shot, [], { state, frame: 20, viewer: 'player' })!
    expect(next.detail).toMatchObject({
      kind: 'focus',
      followThrough: true,
      anchors: [{ type: 'rig', side: 'player', part: 'head' }],
    })
    expect(scheduler.update(next, [], { state, frame: 70, viewer: 'player' })?.detail).toBe(
      next.detail,
    )
    expect(scheduler.update(next, [], { state, frame: 85, viewer: 'player' })).toBeNull()
  })
  it('keeps fixed-step time, movement, health and aura identical through a full extended shot', () => {
    let observed = cinematicDuel('feitan'),
      control = observed
    const director = createCinematicDirector()
    director.update(observed)
    observed = cinematicCommand(observed)
    control = cinematicCommand(control)
    director.update(observed)
    for (let i = 0; i < 300; i++) {
      observed = cinematicStep(observed)
      control = cinematicStep(control)
      director.update(observed, 1, 1 / 60)
    }
    expect(observed).toEqual(control)
    expect(observed.frame).toBe(300)
  })
  it('does not merge identical awakenings belonging to opposite players', () => {
    const initial = beginFight(createFight('biscuit', 'biscuit', { mode: 'versus-local' }))
    const player = performMove({ state: initial, side: 'player', action: 'special' })
    const state = performMove({ state: player, side: 'opponent', action: 'special' })
    const scheduler = createCameraScheduler()
    const events = cinematicEvents(state, cameraSnapshot(initial)).filter(
      (e) => e.detail?.eventId === 'biscuit.form',
    )
    const first = scheduler.update(null, events, { state, frame: 0, viewer: 'player' })!
    const second = scheduler.update(first, [], { state, frame: 90, viewer: 'player' })!
    expect(first.detail.side).not.toBe(second.detail.side)
  })
  it('coalesces a barrage and caps one shot at six seconds', () => {
    const state = cinematicDuel('franklin'),
      scheduler = createCameraScheduler()
    let shot = null as ReturnType<typeof scheduler.update>
    for (let frame = 0; frame < 400; frame += 5) {
      const event: CameraEvent = {
        cue: { frame, side: 'player', strength: 1, hold: 10, release: 44 },
        priority: 2,
        detail: {
          kind: 'impact',
          side: 'opponent',
          sourceSide: 'player',
          source: 'franklin',
          eventId: `impact:${frame}`,
          labelFr: 'Impact',
          labelEn: 'Impact',
        },
      }
      shot = scheduler.update(shot, [event], { state, frame, viewer: 'player' })!
      expect(shot.until - shot.started).toBeLessThanOrEqual(360)
      expect(shot.detail.labelFr).toBe('Impact confirmé')
    }
    expect(shot!.started).toBe(360)
  })
})
