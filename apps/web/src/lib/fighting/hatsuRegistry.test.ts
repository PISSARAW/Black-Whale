import { performArsenalCommand } from './retrospectiveArsenal'

import { performHunterInterview } from './skillHunterAcquisition'
import { describe, expect, it } from 'vitest'
import { performAttack } from './engine'
import {
  hatsuDamageFactor,
  hatsuDefenceFactor,
  hatsuSourceFor,
  resolveHatsuImpact,
  triggerHatsu,
} from './hatsu'

import { hatsuFor } from './hatsu/registry'

import { advance, closeFight, chrolloStrike } from './hatsuRegistryTestSetup'

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
    ready.opponent = { ...ready.opponent, x: 47, hitStun: 0 }
    const seen = triggerHatsu(ready, 'opponent', 'illumi')
    expect(seen.player.hatsuEffects.witnessedHatsu).toBe('illumi')

    const asked = performHunterInterview(seen, 'player', { action: 'hunter-ask' })
    const answered = performHunterInterview(asked, 'opponent', { action: 'hunter-answer' })
    const stolen = chrolloStrike(answered, 'forwardSpecial')
    expect(stolen.player.hatsuEffects.stolenHatsu).toBe('illumi')
    expect(stolen.opponent.skillHunterStolen).toEqual([
      { owner: 'player', moveId: 'illumi:neutralSpecial' },
    ])
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
    expect(replayed.opponent.needlePuppet).toBeUndefined()
  })

  it('cannot steal an unseen, blocked or martial ability', () => {
    const unseen = chrolloStrike(closeFight('chrollo', 'illumi'), 'forwardSpecial')
    expect(unseen.player.hatsuEffects.stolenHatsu).toBeNull()

    const seen = triggerHatsu(closeFight('chrollo', 'illumi'), 'opponent', 'illumi')
    const blocked = chrolloStrike(seen, 'forwardSpecial', true)
    expect(blocked.player.hatsuEffects.stolenHatsu).toBeNull()

    const martial = advance(performAttack(closeFight('beyond', 'chrollo'), 'player', 'special'), 1)
    expect(martial.opponent.health).toBeLessThan(martial.opponent.maxHealth)
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
    const armed = performArsenalCommand(voice, 'player', { action: 'voice-arm' })
    const planted = chrolloStrike(armed, 'neutralSpecial')
    const phone = performArsenalCommand(planted, 'player', { action: 'voice-phone' })
    const ordered = performArsenalCommand(phone, 'player', {
      action: 'voice-stay',
      target: 'opponent',
    })
    expect(ordered.opponent.blackVoiceControl?.active).toBe(true)
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
    expect(avoided.player.health).toBe(avoided.player.maxHealth)
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

  it('keeps sutures and skull needles out of generic carrier hooks', () => {
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
    expect(needled.opponent.needlePuppet).toBeUndefined()
    expect(needled.opponent.aura).toBe(ready.opponent.aura)
  })

  it('never creates explosive Kalluto marks on generic impacts', () => {
    const state = closeFight('kalluto', 'hisoka')
    const impact = hatsuFor('kalluto').onImpact
    let next = state
    for (let strike = 0; strike < 3; strike += 1)
      next = impact({
        state: next,
        side: 'player',
        defenderSide: 'opponent',
        source: 'kalluto',
        blocked: false,
        concealed: false,
      })
    expect(next).toBe(state)
    expect(next.opponent.plantedPaper).toBeUndefined()
  })

  it('never substitutes generic attack or defence bonuses for Bonolenov’s danced pieces', () => {
    const state = hatsuFor('bonolenov').onTrigger({
      state: closeFight('bonolenov', 'hisoka'),
      side: 'player',
      source: 'bonolenov',
    })
    expect(state.player.battleCantabile).toBeUndefined()
    expect(hatsuDamageFactor(state.player)).toBe(1)
    expect(hatsuDefenceFactor(state.player)).toBe(1)
  })

  it('never lets a Blinky contact hit drain aura or heal its user', () => {
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
})
