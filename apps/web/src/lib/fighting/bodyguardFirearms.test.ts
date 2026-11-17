import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, performAuraAttack, tickFight } from './engine'
import { BODYGUARD_FIREARMS } from './bodyguardFirearms'
import { projectileProfile, rangedAuraCost } from './projectiles'
import { isFirearmProjectile } from './nenProjectiles'
import { buildFightFigure } from './fighterFigure'
import { animateServiceHandgun } from './serviceHandgun'
import { castCameraDetail } from './cinematicMoveLenses'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(id: FighterId, side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'player' ? 'hisoka' : id, {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return { ...state, player: { ...state.player, x: 30 }, opponent: { ...state.opponent, x: 70 } }
}

function advance(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Bodyguard service firearms', () => {
  it.each(BODYGUARD_FIREARMS)('%s uses an ordinary bullet instead of a stone or chain', (id) => {
    expect(projectileProfile(id)).toMatchObject({ matter: 'object', shape: 'bullet' })
    expect(rangedAuraCost(id)).toBe(0)
    expect(projectileProfile(id).labelFr).toMatch(/pistolet/i)
  })

  it.each(
    BODYGUARD_FIREARMS.flatMap((id) =>
      (['player', 'opponent'] as const).map((side) => ({ id, side })),
    ),
  )(
    '$id: $side can actually fire and hit without Nen, even with a sealed/stolen Hatsu',
    ({ id, side }) => {
      const base = duel(id, side)
      const shooter = base[side]
      const state = {
        ...base,
        [side]: {
          ...shooter,
          aura: 0,
          auraExhausted: true,
          nen: { ...shooter.nen, mode: 'zetsu' as const, on: false },
          hatsuEffects: { ...shooter.hatsuEffects, hatsuStolen: 180, forcedZetsuFrames: 180 },
        },
      }
      const armed = performAttack(state, side, 'ranged')
      expect(armed[side].attack).toMatchObject({
        kind: 'ranged',
        hatsuSource: null,
        auraCharged: false,
        concealed: false,
      })
      expect(armed[side].aura).toBe(0)
      const flying = advance(armed, 11)
      const bullet = flying.projectiles.find((shot) => shot.owner === side)!
      expect(bullet).toMatchObject({
        matter: 'object',
        shape: 'bullet',
        nenPower: 1,
        hatsuPower: 1,
        concealed: false,
      })
      expect(isFirearmProjectile(bullet)).toBe(true)
      const target = side === 'player' ? 'opponent' : 'player'
      const hit = advance(flying, 40)
      expect(hit[target].health).toBeLessThan(base[target].health)
      expect(hit[target].hatsuEffects.witnessedHatsu).toBeNull()
    },
  )

  it.each(BODYGUARD_FIREARMS)(
    '%s cannot turn a gunshot into a charged or concealed aura attack',
    (id) => {
      const base = duel(id)
      const state = {
        ...base,
        player: {
          ...base.player,
          nen: { ...base.player.nen, mode: 'ren' as const, in: true },
          hatsuChargeFrames: 90,
        },
      }
      const armed = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: true })
      expect(armed.player.aura).toBe(state.player.aura)
      expect(armed.player.attack).toMatchObject({
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
      })
      expect(advance(armed, 11).projectiles[0]).toMatchObject({
        nenPower: 1,
        hatsuPower: 1,
        concealed: false,
      })
    },
  )

  it('keeps Kurapika’s forward special as a separate Nen chain', () => {
    const base = duel('kurapika')
    const chain = performAuraAttack({
      state: base,
      side: 'player',
      kind: 'special',
      auraCharged: false,
      moveId: 'kurapika:forwardSpecial',
    })
    expect(chain.player.attack).toMatchObject({
      moveId: 'kurapika:forwardSpecial',
      hatsuSource: 'kurapika',
    })
    expect(chain.player.aura).toBeLessThan(base.player.aura)
    expect(projectileProfile('kurapika')).toMatchObject({ matter: 'object', shape: 'bullet' })
    const gunshot = performAttack(base, 'player', 'ranged')
    expect(castCameraDetail(gunshot, 'player')).toMatchObject({
      kind: 'focus',
      aura: false,
      labelFr: 'Pistolet de service',
      labelEn: 'Service handgun',
    })
    expect(castCameraDetail(gunshot, 'player').tip).toBeUndefined()
  })

  it.each(BODYGUARD_FIREARMS)(
    '%s retains the weapon after actual Steal Chain or Skill Hunter seals',
    (id) => {
      const base = duel(id)
      const seal = { owner: 'opponent' as const, moveId: `${id}:neutralSpecial` }
      for (const stolen of [{ stolenChainAbility: seal }, { skillHunterStolen: [seal] }]) {
        const state = { ...base, player: { ...base.player, ...stolen } }
        expect(performAttack(state, 'player', 'ranged').player.attack).toMatchObject({
          kind: 'ranged',
          hatsuSource: null,
        })
      }
      const jailed = {
        ...base,
        player: { ...base.player, chainJail: { owner: 'opponent' as const, x: 30, y: 0 } },
      }
      expect(performAttack(jailed, 'player', 'ranged').player.attack).toBeNull()
    },
  )

  it('adjusts the physical release height when Biscuit reveals her natural body', () => {
    const base = duel('biscuit')
    const natural = { ...base, player: { ...base.player, biscuitTrueForm: true } }
    const compactShot = advance(performAttack(base, 'player', 'ranged'), 11).projectiles[0]
    const naturalShot = advance(performAttack(natural, 'player', 'ranged'), 11).projectiles[0]
    expect(compactShot.y).toBeLessThan(naturalShot.y)
    expect(compactShot).toMatchObject({ matter: 'object', shape: 'bullet', nenPower: 1 })
    expect(naturalShot).toMatchObject({ matter: 'object', shape: 'bullet', nenPower: 1 })
  })

  it('keeps the physical weapon with Hanzo’s body and respects death, stun and recovery', () => {
    const base = duel('bill')
    for (const changes of [{ health: 0 }, { hitStun: 60 }, { knockdownFrames: 60 }]) {
      const state = { ...base, player: { ...base.player, ...changes } }
      expect(performAttack(state, 'player', 'ranged').player.attack).toBeNull()
    }
    const armed = performAttack(base, 'player', 'ranged')
    expect(performAttack(armed, 'player', 'ranged').player.attack?.frame).toBe(0)
    const hanzo = performAttack(duel('hanzo'), 'player', 'special')
    const projected = advance(hanzo, 40)
    expect(projected.player.hanzoProjection).toBeDefined()
    expect(performAttack(projected, 'player', 'ranged').player.attack?.kind).not.toBe('ranged')
  })

  it.each(BODYGUARD_FIREARMS.filter((id) => id !== 'theta'))(
    '%s visibly draws a physical weapon and holsters it between shots',
    (id) => {
      const state = duel(id)
      const fighter = state.player
      const model = buildFightFigure({
        THREE,
        glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
        fighter,
      })
      const gun = model.root.getObjectByName(`${id}-handgun`)!
      const holster = model.root.getObjectByName(`${id}-holstered-handgun`)!
      expect(gun.parent?.name).toBe(id === 'kurapika' ? 'hand-left' : 'hand-right')
      animateServiceHandgun(model.turns, fighter)
      expect(gun.visible).toBe(false)
      expect(holster.visible).toBe(true)
      const armed = performAttack(state, 'player', 'ranged').player
      const firing = {
        ...armed,
        attack: { ...armed.attack!, frame: attackData('ranged', armed).startup },
      }
      animateServiceHandgun(model.turns, firing)
      expect(gun.visible).toBe(true)
      expect(holster.visible).toBe(false)
      expect(model.root.getObjectByName(`${id}-muzzle-flash`)?.visible).toBe(true)
      animateServiceHandgun(model.turns, fighter)
      expect(gun.visible).toBe(false)
    },
  )
})
