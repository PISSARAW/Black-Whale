import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
  nextRound,
} from './engine'
import { performArsenalCommand, validArsenalCommand } from './retrospectiveArsenal'
import { addGumLink, ownedGumLinks, selectedGumLink, selectGumLink } from './bungeeNetwork'
import { gumCeilingHeight } from './bungeeGeometry'
import { privatePvpState } from './pvp/view'
import { spectatorSnapshot } from './pvp/spectator'
import { decodeReplay } from './clashReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { advanceGumNetwork } from './bungeeMotion'
import { toggleEmperorTime } from './kurapikaActions'
import { tradeGumState } from './combatTrade'
import { EMPTY_INPUT, type FightState, type FightSide } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function duel(arena = false): FightState {
  const state = beginFight(
    createFight('hisoka', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { stageId: 'vip-casino', arenaInteractions: arena },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 20, aura: 100 },
    opponent: { ...state.opponent, x: 80, aura: 100 },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function command(state: FightState, action: ArsenalCommand['action'], target?: string): FightState {
  return performArsenalCommand(state, 'player', { action, target })
}
function attach(state: FightState, side: FightSide = 'player'): FightState {
  return frames(
    performAuraAttack({
      state,
      side,
      kind: 'special',
      moveId: 'hisoka:neutralSpecial',
      auraCharged: false,
    }),
    60,
  )
}
function thrownCard(): FightState {
  let state = frames(command(duel(), 'gum-prepare-throw'), 15)
  state = frames(performAttack(state, 'player', 'ranged'), 35)
  expect(state.projectiles).toHaveLength(1)
  return state
}

describe('Hisoka’s independent Bungee Gum attachments', () => {
  it('preserves existing link identifiers through an unrelated simultaneous exchange', () => {
    let state = addGumLink(duel(), {
      side: 'player',
      target: { kind: 'fighter', side: 'opponent' },
      hidden: false,
    })
    state = addGumLink(state, {
      side: 'opponent',
      target: { kind: 'fighter', side: 'player' },
      hidden: false,
    })
    const exchanged = tradeGumState(state, { ...state }, { ...state })
    expect(exchanged.gumNetwork?.links.map((link) => link.id)).toEqual(
      state.gumNetwork!.links.map((link) => link.id),
    )
    expect(exchanged.gumNetwork?.selected).toEqual(state.gumNetwork!.selected)
    expect(exchanged.gumNetwork?.nextId).toBe(state.gumNetwork!.nextId)
  })

  it('pulls a defending target without cancelling its ordinary guard or inflicting damage', () => {
    let state = addGumLink(duel(), {
      side: 'player',
      target: { kind: 'fighter', side: 'opponent' },
      hidden: false,
    })
    const health = state.opponent.health
    state = command(state, 'gum-recall')
    for (let i = 0; i < 16; i++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, guard: true },
      })
    expect(state.opponent.x).toBeLessThan(80)
    expect(state.opponent.blocking).toBe(true)
    expect(state.opponent.health).toBe(health)
  })

  it('keeps real contacts from two different limbs without replacing the first link', () => {
    let state = duel()
    state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 54 } }
    state = frames(attach(state), 30)
    const first = ownedGumLinks(state, 'player')[0]
    state = command(state, 'gum-limb', 'foot-left')
    expect(state.gumNetwork?.limbs.player).toBe('foot-left')
    state = {
      ...state,
      player: { ...state.player, x: 44, aura: 100 },
      opponent: { ...state.opponent, x: 54 },
    }
    state = attach(state)
    expect(ownedGumLinks(state, 'player').map((link) => link.limb)).toEqual([
      'hand-right',
      'foot-left',
    ])
    expect(ownedGumLinks(state, 'player')[0].id).toBe(first.id)
    state = command(state, 'gum-select', String(first.id))
    expect(selectedGumLink(state, 'player')?.id).toBe(first.id)
    state = command(state, 'gum-detach')
    expect(ownedGumLinks(state, 'player')).toHaveLength(1)
    expect(ownedGumLinks(state, 'player')[0].limb).toBe('foot-left')
  })

  it('supports both fighters simultaneously, including a real simultaneous contact', () => {
    let state = duel()
    state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 54 } }
    for (const side of ['player', 'opponent'] as const)
      state = performAuraAttack({
        state,
        side,
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      })
    state = frames(state, 50)
    expect(ownedGumLinks(state, 'player')).toHaveLength(1)
    expect(ownedGumLinks(state, 'opponent')).toHaveLength(1)
    expect(new Set(state.gumNetwork!.links.map((link) => link.id)).size).toBe(2)
  })

  it('finishes only with a fighter attachment and consumes only the chosen link', () => {
    let state = addGumLink(duel(), {
      side: 'player',
      target: { kind: 'fighter', side: 'opponent' },
      hidden: false,
    })
    const body = selectedGumLink(state, 'player')!
    state = frames(command(state, 'gum-anchor', 'floor-front'), 20)
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'hisoka:finisher',
        auraCharged: false,
      }),
    ).toBe(state)
    state = selectGumLink(state, 'player', body.id)
    state = {
      ...state,
      player: { ...state.player, x: 44, aura: 100 },
      opponent: { ...state.opponent, x: 54 },
    }
    state = frames(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'hisoka:finisher',
        auraCharged: false,
      }),
      60,
    )
    expect(ownedGumLinks(state, 'player')).toHaveLength(1)
    expect(ownedGumLinks(state, 'player')[0].target.kind).toBe('surface')
  })

  it('requires a vulnerable preparation and a real support for scenery anchors', () => {
    const original = duel()
    const started = command(original, 'gum-anchor', 'ceiling')
    expect(started.player.aura).toBe(88)
    expect(ownedGumLinks(started, 'player')).toHaveLength(0)
    const interrupted = frames({ ...started, player: { ...started.player, hitStun: 8 } }, 25)
    expect(ownedGumLinks(interrupted, 'player')).toHaveLength(0)
    expect(interrupted.gumNetwork?.pending.player).toBeUndefined()
    const open = {
      ...original,
      environment: { ...original.environment, stageId: 'observation-deck' as const },
    }
    expect(gumCeilingHeight(open)).toBeNull()
    expect(command(open, 'gum-anchor', 'ceiling')).toBe(open)
    expect(command(original, 'gum-anchor', 'invented-wall')).toBe(original)
    expect(command(original, 'gum-object', 'invented-object')).toBe(original)
  })

  it('ascends progressively on the real ceiling and falls again when detached or hit', () => {
    let state = frames(command(duel(), 'gum-anchor', 'ceiling'), 20)
    const originalY = state.player.y
    state = command(state, 'gum-propel')
    const first = frames(state, 10)
    expect(first.player.y).toBeGreaterThan(originalY)
    expect(first.player.y).toBeLessThan(gumCeilingHeight(first)! - 14)
    const high = frames(first, 35)
    expect(high.player.y).toBeGreaterThan(8)
    expect(high.player.y).toBeLessThanOrEqual(gumCeilingHeight(high)! - 20)
    expect(high.opponent.health).toBe(high.opponent.maxHealth)
    const released = frames(command(high, 'gum-detach'), 12)
    expect(released.player.y).toBeLessThan(high.player.y)
    const hit = frames({ ...high, player: { ...high.player, hitStun: 12 } }, 8)
    expect(hit.player.y).toBeLessThan(high.player.y)
    expect(selectedGumLink(hit, 'player')?.motion).toBe('idle')
  })

  it('keeps floor anchors immovable and recalls only existing scenery objects', () => {
    let state = duel(true)
    state = frames(command(state, 'gum-object', 'arena:crate:34'), 20)
    expect(selectedGumLink(state, 'player')?.target).toEqual({
      kind: 'entity',
      id: 'arena:crate:34',
    })
    const count = state.battlefield!.entities.length
    const before = state.battlefield!.entities.find((entry) => entry.id === 'arena:crate:34')!
    state = frames(command(state, 'gum-recall'), 20)
    const after = state.battlefield!.entities.find((entry) => entry.id === before.id)!
    expect(after.x).toBeLessThan(before.x)
    expect(state.battlefield!.entities).toHaveLength(count)
    expect(after.health).toBe(before.health)
    state = frames(command(state, 'gum-anchor', 'floor-front'), 20)
    expect(command(state, 'gum-recall')).toBe(state)
    state = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === before.id ? { ...entry, health: 0 } : entry,
        ),
      },
    }
    state = advanceGumNetwork(state)
    expect(ownedGumLinks(state, 'player').some((link) => link.target.kind === 'entity')).toBe(false)
  })

  it('does not retain living aura through Zetsu, stolen Hatsu or a new round', () => {
    const attached = frames(command(duel(), 'gum-anchor', 'floor-front'), 20)
    for (const fighter of [
      { ...attached.player, nen: { ...attached.player.nen, mode: 'zetsu' as const } },
      { ...attached.player, hatsuEffects: { ...attached.player.hatsuEffects, hatsuStolen: 100 } },
    ])
      expect(
        ownedGumLinks(advanceGumNetwork({ ...attached, player: fighter }), 'player'),
      ).toHaveLength(0)
    const ended: FightState = { ...attached, phase: 'finished', winner: 'player' }
    expect(nextRound(ended).gumNetwork).toBeUndefined()
  })
})

