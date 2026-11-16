import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performAuraAttack, tickFight } from './engine'
import { FIXED_STEP, attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { resolvedDamage } from './combatDamage'
import { applyAuraContext, advanceNen, auraFlowRate, nenAttackFactor, nenDamageFactor } from './nen'
import { EN_RADIUS, SHU_BODY_SHARE, shuObject } from './nenAdvanced'
import {
  FIGHT_CATEGORIES,
  abilityCategories,
  fightCategoryEfficiency,
  categoryPower,
} from './nenCategories'
import { abilityPower, fightAbility } from './nenAbility'
import { advanceProjectileNen, commitProjectileNen } from './nenProjectiles'
import { insideEn, enContacts, perceivesProjectile } from './nenPerception'
import { toggleEmperorTime } from './kurapikaActions'
import { createRisingSun } from './feitanSun'
import { projectHanzo } from './hanzoProjection'
import { scaleNenControl } from './nenHatsuEffects'
import { planOpponentNen } from './opponentNenPlan'
import { withDolphinIdentity } from './kurapikaDolphin'
import { bungeeVisible } from './hisokaTechnique'
import {
  EMPTY_INPUT,
  type ArcadeFighter,
  type FightInput,
  type FightProjectile,
  type FightState,
  type FighterId,
} from './types'

function duel(player: FighterId = 'hisoka', opponent: FighterId = 'phinks'): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 40 },
    opponent: { ...state.opponent, aura: 100, x: 50 },
  }
}

const aura = (fighter: ArcadeFighter, input: Partial<FightInput>) =>
  applyAuraContext(fighter, { ...EMPTY_INPUT, ...input })

function shot(owner: FighterId = 'franklin'): FightProjectile {
  return {
    id: 1,
    owner: 'player',
    fighterId: owner,
    x: 50,
    y: 0,
    velocityX: 80,
    width: 0.5,
    height: 0.3,
    damage: 20,
    hitstun: 10,
    blockstun: 5,
    hitstop: 1,
    knockback: 1,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#ff0000',
    age: 0,
    lifetime: 90,
    matter: 'nen',
  }
}

function impact(state: FightState): FightState {
  return resolveFightImpacts(
    {
      ...state,
      player: {
        ...state.player,
        attack: {
          ...state.player.attack!,
          frame: attackData(state.player.attack!.kind, state.player).startup,
        },
      },
    },
    [],
  )
}

