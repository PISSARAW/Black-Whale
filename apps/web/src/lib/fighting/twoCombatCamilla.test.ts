import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack } from './engine'
import { advanceCatsName, CATS_NAME_FRAMES } from './camillaCat'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { exposedBlinkyWounds } from './blinky'
import { camillaRounds, CAMILLA_MAGAZINE_ROUNDS, spendCamillaRound } from './camillaWeapon'
import { canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { attackData } from './frameData'

it('Camilla revives with healed physical wounds, without receiving fresh aura or equipment', () => {
  const base = beginFight(
    createFight('camilla', 'musse', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const dead = {
    ...base,
    player: {
      ...base.player,
      health: 0,
      openWounds: 3,
      aura: 7,
      camillaRounds: 0,
      weaponsConfiscated: true,
      gumWoundSeals: 1,
      pluggingWounds: true,
    },
  }
  let state = resolveFightOutcome(
    recordFightDeath(dead, { victimSide: 'player', killerSide: 'opponent', cause: 'projectile' }),
  )
  expect(state.catsName).toBeDefined()
  for (let i = 0; i < CATS_NAME_FRAMES; i++) state = advanceCatsName(state)
  expect(state.player.health).toBe(state.player.maxHealth)
  expect(state.player.openWounds).toBe(0)
  expect(exposedBlinkyWounds(state.player)).toBe(0)
  expect(state.player.pluggingWounds).toBe(false)
  expect(state.player.gumWoundSeals).toBeUndefined()
  expect(state.player.aura).toBe(7)
  expect(state.player.weaponsConfiscated).toBe(true)
  expect(camillaRounds(state.player)).toBe(0)
})

describe('Camilla’s shown counter and the unresolved chapter 416 threat', () => {
  it('spends a finite physical round only on release, including misses, without aura or an automatic reload', () => {
    const base = beginFight(
      createFight('camilla', 'musse', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const start = {
      ...base,
      player: {
        ...base.player,
        aura: 0,
        x: 15,
        camillaRounds: 1,
        nen: { ...base.player.nen, mode: 'zetsu' as const },
      },
      opponent: { ...base.opponent, x: 90 },
    }
    const preparing = performAttack(start, 'player', 'ranged')
    expect(camillaRounds(preparing.player)).toBe(1)
    expect(camillaRounds(spawnRangedProjectiles(preparing).player)).toBe(1)
    const active = {
      ...preparing,
      player: {
        ...preparing.player,
        attack: {
          ...preparing.player.attack!,
          frame: attackData('ranged', preparing.player).startup,
        },
      },
    }
    const fired = spawnRangedProjectiles(active)
    expect(fired.projectiles).toHaveLength(1)
    expect(fired.projectiles[0].matter).toBe('object')
    expect(camillaRounds(fired.player)).toBe(0)
    expect(fired.player.aura).toBe(0)
    expect(spawnRangedProjectiles(fired).projectiles).toHaveLength(1)
    expect(canUseRangedAttack(fired.player)).toBe(false)
    const empty = { ...fired, player: { ...fired.player, attack: null } }
    expect(performAttack(empty, 'player', 'ranged')).toBe(empty)
    expect(
      spawnRangedProjectiles({ ...active, player: { ...active.player, camillaRounds: 0 } })
        .projectiles,
    ).toHaveLength(0)
    expect(camillaRounds(nextRound({ ...empty, phase: 'finished', winner: 'player' }).player)).toBe(
      CAMILLA_MAGAZINE_ROUNDS,
    )
    const copy = { ...base.player, id: 'camilla' as const, nenOwner: 'kurapika' as const }
    expect(spendCamillaRound(copy)).toBe(copy)
  })
  it('does not fabricate a living murderer for an unattributed death', () => {
    const base = beginFight(
      createFight('camilla', 'benjamin', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const dead = { ...base, player: { ...base.player, health: 0 } }
    const state = resolveFightOutcome(
      recordFightDeath(dead, { victimSide: 'player', killerSide: null, cause: 'strike' }),
    )
    expect(state.catsName).toBeUndefined()
    expect(state.player.health).toBe(0)
  })
  it('does not close wounds for nonlethal injuries', () => {
    const base = beginFight(
      createFight('camilla', 'musse', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const wounded = { ...base, player: { ...base.player, health: 1, openWounds: 2 } }
    const state = resolveFightOutcome(wounded)
    expect(state.player.health).toBe(1)
    expect(state.player.openWounds).toBe(2)
    expect(state.catsName).toBeUndefined()
  })
})
