import { canUseRangedAttack } from './projectiles'
import { toggleEmperorTime } from './kurapikaActions'
import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performMove,
  performAuraAttack,
  tickFight,
  nextRound,
} from './engine'
import { finishFight } from './combatVerdict'
import { resolveFightImpacts } from './combatImpact'
import { attackData, FIXED_STEP } from './frameData'
import { hatsuFor, hatsuDefenceFactor, hatsuDamageFactor } from './hatsu'
import { moveForSlot, movesetFor, finisherReady } from './movesets'
import { applyAuraContext } from './nen'
import { advanceIllumi, consumeControlNeedle } from './illumiFrame'
import { giveNeedleOrder } from './illumiAction'
import { ILLUMI_DISGUISE_FRAMES } from './illumiState'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { hasIllumiNeedles } from './illumiEquipment'
import { EMPTY_INPUT, type FightState, type FightSide, type FightInput } from './types'

function duel(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'illumi' : 'hisoka',
      side === 'opponent' ? 'illumi' : 'hisoka',
      { mode: 'versus-local' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 100 },
    opponent: { ...state.opponent, x: 46, aura: 100 },
  }
}
function frames(state: FightState, count: number, input: Partial<FightInput> = {}): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: FIXED_STEP, opponentInput: EMPTY_INPUT },
    )
  return state
}
function implant(state: FightState, side: FightSide = 'player'): FightState {
  const armed = performMove({ state, side, action: 'special' })
  expect(armed[side].attack).toBeTruthy()
  armed[side].attack!.frame = attackData('special', armed[side]).startup
  return resolveFightImpacts(armed, [])
}

