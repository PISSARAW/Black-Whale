import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import {
  consumeHatsuAvoidance,
  hatsuAvoidsImpact,
  hatsuDamageFactor,
  hatsuDefenceFactor,
  hatsuSourceFor,
  resolveHatsuImpact,
  triggerHatsu,
} from './hatsu'
import { COHORT_WILL_FRAMES } from './hatsu/halkenburg'
import { hatsuFor } from './hatsu/registry'
import { EMPTY_INPUT, type FightProjectile, type FightState } from './types'

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

const SAMPLE_PROJECTILE = {
  id: 0,
  owner: 'opponent',
  fighterId: 'theta',
  x: 50,
  y: 6.1,
  velocityX: -50,
  width: 0.7,
  height: 0.5,
  damage: 8,
  hitstun: 13,
  blockstun: 9,
  hitstop: 5,
  knockback: 2.2,
  targetZone: 'torso',
  shape: 'stone',
  colour: '#81715f',
  age: 0,
  lifetime: 120,
  matter: 'object',
} satisfies FightProjectile

function chrolloStrike(state: FightState, slot: string, blocked = false): FightState {
  return hatsuFor('chrollo').onImpact({
    state,
    side: 'player',
    defenderSide: 'opponent',
    source: 'chrollo',
    moveId: `chrollo:${slot}`,
    blocked,
    concealed: false,
  })
}

