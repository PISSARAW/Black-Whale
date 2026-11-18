import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
  nextRound,
} from './engine'
import { performArsenalAction } from './arsenalExecution'
import { arsenalOptions, validArsenalCommand } from './retrospectiveArsenal'
import { createFightEnvironment } from './fightEnvironment'
import { updateEntity } from './preparationWorld'
import { luiniAnchor, advanceLuiniAnchors } from './luiniSpatial'
import { luiniArsenalAi } from './luiniArsenal'
import { hurtboxes, attackData, boxesOverlap } from './frameData'
import { canMove } from './fightActorState'
import { resolveFightImpacts } from './combatImpact'
import { privatePvpState } from './pvp/view'
import { speakPaperWords } from './kallutoListening'
import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function duel(id: FighterId = 'luini'): FightState {
  const environment = createFightEnvironment({
    preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
  })
  const state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local', environment }))
  return {
    ...state,
    player: { ...state.player, x: 20, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function command(state: FightState, command: ArsenalCommand, side: FightSide = 'player') {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
function frames(state: FightState, count = 18): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function anchored(state = duel()) {
  return frames(command(state, { action: 'luini-travel' }))
}
function partial(mode: 'door' | 'ceiling' = 'door', base = anchored()) {
  return command(command(base, { action: 'luini-select', target: `${mode}:player:destination` }), {
    action: 'luini-travel',
  })
}

describe('Luini’s two encounter applications', () => {
  it('does not select an exit using an opponent position the AI cannot currently perceive', () => {
    const base = duel()
    const actor = createFight('hisoka', 'luini').opponent
    const located = {
      ...base,
      player: { ...base.opponent, x: 15 },
      opponent: { ...actor, x: 80, aura: 100 },
      battlefield: { ...base.battlefield!, luiniAnchors: { opponent: 'opponent:room' } },
    }
    expect(luiniArsenalAi(located, performAuraAttack)?.opponent.luiniPassage).toBeDefined()
    const blind = {
      ...located,
      opponent: {
        ...located.opponent,
        hatsuEffects: { ...located.opponent.hatsuEffects, senseSeals: 1 },
      },
    }
    expect(luiniArsenalAi(blind, performAuraAttack)).toBeNull()
  })
  it('uses a physical knife cut to create an actual wound, including one Zakuro can use', () => {
    const base = duel()
    const target = createFight('luini', 'zakuro').opponent
    const start = { ...base, player: { ...base.player, x: 42 }, opponent: { ...target, x: 50 } }
    const ready = performAttack(start, 'player', 'light')
    const active = {
      ...ready,
      player: {
        ...ready.player,
        attack: { ...ready.player.attack!, frame: attackData('light', ready.player).startup },
      },
    }
    const hit = resolveFightImpacts(active, [])
    expect(hit.opponent.openWounds).toBe(1)
    expect(hit.opponent.health).toBeLessThan(start.opponent.health)
    const disarmed = { ...active, player: { ...active.player, weaponsConfiscated: true } }
    expect(resolveFightImpacts(disarmed, []).opponent.openWounds).toBeUndefined()
  })
  it('selects an actual visited location instead of silently substituting the first exit', () => {
    const initial = anchored(),
      destination = initial.battlefield!.entities.find(
        (entry) => entry.id === 'player:destination',
      )!
    const supplied = {
      ...initial,
      battlefield: {
        ...initial.battlefield!,
        entities: [
          ...initial.battlefield!.entities,
          { ...destination, id: 'player:second', x: 60 },
          { ...destination, id: 'player:unvisited', x: 30, visitedBy: ['opponent' as const] },
        ],
      },
    }
    const selected = command(supplied, { action: 'luini-select', target: 'full:player:second' })
    expect(selected.player.x).toBe(20)
    expect(command(selected, { action: 'luini-travel' }).player.x).toBe(60)
    expect(command(supplied, { action: 'luini-select', target: 'full:player:unvisited' })).toBe(
      supplied,
    )
    const removed = updateEntity(selected, 'player:second', { present: false })
    expect(command(removed, { action: 'luini-travel' })).toBe(removed)
  })
  it.each(['door', 'ceiling'] as const)(
    'exposes the %s exit and keeps both portions physically vulnerable',
    (mode) => {
      const initial = anchored(),
        state = partial(mode, initial)
      expect(state.player.aura).toBe(initial.player.aura - 20)
      expect(state.player.luiniPassage).toMatchObject({ mode, originX: 20, exitX: 85 })
      const boxes = hurtboxes(state.player)
      expect(boxes.some((box) => box.left < 85 && box.right > 85 && box.bottom >= 5.2)).toBe(true)
      expect(boxes.some((box) => box.left < 20 && box.right > 20 && box.top === 5.2)).toBe(true)
      expect(
        boxes.some((box) => boxesOverlap(box, { left: 83, right: 87, bottom: 0, top: 3 })),
      ).toBe(false)
      expect(frames(state).player.luiniPassage).toBeDefined()
      const recovered = frames(state)
      expect(performAttack(recovered, 'player', 'light')).toBe(recovered)
      expect(frames(state).player.y).toBe(mode === 'ceiling' ? 4 : 0)
      expect(canMove(state.player)).toBe(false)
      expect(performAttack(state, 'player', 'light')).toBe(state)
      expect(command(state, { action: 'luini-emerge' })).toBe(state) // activation recovery
      expect(state.opponent.health).toBe(initial.opponent.health)
    },
  )
  it('lets a real attack hit the exposed upper body and prevents a free retreat while stunned', () => {
    const state = partial()
    const nearby = { ...state, opponent: { ...state.opponent, x: 76, facing: 1 as const } }
    const started = performAttack(nearby, 'opponent', 'light')
    const active = {
      ...started,
      opponent: {
        ...started.opponent,
        attack: {
          ...started.opponent.attack!,
          frame: attackData('light', started.opponent).startup,
        },
      },
    }
    const hit = resolveFightImpacts(active, [])
    expect(hit.player.health).toBeLessThan(state.player.health)
    expect(command(hit, { action: 'luini-retract' })).toBe(hit)
    expect(advanceLuiniAnchors(hit).player.luiniPassage).toBeUndefined()
  })
  it('allows ordinary speech, then paid retraction or completion after recovery', () => {
    const state = frames(partial())
    const audible = { ...state, opponent: { ...state.opponent, x: 75 } }
    expect(speakPaperWords(audible, 'player', 'Bonjour.').opponent.heardWords?.text).toBe(
      'Bonjour.',
    )
    const returned = command(state, { action: 'luini-retract' })
    expect(returned.player.x).toBe(20)
    expect(returned.player.luiniPassage).toBeUndefined()
    expect(returned.player.aura).toBe(state.player.aura - 20)
    const completed = command(state, { action: 'luini-emerge' })
    expect(completed.player.x).toBe(85)
    expect(completed.player.y).toBe(0)
    expect(completed.player.luiniPassage).toBeUndefined()
    expect(completed.player.health).toBe(state.player.health)
  })
  it('invalidates the real anchor on opening and removes exposed states on Nen loss, damage or round reset', () => {
    const state = partial()
    const opened = advanceLuiniAnchors(updateEntity(state, 'player:room', { sealed: false }))
    expect(luiniAnchor(opened, 'player')).toBeUndefined()
    expect(opened.player.luiniPassage).toBeUndefined()
    for (const patch of [{ hitStun: 12 }, { health: 0 }, { moonlightZetsu: true }]) {
      expect(
        advanceLuiniAnchors({ ...state, player: { ...state.player, ...patch } }).player
          .luiniPassage,
      ).toBeUndefined()
    }
    expect(
      nextRound({ ...state, phase: 'finished', winner: 'player' }).player.luiniPassage,
    ).toBeUndefined()
  })
  it('uses a copied page’s own room and visits, and keeps the selected exit private', () => {
    const base = duel('chrollo')
    const prepared = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['luini'] as const, open: true, page: 0, bookmark: null },
      },
    }
    const state = partial('door', anchored(prepared))
    expect(state.player.id).toBe('chrollo')
    expect(state.player.luiniPassage).toBeDefined()
    expect(privatePvpState(state, 'opponent').opponent.luiniExit).toBeUndefined()
    expect(privatePvpState(state, 'opponent').opponent.luiniPassage).toBeDefined()
    const noVisits = updateEntity(anchored(prepared), 'player:destination', {
      visitedBy: ['opponent'],
    })
    expect(command(noVisits, { action: 'luini-select', target: 'door:player:destination' })).toBe(
      noVisits,
    )
  })
  it('keeps Dolphin occupied until its one passage completes, without copying the original user’s visits', () => {
    const base = duel('kurapika'),
      actor = base.player
    const loaded = {
      ...base,
      player: {
        ...actor,
        kurapika: {
          ...actor.kurapika!,
          emperorTime: true,
          held: {
            source: 'luini' as const,
            victim: 'opponent' as const,
            moveId: 'luini:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const state = frames(partial('door', anchored(loaded)))
    expect(state.player.id).toBe('kurapika')
    expect(state.player.luiniPassage).toBeDefined()
    expect(state.player.kurapika?.held?.used).toBe(true)
    const done = frames(command(state, { action: 'luini-emerge' }), 1)
    expect(done.player.x).toBe(85)
    expect(done.player.luiniPassage).toBeUndefined()
    expect(done.player.kurapika?.held).toBeNull()
  })
  it('exposes unique network-valid commands and lets a prepared AI complete its own partial passage', () => {
    const state = frames(partial())
    const options = arsenalOptions(state, 'player')
    const keys = options.map((entry) => JSON.stringify(entry.command))
    expect(new Set(keys).size).toBe(keys.length)
    expect(options.every((entry) => validArsenalCommand(entry.command))).toBe(true)
    const mirrored: FightState = {
      ...state,
      player: state.opponent,
      opponent: { ...state.player },
      battlefield: { ...state.battlefield!, luiniAnchors: { opponent: 'opponent:room' } },
    }
    expect(luiniArsenalAi(mirrored, performAuraAttack)?.opponent.luiniPassage).toBeUndefined()
  })
})