describe('Nen techniques in an actual 2D duel', () => {
  it('En detects physical bodies in Zetsu, hidden aura and entering projectiles only inside its radius', () => {
    const state = duel()
    state.player = aura(state.player, { en: true })
    state.opponent = aura(state.opponent, { aura: true, down: true })
    expect(enContacts(state, 'player')).toBe(1)
    expect(insideEn(state.player, { x: state.player.x + EN_RADIUS + 0.01, y: 0 })).toBe(false)
    expect(insideEn(state.player, { x: state.player.x, y: EN_RADIUS + 1 })).toBe(false)
    const hidden = { ...shot(), owner: 'opponent' as const, concealed: true }
    state.projectiles = [hidden, { ...hidden, id: 2, x: 95 }]
    expect(enContacts(state, 'player')).toBe(2)
    expect(perceivesProjectile(state.player, hidden)).toBe(true)
    expect(
      perceivesProjectile({ ...state.player, nen: { ...state.player.nen, en: null } }, hidden),
    ).toBe(false)
    state.opponent = { ...projectHanzo(state.opponent), x: 95 }
    expect(enContacts(state, 'player')).toBe(2) // Sleeping body and the incoming shot.
  })

  it('maintains En with real upkeep and thinner defence, collapses on attack and forced Zetsu', () => {
    const state = duel()
    const en = aura(state.player, { en: true })
    expect(auraFlowRate(en)).toBeLessThan(-9)
    expect(nenDamageFactor(en, 'torso')).toBeGreaterThan(nenDamageFactor(state.player, 'torso'))
    expect(advanceNen(en, 1).aura).toBeLessThan(en.aura - 9)
    const attack = performAttack({ ...state, player: en }, 'player', 'light')
    expect(attack.player.nen.en).toBeNull()
    const zetsu = aura(en, {
      en: true,
      shu: true,
      gyo: true,
      conceal: true,
      aura: true,
      down: true,
    })
    expect(zetsu.nen).toMatchObject({ mode: 'zetsu', en: null, shu: [], in: false, gyo: false })
    expect(aura(en, {}).nen.en).toBeNull()
  })

  it('En and Gyo help a deliberately timed parry; concealed aura defeats an unread late parry', () => {
    const original = performAuraAttack({
      state: duel('kurapika', 'phinks'),
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:forwardSpecial',
      auraCharged: false,
    })
    const guarded = {
      ...original,
      opponent: { ...original.opponent, blocking: true, guardFrames: 8 },
    }
    expect(impact(guarded).impact?.parried).toBe(false)
    expect(
      impact({ ...guarded, opponent: aura(guarded.opponent, { en: true }) }).impact?.parried,
    ).toBe(true)
    expect(
      impact({ ...guarded, opponent: aura(guarded.opponent, { gyo: true }) }).impact?.parried,
    ).toBe(true)
    const concealed = {
      ...original,
      player: { ...original.player, attack: { ...original.player.attack!, concealed: true } },
      opponent: { ...original.opponent, blocking: true, guardFrames: 2 },
    }
    expect(impact(concealed).impact).toMatchObject({ blocked: true, parried: false })
    expect(
      impact({ ...concealed, opponent: aura(concealed.opponent, { gyo: true }) }).impact?.parried,
    ).toBe(true)
  })

  it('Shu reinforces an actual thrown card and retains its committed aura after the thrower enters Zetsu', () => {
    const state = duel()
    const shu = aura(state.player, { shu: true })
    const card = { ...shot('hisoka'), matter: 'object' as const, shape: 'card' as const }
    const normal = commitProjectileNen(card, state.player)
    const reinforced = commitProjectileNen(card, shu)
    expect(reinforced.shuCharged).toBe(true)
    expect(reinforced.nenPower).toBeGreaterThan(normal.nenPower!)
    expect(shu.nen.shu).toEqual([shuObject(shu)])
    expect(SHU_BODY_SHARE).toBeLessThan(1)
    expect(nenDamageFactor(shu, 'torso')).toBeGreaterThan(nenDamageFactor(state.player, 'torso'))
    expect(auraFlowRate(shu)).toBeLessThan(0)
    const zetsu = aura(shu, { aura: true, down: true })
    const damage = (attacker: ArcadeFighter) =>
      resolvedDamage({
        attacker,
        defence: {
          fighter: state.opponent,
          blocked: false,
          parried: false,
          avoided: false,
          invulnerable: false,
        },
        kind: 'ranged',
        base: card.damage,
        zone: 'torso',
        damageScale: 1,
        openingMultiplier: 1,
        projectileNenPower: reinforced.nenPower,
        projectileHatsuPower: 1,
      })
    expect(damage(zetsu)).toBe(damage(shu))
    expect(aura(shu, {}).nen.shu).toEqual([])
    const spent = advanceProjectileNen({ ...reinforced, age: reinforced.shuFrames! })
    expect(spent).toMatchObject({
      matter: 'object',
      shuCharged: false,
      nenPower: 1,
      lifetime: card.lifetime,
    })
  })

  it('Shu strengthens a held weapon, never a bare fist or an ordinary firearm bullet', () => {
    const hisoka = duel().player
    const phinks = duel('phinks').player
    expect(nenAttackFactor(aura(hisoka, { shu: true }), 'light')).toBeGreaterThan(
      nenAttackFactor(hisoka, 'light'),
    )
    expect(nenAttackFactor(aura(phinks, { shu: true }), 'light')).toBe(
      nenAttackFactor(phinks, 'light'),
    )
    const gunner = aura(duel('benjamin').player, { shu: true, conceal: true, aura: true })
    expect(commitProjectileNen({ ...shot('benjamin'), matter: 'object' }, gunner)).toMatchObject({
      nenPower: 1,
      hatsuPower: 1,
      concealed: false,
    })
    const stone = { ...shot('phinks'), matter: 'object' as const, shape: 'stone' as const }
    expect(commitProjectileNen(stone, phinks).nenPower).toBe(1)
  })

  it('In conceals all users’ aura actions; Gyo reveals aura, while real thrown matter stays visible', () => {
    const state = duel('franklin')
    state.player = aura(state.player, { conceal: true })
    const fired = performAuraAttack({ state, side: 'player', kind: 'special', auraCharged: false })
    expect(fired.player.attack?.concealed).toBe(true)
    expect(fired.player.aura).toBeLessThan(60)
    const hidden = commitProjectileNen(shot(), state.player)
    expect(hidden.concealed).toBe(true)
    expect(perceivesProjectile(state.opponent, hidden)).toBe(false)
    expect(perceivesProjectile(aura(state.opponent, { gyo: true }), hidden)).toBe(true)
    expect(perceivesProjectile(state.opponent, { ...hidden, matter: 'object' })).toBe(true)
    expect(nenDamageFactor(aura(state.opponent, { gyo: true }), 'torso')).toBeGreaterThan(
      nenDamageFactor(state.opponent, 'torso'),
    )
    expect(aura(aura(state.player, { gyo: true }), {}).nen.gyo).toBe(false)
  })

  it('manual Ryu redistributes aura, protects its zone and exposes the rest instead of stacking Ken', () => {
    const fighter = duel('phinks').player
    const focused = aura(fighter, { aura: true, guard: true, focusHead: true })
    expect(focused.nen.ken).toBe(false)
    expect(focused.nen.ryu).toMatchObject({ head: 0.76, torso: 0.08, hands: 0.08, feet: 0.08 })
    expect(nenDamageFactor(focused, 'head')).toBeLessThan(nenDamageFactor(focused, 'torso'))
    const hands = aura(fighter, { focusHands: true })
    const started = performAttack({ ...duel('phinks'), player: hands }, 'player', 'light')
    expect(started.player.nen.ryu.hands).toBe(0.76)
    expect(nenAttackFactor(hands, 'light')).toBeGreaterThan(
      nenAttackFactor(aura(fighter, { focusFeet: true }), 'light'),
    )
  })

  it('Ten recovers slowly, Ren increases output, Zetsu recovers fast with no aura defence', () => {
    const fighter = duel('phinks').player
    const ten = aura(fighter, {})
    const ren = aura(fighter, { aura: true })
    const zetsu = aura(fighter, { aura: true, down: true })
    expect(auraFlowRate(ten)).toBeGreaterThan(0)
    expect(auraFlowRate(ren)).toBeLessThan(0)
    expect(auraFlowRate(zetsu)).toBeGreaterThan(auraFlowRate(ten))
    expect(nenAttackFactor(ren, 'light')).toBeGreaterThan(nenAttackFactor(ten, 'light'))
    expect(nenDamageFactor(zetsu, 'torso')).toBeGreaterThan(nenDamageFactor(ten, 'torso'))
  })

  it('Ko commits all aura to the striking zone and leaves other zones vulnerable', () => {
    const state = duel('phinks')
    state.player = aura(state.player, { aura: true })
    const started = performAuraAttack({ state, side: 'player', kind: 'heavy', auraCharged: true })
    const ko = aura(started.player, {})
    expect(ko.nen.ko).toBe(attackData('heavy', ko).auraZone)
    expect(ko.aura).toBe(started.player.aura - 20)
    expect(nenDamageFactor(ko, 'torso')).toBeGreaterThan(nenDamageFactor(state.player, 'torso'))
    expect(nenAttackFactor(ko, 'heavy')).toBeGreaterThan(nenAttackFactor(started.player, 'heavy'))
  })

  it('Ken absorbs ordinary guarded strikes, drains aura on contact and can be overwhelmed', () => {
    const state = duel('phinks', 'phinks')
    const defender = {
      ...aura(state.opponent, { aura: true, guard: true }),
      blocking: true,
      guardFrames: 20,
    }
    const defence = {
      fighter: defender,
      blocked: true,
      parried: false,
      avoided: false,
      invulnerable: false,
    }
    const damage = (base: number) =>
      resolvedDamage({
        attacker: state.player,
        defence,
        base,
        kind: 'heavy',
        zone: 'torso',
        damageScale: 1,
        openingMultiplier: 1,
      })
    expect(damage(10)).toBe(0)
    expect(damage(500)).toBeGreaterThan(0)
    const struck = impact(performAttack({ ...state, opponent: defender }, 'player', 'light'))
    expect(struck.opponent.aura).toBeLessThan(defender.aura)
  })

  it('runs the new controls through both local fighters and clears them at exhaustion', () => {
    const state = duel()
    const next = tickFight(
      state,
      { ...EMPTY_INPUT, en: true },
      { dt: FIXED_STEP, opponentInput: { ...EMPTY_INPUT, shu: true, focusHands: true } },
    )
    expect(next.player.nen.en).not.toBeNull()
    expect(next.opponent.nen.shu.length).toBe(1)
    expect(next.opponent.nen.ryu.hands).toBe(0.76)
    const drained = advanceNen({ ...next.player, aura: 0.01 }, 1)
    expect(drained).toMatchObject({
      auraExhausted: true,
      nen: { mode: 'zetsu', en: null, shu: [], in: false },
    })
  })
})

