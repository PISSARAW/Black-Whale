import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import {
  applyAuraContext,
  auraFlowRate,
  nenDamageFactor,
  nenAttackFactor,
  isCriticalAuraStrike,
} from '../nen'
import { EMPTY_INPUT, type FightProjectile } from '../types'
import { commitProjectileNen, advanceProjectileNen } from '../nenProjectiles'
import { gyoSight, perceivesProjectile } from '../nenPerception'
import { readAura } from './reading'
import { regionalDefence, shuGuardFactor } from './protection'
import { sampleGamepad, type FightPad } from '../fightGamepad'
const apply = (f: ReturnType<typeof createFight>['player'], input: Partial<typeof EMPTY_INPUT>) =>
  applyAuraContext(f, { ...EMPTY_INPUT, ...input })
const guard = { aura: true, guard: true, gyo: true, focusHead: true }
const card: FightProjectile = {
  id: 1,
  owner: 'player',
  fighterId: 'hisoka',
  x: 50,
  y: 6,
  velocityX: 65,
  width: 0.85,
  height: 0.45,
  damage: 8,
  hitstun: 10,
  blockstun: 5,
  hitstop: 2,
  knockback: 1,
  targetZone: 'torso',
  shape: 'card',
  colour: '#ffffff',
  age: 0,
  lifetime: 90,
  matter: 'object',
}
describe('advanced combinations from the supplied Nen excerpt', () => {
  it('distinguishes low-output aura observation from Ren-based ocular detection of In', () => {
    const f = createFight('kurapika', 'hisoka').player
    const full = apply(f, { gyo: true }),
      low = apply(f, { gyo: true, down: true })
    const target = apply(f, { conceal: true, focusHead: true })
    expect(full.nen.mode).toBe('ren')
    expect(low.nen.mode).toBe('ten')
    expect(auraFlowRate(full)).toBeCloseTo(-6.4)
    expect(auraFlowRate(low)).toBeCloseTo(-2.4)
    expect(gyoSight(full)).toBe(true)
    expect(gyoSight(low)).toBe(false)
    expect(readAura(low, target)).toMatchObject({ output: 'quiet', shares: null })
    expect(readAura(full, target)?.shares?.head).toBe(0.76)
    expect(perceivesProjectile(low, { ...card, matter: 'nen', concealed: true })).toBe(false)
    expect(perceivesProjectile(full, { ...card, matter: 'nen', concealed: true })).toBe(true)
    expect(gyoSight(apply(low, { gyo: true }))).toBe(true)
  })
  it('maintains Ryu and ocular reading together when aura output is explicitly sustained', () => {
    const f = createFight('kurapika', 'hisoka').player
    const next = apply(f, { aura: true, gyo: true, focusHands: true })
    expect(next.nen.ryu.hands).toBe(0.76)
    expect(gyoSight(next)).toBe(true)
    expect(auraFlowRate(next)).toBeCloseTo(-8.4)
  })
  it('commits defensive Ko once, protects the chosen zone more than Ken, and leaves zero aura elsewhere', () => {
    const f = { ...createFight('kurapika', 'hisoka').player, aura: 100 }
    const ko = apply(f, guard),
      ken = apply(f, { aura: true, guard: true })
    expect(ko.aura).toBe(80)
    expect(apply(ko, guard).aura).toBe(80)
    expect(ko.nen).toMatchObject({ ko: 'head', gyo: false, ken: false, ryu: { head: 1 } })
    expect(regionalDefence(ko, 'hands')).toBe(0)
    expect(nenDamageFactor(ko, 'head')).toBeLessThan(nenDamageFactor(ken, 'head'))
    expect(nenDamageFactor(ko, 'torso')).toBeGreaterThan(nenDamageFactor(ken, 'torso'))
    expect(apply(ko, {}).nen.ko).toBeNull()
    expect(apply({ ...f, aura: 19 }, guard).nen.ko).toBeNull()
    expect(
      apply({ ...ko, hatsuEffects: { ...ko.hatsuEffects, forcedZetsuFrames: 20 } }, guard).nen.gyo,
    ).toBe(false)
  })
  it('does not transfer head Ko into an unrelated hand or foot strike', () => {
    const f = createFight('kurapika', 'hisoka').player
    const head = apply(f, guard)
    const hands = apply(f, { ...guard, focusHead: false, focusHands: true })
    expect(nenAttackFactor(head, 'light')).toBe(0.7)
    const state = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
    expect(
      isCriticalAuraStrike(performAttack({ ...state, player: head }, 'player', 'light').player),
    ).toBe(false)
    expect(
      isCriticalAuraStrike(performAttack({ ...state, player: hands }, 'player', 'light').player),
    ).toBe(true)
    expect(nenAttackFactor(hands, 'light')).toBeGreaterThan(nenAttackFactor(head, 'light'))
  })
  it('preserves a paid hand Ko into an actual physical weapon strike while Shu remains held', () => {
    const state = beginFight(createFight('hisoka', 'phinks', { mode: 'versus-local' }))
    state.player = { ...state.player, x: 40, aura: 100 }
    state.opponent.x = 47
    state.player = apply(apply(state.player, { shu: true }), {
      ...guard,
      focusHead: false,
      focusHands: true,
      shu: true,
    })
    let next = performAttack(state, 'player', 'light')
    for (let i = 0; i < 20 && !next.impact; i++)
      next = tickFight(
        next,
        { ...EMPTY_INPUT, shu: true },
        { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT },
      )
    expect(next.impact).toMatchObject({ attacker: 'player', critical: true, blocked: false })
    expect(next.player.nen.shu).toEqual(['cards'])
  })
  it('commits Shu + Ko to real thrown matter, hides only its aura with In, and preserves released aura in Zetsu', () => {
    const f = { ...createFight('hisoka', 'hinrigh').player, aura: 100 },
      shu = apply(f, { shu: true })
    const ko = apply(shu, {
      ...guard,
      focusHead: false,
      focusHands: true,
      shu: true,
      conceal: true,
    })
    const base = commitProjectileNen(card, shu),
      reinforced = commitProjectileNen(card, ko)
    expect(reinforced.nenPower).toBeGreaterThan(base.nenPower!)
    expect(reinforced).toMatchObject({ matter: 'object', concealed: true, shuCharged: true })
    expect(perceivesProjectile(f, reinforced)).toBe(true)
    expect(apply(ko, { aura: true, down: true }).nen.mode).toBe('zetsu')
    expect(reinforced.nenPower).toBeGreaterThan(1)
    expect(advanceProjectileNen({ ...reinforced, age: reinforced.shuFrames! }).shuCharged).toBe(
      false,
    )
  })
  it('preserves an existing In-hidden paper manifestation without requiring Shu or hiding its real support', () => {
    const fighter = apply(createFight('kalluto', 'hinrigh').player, { conceal: true })
    const shot = commitProjectileNen(
      { ...card, fighterId: 'kalluto', kallutoPaper: 'plant', concealed: true },
      fighter,
    )
    expect(shot).toMatchObject({
      concealed: true,
      shuCharged: false,
      matter: 'object',
      nenPower: 1,
    })
    expect(perceivesProjectile(createFight('hinrigh', 'kalluto').player, shot)).toBe(true)
  })
  it('lets reinforced equipment aid an already successful guard without strengthening bare fists or ballistics', () => {
    const f = createFight('hisoka', 'phinks').player,
      equipped = apply(f, { shu: true })
    expect(shuGuardFactor(equipped, true)).toBeLessThan(shuGuardFactor(f, true))
    expect(shuGuardFactor(equipped, false)).toBe(1)
    expect(shuGuardFactor(equipped, true, true)).toBe(1)
    expect(shuGuardFactor(apply(createFight('phinks', 'hisoka').player, { shu: true }), true)).toBe(
      1,
    )
  })
  it.each([
    ['Gyo', [11, 12], { gyo: true, focusHead: true }],
    ['Ryu', [4, 12], { gyo: false, focusHead: true }],
    ['Ko', [4, 5, 11, 12], { aura: true, guard: true, gyo: true, focusHead: true }],
    [
      'Shu + Ko',
      [8, 4, 5, 11, 14],
      { aura: true, guard: true, gyo: true, focusHands: true, shu: true },
    ],
  ] as const)(
    'provides a playable Xbox chord for %s without unintended movement',
    (_name, buttons, expected) => {
      const pad: FightPad = {
        index: 0,
        id: 'Xbox',
        connected: true,
        mapping: 'standard',
        axes: [0, 0],
        buttons: Array.from({ length: 16 }, (_, i) => ({
          pressed: buttons.includes(i as never),
          value: 0,
        })),
      }
      const input = sampleGamepad(pad, null).input
      if (_name === 'Shu + Ko') {
        const fighter = applyAuraContext(createFight('hisoka', 'phinks').player, input)
        expect(fighter.nen).toMatchObject({ ko: 'hands', shu: ['cards'] })
        expect(applyAuraContext(fighter, input).aura).toBe(fighter.aura)
      }
      expect(input).toMatchObject({
        ...expected,
        jump: false,
        down: false,
        left: false,
        right: false,
      })
    },
  )
})