describe('physical linked cards and recalls', () => {
  it('requires preparation before throwing and keeps the same object through recall and rethrow', () => {
    let state = thrownCard()
    const id = state.projectiles[0].id,
      nextId = state.nextProjectileId
    expect(selectedGumLink(state, 'player')?.target).toEqual({ kind: 'projectile', id })
    state = frames(command(state, 'gum-recall'), 60)
    expect(state.projectiles).toHaveLength(1)
    expect(state.projectiles[0].id).toBe(id)
    expect(state.projectiles[0].gumFlight?.mode).toBe('held')
    expect(state.nextProjectileId).toBe(nextId)
    state = command(state, 'gum-rethrow')
    expect(state.projectiles[0].id).toBe(id)
    expect(state.projectiles[0].gumFlight?.mode).toBe('outbound')
    expect(state.projectiles[0].velocityX).toBeGreaterThan(0)
    expect(state.nextProjectileId).toBe(nextId)
    expect(state.player.gumThrowReady).toBeUndefined()
  })

  it('can hit on the return path after missing, once per journey, without repeated resting damage', () => {
    let state = frames(thrownCard(), 40)
    const shot = state.projectiles[0]
    state = { ...state, opponent: { ...state.opponent, x: 50, y: 0 } }
    const health = state.opponent.health
    expect(shot.x).toBeGreaterThan(50)
    state = frames(command(state, 'gum-recall'), 60)
    expect(state.opponent.health).toBeLessThan(health)
    const after = state.opponent.health
    state = frames(state, 90)
    expect(state.opponent.health).toBe(after)
    expect(state.projectiles).toHaveLength(1)
  })

  it('detaches aura while leaving the real object visible and unable to inflict resting hits', () => {
    const before = thrownCard()
    const id = before.projectiles[0].id
    const released = command(before, 'gum-detach')
    expect(ownedGumLinks(released, 'player')).toHaveLength(0)
    expect(released.projectiles[0].id).toBe(id)
    expect(released.projectiles[0].matter).toBe('object')
    expect(released.projectiles[0].gumFlight?.mode).toBe('falling')
    expect(frames(released, 30).projectiles[0].y).toBeLessThan(before.projectiles[0].y)
  })
})

