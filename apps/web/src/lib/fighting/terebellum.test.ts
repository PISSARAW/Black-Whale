import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { resolveFightImpacts } from './combatImpact'
import { attackData, otherSide } from './frameData'
import { hatsuAvoidsImpact, triggerHatsu } from './hatsu'
import { sweetHomeContacts } from './sweetHomeContacts'
import { finisherReady } from './movesets'
import { projectileProfile, type ProjectileHit } from './projectiles'
import { EMPTY_INPUT, type FightSide, type FightState, type MoveSlot } from './types'

function close(owner: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      owner === 'player' ? 'terebellum' : 'hisoka',
      owner === 'opponent' ? 'terebellum' : 'hisoka',
      'knockout',
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}

function activate(state: FightState, side: FightSide, moveId?: string): FightState {
  const next = performAuraAttack({
    state,
    side,
    kind: moveId ? 'special' : 'light',
    moveId: moveId ?? `${state[side].id}:standingLight`,
    auraCharged: false,
  })
  const fighter = next[side]
  return {
    ...next,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, frame: attackData(fighter.attack!.kind, fighter).startup },
    },
  }
}

function stance(
  state: FightState,
  side: FightSide = 'player',
  slot: MoveSlot = 'neutralSpecial',
): FightState {
  const next = activate(state, side, `${state[side].id}:${slot}`)
  // The physical carrier has already resolved; its hands are still in their active pose.
  return { ...next, [side]: { ...next[side], attack: { ...next[side].attack!, impacted: true } } }
}

function withoutHatsu(state: FightState, owner: FightSide): FightState {
  return {
    ...state,
    [owner]: { ...state[owner], attack: { ...state[owner].attack!, hatsuSource: null } },
  }
}

function shot(state: FightState, owner: FightSide): ProjectileHit {
  const profile = projectileProfile(state[owner].id)
  const target = otherSide(owner)
  return {
    defenderSide: target,
    position: { x: state[target].x, y: 7 },
    projectile: {
      ...profile,
      id: 1,
      owner,
      fighterId: state[owner].id,
      x: state[target].x,
      y: 7,
      velocityX: 0,
      targetZone: 'torso',
      age: 1,
      lifetime: 90,
    },
  }
}

