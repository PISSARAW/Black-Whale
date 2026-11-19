import { performArsenalCommand } from './retrospectiveArsenal'
import { predatorPrey, preyIsLive } from './predatorPrey'
import { advanceBlinky } from './blinkyFrames'
import { attackData } from './frameData'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { performArenaAction, arenaObjects } from './arenaActions'
import { ARENA_TECHNIQUES } from './arenaTechnique'
import { advanceArena, collideArenaBodies, interceptArenaProjectile } from './arenaSimulation'
import { interactWithPreparation } from './preparationSimulation'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'
import { projectileProfile } from './projectiles'
import { futureVisibleState } from './parallelFuturePresentation'

function duel(id: FighterId = 'hisoka', target: FighterId = 'theta') {
  const state = beginFight(
    createFight(id, target, { mode: 'versus-local', environment: { arenaInteractions: true } }),
  )
  return { ...state, player: { ...state.player, aura: 100 } }
}
function frames(state: FightState, count: number, arena = false) {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, { ...EMPTY_INPUT, arena }, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
const use = (state: FightState, side: 'player' | 'opponent' = 'player') =>
  performArenaAction(state, side, performAuraAttack)
const nearby = (state: FightState): FightState => ({ ...state, player: { ...state.player, x: 27 } })

describe('forty arena applications and real cover', () => {
  it('covers exactly the forty playable fighters and leaves preparation optional', () => {
    expect(FIGHTING_ROSTER).toHaveLength(40)
    expect(Object.keys(ARENA_TECHNIQUES).sort()).toEqual(
      FIGHTING_ROSTER.map((entry) => entry.id).sort(),
    )
    expect(createFight('hisoka', 'theta').arena).toBeUndefined()
    expect(arenaObjects(duel())).toHaveLength(2)
    for (const entry of Object.values(ARENA_TECHNIQUES))
      for (const copy of [entry.name, entry.effect, entry.condition])
        expect(copy.every(Boolean)).toBe(true)
  })

  it('blocks walking and tunnelling but permits jumps and Hanzo’s active double', () => {
    const state = { ...duel(), player: { ...duel().player, x: 27 } }
    const moved = { ...state, player: { ...state.player, x: 36 } }
    expect(collideArenaBodies(state, moved).player.x).toBe(28.5)
    expect(
      collideArenaBodies(state, { ...moved, player: { ...moved.player, y: 9 } }).player.x,
    ).toBe(36)
    const projected = {
      ...moved,
      player: {
        ...moved.player,
        hanzoProjection: {
          bodyX: 27,
          bodyFacing: 1 as const,
          bodyNen: state.player.nen,
          startupFrames: 0,
        },
      },
    }
    expect(collideArenaBodies(state, projected).player.x).toBe(36)
  })

  it('intercepts a fast bullet once, destroys cover, and does not intercept an underground fist', () => {
    const state = duel()
    const bullet = {
      ...projectileProfile('theta'),
      id: 1,
      owner: 'opponent' as const,
      fighterId: 'theta' as const,
      x: 30,
      y: 6,
      velocityX: -100,
      damage: 50,
      age: 0,
      lifetime: 60,
      targetZone: 'torso' as const,
    }
    const hit = interceptArenaProjectile(state, bullet, 40)
    expect(hit.intercepted).toBe(true)
    expect(arenaObjects(hit.state)).toHaveLength(1)
    expect(hit.state.player.health).toBe(state.player.health)
    expect(arenaObjects(state)).toHaveLength(2)
    const fist = {
      ...bullet,
      y: -3,
      remotePunch: { originX: 40, targetX: 34, travelFrames: 12, struck: false },
    }
    expect(interceptArenaProjectile(state, fist, 40).intercepted).toBe(false)
  })

  it('lets Theta and Beyond break cover without gaining a Hatsu or paying aura', () => {
    for (const id of ['theta', 'beyond'] as const) {
      let state = nearby(duel(id))
      state = { ...state, player: { ...state.player, aura: 0 } }
      const original = state
      for (let attempt = 0; attempt < 8; attempt++) state = frames(use(state), 60)
      expect(
        state.battlefield!.entities.find((entry) => entry.id === 'arena:crate:34')!.health,
        id,
      ).toBe(0)
      expect(original.battlefield!.entities[0].health).toBe(40)
      expect(state.player.hatsuEffects.hatsuStolen).toBe(0)
    }
  })

  it('anchors then pulls Hisoka physically; holding the button does not recast or spend aura repeatedly', () => {
    const original = duel()
    let state = frames(original, 20, true)
    expect(state.arena!.tether.player?.objectId).toBe('arena:crate:34')
    expect(state.arena!.pending.player).toBeUndefined()
    expect(original.arena!.tether.player).toBeUndefined()
    const x = state.player.x
    state = frames(state, 1)
    state = frames(state, 16, true)
    expect(state.player.x).toBeGreaterThan(x)
    expect(state.player.x).toBeLessThanOrEqual(28.5)
    const broken = {
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' as const } },
    }
    expect(advanceArena(broken).arena!.tether.player).toBeUndefined()
  })

  it('interrupts a utility cast on a hit and prevents a second attack during preparation', () => {
    const started = use(nearby(duel('machi')))
    expect(started.player.arenaRecovery).toBe(18)
    expect(
      performAuraAttack({ state: started, side: 'player', kind: 'heavy', auraCharged: false }),
    ).toBe(started)
    const hit = { ...started, player: { ...started.player, hitStun: 6 } }
    expect(advanceArena(hit).arena!.pending.player).toBeUndefined()
    expect(advanceArena(hit).arena!.tether.player).toBeUndefined()
  })

  it('Machi moves a real crate after attaching the thread; Zetsu releases it', () => {
    let state = frames(use(nearby(duel('machi'))), 20)
    state = { ...state, player: { ...state.player, x: 22 } }
    state = frames(state, 15)
    expect(arenaObjects(state)[0].x).toBeLessThan(34)
    const released = advanceArena({
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } },
    })
    expect(released.arena!.tether.player).toBeUndefined()
  })

  it('Blinky removes then restores the same real crate, including damage, without duplication', () => {
    const original = nearby(duel('shizuku'))
    let state = frames(use(original), 20)
    expect(arenaObjects(state)).toHaveLength(1)
    expect(state.arena!.stored.player).toBe('arena:crate:34')
    state = frames(use(state), 20)
    expect(arenaObjects(state)).toHaveLength(2)
    expect(state.arena!.stored.player).toBeUndefined()
    expect(
      state.battlefield!.entities.filter((entry) => entry.id === 'arena:crate:34'),
    ).toHaveLength(1)
    expect(original.battlefield!.entities[0].present).toBe(true)
  })

  it('shares Blinky’s last-object memory with ordinary suction and ordinary ejection', () => {
    let state = frames(use(nearby(duel('shizuku'))), 20)
    const stored = state
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'shizuku:backSpecial',
      auraCharged: false,
    })
    state = frames(state, 60)
    expect(arenaObjects(state)).toHaveLength(2)
    expect(state.player.blinky?.lastArenaObject).toBeUndefined()
    let suction = performAuraAttack({
      state: stored,
      side: 'player',
      kind: 'special',
      moveId: 'shizuku:neutralSpecial',
      auraCharged: false,
    })
    const shot = {
      ...projectileProfile('theta'),
      id: 50,
      owner: 'opponent' as const,
      fighterId: 'theta' as const,
      x: 32,
      y: 6.1,
      velocityX: -100,
      age: 0,
      lifetime: 60,
      targetZone: 'torso' as const,
    }
    suction = {
      ...suction,
      player: {
        ...suction.player,
        attack: { ...suction.player.attack!, frame: attackData('special', suction.player).startup },
      },
      projectiles: [shot],
    }
    const swallowed = advanceBlinky(suction)
    expect(swallowed.arena!.stored.player).toBeUndefined()
    expect(swallowed.player.blinky?.lastArenaObject).toBeUndefined()
    expect(swallowed.player.blinky?.lastObject?.id).toBe(50)
    expect(arenaObjects(swallowed)).toHaveLength(1)
  })

  it('does not vacuum a crate outside the actual nozzle’s vertical aperture', () => {
    const state = nearby(duel('shizuku'))
    const airborne = { ...state, player: { ...state.player, y: 6 } }
    expect(use(airborne)).toBe(airborne)
  })

  it('marks distinct objects using the correct free hand, preserves marks when the page closes, and explodes only on contact', () => {
    let state = frames(use(nearby(duel('chrollo'))), 20)
    expect(arenaObjects(state)[0].arena!.sun).toBe('player')
    state = performArsenalCommand(state, 'player', {
      action: 'arena-turn-object',
      target: 'arena:crate:34',
    })
    state = {
      ...state,
      player: {
        ...state.player,
        x: 59,
        chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
      },
    }
    state = frames(use(state), 20)
    expect(arenaObjects(state)[1].arena!.moon).toBe('player')
    expect(arenaObjects(state)).toHaveLength(2)
    state = {
      ...state,
      player: {
        ...state.player,
        chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: null },
      },
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === 'arena:crate:66' ? { ...entry, x: 40 } : entry,
        ),
      },
    }
    const exploded = advanceArena(state)
    expect(arenaObjects(exploded)).toHaveLength(0)
    expect(arenaObjects(state)).toHaveLength(2)
  })

  it('lets Predator identify and consume a Hatsu attached to scenery without destroying the crate', () => {
    const state = frames(use(duel('hisoka', 'rihan')), 20)
    expect(preyIsLive(state, 'player', 'bungee-gum')).toBe(true)
    const consumed = predatorPrey('bungee-gum').consume(state, 'player')
    expect(preyIsLive(consumed, 'player', 'bungee-gum')).toBe(false)
    expect(arenaObjects(consumed)).toHaveLength(2)
    expect(state.arena!.tether.player).toBeDefined()
  })

  it('lets either side push crates physically, and resets all terrain between rounds', () => {
    const state = nearby(duel())
    const pushed = interactWithPreparation(state, 'player')
    expect(arenaObjects(pushed)[0].x).toBe(37)
    expect(arenaObjects(state)[0].x).toBe(34)
    const next = nextRound({ ...pushed, phase: 'finished', winner: 'player' })
    expect(arenaObjects(next)[0].x).toBe(34)
    expect(next.arena!.stored).toEqual({})
    expect(next.arena!.tether).toEqual({})
  })

  it('keeps scenario prerequisites and unknown Hatsu intact through the new command', () => {
    for (const id of ['bill', 'cluck', 'sayird', 'luini', 'halkenburg', 'yokotani'] as const) {
      const state = duel(id)
      expect(use(state), id).toBe(state)
    }
    const state = duel('hisoka')
    const sealed = {
      ...state,
      player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    }
    expect(use(sealed)).toBe(sealed)
  })

  it('lets the arena command open Tserriednich’s eyes while the detached vision pauses the simulation', () => {
    let state = frames(duel('tserriednich'), 1, true)
    state = frames(state, 31)
    expect(state.parallelFuture?.phase).toBe('vision')
    state = frames(state, 1, true)
    expect(state.parallelFuture?.phase).toBe('diverging')
    expect(state.player.parallelEyesClosed).toBe(false)
  })

  it('uses the predicted battlefield and arena state for the vision without changing reality', () => {
    const real = duel('tserriednich')
    const predicted = {
      ...real,
      arena: { ...real.arena!, stored: { opponent: 'arena:crate:66' } },
      battlefield: {
        ...real.battlefield!,
        entities: real.battlefield!.entities.map((entry) => ({ ...entry, present: false })),
      },
    }
    const vision: FightState = {
      ...real,
      parallelFuture: {
        owner: 'player',
        phase: 'vision',
        preparation: 30,
        cursor: 0,
        previewCursor: 0,
        controls: null,
        frames: [{ ...predicted, command: null }],
      },
    }
    expect(arenaObjects(futureVisibleState(vision, 'player'))).toHaveLength(0)
    expect(futureVisibleState(vision, 'player').arena!.stored.opponent).toBe('arena:crate:66')
    expect(arenaObjects(real)).toHaveLength(2)
  })
})
