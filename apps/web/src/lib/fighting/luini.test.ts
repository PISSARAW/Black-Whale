import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { createFightEnvironment } from './fightEnvironment'
import { luiniAction, luiniAnchor } from './luiniSpatial'
import { luiniPhasePresentation } from './luiniPresentation'
import { preparationCheck } from './preparationRequirements'
import { preparedActionReady } from './preparationActions'
import { interactWithPreparation, advancePreparation } from './preparationSimulation'
import { updateEntity } from './preparationWorld'
import { fightSpecialPresentation } from './fightSpecialPresentation'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinIsBusy } from './kurapikaDolphin'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(player: FighterId = 'luini', opponent: FighterId = 'hisoka') {
  const environment = createFightEnvironment({
    preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
  })
  const state = beginFight(createFight(player, opponent, { mode: 'versus-local', environment }))
  return {
    ...state,
    player: { ...state.player, aura: 100 },
    opponent: { ...state.opponent, aura: 100 },
  }
}

function recover(state: FightState): FightState {
  for (let frame = 0; frame < 18; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

function cast(state: FightState, side: FightSide = 'player') {
  return performAttack(state, side, 'special')
}

function moveBody(state: FightState, x: number, y = 0): FightState {
  return { ...state, player: { ...state.player, x, y } }
}

function borrow(state: FightState): FightState {
  const active = toggleEmperorTime(state, 'player')
  return {
    ...active,
    player: {
      ...active.player,
      kurapika: {
        ...active.player.kurapika!,
        held: {
          source: 'luini',
          victim: 'opponent',
          moveId: 'luini:neutralSpecial',
          loaded: true,
          used: false,
          sustainedKeys: [],
        },
      },
    },
  }
}

function dolphinL(state: FightState) {
  return performMove({
    state,
    side: 'player',
    action: 'special',
    input: { ...EMPTY_INPUT, left: state.player.facing === 1, right: state.player.facing === -1 },
  })
}

describe('Luini — anchor, departure and unrestricted return', () => {
  it('anchors from inside the sealed room without moving or creating any offensive/defensive effect', () => {
    const state = duel()
    const anchored = cast(state)
    expect(luiniAction(state, 'player')).toBe('anchor')
    expect(anchored.player.x).toBe(state.player.x)
    expect(anchored.player.y).toBe(state.player.y)
    expect(luiniAnchor(anchored, 'player')?.id).toBe('player:room')
    expect(anchored.player.aura).toBe(80)
    expect(anchored.player.preparationRecovery).toBe(18)
    expect(anchored.player.hatsuEffects.teleportDodges).toBe(0)
    expect(anchored.player.attack).toBeNull()
    expect(anchored.opponent.health).toBe(state.opponent.health)
    expect(state.battlefield?.luiniAnchors).toBeUndefined()
    expect(cast(anchored)).toBe(anchored)
  })

  it.each([
    [85, 0],
    [27, 0],
    [20, 17],
  ])('cannot create an anchor from outside the room at (%s, %s)', (x, y) => {
    const state = moveBody(duel(), x, y)
    expect(preparedActionReady(state, 'player')).toBe(false)
    expect(cast(state)).toBe(state)
  })

  it.each([{ singleDoor: false }, { sealed: false }, { present: false }, { health: 0 }])(
    'requires a real usable single-door sealed room: %j',
    (change) => {
      const state = updateEntity(duel(), 'player:room', change)
      expect(cast(state)).toBe(state)
    },
  )

  it('can anchor before having any visited destination, but cannot depart to an unvisited place', () => {
    const state = updateEntity(duel(), 'player:destination', { visitedBy: ['opponent'] })
    const anchored = recover(cast(state))
    expect(luiniAnchor(anchored, 'player')).toBeDefined()
    expect(preparationCheck(anchored, 'player').ready).toBe(false)
    expect(cast(anchored)).toBe(anchored)
    const visited = updateEntity(anchored, 'player:destination', { visitedBy: ['player'] })
    expect(cast(visited).player.x).toBe(85)
  })

  it('departs only on the next activation, preserving the anchor for future returns', () => {
    const anchored = recover(cast(duel()))
    expect(luiniAction(anchored, 'player')).toBe('depart')
    const departed = cast(anchored)
    expect(departed.player.x).toBe(85)
    expect(departed.player.aura).toBeCloseTo(anchored.player.aura - 20)
    expect(luiniAnchor(departed, 'player')?.id).toBe('player:room')
    expect(luiniAction(departed, 'player')).toBe('return')
  })

  it.each([
    [0, 0],
    [48, 0],
    [100, 30],
    [20, 25],
  ])('returns from (%s, %s) even with no destination left', (x, y) => {
    const anchored = recover(cast(duel()))
    const outside = moveBody(
      updateEntity(anchored, 'player:destination', { present: false, visitedBy: [] }),
      x,
      y,
    )
    expect(preparationCheck(outside, 'player').ready).toBe(true)
    const returned = cast(outside)
    expect(returned.player.x).toBe(20)
    expect(returned.player.y).toBe(0)
    expect(returned.player.velocityY).toBe(0)
    expect(returned.player.hatsuEffects.teleportDodges).toBe(0)
    expect(returned.player.wakeupInvulnerableFrames).toBe(outside.player.wakeupInvulnerableFrames)
    expect(luiniAction(returned, 'player')).toBe('depart')
  })

  it('does not confuse a supplied room with an active anchor when starting outside', () => {
    const outside = moveBody(duel(), 48)
    expect(cast(outside)).toBe(outside)
  })

  it('the opponent can open the anchor door, permanently cancelling departure and return', () => {
    const outside = moveBody(recover(cast(duel())), 48)
    const enemyAtDoor = { ...outside, opponent: { ...outside.opponent, x: 20 } }
    const opened = interactWithPreparation(enemyAtDoor, 'opponent')
    expect(luiniAnchor(opened, 'player')).toBeUndefined()
    expect(cast(opened)).toBe(opened)
    const reclosed = updateEntity(opened, 'player:room', { sealed: true, invalidated: false })
    const inside = moveBody(reclosed, 20)
    expect(cast(inside)).toBe(inside)
    expect(
      inside.battlefield!.entities.find((entity) => entity.id === 'player:room')?.invalidated,
    ).toBe(true)
    expect(
      enemyAtDoor.battlefield!.entities.find((entity) => entity.id === 'player:room')?.sealed,
    ).toBe(true)
  })

  it('also invalidates a room opened externally, without changing the original forecast state', () => {
    const anchored = recover(cast(duel()))
    const external = {
      ...anchored,
      battlefield: {
        ...anchored.battlefield!,
        entities: anchored.battlefield!.entities.map((entry) =>
          entry.id === 'player:room' ? { ...entry, sealed: false } : entry,
        ),
      },
    }
    const next = advancePreparation(external, { player: EMPTY_INPUT })
    expect(next.battlefield!.luiniAnchors?.player).toBeUndefined()
    expect(
      next.battlefield!.entities.find((entry) => entry.id === 'player:room')?.invalidated,
    ).toBe(true)
    expect(
      external.battlefield!.entities.find((entry) => entry.id === 'player:room')?.invalidated,
    ).toBe(false)
  })

  it('keeps the same arena, clock and health and reconstructs rooms and anchors only for a new round', () => {
    const state = duel()
    const departed = cast(recover(cast(state)))
    expect(departed.environment).toBe(state.environment)
    expect(departed.environment.stageId).toBe(state.environment.stageId)
    expect(departed.roundNumber).toBe(state.roundNumber)
    expect(departed.player.health).toBe(state.player.health)
    const opened = updateEntity(departed, 'player:room', { sealed: false })
    const next = nextRound({ ...opened, phase: 'finished', winner: 'player' })
    expect(next.battlefield?.luiniAnchors?.player).toBeUndefined()
    expect(
      next.battlefield!.entities.find((entry) => entry.id === 'player:room')?.invalidated,
    ).toBe(false)
  })

  it('both players have their own anchor and visits', () => {
    const state = duel('luini', 'luini')
    const anchored = cast(cast(state), 'opponent')
    expect(luiniAnchor(anchored, 'player')?.id).toBe('player:room')
    expect(luiniAnchor(anchored, 'opponent')?.id).toBe('opponent:room')
    const departed = cast(recover(anchored), 'opponent')
    expect(departed.opponent.x).toBe(15)
    const outside = { ...recover(departed), opponent: { ...recover(departed).opponent, x: 50 } }
    expect(cast(outside, 'opponent').opponent.x).toBe(80)
  })

  it.each(['fr', 'en'] as const)(
    'exposes distinct phase labels and the burned-room status in %s',
    (language) => {
      const state = duel()
      const anchored = recover(cast(state))
      const outside = moveBody(anchored, 48)
      const labels = [state, anchored, outside].map(
        (entry) => fightSpecialPresentation(entry, language).label,
      )
      expect(new Set(labels).size).toBe(3)
      const opened = updateEntity(outside, 'player:room', { sealed: false })
      expect(luiniPhasePresentation(opened, 'player', language).status).toMatch(
        /définitivement|permanently/,
      )
      expect(fightSpecialPresentation(opened, language).ready).toBe(false)
    },
  )
})

describe('Luini — copies keep the complete passage and personal prerequisites', () => {
  it('Skill Hunter must make its own anchor and visits; closing the page dismisses the anchor', () => {
    const state = duel('chrollo', 'luini')
    const nativeAnchor = cast(state, 'opponent')
    const copied: FightState = {
      ...nativeAnchor,
      player: {
        ...nativeAnchor.player,
        chrolloBook: { pages: ['luini'], page: 0, open: true, bookmark: null },
      },
    }
    expect(luiniAnchor(copied, 'player')).toBeUndefined()
    const anchored = cast(copied)
    expect(anchored.player.x).toBe(copied.player.x)
    expect(luiniAnchor(anchored, 'player')?.id).toBe('player:room')
    const unvisited = updateEntity(recover(anchored), 'player:destination', {
      visitedBy: ['opponent'],
    })
    expect(cast(unvisited)).toBe(unvisited)
    const closed = {
      ...anchored,
      player: { ...anchored.player, chrolloBook: { ...anchored.player.chrolloBook!, open: false } },
    }
    expect(luiniAnchor(reconcileChrolloPages(anchored, closed, 'player'), 'player')).toBeUndefined()
    expect(luiniAnchor(anchored, 'opponent')).toBeDefined()
  })

  it('Stealth Dolphin stays occupied through anchoring and departure, then releases after returning from anywhere', () => {
    const state = borrow(duel('kurapika', 'luini'))
    const anchored = dolphinL(state)
    expect(anchored.player.x).toBe(state.player.x)
    expect(luiniAnchor(anchored, 'player')).toBeDefined()
    expect(dolphinIsBusy(anchored, 'player', anchored.player.kurapika!.held!)).toBe(true)
    const departed = dolphinL(recover(anchored))
    expect(departed.player.x).toBe(85)
    const outside = moveBody(recover(departed), 48)
    const returned = dolphinL(outside)
    expect(returned.player.id).toBe('kurapika')
    expect(returned.player.x).toBe(20)
    expect(returned.player.kurapika!.held).toBeNull()
    expect(luiniAnchor(returned, 'player')).toBeUndefined()
  })

  it('opening the door releases the borrowed passage instead of leaving Dolphin stuck', () => {
    const anchored = dolphinL(borrow(duel('kurapika', 'luini')))
    const opened = updateEntity(anchored, 'player:room', { sealed: false })
    expect(recover(opened).player.kurapika!.held).toBeNull()
  })
})
