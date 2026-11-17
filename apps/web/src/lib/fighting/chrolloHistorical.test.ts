import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import {
  advanceHistoricalCopies,
  copyHistoricalObject,
  GALLERY_FAKE_LIFETIME,
  stampHistoricalPuppet,
} from './chrolloHistoricalObjects'
import { advanceHistoricalEffects } from './chrolloHistoricalEffects'
import { damageArenaObject } from './arenaSimulation'
import { battleAppearance } from './battleCantabileRules'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const s = beginFight(
    createFight('chrollo', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['rooms', 'objects'], cohorts: [] },
      },
    }),
  )
  return { ...s, player: { ...s.player, x: 18, aura: 100 }, opponent: { ...s.opponent, x: 23 } }
}
function frames(s: FightState, n = 24): FightState {
  for (let i = 0; i < n; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
function page(s: FightState, target: string): FightState {
  return frames(performArsenalCommand(s, 'player', { action: 'history-page', target }), 13)
}
function close(s: FightState): FightState {
  return frames(
    performAuraAttack({
      state: s,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:downSpecial',
      auraCharged: false,
    }),
  )
}

describe('retrospective stolen pages execute their own material rules', () => {
  it('creates inert copies with both hands, without copying living properties or powers', () => {
    const open = page(duel(), 'gallery-fake')
    expect(copyHistoricalObject(open, 'player', 'opponent')).toBe(open)
    const s = close(open)
    const copy = copyHistoricalObject(s, 'player', 'opponent')
    const puppet = copy.battlefield!.entities.find((entry) => entry.copy)!
    expect(puppet.kind).toBe('puppet')
    expect(puppet.material).toBe('nen')
    expect(puppet.copy?.appearance).toBe('hisoka')
    expect(puppet.copy?.order).toBeUndefined()
    expect(copy.opponent.health).toBe(s.opponent.health)
    expect(copy.player.aura).toBe(s.player.aura - 20)
  })
  it('uses the bookmark to sustain Gallery Fake while the open page animates a copy', () => {
    let s = copyHistoricalObject(close(page(duel(), 'gallery-fake')), 'player', 'opponent')
    s = frames(s, 19)
    s = page(s, 'order-stamp')
    const puppet = s.battlefield!.entities.find((entry) => entry.copy)!
    expect(puppet.present).toBe(true)
    expect(puppet.copy?.headAttached).toBe(true)
    expect(s.player.aura).toBeGreaterThanOrEqual(10)
    expect(Math.hypot(puppet.x - s.player.x, puppet.y - s.player.y)).toBeLessThanOrEqual(8)
    s = stampHistoricalPuppet(s, 'player', puppet.id)
    expect(s.battlefield!.entities.find((entry) => entry.id === puppet.id)?.copy?.order).toBe(
      'attack',
    )
    let hit = s
    for (let i = 0; i < 120 && hit.opponent.health === s.opponent.health; i++)
      hit = advanceHistoricalCopies(hit)
    expect(hit.opponent.health).toBeLessThan(s.opponent.health)
    expect(hit.impact?.attacker).toBe('player')
  })
  it('does not animate a real person or a real corpse, and head destruction ends movement', () => {
    const s = page(duel(), 'order-stamp')
    expect(stampHistoricalPuppet(s, 'player', 'opponent')).toBe(s)
    let copied = copyHistoricalObject(close(page(duel(), 'gallery-fake')), 'player', 'opponent')
    copied = frames(copied, 19)
    copied = page(copied, 'order-stamp')
    const puppet = copied.battlefield!.entities.find((entry) => entry.copy)!
    const marked = stampHistoricalPuppet(copied, 'player', puppet.id)
    const severed = damageArenaObject(marked, puppet.id, { damage: 16, zone: 'head' })
    expect(
      severed.battlefield!.entities.find((entry) => entry.id === puppet.id)?.copy?.headAttached,
    ).toBe(false)
    const next = advanceHistoricalCopies(severed)
    expect(next.opponent.health).toBe(severed.opponent.health)
  })
  it('expires ordinary copies after twenty-four hours, while post-mortem marks keep them present', () => {
    const s = copyHistoricalObject(close(page(duel(), 'gallery-fake')), 'player', 'opponent')
    const puppet = s.battlefield!.entities.find((entry) => entry.copy)!
    const expired = { ...s, frame: puppet.copy!.createdAt + GALLERY_FAKE_LIFETIME }
    expect(
      advanceHistoricalCopies(expired).battlefield!.entities.find((entry) => entry.id === puppet.id)
        ?.present,
    ).toBe(false)
    const marked = {
      ...expired,
      battlefield: {
        ...expired.battlefield!,
        entities: expired.battlefield!.entities.map((entry) =>
          entry.id === puppet.id
            ? { ...entry, arena: { ...entry.arena!, sun: 'player' as const } }
            : entry,
        ),
      },
    }
    expect(
      advanceHistoricalCopies(marked).battlefield!.entities.find((entry) => entry.id === puppet.id)
        ?.present,
    ).toBe(true)
  })
  it('changes appearance with the proper hand without changing identity, health or power', () => {
    let s = page(duel(), 'convert-hands')
    const right = performArsenalCommand(s, 'player', { action: 'history-shape-right' })
    expect(right).toBe(s)
    const left = frames(performArsenalCommand(s, 'player', { action: 'history-shape-left' }), 18)
    expect(battleAppearance(left.player)).toBe('hisoka')
    expect(left.player.id).toBe('chrollo')
    expect(left.player.health).toBe(s.player.health)
    s = close(s)
    const swap = frames(performArsenalCommand(s, 'player', { action: 'history-shape-swap' }), 18)
    expect(battleAppearance(swap.player)).toBe('hisoka')
    expect(battleAppearance(swap.opponent)).toBe('chrollo')
    expect(swap.opponent.id).toBe('hisoka')
  })
  it('keeps Indoor Fish wounds painless and deferred until the sealed room is opened', () => {
    const s = page(duel(), 'indoor-fish')
    let fish = performArsenalCommand(s, 'player', { action: 'history-use' })
    expect(fish.player.chrolloHistorical?.fish).toBeTruthy()
    for (let i = 0; i < 90; i++) fish = advanceHistoricalEffects(fish)
    expect(fish.opponent.health).toBe(s.opponent.health)
    expect(fish.opponent.hitStun).toBe(0)
    expect(fish.player.chrolloHistorical?.fish?.wounds).toBe(16)
    const roomId = fish.player.chrolloHistorical!.fish!.roomId
    const opened = {
      ...fish,
      battlefield: {
        ...fish.battlefield!,
        entities: fish.battlefield!.entities.map((entry) =>
          entry.id === roomId ? { ...entry, sealed: false } : entry,
        ),
      },
    }
    const injured = advanceHistoricalEffects(opened)
    expect(injured.opponent.health).toBe(s.opponent.health - 16)
    expect(injured.player.chrolloHistorical?.fish).toBeUndefined()
  })
  it('wraps and carries a real target without damage or forced Zetsu, then returns it intact', () => {
    let s = close(page(duel(), 'fun-fun-cloth'))
    const health = s.opponent.health
    s = frames(performArsenalCommand(s, 'player', { action: 'history-use' }), 18)
    expect(s.opponent.clothCapture?.owner).toBe('player')
    expect(s.opponent.nen.mode).not.toBe('zetsu')
    const released = performArsenalCommand(frames(s, 19), 'player', { action: 'history-release' })
    expect(released.opponent.clothCapture).toBeUndefined()
    expect(released.opponent.health).toBe(health)
  })
  it('relocates another person without creating an attack or moving Chrollo', () => {
    const s = page(duel(), 'chrollo-teleportation')
    const next = performArsenalCommand(s, 'player', { action: 'history-use', target: 'point:75' })
    expect(next.player.x).toBe(s.player.x)
    expect(next.opponent.x).toBe(75)
    expect(next.opponent.health).toBe(s.opponent.health)
    expect(next.player.attack).toBeNull()
  })
})
