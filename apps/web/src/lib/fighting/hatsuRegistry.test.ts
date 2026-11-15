import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import {
  consumeHatsuAvoidance,
  hatsuAvoidsImpact,
  hatsuDamageFactor,
  hatsuDefenceFactor,
} from './hatsu'
import { hatsuFor } from './hatsu/registry'
import { EMPTY_INPUT, type FightState } from './types'

function advance(state: FightState, seconds: number): FightState {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, EMPTY_INPUT, 0.02)
  }
  return next
}

function closeFight(
  player: Parameters<typeof createFight>[0],
  opponent: Parameters<typeof createFight>[1],
) {
  const state = beginFight(createFight(player, opponent))
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 54, aura: 100, hitStun: 90 },
  }
}

describe('fighter Hatsu registry', () => {
  it('forces Judgment Chain targets into Zetsu', () => {
    const struck = advance(
      performAttack(closeFight('kurapika', 'hisoka'), 'player', 'special'),
      0.5,
    )
    expect(struck.opponent.hatsuEffects.forcedZetsuFrames).toBeGreaterThan(0)
    expect(struck.opponent.nen.mode).toBe('zetsu')
  })

  it('lets Skill Hunter replay the last Hatsu received', () => {
    let state = advance(performAttack(closeFight('kurapika', 'chrollo'), 'player', 'special'), 0.5)
    expect(state.opponent.hatsuEffects.lastHatsuReceived).toBe('kurapika')
    state = {
      ...state,
      player: { ...state.player, x: 42, hitStun: 90 },
      opponent: {
        ...state.opponent,
        x: 54,
        aura: 100,
        nen: createFight('chrollo', 'kurapika').player.nen,
        attack: null,
        hitStun: 0,
        blockStun: 0,
        hatsuEffects: { ...state.opponent.hatsuEffects, forcedZetsuFrames: 0 },
      },
    }
    const copied = advance(performAttack(state, 'opponent', 'special'), 0.6)
    expect(copied.player.hatsuEffects.forcedZetsuFrames).toBeGreaterThan(0)
  })

  it('stacks Contagion and drains aura', () => {
    const ready = closeFight('morena', 'hisoka')
    const struck = advance(performAttack(ready, 'player', 'special'), 0.6)
    expect(struck.opponent.hatsuEffects.contagionStacks).toBe(1)
    expect(struck.opponent.aura).toBeLessThan(ready.opponent.aura)
  })

  it('stores Benjamin Baton power for the next normal hit', () => {
    let state = advance(performAttack(closeFight('benjamin', 'hisoka'), 'player', 'special'), 0.6)
    expect(state.player.hatsuEffects.batonCharges).toBe(1)
    state = {
      ...state,
      player: { ...state.player, x: 46, attack: null, hitStun: 0, blockStun: 0 },
      opponent: { ...state.opponent, x: 52, hitStun: 90 },
    }
    const spent = advance(performAttack(state, 'player', 'light'), 0.2)
    expect(spent.player.hatsuEffects.batonCharges).toBe(0)
  })

  it('uses Parallel Future to erase the next incoming hit', () => {
    let state = closeFight('tserriednich', 'hisoka')
    state = { ...state, opponent: { ...state.opponent, hitStun: 0 } }
    state = performAttack(state, 'player', 'special')
    expect(state.player.hatsuEffects.futureSight).toBe(1)
    state = performAttack(state, 'opponent', 'light')
    const avoided = advance(state, 0.2)
    expect(avoided.impact).toMatchObject({ attacker: 'opponent', avoided: true, damage: 0 })
    expect(avoided.player.health).toBe(100)
    expect(avoided.player.hatsuEffects.futureSight).toBe(0)
  })

  it('powers Rising Sun with the damage Feitan has suffered', () => {
    const ready = performAttack(closeFight('feitan', 'hisoka'), 'player', 'special')
    const healthy = hatsuDamageFactor(ready.player)
    const wounded = hatsuDamageFactor({ ...ready.player, health: 20 })
    expect(wounded).toBeGreaterThan(healthy * 2)
  })

  it('lets Three Monkeys seal all senses after three strikes', () => {
    let state = closeFight('saiyu', 'hisoka')
    for (let strike = 0; strike < 3; strike += 1) {
      state = hatsuFor('saiyu').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'saiyu',
        blocked: false,
        concealed: false,
      })
    }
    expect(state.opponent.hatsuEffects.senseSeals).toBe(3)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBeGreaterThan(0)
  })

  it('combines Black Voice control with Sun and Moon detonation', () => {
    const impact = hatsuFor('chrollo').onImpact
    let state = impact({
      state: closeFight('chrollo', 'hisoka'),
      side: 'player',
      defenderSide: 'opponent',
      source: 'chrollo',
      blocked: false,
      concealed: false,
    })
    expect(state.opponent.hatsuEffects.manipulatedFrames).toBeGreaterThan(0)
    const markedHealth = state.opponent.health
    state = impact({
      state,
      side: 'player',
      defenderSide: 'opponent',
      source: 'chrollo',
      blocked: false,
      concealed: false,
    })
    expect(state.opponent.health).toBe(markedHealth - 24)
    expect(state.opponent.hatsuEffects.sunMoonMarks).toBe(0)
  })

  it('makes Theta suppress aura with her projectile', () => {
    const ready = closeFight('theta', 'hisoka')
    const struck = hatsuFor('theta').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'theta',
      blocked: false,
      concealed: false,
    })
    expect(struck.opponent.aura).toBe(ready.opponent.aura - 18)
    expect(struck.opponent.hatsuEffects.forcedZetsuFrames).toBe(90)
  })

  it('reinforces Biscuit through Body Transformation', () => {
    const transformed = hatsuFor('biscuit').onTrigger({
      state: closeFight('biscuit', 'hisoka'),
      side: 'player',
      source: 'biscuit',
    })
    expect(hatsuDamageFactor(transformed.player)).toBeGreaterThan(1)
    expect(hatsuDefenceFactor(transformed.player)).toBeLessThan(1)
  })

  it('uses Room 1013 Isolation to erase the next incoming hit', () => {
    let state = closeFight('marayam', 'hisoka')
    state = {
      ...state,
      opponent: { ...state.opponent, hitStun: 0 },
    }
    state = hatsuFor('marayam').onTrigger({ state, side: 'player', source: 'marayam' })
    state = performAttack(state, 'opponent', 'light')
    const avoided = advance(state, 0.2)
    expect(avoided.impact).toMatchObject({ attacker: 'opponent', avoided: true, damage: 0 })
    expect(avoided.player.health).toBe(100)
    expect(avoided.player.hatsuEffects.isolationFrames).toBe(0)
  })

  it('stores missed Ripper Cyclotron rotations until Phinks connects', () => {
    const trigger = hatsuFor('phinks').onTrigger
    let state = trigger({ state: closeFight('phinks', 'hisoka'), side: 'player', source: 'phinks' })
    state = trigger({ state, side: 'player', source: 'phinks' })
    expect(state.player.hatsuEffects.cyclotronTurns).toBe(2)
    expect(hatsuDamageFactor(state.player)).toBeGreaterThan(1.4)
    state = hatsuFor('phinks').onImpact({
      state,
      side: 'player',
      defenderSide: 'opponent',
      source: 'phinks',
      blocked: false,
      concealed: false,
    })
    expect(state.player.hatsuEffects.cyclotronTurns).toBe(0)
  })

  it('adds Franklin’s machine-gun barrage to a confirmed hit', () => {
    const ready = closeFight('franklin', 'hisoka')
    const struck = hatsuFor('franklin').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'franklin',
      blocked: false,
      concealed: false,
    })
    expect(struck.opponent.health).toBe(ready.opponent.health - 10)
  })

  it('lets Machi and Illumi immobilize a target in distinct ways', () => {
    const ready = closeFight('machi', 'hisoka')
    const stitched = hatsuFor('machi').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'machi',
      blocked: false,
      concealed: false,
    })
    const needled = hatsuFor('illumi').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'illumi',
      blocked: false,
      concealed: false,
    })
    expect(stitched.opponent.hatsuEffects.stitchedFrames).toBe(90)
    expect(needled.opponent.hatsuEffects.needleFrames).toBe(120)
    expect(needled.opponent.aura).toBeLessThan(ready.opponent.aura)
  })

  it('converges Kalluto’s paper marks on the third strike', () => {
    const impact = hatsuFor('kalluto').onImpact
    let state = closeFight('kalluto', 'hisoka')
    for (let strike = 0; strike < 3; strike += 1) {
      state = impact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'kalluto',
        blocked: false,
        concealed: false,
      })
    }
    expect(state.opponent.health).toBe(82)
    expect(state.opponent.hatsuEffects.serpentMarks).toBe(0)
  })

  it('arms Bonolenov with Battle Cantabile’s attack and armour', () => {
    const state = hatsuFor('bonolenov').onTrigger({
      state: closeFight('bonolenov', 'hisoka'),
      side: 'player',
      source: 'bonolenov',
    })
    expect(hatsuDamageFactor(state.player)).toBeGreaterThan(1)
    expect(hatsuDefenceFactor(state.player)).toBeLessThan(1)
  })

  it('lets Shizuku drain a wounded target with Blinky', () => {
    const ready = closeFight('shizuku', 'hisoka')
    ready.player.health = 70
    const struck = hatsuFor('shizuku').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'shizuku',
      blocked: false,
      concealed: false,
    })
    expect(struck.player.health).toBe(78)
    expect(struck.opponent.health).toBe(92)
    expect(struck.opponent.aura).toBeLessThan(ready.opponent.aura)
  })

  it('turns Hinrigh’s Biohazard into temporary attack and armour', () => {
    const state = hatsuFor('hinrigh').onTrigger({
      state: closeFight('hinrigh', 'hisoka'),
      side: 'player',
      source: 'hinrigh',
    })
    expect(hatsuDamageFactor(state.player)).toBeGreaterThan(1)
    expect(hatsuDefenceFactor(state.player)).toBeLessThan(1)
  })

  it('gives Hanzo’s clone one complete dodge', () => {
    const state = hatsuFor('hanzo').onTrigger({
      state: closeFight('hanzo', 'hisoka'),
      side: 'player',
      source: 'hanzo',
    })
    expect(hatsuAvoidsImpact(state.player)).toBe(true)
    expect(consumeHatsuAvoidance(state.player).hatsuEffects.cloneDodges).toBe(0)
  })

  it('lets Predator analyse and suppress an enemy Hatsu', () => {
    const ready = closeFight('rihan', 'hisoka')
    const struck = hatsuFor('rihan').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'rihan',
      blocked: false,
      concealed: false,
    })
    expect(struck.player.hatsuEffects.predatorFrames).toBe(180)
    expect(struck.opponent.hatsuEffects.forcedZetsuFrames).toBe(180)
  })

  it('applies the second wave’s three distinct control effects', () => {
    const ready = closeFight('mizaistom', 'hisoka')
    const impact = (source: 'mizaistom' | 'zakuro' | 'melody') =>
      hatsuFor(source).onImpact({
        state: ready,
        side: 'player',
        defenderSide: 'opponent',
        source,
        blocked: false,
        concealed: false,
      }).opponent.hatsuEffects
    expect(impact('mizaistom').restrainedFrames).toBe(90)
    expect(impact('zakuro').bloodBoundFrames).toBe(100)
    expect(impact('melody').entrancedFrames).toBe(75)
  })

  it('makes Leorio’s remote fist add a second impact', () => {
    const ready = closeFight('leorio', 'hisoka')
    const struck = hatsuFor('leorio').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'leorio',
      blocked: false,
      concealed: false,
    })
    expect(struck.opponent.health).toBe(92)
    expect(struck.opponent.hitStun).toBe(30)
  })
})
