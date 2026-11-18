import { describe, expect, it } from 'vitest'
import { performMove, performAuraAttack } from './engine'
import { multiDuel, multiCommand, multiFrames, multiActive } from './fourCombatTestKit'
import { resolveFightImpacts } from './combatImpact'
import { advanceConditionedNeedles } from './illumiConditioning'
import { advanceIllumiMask } from './illumiMask'
import { battleAppearance } from './battleCantabileRules'
import { emptyBattleCantabile, BATTLE_MOVES } from './battleCantabileTypes'
import { advanceBattleCantabile } from './battleCantabileFrame'
import { privatePvpState } from './pvp/view'
import { advanceGumHeart } from './hisokaHeart'
import { recordFightDeath, resolvePostMortemDeaths, type FightDeathCause } from './fightDeaths'

describe('four-plus encounters: physical identity, autonomy and post-mortem orders', () => {
  it('implants a removable conditioning needle through a real skull hit, without making Needle People', () => {
    let s = multiDuel('illumi', 'hisoka')
    s = { ...s, opponent: { ...s.opponent, x: 36 } }
    s = multiCommand(s, { action: 'illumi-needle-mode', target: 'condition' })
    s = resolveFightImpacts(
      multiActive(performMove({ state: s, side: 'player', action: 'special' })),
      [],
    )
    expect(s.opponent.conditionedNeedle?.owner).toBe('player')
    expect(s.opponent.needlePuppet).toBeUndefined()
    const before = s.opponent.x
    const threat = performMove({
      state: { ...s, player: { ...s.player, attack: null } },
      side: 'player',
      action: 'heavy',
    })
    expect(advanceConditionedNeedles(threat).opponent.x).toBeGreaterThan(before)
    const hidden = {
      ...threat,
      player: { ...threat.player, attack: { ...threat.player.attack!, concealed: true } },
    }
    expect(advanceConditionedNeedles(hidden).opponent.x).toBe(before)
    s = multiCommand(s, { action: 'illumi-needle-remove' }, 'opponent')
    expect(s.opponent.needleRemoval?.frames).toBe(30)
    const interrupted = advanceConditionedNeedles({ ...s, opponent: { ...s.opponent, hitStun: 1 } })
    expect(interrupted.opponent.needleRemoval).toBeUndefined()
    expect(interrupted.opponent.conditionedNeedle).toBeDefined()
    for (let n = 0; n < 30; n++) s = advanceConditionedNeedles(s)
    expect(s.opponent.conditionedNeedle).toBeUndefined()
    const irreversible = {
      ...s,
      opponent: {
        ...s.opponent,
        arenaRecovery: 0,
        needlePuppet: { owner: 'player' as const, order: 'stay' as const, needleEmbedded: true },
      },
    }
    expect(multiCommand(irreversible, { action: 'illumi-needle-remove' }, 'opponent')).toBe(
      irreversible,
    )
  })
  it('uses a timed needleless Hisoka appearance with no healing or borrowed Hatsu', () => {
    let s = multiDuel('illumi', 'hisoka')
    s = { ...s, player: { ...s.player, health: 51 } }
    s = multiCommand(s, { action: 'illumi-mask', target: 'hisoka' })
    expect(battleAppearance(s.player)).toBe('illumi')
    s = multiFrames(s, 31)
    expect(battleAppearance(s.player)).toBe('hisoka')
    expect(s.player.id).toBe('illumi')
    expect(s.player.health).toBe(51)
    expect(multiCommand(s, { action: 'gum-heart' })).toBe(s)
    expect(privatePvpState(s, 'opponent').opponent.id).toBe('illumi')
    s = { ...s, player: { ...s.player, illumiMask: { ...s.player.illumiMask!, remaining: 1 } } }
    s = advanceIllumiMask(s)
    expect(battleAppearance(s.player)).toBe('illumi')
  })
  it('reuses an actually learned model and changes form directly after the next vulnerable dance', () => {
    let s = multiDuel('bonolenov', 'theta')
    s = {
      ...s,
      player: {
        ...s.player,
        battleCantabile: {
          ...emptyBattleCantabile(),
          models: {
            hisoka: { frames: 600, spoken: true },
            lynch: { frames: 900, spoken: true },
            illumi: { frames: 600, spoken: false },
          },
          form: { model: 'hisoka', remaining: 500, duration: 600 },
        },
      },
    }
    expect(multiCommand(s, { action: 'bono-model', target: 'illumi' })).toBe(s)
    s = multiCommand(s, { action: 'bono-model', target: 'lynch' })
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'special',
      moveId: BATTLE_MOVES.metamorphosen,
      auraCharged: false,
    })
    expect(s.player.battleCantabile?.preparation?.model).toBe('lynch')
    for (let i = 0; i < 45; i++) s = advanceBattleCantabile(s)
    expect(battleAppearance(s.player)).toBe('lynch')
    expect(s.player.id).toBe('bonolenov')
    expect(s.player.aura).toBe(70)
    expect(privatePvpState(s, 'opponent').opponent.battleCantabile?.models).toEqual({})
  })
  it('requires an uninterrupted gum order issued alive and pays even on interruption', () => {
    const base = multiDuel('hisoka')
    let s = multiCommand(base, { action: 'gum-heart' })
    expect(s.player.aura).toBe(80)
    const broken = advanceGumHeart({ ...s, player: { ...s.player, hitStun: 1 } })
    expect(broken.player.gumHeartArmed).toBe(false)
    expect(broken.player.aura).toBe(80)
    for (let i = 0; i < 18; i++) s = advanceGumHeart(s)
    expect(s.player.gumHeartArmed).toBe(true)
    expect(privatePvpState(s, 'opponent').opponent.gumHeartArmed).toBeUndefined()
  })
  it('attributes actual fatal contact from Hanzo’s projected choke before the verdict', () => {
    let s = multiDuel('hanzo', 'hisoka')
    s = {
      ...s,
      player: { ...s.player, x: 25 },
      opponent: { ...s.opponent, x: 80, gumHeartArmed: true, health: 1, openWounds: 2 },
    }
    s = multiFrames(performMove({ state: s, side: 'player', action: 'special' }), 30)
    expect(s.player.hanzoProjection).toBeDefined()
    s = { ...s, player: { ...s.player, x: 74 }, opponent: { ...s.opponent, x: 78 } }
    s = performMove({ state: s, side: 'player', action: 'finisher' })
    expect(s.player.attack?.moveId).toBe('hanzo:finisher')
    s = resolveFightImpacts(multiActive(s), [])
    expect(s.opponent.health).toBe(1)
    expect(s.opponent.gumHeartSpent).toBe(true)
    expect(s.opponent.openWounds).toBe(2)
    expect(s.phase).toBe('fighting')
  })
  it.each([
    'asphyxia',
    'strike',
    'projectile',
    'heat',
    'transfer',
    'judgment',
    'vow',
    'blood',
    'toxin',
  ] satisfies FightDeathCause[])('limits prepared gum resuscitation for death by %s', (cause) => {
    const base = multiDuel('hisoka')
    const dead = {
      ...base,
      player: { ...base.player, health: 0, aura: 17, openWounds: 3, gumHeartArmed: true },
    }
    let s = resolvePostMortemDeaths(
      recordFightDeath(dead, { victimSide: 'player', killerSide: null, cause }),
    )
    expect(s.player.health).toBe(cause === 'asphyxia' ? 1 : 0)
    expect(s.player.openWounds).toBe(3)
    expect(s.player.aura).toBe(17)
    if (cause === 'asphyxia') {
      s = { ...s, player: { ...s.player, health: 0 } }
      s = resolvePostMortemDeaths(
        recordFightDeath(s, { victimSide: 'player', killerSide: null, cause }),
      )
      expect(s.player.health).toBe(0)
    }
  })
})