describe('Illumi — skull needle, orders and physical disguise', () => {
  it('never applies control or aura drain through a generic Hatsu carrier hook', () => {
    const state = duel()
    expect(
      hatsuFor('illumi').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'illumi',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
  })
  it.each(['player', 'opponent'] as const)(
    'implants only on an unguarded skull contact (%s)',
    (side) => {
      const state = duel(side)
      const enemy = side === 'player' ? 'opponent' : 'player'
      const next = implant(state, side)
      expect(next[enemy].needlePuppet).toEqual({ owner: side, order: 'stay', needleEmbedded: true })
      expect(next[enemy].health).toBe(state[enemy].health)
      expect(next[enemy].aura).toBe(100)
      expect(next[enemy].nen).toEqual(state[enemy].nen)
      expect(next[enemy].hatsuEffects.forcedZetsuFrames).toBe(0)
      expect(next[enemy].hitStun).toBe(0)
      expect(next.score).toEqual(state.score)
      expect(next.impact).toMatchObject({ damage: 0, points: 0, zone: 'head' })
    },
  )
  it('commits the implantation cost, including a miss, without draining the target', () => {
    const state = duel()
    state.opponent.x = 80
    const next = performMove({ state, side: 'player', action: 'special' })
    expect(next.player.aura).toBe(60)
    expect(frames(next, 40).opponent.needlePuppet).toBeUndefined()
    expect(frames(next, 40).opponent.aura).toBe(100)
  })
  it.each(['blocked', 'parried', 'dodge', 'body', 'far'] as const)(
    'does not implant on %s',
    (condition) => {
      const state = duel()
      if (condition === 'blocked' || condition === 'parried') {
        state.opponent.blocking = true
        state.opponent.guardFrames = condition === 'blocked' ? 30 : 1
      }
      if (condition === 'dodge') state.opponent.wakeupInvulnerableFrames = 9
      if (condition === 'body') state.opponent.y = 6
      if (condition === 'far') state.opponent.x = 80
      expect(implant(state).opponent.needlePuppet).toBeUndefined()
    },
  )
  it('does not replace a prior controller', () => {
    const state = duel()
    state.opponent.hatsuEffects.manipulatedFrames = 80
    expect(implant(state).opponent.needlePuppet).toBeUndefined()
  })
  it('keeps its order beyond two seconds without refreshing hitstun', () => {
    const state = frames(implant(duel()), 240)
    expect(state.opponent.needlePuppet?.needleEmbedded).toBe(true)
    expect(state.opponent.hitStun).toBe(0)
    expect(state.opponent.health).toBe(state.opponent.maxHealth)
  })
  it('preselects an order without a needle or a free damaging strike', () => {
    const state = duel()
    const next = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(next.player.illumi?.order).toBe('approach')
    expect(next.player.attack).toBeNull()
    expect(next.player.aura).toBe(100)
    expect(next.opponent.needlePuppet).toBeUndefined()
    expect(implant(next).opponent.needlePuppet?.order).toBe('approach')
  })
  it('executes approach, retreat and stay rather than turning them into stun', () => {
    let state = implant(duel())
    state.player.attack = null
    state.opponent.x = 65
    state = giveNeedleOrder(state, 'player', 'approach')
    const closer = frames(state, 15)
    expect(closer.opponent.x).toBeLessThan(65)
    const away = frames(giveNeedleOrder(closer, 'player', 'retreat'), 15)
    expect(away.opponent.x).toBeGreaterThan(closer.opponent.x)
    const still = frames(giveNeedleOrder(away, 'player', 'stay'), 15)
    expect(still.opponent.x).toBe(away.opponent.x)
    expect(still.opponent.hitStun).toBe(0)
  })
  it('ignores the controlled body’s movement, guard, attacks and Nen commands', () => {
    const captured = implant(duel('opponent'), 'opponent')
    const x = captured.player.x
    const next = frames(captured, 40, { left: true, guard: true, jump: true, aura: true })
    expect(next.player.x).toBe(x)
    expect(next.player.y).toBe(0)
    expect(next.player.blocking).toBe(false)
    expect(applyAuraContext(next.player, { ...EMPTY_INPUT, aura: true })).toBe(next.player)
    expect(performMove({ state: next, side: 'player', action: 'light' })).toBe(next)
    expect(
      performAuraAttack({ state: next, side: 'player', kind: 'ranged', auraCharged: true }),
    ).toBe(next)
  })
  it('does not reverse Needle People’s injury when Predator consumes the needle', () => {
    const captured = implant(duel())
    const next = frames(consumeControlNeedle(captured, 'opponent'), 180)
    expect(next.opponent.needlePuppet).toMatchObject({ needleEmbedded: false })
    expect(performMove({ state: next, side: 'opponent', action: 'heavy' })).toBe(next)
    expect(next.opponent.health).toBe(captured.opponent.health)
  })
  it('keeps the existing command if the caster loses access to Nen', () => {
    const state = implant(duel())
    state.player.nen.mode = 'zetsu'
    state.player.hatsuEffects.hatsuStolen = 1
    expect(advanceIllumi(state).opponent.needlePuppet).toEqual(state.opponent.needlePuppet)
  })
  it('prepares a separate disguise without a strike, lunge or defence enhancement', () => {
    const state = duel()
    const started = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(started.player.attack).toBeNull()
    expect(started.player.aura).toBe(80)
    expect(started.player.x).toBe(state.player.x)
    expect(started.player.illumi?.disguised).toBe(false)
    const dressed = frames(started, ILLUMI_DISGUISE_FRAMES)
    expect(dressed.player.illumi?.disguised).toBe(true)
    expect(dressed.opponent.needlePuppet).toBeUndefined()
    expect(hatsuDefenceFactor(dressed.player)).toBe(1)
    expect(hatsuDamageFactor(dressed.player)).toBe(1)
    expect(frames(dressed, 240).player.illumi?.disguised).toBe(true)
    expect(
      performMove({
        state: dressed,
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, left: true },
      }).player.illumi?.disguised,
    ).toBe(false)
  })
  it('interrupts disguise preparation on movement or injury', () => {
    const start = () =>
      performMove({
        state: duel(),
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, left: true },
      })
    expect(frames(start(), 35, { right: true }).player.illumi?.disguised).toBe(false)
    const hurt = start()
    hurt.player.hitStun = 12
    expect(frames(hurt, 35).player.illumi?.disguised).toBe(false)
  })
  it('does not conjure physical needles for a copier', () => {
    const state = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    state.player.aura = 100
    state.player.chrolloBook = { pages: ['illumi'], page: 0, open: true, bookmark: null }
    expect(performMove({ state, side: 'player', action: 'special' })).toBe(state)
  })
  it('removes Total Control as an invented finisher and resets the bodies each round', () => {
    const state = implant(duel())
    expect(moveForSlot('illumi', 'finisher')).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
    expect(
      movesetFor('illumi')!
        .moves.filter((move) => move.kind === 'special')
        .every((move) => move.tuning.damage === 0),
    ).toBe(true)
    const fresh = nextRound(finishFight(state, 'player'))
    expect(fresh.opponent.needlePuppet).toBeUndefined()
    expect(fresh.player.illumi).toBeUndefined()
  })
})

