import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { gumObjectAnchors } from './gumObjectAnchors'
import { advanceGumObjectAnchors } from './gumObjectAnchorFrames'
import { damageArenaObject } from './arenaSimulation'
import { createGumObjectAnchorScene } from './gumObjectAnchorScene'
import { privatePvpState } from './pvp/view'
import { teamRelayReady } from './teamRelayRules'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const base = beginFight(
    createFight('hisoka', 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { arenaInteractions: true },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 28.5, aura: 100 },
    opponent: { ...base.opponent, x: 88 },
  }
}
function advance(state: FightState, count = 20): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function attach(state: FightState, objectId = 'arena:crate:34'): FightState {
  return performArsenalCommand(state, 'player', { action: 'gum-anchor-attach', target: objectId })
}
function control(
  state: FightState,
  action: 'gum-anchor-self' | 'gum-anchor-object' | 'gum-anchor-stop' | 'gum-anchor-release',
  target = 'arena:crate:34',
): FightState {
  return performArsenalCommand(state, 'player', { action, target })
}
function twoAnchors(): FightState {
  let state = advance(attach(duel()))
  for (let index = 0; index < 240 && state.player.x < 59.5; index++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, right: true, jump: true },
      {
        dt: 1 / 60,
        opponentInput: EMPTY_INPUT,
      },
    )
  expect(state.player.x).toBeGreaterThanOrEqual(59.5)
  for (let index = 0; index < 100 && state.player.y > 0; index++) state = advance(state, 1)
  return advance(attach(state, 'arena:crate:66'))
}

describe('Hisoka’s simultaneous physical object attachments', () => {
  it('requires actual contact, then walks and jumps to another support without discarding the first strand', () => {
    const base = duel()
    const far = { ...base, player: { ...base.player, x: 15 } }
    expect(attach(far)).toBe(far)
    const state = twoAnchors()
    expect(gumObjectAnchors(state.player).map((anchor) => anchor.objectId)).toEqual([
      'arena:crate:34',
      'arena:crate:66',
    ])
    expect(state.player.x - 34).toBeGreaterThan(24)
    expect(attach(state, 'arena:crate:66')).toBe(state)
    expect(state.battlefield!.entities).toHaveLength(2)
  })
  it('reels one actual object while retaining the independent other attachment', () => {
    const state = twoAnchors()
    const selected = control(state, 'gum-anchor-object')
    const moved = advance(selected, 10)
    const old = state.battlefield!.entities.find((entry) => entry.id === 'arena:crate:34')!
    const after = moved.battlefield!.entities.find((entry) => entry.id === old.id)!
    expect(after.x).toBeGreaterThan(old.x)
    expect(moved.battlefield!.entities.find((entry) => entry.id === 'arena:crate:66')!.x).toBe(66)
    expect(gumObjectAnchors(moved.player)).toHaveLength(2)
    const stopped = control(moved, 'gum-anchor-stop')
    expect(advance(stopped, 10).battlefield!.entities.find((entry) => entry.id === old.id)!.x).toBe(
      after.x,
    )
    const released = control(stopped, 'gum-anchor-release')
    expect(gumObjectAnchors(released.player).map((anchor) => anchor.objectId)).toEqual([
      'arena:crate:66',
    ])
    expect(released.battlefield!.entities.find((entry) => entry.id === old.id)!.x).toBe(after.x)
  })
  it('moves the body toward its real support with collisions, without moving that support or granting invulnerability', () => {
    const base = advance(attach(duel()))
    const away = { ...base, player: { ...base.player, x: 10 } }
    const selected = control(away, 'gum-anchor-self')
    const moved = advance(selected, 15)
    expect(moved.player.x).toBeGreaterThan(away.player.x)
    expect(moved.player.health).toBe(away.player.health)
    expect(moved.player.wakeupInvulnerableFrames).toBe(0)
    expect(moved.battlefield!.entities[0].x).toBe(34)
  })
  it('keeps adhesion through a hit but pauses voluntary pulling, and drops only the strand whose support is destroyed', () => {
    const state = control(twoAnchors(), 'gum-anchor-object')
    const hit = { ...state, player: { ...state.player, hitStun: 10 } }
    const held = advanceGumObjectAnchors(hit)
    expect(gumObjectAnchors(held.player)).toHaveLength(2)
    expect(held.battlefield!.entities).toEqual(state.battlefield!.entities)
    const broken = damageArenaObject(state, 'arena:crate:34', 100)
    expect(
      gumObjectAnchors(advanceGumObjectAnchors(broken).player).map((anchor) => anchor.objectId),
    ).toEqual(['arena:crate:66'])
  })
  it('keeps On and clears these living Nen connections when it seals their actual user', () => {
    const state = twoAnchors()
    const enabled = {
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, on: true } },
    }
    const result = advanceGumObjectAnchors(enabled)
    expect(result.player.nen.on).toBe(true)
    expect(gumObjectAnchors(result.player)).toHaveLength(0)
    expect(control(enabled, 'gum-anchor-object')).toBe(enabled)
    expect(result.battlefield!.entities).toEqual(state.battlefield!.entities)
  })
  it('keeps hidden strands out of an opponent’s scene and private snapshot until Gyo, without exposing their source', () => {
    const base = duel()
    const hidden = advance(
      attach({ ...base, player: { ...base.player, nen: { ...base.player.nen, in: true } } }),
    )
    const scene = new THREE.Scene()
    const renderer = createGumObjectAnchorScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      viewer: () => 'opponent',
    })
    renderer.sync(hidden, 0)
    expect(scene.children).toHaveLength(0)
    expect(privatePvpState(hidden, 'opponent').opponent.gumObjectAnchors).toBeUndefined()
    const seen = {
      ...hidden,
      opponent: { ...hidden.opponent, nen: { ...hidden.opponent.nen, gyo: true } },
    }
    renderer.sync(seen, 1)
    expect(scene.getObjectByName('gum-object:player:arena:crate:34')).toBeDefined()
    expect(privatePvpState(seen, 'opponent').opponent.gumObjectAnchors?.[0].source).toBeUndefined()
    const privateView = privatePvpState(seen, 'opponent')
    expect(advanceGumObjectAnchors(privateView).opponent.gumObjectAnchors).toHaveLength(1)
    renderer.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('does not allow a relay to suspend an outstanding body-owned attachment', () => {
    const state = advance(attach(duel()))
    expect(teamRelayReady({ ...state, player: { ...state.player, x: 7 } }, 'player')).toBe(false)
  })
  it('keeps ordinary body attachment executable alongside object anchors', () => {
    const base = advance(attach(duel()))
    const near = {
      ...base,
      opponent: { ...base.opponent, x: 20 },
      player: { ...base.player, facing: -1 as const },
    }
    const cast = performAuraAttack({
      state: near,
      side: 'player',
      kind: 'special',
      moveId: 'hisoka:neutralSpecial',
      auraCharged: false,
    })
    const attached = advance(cast, 45)
    expect(attached.bungeeGum?.owner).toBe('player')
    expect(gumObjectAnchors(attached.player)).toHaveLength(1)
  })
})
