import { describe, expect, it } from 'vitest'
import { performMove, performAttack, nextRound } from './engine'
import { multiDuel, multiCommand, multiFrames, multiActive } from './fourCombatTestKit'
import {
  advanceFutureField,
  startFutureField,
  fieldDeceives,
  ILLUSION_BATTERY_CAP,
} from './futureIllusion'
import { futureVisibleState } from './parallelFuturePresentation'
import { activeHitbox } from './frameData'
import { advanceProjectiles, spawnRangedProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT } from './types'
import { privatePvpState } from './pvp/view'

function field() {
  let s = multiDuel('tserriednich')
  s = {
    ...s,
    player: {
      ...s.player,
      futureIllusionMode: true,
      futureStoredFrames: 1500,
      nen: { ...s.player.nen, mode: 'zetsu' },
    },
  }
  return startFutureField(s, 'player')
}
describe('four-plus encounters: sustained Zetsu illusion application', () => {
  it('charges only with available Nen outside Zetsu and caps the duel reserve', () => {
    const base = multiDuel('tserriednich')
    expect(advanceFutureField(base).player.futureStoredFrames).toBe(11)
    expect(
      advanceFutureField({
        ...base,
        player: { ...base.player, nen: { ...base.player.nen, mode: 'zetsu' } },
      }).player.futureStoredFrames,
    ).toBeUndefined()
    expect(
      advanceFutureField({
        ...base,
        player: { ...base.player, futureStoredFrames: ILLUSION_BATTERY_CAP },
      }).player.futureStoredFrames,
    ).toBe(ILLUSION_BATTERY_CAP)
  })
  it('starts after a real vulnerable vision and eye opening, keeping the original anchor', () => {
    let s = multiCommand(multiDuel('tserriednich'), { action: 'future-field-mode' })
    s = { ...s, player: { ...s.player, futureStoredFrames: 1500 } }
    s = multiFrames(performMove({ state: s, side: 'player', action: 'special' }), 30)
    expect(s.parallelFuture?.phase).toBe('vision')
    expect(s.futureIllusion).toBeUndefined()
    s = performMove({ state: s, side: 'player', action: 'special' })
    expect(s.futureIllusion).toMatchObject({ owner: 'player', x: 30, participants: ['theta'] })
    const moving = multiFrames(s, 8, { right: true })
    expect(moving.player.x).toBeGreaterThan(30)
    expect(moving.player.nen.mode).toBe('zetsu')
    expect(moving.futureIllusion?.x).toBe(30)
    expect(moving.player.futureStoredFrames).toBeLessThan(1500)
  })
  it('allows a new one-frame blink without moving the antenna or restoring the reserve', () => {
    let s = multiCommand(field(), { action: 'future-blink' })
    expect(s.parallelFuture).toMatchObject({ phase: 'preparing', preparation: 29 })
    s = multiFrames(s, 1)
    expect(s.parallelFuture?.phase).toBe('vision')
    expect(s.player.futureStoredFrames).toBeLessThan(1500)
    expect(s.futureIllusion?.x).toBe(30)
  })
  it('does not enroll newcomers or observers originally outside the fixed field', () => {
    const s = field()
    expect(fieldDeceives(s, 'opponent')).toBe(true)
    expect(futureVisibleState({ ...s, player: { ...s.player, x: 35 } }, 'opponent').player.x).toBe(
      30,
    )
    const newcomer = { ...s, opponent: { ...s.opponent, id: 'hisoka' as const } }
    expect(fieldDeceives(newcomer, 'opponent')).toBe(false)
    const far = { ...s, opponent: { ...s.opponent, x: 80 } }
    expect(fieldDeceives(far, 'opponent')).toBe(false)
  })
  it('keeps movement in Zetsu but ends on Ren, empty reserve or leaving the antenna', () => {
    const s = field()
    expect(applyAuraContext(s.player, EMPTY_INPUT).nen.mode).toBe('zetsu')
    const ren = applyAuraContext(s.player, { ...EMPTY_INPUT, aura: true })
    expect(advanceFutureField({ ...s, player: ren }).futureIllusion).toBeUndefined()
    expect(
      advanceFutureField({ ...s, player: { ...s.player, futureStoredFrames: 0 } }).futureIllusion,
    ).toBeUndefined()
    expect(
      advanceFutureField({ ...s, player: { ...s.player, x: 70 } }).futureIllusion,
    ).toBeUndefined()
    expect(nextRound({ ...s, phase: 'finished', winner: 'player' }).futureIllusion).toBeUndefined()
  })
  it('spends actual ammunition while illusion shots and melee cannot harm people or score', () => {
    const base = field()
    let s = spawnRangedProjectiles(multiActive(performAttack(base, 'player', 'ranged')))
    expect(s.player.princeSidearmRounds).toBe(11)
    expect(s.projectiles[0]?.illusionHarmless).toBe(true)
    s = { ...s, projectiles: s.projectiles.map((p) => ({ ...p, x: s.opponent.x })) }
    const contact = advanceProjectiles(s, 1 / 60)
    expect(contact.hits).toHaveLength(0)
    expect(resolveFightImpacts(contact.state, contact.hits).opponent.health).toBe(
      base.opponent.health,
    )
    const punch = performMove({
      state: { ...base, opponent: { ...base.opponent, x: 36 } },
      side: 'player',
      action: 'light',
    })
    expect(activeHitbox(multiActive(punch).player)).toBeNull()
    expect(futureVisibleState(s, 'opponent').projectiles).toHaveLength(0)
    expect(privatePvpState(s, 'opponent').opponent.futureStoredFrames).toBeUndefined()
  })
  it('leaves ammunition released before activation dangerous', () => {
    const base = multiDuel('tserriednich')
    let s = spawnRangedProjectiles(multiActive(performAttack(base, 'player', 'ranged')))
    s = startFutureField(
      {
        ...s,
        player: {
          ...s.player,
          futureIllusionMode: true,
          futureStoredFrames: 200,
          nen: { ...s.player.nen, mode: 'zetsu' },
        },
      },
      'player',
    )
    s = { ...s, projectiles: s.projectiles.map((p) => ({ ...p, x: s.opponent.x - 0.2 })) }
    const contact = advanceProjectiles(s, 0)
    expect(contact.hits).toHaveLength(1)
    expect(resolveFightImpacts(contact.state, contact.hits).opponent.health).toBeLessThan(
      base.opponent.health,
    )
  })
})