describe('Illumi conditions and borrowed needles', () => {
  it('can commit exactly forty aura and still implant the charged needle', () => {
    const state = duel()
    state.player.aura = 40
    const next = frames(performMove({ state, side: 'player', action: 'special' }), 17)
    expect(next.opponent.needlePuppet?.needleEmbedded).toBe(true)
    const poor = duel()
    poor.player.aura = 39
    expect(performMove({ state: poor, side: 'player', action: 'special' })).toBe(poor)
  })
  it('issues Stay without requiring or spending another forty aura', () => {
    const captured = implant(duel())
    captured.player.attack = null
    captured.player.aura = 1
    captured.opponent.needlePuppet!.order = 'retreat'
    const next = performMove({ state: captured, side: 'player', action: 'special' })
    expect(next.opponent.needlePuppet?.order).toBe('stay')
    expect(next.player.aura).toBe(1)
    expect(next.player.attack).toBeNull()
  })
  it('never turns an ordinary thrown needle into Needle People', () => {
    const state = duel()
    state.opponent.x = 58
    const armed = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })
    const next = frames(armed, 50)
    expect(next.opponent.needlePuppet).toBeUndefined()
  })
  it('requires physical stock even for native Illumi if his equipment is removed', () => {
    const state = duel()
    state.player.equipment = []
    expect(performMove({ state, side: 'player', action: 'special' })).toBe(state)
    expect(performMove({ state, side: 'player', action: 'light' }).player.attack?.kind).toBe(
      'light',
    )
  })
  it('can bring real needles before using a copied Hatsu', () => {
    const state = beginFight(
      createFight('chrollo', 'hisoka', {
        mode: 'versus-local',
        environment: {
          needleStock: { player: true },
        },
      }),
    )
    state.player.chrolloBook = { pages: ['illumi'], page: 0, open: true, bookmark: null }
    expect(hasIllumiNeedles(state.player)).toBe(true)
    state.player.x = 40
    state.opponent.x = 46
    state.player.aura = 100
    const captured = implant(state)
    expect(captured.opponent.needlePuppet).toMatchObject({ owner: 'player', needleEmbedded: true })
    const turned = {
      ...captured,
      player: {
        ...captured.player,
        chrolloBook: {
          pages: ['illumi' as const, 'hisoka' as const],
          page: 1,
          open: true,
          bookmark: null,
        },
      },
    }
    const closed = reconcileChrolloPages(captured, turned, 'player')
    expect(closed.opponent.needlePuppet).toMatchObject({ needleEmbedded: false })
    expect(performMove({ state: closed, side: 'opponent', action: 'light' })).toBe(closed)
  })
  it('does not let a puppet toggle Emperor Time', () => {
    const ready = duel()
    ready.opponent = { ...createFight('illumi', 'kurapika').opponent, x: 46, aura: 100 }
    const state = implant(ready)
    expect(toggleEmperorTime(state, 'opponent')).toBe(state)
  })
  it('uses actual brain control for a Dolphin borrower, without copying its equipment', () => {
    let state = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
    state.player.x = 40
    state.opponent.x = 46
    state.player.aura = 100
    state.player.kurapika = {
      ...state.player.kurapika!,
      emperorTime: true,
      held: {
        source: 'illumi',
        victim: 'opponent',
        moveId: 'illumi:neutralSpecial',
        loaded: true,
        used: false,
        sustainedKeys: [],
      },
    }
    const command = { ...EMPTY_INPUT, left: true }
    expect(performMove({ state, side: 'player', action: 'special', input: command })).toBe(state)
    state.player.equipment = ['needles']
    state = performMove({ state, side: 'player', action: 'special', input: command })
    expect(state.player.id).toBe('kurapika')
    expect(state.player.attack?.hatsuSource).toBe('illumi')
    state.player.attack!.frame = attackData('special', state.player).startup
    state = resolveFightImpacts(state, [])
    expect(state.opponent.needlePuppet?.owner).toBe('player')
    expect(state.player.kurapika?.held?.sustainedKeys).toContain('needle-puppet')
  })
})

it('respects both explicit needle loadouts and preserves the stock across rounds', () => {
  const state = beginFight(
    createFight('illumi', 'chrollo', {
      environment: {
        needleStock: { player: false, opponent: true },
      },
    }),
  )
  expect(hasIllumiNeedles(state.player)).toBe(false)
  expect(hasIllumiNeedles(state.opponent)).toBe(true)
  expect(canUseRangedAttack(state.player)).toBe(false)
  expect(performMove({ state, side: 'player', action: 'special' })).toBe(state)
  const fresh = nextRound(finishFight(state, 'player'))
  expect(hasIllumiNeedles(fresh.player)).toBe(false)
  expect(hasIllumiNeedles(fresh.opponent)).toBe(true)
})