describe('Sweet Home damage transfer', () => {
  it('does not grant an avoidance charge on activation', () => {
    const state = triggerHatsu(close(), 'player', 'terebellum')
    expect(hatsuAvoidsImpact(state.player)).toBe(false)
    expect(sweetHomeContacts(state, 'player')).toBeNull()
  })

  it.each(['player', 'opponent'] as const)(
    'transfers the owner’s wound with only the left hand (%s)',
    (owner) => {
      const attacker = otherSide(owner)
      const ready = activate(stance(close(owner), owner), attacker)
      const control = resolveFightImpacts(withoutHatsu(ready, owner), [])
      const next = resolveFightImpacts(ready, [])
      const damage = control.impact!.damage
      expect(control[owner].health).toBe(100 - damage)
      expect(sweetHomeContacts(ready, owner)).toEqual({ right: null, left: attacker })
      expect(next[owner].health).toBe(100)
      expect(next[owner].hitStun).toBe(0)
      expect(next[attacker].health).toBe(100 - damage)
      expect(next[attacker].hitStun).toBeGreaterThan(0)
      expect(next.impact).toMatchObject({
        damage,
        attacker: owner,
        avoided: false,
        invulnerable: false,
        transfer: { owner, from: owner, to: attacker, backlash: false },
      })
      expect(next.score[owner]).toBeGreaterThan(0)
      expect(next.score[attacker]).toBe(0)
    },
  )

  it.each(['forwardSpecial', 'downSpecial'] as const)(
    'absorbs an external wound through the right hand (%s)',
    (slot) => {
      const ready = activate(close(), 'player', `terebellum:${slot}`)
      const control = resolveFightImpacts(withoutHatsu(ready, 'player'), [])
      const next = resolveFightImpacts(ready, [])
      expect(next.opponent.health).toBe(100)
      expect(next.player.health).toBe(100 - control.impact!.damage)
      expect(next.score).toEqual({ player: 0, opponent: 0 })
      expect(next.impact).toMatchObject({
        damage: control.impact!.damage,
        avoided: false,
        transfer: {
          owner: 'player',
          from: 'opponent',
          to: 'player',
          backlash: slot === 'downSpecial',
        },
      })
      if (slot === 'downSpecial') expect(next.impact?.zone).toBe('hands')
    },
  )

  it('does not absorb another person’s wound with the left hand', () => {
    const ready = activate(close(), 'player', 'terebellum:neutralSpecial')
    const next = resolveFightImpacts(ready, [])
    expect(next.opponent.health).toBeLessThan(100)
    expect(next.player.health).toBe(100)
    expect(next.impact?.transfer).toBeUndefined()
  })

  it.each(['neutralSpecial', 'backSpecial', 'finisher'] as const)(
    'requires fresh left-hand contact on %s',
    (slot) => {
      const ready = activate(stance(close(), 'player', slot), 'opponent')
      const next = resolveFightImpacts(ready, [])
      expect(next.player.health).toBe(100)
      expect(next.opponent.health).toBeLessThan(100)
    },
  )

  it.each(['distance', 'facing', 'height', 'startup', 'recovery', 'interruption'] as const)(
    'keeps the original wound if contact fails: %s',
    (failure) => {
      const ready = stance(close())
      if (failure === 'distance') ready.player.x = 37
      if (failure === 'facing') ready.player.facing = -1
      if (failure === 'height') ready.opponent.y = 9
      if (failure === 'startup') ready.player.attack!.frame = 0
      if (failure === 'recovery')
        ready.player.attack!.frame += attackData('special', ready.player).active
      if (failure === 'interruption') ready.player.attack = null
      // Projectiles can reach the owner even when the opponent is beyond hand reach.
      const hit = shot(ready, 'opponent')
      const next = resolveFightImpacts(ready, [hit])
      expect(next.player.health).toBeLessThan(100)
      expect(next.opponent.health).toBe(100)
      expect(next.impact?.transfer).toBeUndefined()
    },
  )

  it.each(['zetsu', 'forced-zetsu', 'stolen', 'on-seal', 'stun', 'down'] as const)(
    'cannot transfer with unavailable Nen or hands: %s',
    (reason) => {
      const ready = stance(close())
      if (reason === 'zetsu') ready.player.nen.mode = 'zetsu'
      if (reason === 'forced-zetsu') ready.player.hatsuEffects.forcedZetsuFrames = 1
      if (reason === 'stolen') ready.player.hatsuEffects.hatsuStolen = 1
      if (reason === 'on-seal') ready.player.on = { grudge: 0, sealFrames: 10 }
      if (reason === 'stun') ready.player.hitStun = 2
      if (reason === 'down') ready.player.knockdownFrames = 2
      const next = resolveFightImpacts(ready, [shot(ready, 'opponent')])
      expect(next.player.health).toBeLessThan(100)
      expect(next.impact?.transfer).toBeUndefined()
    },
  )

  it('rechecks the contact for each projectile instead of keeping a prepared target', () => {
    const ready = stance(close())
    const first = resolveFightImpacts(ready, [shot(ready, 'opponent')])
    expect(first.player.health).toBe(100)
    expect(first.impact?.transfer).toBeDefined()
    const separated = { ...first, opponent: { ...first.opponent, x: 80 } }
    const second = resolveFightImpacts(separated, [shot(separated, 'opponent')])
    expect(second.player.health).toBeLessThan(100)
    expect(second.impact?.transfer).toBeUndefined()
  })

  it('checks right-hand contact when an external wound arrives by projectile', () => {
    const ready = stance(close(), 'player', 'downSpecial')
    const hit = shot(ready, 'player')
    const next = resolveFightImpacts(ready, [hit])
    expect(next.opponent.health).toBe(100)
    expect(next.player.health).toBeLessThan(100)
    expect(next.impact?.transfer?.backlash).toBe(true)
    const separated = { ...ready, opponent: { ...ready.opponent, x: 80 } }
    const missed = resolveFightImpacts(separated, [shot(separated, 'player')])
    expect(missed.player.health).toBe(100)
    expect(missed.opponent.health).toBeLessThan(100)
    expect(missed.impact?.transfer).toBeUndefined()
  })

  it('applies the wound once even through the recipient’s Ken and avoidance Hatsu', () => {
    const ready = stance(close())
    ready.opponent.nen.ken = true
    ready.opponent.hatsuEffects.isolationFrames = 1
    const next = resolveFightImpacts(ready, [shot(ready, 'opponent')])
    expect(next.player.health).toBe(100)
    expect(next.opponent.health).toBe(100 - next.impact!.damage)
    expect(next.opponent.hatsuEffects.isolationFrames).toBe(1)
  })

  it('does not transfer damage that was already avoided', () => {
    const ready = stance(close())
    ready.player.hatsuEffects.isolationFrames = 1
    const next = resolveFightImpacts(ready, [shot(ready, 'opponent')])
    expect(next.player.health).toBe(100)
    expect(next.opponent.health).toBe(100)
    expect(next.impact?.transfer).toBeUndefined()
  })

  it('does not bounce recursively when both fighters use Sweet Home', () => {
    const ready = close()
    ready.opponent.id = 'terebellum'
    const linked = stance(stance(ready), 'opponent')
    const next = resolveFightImpacts(linked, [shot(linked, 'opponent')])
    expect(next.player.health).toBe(100)
    expect(next.opponent.health).toBe(100 - next.impact!.damage)
  })

  it('lets Chrollo replay the stolen page with the same contact requirements', () => {
    const ready = close()
    ready.player.id = 'chrollo'
    ready.player.hatsuEffects.stolenHatsu = 'terebellum'
    const linked = stance(ready)
    const next = resolveFightImpacts(linked, [shot(linked, 'opponent')])
    expect(next.player.health).toBe(100)
    expect(next.opponent.health).toBeLessThan(100)
  })

  it('awards the KO to the owner when the recipient of a self-transfer dies', () => {
    const ready = stance(close())
    ready.player.health = 1
    ready.opponent.health = 1
    const next = resolveFightImpacts(ready, [shot(ready, 'opponent')])
    expect(next.player.health).toBe(1)
    expect(next.opponent.health).toBe(0)
    expect(next.winner).toBe('player')
    expect(next.roundsWon).toEqual({ player: 1, opponent: 0 })
  })

  it('can kill the owner through a failed right-hand absorption', () => {
    const ready = stance(close(), 'player', 'downSpecial')
    ready.player.health = 1
    const next = resolveFightImpacts(ready, [shot(ready, 'player')])
    expect(next.player.health).toBe(0)
    expect(next.opponent.health).toBe(100)
    expect(next.winner).toBe('opponent')
  })

  it('credits the actual recipient in Tower scoring without inventing a knockdown', () => {
    const ready = stance(close())
    ready.formatId = 'heavens-arena'
    ready.score.player = 9
    const next = resolveFightImpacts(ready, [shot(ready, 'opponent')])
    expect(next.score).toEqual({ player: 10, opponent: 0 })
    expect(next.knockdowns).toEqual({ player: 0, opponent: 0 })
    expect(next.winner).toBe('player')
  })

  it('resets the actual recipient in training after a lethal transfer', () => {
    const ready = stance(close())
    ready.mode = 'training'
    ready.opponent.health = 1
    const next = resolveFightImpacts(ready, [shot(ready, 'opponent')])
    expect(next.opponent.health).toBe(100)
    expect(next.player.health).toBe(100)
    expect(next.phase).toBe('fighting')
  })

  it.each(['player', 'opponent'] as const)(
    'conserves direct and transferred damage during a simultaneous trade (%s)',
    (owner) => {
      const enemy = otherSide(owner)
      const ready = activate(activate(close(owner), owner, 'terebellum:neutralSpecial'), enemy)
      const selfStrike = resolveFightImpacts(
        {
          ...ready,
          [enemy]: { ...ready[enemy], attack: { ...ready[enemy].attack!, impacted: true } },
        },
        [],
      )
      const counterStrike = resolveFightImpacts(
        {
          ...ready,
          [owner]: { ...ready[owner], attack: { ...ready[owner].attack!, impacted: true } },
        },
        [],
      )
      const next = resolveFightImpacts(ready, [])
      expect(next[owner].health).toBe(100)
      expect(next[enemy].health).toBe(
        100 - selfStrike.impact!.damage - counterStrike.impact!.damage,
      )
      expect(next.score[owner]).toBe(selfStrike.score[owner] + counterStrike.score[owner])
      expect(next.score[enemy]).toBe(0)
    },
  )

  it('requires hand reach for the finisher instead of a stored avoidance charge', () => {
    const ready = close()
    expect(finisherReady(ready, 'player')).toBe(true)
    ready.opponent.x = 80
    expect(finisherReady(ready, 'player')).toBe(false)
  })

  it('loses its contact posture after the move ends', () => {
    const ready = stance(close())
    let elapsed = ready
    for (let frame = 0; frame < 90; frame++)
      elapsed = tickFight(elapsed, EMPTY_INPUT, {
        dt: 1 / 60,
        ai: false,
        opponentInput: EMPTY_INPUT,
      })
    expect(elapsed.player.attack).toBeNull()
    expect(sweetHomeContacts(elapsed, 'player')).toBeNull()
    const next = performMove({ state: elapsed, side: 'player', action: 'light' })
    expect(sweetHomeContacts(next, 'player')).toBeNull()
  })
})