describe('Category components and Emperor Time', () => {
  it('applies hexagon efficiencies to fists and defence, including normalized catalogue aliases', () => {
    const enhancer = duel('phinks').player
    const conjurer = duel('kurapika').player
    expect(fightCategoryEfficiency(enhancer, 'enhancer')).toBe(1)
    expect(fightCategoryEfficiency(conjurer, 'enhancer')).toBe(0.6)
    expect(fightCategoryEfficiency(conjurer, 'emitter')).toBe(0.4)
    expect(fightCategoryEfficiency(duel('bill').player, 'enhancer')).toBe(1)
    expect(fightCategoryEfficiency(duel('sayird').player, 'emitter')).toBe(1)
    expect(nenDamageFactor(enhancer, 'torso')).toBeLessThan(nenDamageFactor(conjurer, 'torso'))
    expect(fightCategoryEfficiency(enhancer, 'specialist')).toBe(0)
  })

  it('resolves mixed Hatsu by their declared components, without transferring the owner’s innate type', () => {
    const hisoka = duel().player
    expect(abilityCategories('bungee-gum')).toEqual(['transmuter', 'emitter', 'manipulator'])
    const expected = Math.cbrt(
      categoryPower(hisoka, 'transmuter') *
        categoryPower(hisoka, 'emitter') *
        categoryPower(hisoka, 'manipulator'),
    )
    expect(abilityPower(hisoka, 'bungee-gum')).toBeCloseTo(expected)
    const chrollo = duel('chrollo').player
    chrollo.chrolloBook = { pages: ['hisoka'], page: 0, open: true, bookmark: null }
    expect(fightAbility(chrollo)).toBe('bungee-gum')
    expect(abilityPower(chrollo)).not.toBe(abilityPower(hisoka))
    expect(fightCategoryEfficiency(duel('hanzo').player, 'conjurer')).toBe(0.8)
  })

  it('improves emission at release, conjured tools, transmuted heat, and manipulation duration separately', () => {
    const franklin = duel('franklin').player
    const kurapika = duel('kurapika').player
    expect(commitProjectileNen(shot(), franklin).nenPower).toBeGreaterThan(
      commitProjectileNen(shot(), kurapika).nenPower!,
    )
    const cold = createRisingSun(duel('kurapika').player, 40)
    const hot = createRisingSun(duel('feitan').player, 40)
    expect(hot.damage).toBeGreaterThan(cold.damage)
    const state = duel('illumi')
    const controlled = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, restrainedFrames: 100 },
      },
    }
    expect(
      scaleNenControl(state, controlled, 'player').opponent.hatsuEffects.restrainedFrames,
    ).toBe(120)
    expect(
      scaleNenControl(state, controlled, 'player').opponent.hatsuEffects.forcedZetsuFrames,
    ).toBe(0)
  })

  it('Emperor Time grants simultaneous efficiency in all categories with no extra ability or aura reserve', () => {
    const state = duel('kurapika')
    const active = toggleEmperorTime(state, 'player')
    expect(
      FIGHT_CATEGORIES.map((category) => fightCategoryEfficiency(active.player, category)),
    ).toEqual([1, 1, 1, 1, 1, 1])
    expect(active.player.aura).toBe(state.player.aura)
    expect(fightAbility(active.player)).toBe(fightAbility(state.player))
    expect(nenAttackFactor(active.player, 'light')).toBeGreaterThan(
      nenAttackFactor(state.player, 'light'),
    )
    expect(nenDamageFactor(active.player, 'torso')).toBeLessThan(
      nenDamageFactor(state.player, 'torso'),
    )
    expect(commitProjectileNen(shot('kurapika'), active.player).nenPower).toBeGreaterThan(
      commitProjectileNen(shot('kurapika'), state.player).nenPower!,
    )
    const later = tickFight(active, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    expect(later.player.kurapika!.lifespanFrames).toBeGreaterThan(
      active.player.kurapika!.lifespanFrames,
    )
    const zetsu = aura(active.player, { aura: true, down: true })
    expect(fightCategoryEfficiency(zetsu, 'enhancer')).toBe(0)
  })

  it('retains Kurapika’s simultaneous efficiencies inside a borrowed Hatsu execution identity', () => {
    const state = toggleEmperorTime(duel('kurapika'), 'player')
    state.player.kurapika!.held = {
      source: 'hisoka',
      victim: 'opponent',
      moveId: 'hisoka:neutralSpecial',
      loaded: true,
      used: true,
      sustainedKeys: [],
    }
    const executed = withDolphinIdentity(state, (borrowed) => {
      expect(borrowed.player.id).toBe('hisoka')
      expect(fightAbility(borrowed.player)).toBe('bungee-gum')
      expect(
        FIGHT_CATEGORIES.map((category) => fightCategoryEfficiency(borrowed.player, category)),
      ).toEqual([1, 1, 1, 1, 1, 1])
      expect(abilityPower(borrowed.player)).toBeCloseTo(1.2)
      return borrowed
    })
    expect(executed.player.id).toBe('kurapika')
    expect(executed.player.nenOwner).toBeUndefined()
  })

  it('En locates an In-concealed tether crossing the field even with a distant anchor', () => {
    const state = duel('phinks', 'hisoka')
    state.player = aura(state.player, { en: true })
    state.opponent.x = 95
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: true, retracting: false }
    expect(bungeeVisible(state)).toBe(true)
    expect(enContacts(state, 'player')).toBe(1)
    expect(bungeeVisible({ ...state, player: aura(state.player, {}) })).toBe(false)
  })

  it('the CPU scans on its own schedule without consulting an unseen Nen mode', () => {
    const state = duel('hisoka', 'phinks')
    const neutral = planOpponentNen(state).opponent.nen
    expect(
      planOpponentNen({ ...state, player: aura(state.player, { conceal: true }) }).opponent.nen,
    ).toEqual(neutral)
    expect(
      planOpponentNen({ ...state, player: aura(state.player, { aura: true, down: true }) }).opponent
        .nen,
    ).toEqual(neutral)
    expect(neutral.gyo).toBe(true)
    const idle = { ...state, frame: 60 }
    expect(
      planOpponentNen({ ...idle, player: aura(idle.player, { conceal: true }) }).opponent.nen.gyo,
    ).toBe(false)
  })
})