describe('network privacy and deterministic replay', () => {
  it('keeps a real card visible under In without transmitting its hidden attachment metadata', () => {
    const initial = thrownCard()
    const state: FightState = {
      ...initial,
      gumNetwork: {
        ...initial.gumNetwork!,
        links: initial.gumNetwork!.links.map((link) => ({ ...link, hidden: true })),
      },
    }
    const enemy = privatePvpState(state, 'opponent')
    expect(enemy.gumNetwork?.links).toHaveLength(0)
    expect(enemy.projectiles).toHaveLength(1)
    expect(enemy.projectiles[0].matter).toBe('object')
    expect(enemy.projectiles[0].gumFlight).toBeUndefined()
    expect(privatePvpState(state, 'player').projectiles[0].gumFlight).toBeTruthy()
  })

  it('hides every In link and preparation independently, reveals with Gyo, and swaps P2 ownership', () => {
    let state = duel()
    state = addGumLink(state, {
      side: 'opponent',
      target: { kind: 'fighter', side: 'player' },
      hidden: true,
      limb: 'foot-right',
    })
    state = addGumLink(state, {
      side: 'opponent',
      target: { kind: 'surface', surface: 'floor', stage: state.environment.stageId, x: 70, y: 0 },
      hidden: false,
    })
    const view = privatePvpState(state, 'player')
    expect(view.gumNetwork?.links).toHaveLength(1)
    expect(view.gumNetwork?.links[0].target.kind).toBe('surface')
    const seen = privatePvpState(
      { ...state, player: { ...state.player, nen: { ...state.player.nen, gyo: true } } },
      'player',
    )
    expect(seen.gumNetwork?.links).toHaveLength(2)
    const own = privatePvpState(state, 'opponent')
    expect(own.gumNetwork?.links.every((link) => link.owner === 'player')).toBe(true)
    expect(own.gumNetwork?.links.find((link) => link.target.kind === 'fighter')?.target).toEqual({
      kind: 'fighter',
      side: 'opponent',
    })
    const publicState = decodeReplay(spectatorSnapshot(state).snapshot) as FightState
    expect(publicState.gumNetwork?.links).toHaveLength(1)
    expect(publicState.gumNetwork?.pending).toEqual({})
  })

  it('roundtrips the network and object identity and simulates the same branch deterministically', () => {
    const state = thrownCard()
    const setup = {
      player: 'hisoka' as const,
      opponent: 'hisoka' as const,
      mode: state.mode,
      formatId: state.formatId,
      environment: state.environment,
    }
    const copy = decodeFightSnapshot(encodeFightSnapshot(state), setup)
    expect(fightReplayHash(copy)).toBe(fightReplayHash(state))
    const first = frames(command(state, 'gum-recall'), 80)
    const second = frames(command(copy, 'gum-recall'), 80)
    expect(fightReplayHash(first)).toBe(fightReplayHash(second))
    expect(state.projectiles[0].gumFlight?.mode).toBe('outbound')
    expect(validArsenalCommand({ action: 'gum-anchor', target: 'ceiling', x: 99 })).toBe(false)
  })
})

describe('borrowed Bungee Gum', () => {
  it('keeps Dolphin locked while its paid scenery anchor remains and refuses a second creation', () => {
    const base = beginFight(
      createFight('kurapika', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    let state = {
      ...base,
      player: { ...base.player, x: 44, aura: 100 },
      opponent: { ...base.opponent, x: 49, aura: 100 },
    }
    const steal = (s: FightState) =>
      performAuraAttack({
        state: s,
        side: 'player',
        kind: 'special',
        moveId: 'kurapika:backSpecial',
        auraCharged: false,
      })
    state = frames(steal(state), 220)
    expect(state.player.kurapika?.held?.source).toBe('hisoka')
    state = steal(toggleEmperorTime(state, 'player'))
    state = frames(command(state, 'gum-anchor', 'floor-front'), 30)
    expect(ownedGumLinks(state, 'player')).toHaveLength(1)
    expect(state.player.kurapika?.held?.used).toBe(true)
    expect(state.player.kurapika?.emperorTime).toBe(true)
    expect(command(state, 'gum-anchor', 'floor-back')).toBe(state)
    state = frames(command(state, 'gum-detach'), 3)
    expect(state.player.kurapika?.held).toBeNull()
  })
})