describe('fighter Hatsu registry', () => {
  it('lets Chain Jail force only a Phantom Troupe target into Zetsu', () => {
    const struck = advance(
      performAttack(closeFight('kurapika', 'chrollo'), 'player', 'special'),
      0.5,
    )
    expect(struck.opponent.hatsuEffects.forcedZetsuFrames).toBeGreaterThan(0)
    expect(struck.opponent.nen.mode).toBe('zetsu')
  })

  it('lets Skill Hunter steal only a Hatsu Chrollo has seen, with the target on the book', () => {
    const ready = closeFight('chrollo', 'illumi')
    const seen = triggerHatsu(ready, 'opponent', 'illumi')
    expect(seen.player.hatsuEffects.witnessedHatsu).toBe('illumi')

    const stolen = chrolloStrike(seen, 'forwardSpecial')
    expect(stolen.player.hatsuEffects.stolenHatsu).toBe('illumi')
    expect(stolen.opponent.hatsuEffects.hatsuStolen).toBe(1)
    // The owner cannot use an ability while it is held in the book.
    expect(hatsuSourceFor(stolen.opponent)).toBeNull()
    // Only Skill Hunter opens the stolen page; his own techniques stay his.
    expect(hatsuSourceFor(stolen.player, 'chrollo:neutralSpecial')).toBe('illumi')
    expect(hatsuSourceFor(stolen.player, 'chrollo:forwardSpecial')).toBe('chrollo')

    const replayed = resolveHatsuImpact({
      state: stolen,
      side: 'player',
      defenderSide: 'opponent',
      source: 'illumi',
      moveId: 'chrollo:neutralSpecial',
      blocked: false,
      concealed: false,
    })
    expect(replayed.opponent.hatsuEffects.needleFrames).toBeGreaterThan(0)
  })

  it('cannot steal an unseen, blocked or martial ability', () => {
    const unseen = chrolloStrike(closeFight('chrollo', 'illumi'), 'forwardSpecial')
    expect(unseen.player.hatsuEffects.stolenHatsu).toBeNull()

    const seen = triggerHatsu(closeFight('chrollo', 'illumi'), 'opponent', 'illumi')
    const blocked = chrolloStrike(seen, 'forwardSpecial', true)
    expect(blocked.player.hatsuEffects.stolenHatsu).toBeNull()

    const martial = advance(performAttack(closeFight('beyond', 'chrollo'), 'player', 'special'), 1)
    expect(martial.opponent.health).toBeLessThan(100)
    expect(martial.opponent.hatsuEffects.witnessedHatsu).toBeNull()
  })

  it('ties Black Voice to its page and requires both free-hand Sun/Moon contacts', () => {
    const ready = closeFight('chrollo', 'hisoka')
    const voice = {
      ...ready,
      player: {
        ...ready.player,
        chrolloBook: {
          ...ready.player.chrolloBook!,
          page: 1,
        },
      },
    }
    expect(
      chrolloStrike(voice, 'neutralSpecial').opponent.hatsuEffects.manipulatedFrames,
    ).toBeGreaterThan(0)
    expect(chrolloStrike(ready, 'neutralSpecial').opponent.hatsuEffects.manipulatedFrames).toBe(0)
    const sun = chrolloStrike(ready, 'neutralSpecial')
    expect(sun.opponent.hatsuEffects.sunMark).toBe(1)
    expect(chrolloStrike(sun, 'neutralSpecial').opponent.health).toBe(ready.opponent.health)
    const closed = {
      ...sun,
      player: {
        ...sun.player,
        chrolloBook: {
          ...sun.player.chrolloBook!,
          open: false,
          bookmark: 'sun-and-moon' as const,
        },
      },
    }
    const detonated = chrolloStrike(closed, 'finisher')
    expect(detonated.opponent.health).toBe(ready.opponent.health - 24)
    expect(detonated.opponent.hatsuEffects).toMatchObject({ sunMark: 0, moonMark: 0 })
  })

  it('stacks Contagion and drains aura', () => {
    const ready = closeFight('morena', 'hisoka')
    const struck = advance(performAttack(ready, 'player', 'special'), 0.6)
    expect(struck.opponent.hatsuEffects.contagionStacks).toBe(1)
    expect(struck.opponent.aura).toBeLessThan(ready.opponent.aura)
  })

  it('keeps Benjamin’s inherited loadout without a damage-charge bonus', () => {
    const state = advance(performAttack(closeFight('benjamin', 'hisoka'), 'player', 'special'), 0.6)
    expect(state.player.hatsuEffects.baton?.inherited).toEqual([
      'air-blow',
      'secret-window',
      'culdcept',
    ])
    expect(hatsuDamageFactor(state.player)).toBe(1)
  })

  it('requires vulnerable preparation instead of erasing an incoming hit', () => {
    let state = closeFight('tserriednich', 'hisoka')
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52, hitStun: 0 },
    }
    state = performAttack(state, 'player', 'special')
    expect(state.player.nen.mode).toBe('zetsu')
    expect(state.player.parallelEyesClosed).toBe(true)
    const health = state.player.health
    const struck = advance(performAttack(state, 'opponent', 'light'), 0.2)
    expect(struck.player.health).toBeLessThan(health)
    expect(struck.parallelFuture).toBeUndefined()
  })

  it('does not apply a missing-health multiplier to Feitan’s martial attacks', () => {
    const ready = performAttack(closeFight('feitan', 'hisoka'), 'player', 'special')
    const healthy = hatsuDamageFactor(ready.player)
    const wounded = hatsuDamageFactor({ ...ready.player, health: 20 })
    expect(wounded).toBe(healthy)
  })

  it('lets each of Three Monkeys seal its own sense without forcing Zetsu', () => {
    let state = closeFight('saiyu', 'hisoka')
    for (let strike = 0; strike < 3; strike += 1) {
      state = hatsuFor('saiyu').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'saiyu',
        moveId: ['saiyu:neutralSpecial', 'saiyu:forwardSpecial', 'saiyu:downSpecial'][strike],
        blocked: false,
        concealed: false,
      })
    }
    expect(state.opponent.hatsuEffects.senseSeals).toBe(7)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
  })

  it('keeps Theta’s personal Hatsu unknown without draining or sealing Nen', () => {
    const ready = closeFight('theta', 'hisoka')
    const struck = hatsuFor('theta').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'theta',
      blocked: false,
      concealed: false,
    })
    expect(struck).toBe(ready)
    expect(hatsuFor('theta').martialOnly).toBe(true)
  })

  it('keeps Cookie outside the duel and does not expose a stealable Biscuit Hatsu', () => {
    const state = closeFight('biscuit', 'hisoka')
    expect(hatsuFor('biscuit').martialOnly).toBe(true)
    expect(hatsuFor('biscuit').onTrigger({ state, side: 'player', source: 'biscuit' })).toBe(state)
    expect(hatsuSourceFor(state.player, 'biscuit:neutralSpecial')).toBeNull()
  })

  it('uses Room 1013 Isolation to erase the next incoming hit', () => {
    let state = closeFight('marayam', 'hisoka')
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52, hitStun: 0 },
    }
    state = hatsuFor('marayam').onTrigger({ state, side: 'player', source: 'marayam' })
    state = performAttack(state, 'opponent', 'light')
    const avoided = advance(state, 0.2)
    expect(avoided.impact).toMatchObject({ attacker: 'opponent', avoided: true, damage: 0 })
    expect(avoided.player.health).toBe(100)
    expect(avoided.player.hatsuEffects.isolationFrames).toBe(0)
  })

  it('never creates Cyclotron rotations or a global damage bonus through a carrier hook', () => {
    const base = closeFight('phinks', 'hisoka')
    const triggered = hatsuFor('phinks').onTrigger({
      state: base,
      side: 'player',
      source: 'phinks',
    })
    expect(triggered).toBe(base)
    expect(triggered.player.hatsuEffects.cyclotronTurns).toBe(0)
    base.player.hatsuEffects.cyclotronTurns = 15
    expect(hatsuDamageFactor(base.player)).toBe(1)
  })

  it('does not add invisible damage on top of Franklin’s travelling bullets', () => {
    const ready = closeFight('franklin', 'hisoka')
    const struck = hatsuFor('franklin').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'franklin',
      blocked: false,
      concealed: false,
    })
    expect(struck).toBe(ready)
  })

  it('lets Machi and Illumi immobilize a target in distinct ways', () => {
    const ready = closeFight('machi', 'hisoka')
    const stitched = hatsuFor('machi').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'machi',
      moveId: 'machi:downSpecial',
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
    expect(stitched.opponent.machiThread).toMatchObject({ owner: 'player', kind: 'bind' })
    expect(stitched.opponent.hitStun).toBe(ready.opponent.hitStun)
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

  it('never lets Blinky drain a living target', () => {
    const ready = closeFight('shizuku', 'hisoka')
    const struck = hatsuFor('shizuku').onImpact({
      state: { ...ready, player: { ...ready.player, health: 70 } },
      side: 'player',
      defenderSide: 'opponent',
      source: 'shizuku',
      blocked: false,
      concealed: false,
    })
    expect(struck.player.health).toBe(70)
    expect(struck.opponent.health).toBe(ready.opponent.health)
    expect(struck.opponent.aura).toBe(ready.opponent.aura)
  })

  it('lets Blinky swallow incoming objects but never Nen constructs', () => {
    const ready = closeFight('shizuku', 'theta')
    const shot = (id: number, x: number, matter: FightProjectile['matter']) => ({
      ...SAMPLE_PROJECTILE,
      id,
      x,
      matter,
    })
    const armed = hatsuFor('shizuku').onTrigger({
      state: {
        ...ready,
        projectiles: [
          shot(1, ready.player.x + 6, 'object'),
          shot(2, ready.player.x + 6, 'nen'),
          shot(3, ready.player.x + 40, 'object'),
        ],
      },
      side: 'player',
      source: 'shizuku',
    })
    expect(armed.player.hatsuEffects.blinkyFrames).toBeGreaterThan(0)
    const cleaned = hatsuFor('shizuku').onFrame(armed)
    expect(cleaned.projectiles.map((projectile) => projectile.id)).toEqual([2, 3])
    expect(cleaned.player.hatsuEffects.blinkyFrames).toBe(
      armed.player.hatsuEffects.blinkyFrames - 1,
    )
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

  it('never stuns Hinrigh with his own Biohazard', () => {
    const triggered = hatsuFor('hinrigh').onTrigger({
      state: closeFight('hinrigh', 'hisoka'),
      side: 'player',
      source: 'hinrigh',
    })
    const ticked = hatsuFor('hinrigh').onFrame(triggered)
    expect(ticked.player.hatsuEffects.biohazardFrames).toBe(89)
    expect(ticked.player.hitStun).toBe(0)

    let fight = performAttack(closeFight('hinrigh', 'hisoka'), 'player', 'special')
    fight = advance(fight, 1.2)
    expect(fight.player.hatsuEffects.biohazardFrames).toBeGreaterThan(0)
    expect(fight.player.hitStun).toBe(0)
    expect(fight.player.pose).not.toBe('hit')
  })

  it('leaves Hanzo’s sleeping body vulnerable during projection', () => {
    const state = hatsuFor('hanzo').onTrigger({
      state: closeFight('hanzo', 'hisoka'),
      side: 'player',
      source: 'hanzo',
    })
    expect(state.player.hanzoProjection?.bodyX).toBe(state.player.x)
    expect(hatsuAvoidsImpact(state.player)).toBe(false)
  })

  it('never turns a Predator carrier hit into suppression or a defence buff', () => {
    const ready = closeFight('rihan', 'hisoka')
    const struck = hatsuFor('rihan').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'rihan',
      blocked: false,
      concealed: false,
    })
    expect(struck).toBe(ready)
    expect(struck.player.predator).toBeUndefined()
    expect(struck.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
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
    expect(impact('melody').entrancedFrames).toBe(0)
  })

  it('does not add automatic damage or stun to Leorio’s contact hits', () => {
    const ready = closeFight('leorio', 'hisoka')
    const struck = hatsuFor('leorio').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'leorio',
      blocked: false,
      concealed: false,
    })
    expect(struck).toBe(ready)
  })

  it('does not turn Basho’s poem into an automatic reinforcement bonus', () => {
    const state = closeFight('basho', 'hisoka')
    const triggered = hatsuFor('basho').onTrigger({ state, side: 'player', source: 'basho' })
    expect(triggered).toBe(state)
    expect(hatsuDamageFactor(triggered.player)).toBe(1)
  })

  it('gives Luini one defensive counter', () => {
    const state = hatsuFor('luini').onTrigger({
      state: closeFight('luini', 'hisoka'),
      side: 'player',
      source: 'luini',
    })
    expect(hatsuAvoidsImpact(state.player)).toBe(true)
    expect(hatsuAvoidsImpact(consumeHatsuAvoidance(state.player))).toBe(false)
  })

  it('keeps Cat’s Name dormant until Camilla is killed', () => {
    const ready = closeFight('camilla', 'hisoka')
    expect(hatsuSourceFor(ready.player)).toBeNull()
    const triggered = hatsuFor('camilla').onTrigger({
      state: ready,
      side: 'player',
      source: 'camilla',
    })
    expect(triggered).toBe(ready)
    expect(hatsuAvoidsImpact(triggered.player)).toBe(false)
  })

  it('lets Cat’s Name revive Camilla and kill her direct killer', () => {
    const killing = (formatId: 'knockout' | 'heavens-arena') => {
      const state = beginFight(createFight('hisoka', 'camilla', formatId))
      return advance(
        performAttack(
          {
            ...state,
            player: { ...state.player, x: 44 },
            opponent: { ...state.opponent, x: 52, health: 1, hitStun: 90 },
          },
          'player',
          'heavy',
        ),
        2.7,
      )
    }
    const killed = killing('knockout')
    expect(killed.phase).toBe('finished')
    expect(killed.winner).toBe('opponent')
    expect(killed.opponent.health).toBeGreaterThan(0)
    expect(killed.player.health).toBe(0)

    // Points formats never kill: no death, no cat.
    const scored = killing('heavens-arena')
    expect(scored.opponent.health).toBeGreaterThan(0)
    expect(scored.winner).not.toBe('opponent')
  })

  it('fires Grimmel only once the cohort’s will is gathered', () => {
    const halkenburg = hatsuFor('halkenburg')
    const ready = closeFight('halkenburg', 'hisoka')
    const shoot = (state: FightState, blocked: boolean) =>
      halkenburg.onImpact({
        state: halkenburg.onTrigger({ state, side: 'player', source: 'halkenburg' }),
        side: 'player',
        defenderSide: 'opponent',
        source: 'halkenburg',
        blocked,
        concealed: false,
      })

    // Without the cohort's will, the special is an ordinary strike.
    const early = shoot(ready, false)
    expect(early.opponent.hatsuEffects.possessedFrames).toBe(0)
    expect(early.player.health).toBe(ready.player.health)

    let gathered = ready
    for (let frame = 0; frame < COHORT_WILL_FRAMES; frame += 1)
      gathered = halkenburg.onFrame(gathered)
    expect(gathered.player.hatsuEffects.cohortWillFrames).toBe(COHORT_WILL_FRAMES)
    expect(gathered.opponent.hatsuEffects.cohortWillFrames).toBe(0)

    // The arrow pierces the guard, takes the body over, and costs Halkenburg.
    const struck = shoot(gathered, true)
    expect(struck.opponent.hatsuEffects.possessedFrames).toBeGreaterThan(0)
    expect(struck.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(struck.player.health).toBeLessThan(ready.player.health)
    expect(struck.player.hatsuEffects.cohortWillFrames).toBe(0)
    expect(halkenburg.onFrame(struck).opponent.hitStun).toBeGreaterThan(0)
  })

  it('keeps Gel’s arm free of added effects while Lynch exposes the target’s soul', () => {
    const ready = closeFight('gel', 'hisoka')
    const struck = hatsuFor('gel').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'gel',
      blocked: false,
      concealed: false,
    })
    const exposed = hatsuFor('lynch').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'lynch',
      blocked: false,
      concealed: false,
    })
    expect(struck).toBe(ready)
    expect(hatsuDefenceFactor(exposed.opponent)).toBeGreaterThan(1)
  })

  it('turns Zhang Lei’s coins into a scaling buff', () => {
    let coins = closeFight('zhanglei', 'hisoka')
    for (let charge = 0; charge < 3; charge += 1) {
      coins = hatsuFor('zhanglei').onTrigger({ state: coins, side: 'player', source: 'zhanglei' })
    }
    expect(hatsuDamageFactor(coins.player)).toBeGreaterThan(1.2)
    expect(hatsuDefenceFactor(coins.player)).toBeLessThan(1)
  })

  it('keeps fighters whose canon Hatsu cannot act in a duel purely martial', () => {
    for (const id of ['cluck', 'beyond', 'sayird'] as const) {
      const ready = closeFight(id, 'hisoka')
      const hatsu = hatsuFor(id)
      const triggered = hatsu.onTrigger({ state: ready, side: 'player', source: id })
      const impacted = hatsu.onImpact({
        state: ready,
        side: 'player',
        defenderSide: 'opponent',
        source: id,
        blocked: false,
        concealed: false,
      })
      expect(hatsu.martialOnly).toBe(true)
      expect(hatsuSourceFor(ready.player)).toBeNull()
      expect(triggered).toBe(ready)
      expect(impacted).toBe(ready)
      expect(hatsu.onFrame(ready)).toBe(ready)
    }
  })

  it('gives Fugetsu and Kacho one protected passage', () => {
    for (const source of ['fugetsu', 'kacho'] as const) {
      const state = hatsuFor(source).onTrigger({
        state: closeFight(source, 'hisoka'),
        side: 'player',
        source,
      })
      expect(hatsuAvoidsImpact(state.player)).toBe(true)
      expect(hatsuAvoidsImpact(consumeHatsuAvoidance(state.player))).toBe(false)
    }
  })

  it('distinguishes Desire Trap, Are You Free and aura smoke', () => {
    const ready = closeFight('luzurus', 'hisoka')
    const effect = (source: 'luzurus' | 'momoze' | 'salesale') =>
      hatsuFor(source).onImpact({
        state: ready,
        side: 'player',
        defenderSide: 'opponent',
        source,
        blocked: false,
        concealed: false,
      }).opponent.hatsuEffects
    expect(effect('luzurus').desireFrames).toBe(90)
    expect(effect('momoze').momozeFrames).toBe(120)
    expect(effect('salesale').smokeFrames).toBe(180)
  })

  it('cannot summon LSDF outside Morena’s occupied hideout', () => {
    const ready = closeFight('yokotani', 'hisoka')
    const state = hatsuFor('yokotani').onTrigger({
      state: ready,
      side: 'player',
      source: 'yokotani',
    })
    expect(state).toBe(ready)
    expect(hatsuAvoidsImpact(state.player)).toBe(false)
  })

  it('applies the remaining curse, contract and support effects', () => {
    const ready = closeFight('gidal', 'hisoka')
    const curse = hatsuFor('gidal').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'gidal',
      blocked: false,
      concealed: false,
    })
    const contract = hatsuFor('longhi').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'longhi',
      blocked: false,
      concealed: false,
    })
    const synthesis = hatsuFor('tubeppa').onTrigger({
      state: closeFight('tubeppa', 'hisoka'),
      side: 'player',
      source: 'tubeppa',
    })
    expect(curse.opponent.hatsuEffects.gidalCurseFrames).toBe(240)
    expect(contract).toBe(ready)
    expect(hatsuDefenceFactor(synthesis.player)).toBeLessThan(1)
  })

  it('arms Padaille and grants Voconte a tactical dodge', () => {
    const armed = hatsuFor('padaille').onTrigger({
      state: closeFight('padaille', 'hisoka'),
      side: 'player',
      source: 'padaille',
    })
    expect(hatsuDamageFactor(armed.player)).toBeGreaterThan(1)
    for (const source of ['voconte'] as const) {
      const state = hatsuFor(source).onTrigger({
        state: closeFight(source, 'hisoka'),
        side: 'player',
        source,
      })
      expect(hatsuAvoidsImpact(state.player)).toBe(true)
    }
  })
})
