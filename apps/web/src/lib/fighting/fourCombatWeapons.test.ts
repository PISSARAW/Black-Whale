import { describe, expect, it } from 'vitest'
import { performMove, performAttack } from './engine'
import { multiDuel, multiCommand, multiFrames, multiActive } from './fourCombatTestKit'
import { advanceHistoricalWeapons } from './historicalWeaponFrame'
import { activeHitbox } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { historicalBladeStrike } from './historicalWeapons'
import { PRINCE_SIDEARM_ROUNDS } from './princeSidearm'
import { spawnFranklinBarrage } from './franklinBarrage'
import { franklinSalvo } from './franklinAttack'

describe('four-plus encounters: physical equipment and emission', () => {
  it('throws Leorio’s single real knife only at release, without a duplicate melee hit', () => {
    const base = multiDuel('leorio')
    let s = multiCommand(base, { action: 'weapon-throw' })
    expect(s.player.historicalWeaponSpent).toBeUndefined()
    expect(activeHitbox(s.player)).toBeNull()
    const interrupted = advanceHistoricalWeapons({ ...s, player: { ...s.player, attack: null } })
    expect(interrupted.player.historicalWeaponSpent).toBeUndefined()
    s = advanceHistoricalWeapons(multiActive(s))
    expect(s.projectiles).toHaveLength(1)
    expect(s.projectiles[0]).toMatchObject({
      matter: 'object',
      physicalBlade: { weapon: 'switchblade' },
    })
    expect(s.player.historicalWeaponSpent).toBe(true)
    expect(s.opponent.health).toBe(base.opponent.health)
    expect(advanceHistoricalWeapons(s).projectiles).toHaveLength(1)
    s = multiFrames(s, 45)
    expect(s.opponent.health).toBeLessThan(base.opponent.health)
    expect(s.opponent.openWounds).toBeGreaterThan(0)
    expect(multiCommand(s, { action: 'weapon-throw' })).toBe(s)
  })
  it('distinguishes a blocked poisoned cut, an open wound and early containment', () => {
    let base = multiDuel('chrollo')
    base = { ...base, opponent: { ...base.opponent, x: 36 } }
    const ready = multiFrames(multiCommand(base, { action: 'weapon-ready' }), 12)
    const hit = multiActive(performMove({ state: ready, side: 'player', action: 'light' }))
    let struck = resolveFightImpacts(hit, [])
    expect(struck.opponent.paralyticPoison).toMatchObject({
      owner: 'player',
      age: 0,
      contained: false,
    })
    expect(struck.opponent.openWounds).toBeGreaterThan(0)
    const blocked = resolveFightImpacts(
      { ...hit, opponent: { ...hit.opponent, blocking: true, guardFrames: 30 } },
      [],
    )
    expect(blocked.opponent.paralyticPoison).toBeUndefined()
    const health = struck.opponent.health
    struck = {
      ...struck,
      opponent: { ...struck.opponent, attack: null, hitStun: 0, blockStun: 0, knockdownFrames: 0 },
    }
    struck = multiCommand(struck, { action: 'weapon-contain' }, 'opponent')
    expect(struck.opponent.paralyticPoison?.contained).toBe(true)
    for (let n = 0; n < 35; n++) struck = advanceHistoricalWeapons(struck)
    expect(struck.opponent.health).toBe(health)
    expect(struck.opponent.hitStun).toBe(0)
    let late = resolveFightImpacts(hit, [])
    for (let n = 0; n < 30; n++) late = advanceHistoricalWeapons(late)
    expect(late.opponent.hitStun).toBeGreaterThan(0)
    expect(multiCommand(late, { action: 'weapon-contain' }, 'opponent')).toBe(late)
  })
  it('keeps Hanzo’s blade physical, Feitan’s sword cutting and Kurapika’s wood non-cutting', () => {
    for (const id of ['hanzo', 'kurapika', 'feitan'] as const) {
      let s = multiDuel(id)
      if (id !== 'feitan') s = multiFrames(multiCommand(s, { action: 'weapon-ready' }), 12)
      s = multiActive(performMove({ state: s, side: 'player', action: 'light' }))
      expect(historicalBladeStrike(s.player)).toBe(id !== 'kurapika')
      expect(historicalBladeStrike({ ...s.player, weaponsConfiscated: true })).toBe(false)
      if (id === 'hanzo')
        expect(
          historicalBladeStrike({
            ...s.player,
            hanzoProjection: { bodyX: 20, bodyFacing: 1, bodyNen: s.player.nen, startupFrames: 0 },
          }),
        ).toBe(false)
    }
  })
  it.each(['tserriednich', 'halkenburg'] as const)(
    'gives %s a finite physical pistol that can fire in Zetsu',
    (id) => {
      let s = multiDuel(id)
      s = { ...s, player: { ...s.player, nen: { ...s.player.nen, mode: 'zetsu' }, aura: 0 } }
      for (let i = 0; i < PRINCE_SIDEARM_ROUNDS; i++) {
        expect(canUseRangedAttack(s.player)).toBe(true)
        s = performAttack(s, 'player', 'ranged')
        expect(s.player.attack).not.toBeNull()
        s = spawnRangedProjectiles(multiActive(s))
        expect(s.projectiles.at(-1)).toMatchObject({
          shape: 'bullet',
          matter: 'object',
          nenPower: 1,
        })
        s = { ...s, player: { ...s.player, attack: null } }
      }
      expect(s.player.aura).toBe(0)
      expect(s.player.princeSidearmRounds).toBe(0)
      expect(canUseRangedAttack(s.player)).toBe(false)
    },
  )
  it.each(['split', 'sweep'] as const)(
    'keeps Franklin’s %s salvo physical in space with the same count and cost',
    (target) => {
      const original = multiDuel('franklin')
      let s = multiCommand(original, { action: 'franklin-aim', target })
      s = performMove({ state: s, side: 'player', action: 'special' })
      const aura = s.player.aura,
        salvo = franklinSalvo(s.player)
      const start = multiActive(s).player.attack!.frame
      for (let frame = start; frame < start + 120; frame++) {
        s = { ...s, player: { ...s.player, attack: { ...s.player.attack!, frame } } }
        s = spawnFranklinBarrage(s, 'player')
      }
      expect(s.projectiles).toHaveLength(salvo.shots)
      expect(s.player.aura).toBe(aura)
      if (target === 'split')
        expect(new Set(s.projectiles.map((p) => Math.sign(p.velocityX)))).toEqual(new Set([-1, 1]))
      else expect(new Set(s.projectiles.map((p) => Math.round(p.y))).size).toBeGreaterThan(2)
      const interrupted = spawnFranklinBarrage(
        { ...s, player: { ...s.player, hitStun: 10 } },
        'player',
      )
      expect(interrupted.projectiles).toHaveLength(salvo.shots)
    },
  )
})
