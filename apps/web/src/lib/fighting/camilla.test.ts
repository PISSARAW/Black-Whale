import { attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { moveForSlot, movesetFor } from './movesets'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { recordFightDeath, type FightDeathCause } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { CATS_NAME_FRAMES, catsNamePhase } from './camillaCat'
import { chainRuleDeath } from './kurapikaActions'
import { resolveSolarHeat, SUN_PULSE_FRAMES } from './feitanSun'
import { createPainPacker } from './feitanPain'
import { forceZetsu } from './nen'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function ready(
  options: { mode?: 'training' | 'versus-local'; formatId?: 'knockout' | 'heavens-arena' } = {},
): FightState {
  const state = beginFight(
    createFight('hisoka', 'camilla', {
      mode: options.mode ?? 'versus-local',
      formatId: options.formatId ?? 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50, health: 1 },
  }
}
function frames(state: FightState, count: number): FightState {
  let next = state
  for (let frame = 0; frame < count; frame++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}
function killed(cause: FightDeathCause = 'strike', state = ready()): FightState {
  const dead = { ...state, opponent: { ...state.opponent, health: 0 } }
  return resolveFightOutcome(
    recordFightDeath(dead, { victimSide: 'opponent', killerSide: 'player', cause }),
  )
}

describe('Camilla and the common death verdict', () => {
  it.each(['strike', 'projectile', 'heat', 'transfer', 'judgment'] as const)(
    'starts a post-mortem sequence for an attributed %s death',
    (cause) => {
      const state = killed(cause)
      expect(state.phase).toBe('fighting')
      expect(state.catsName).toEqual({ victimSide: 'opponent', killerSide: 'player', frame: 0 })
      expect(state.opponent.health).toBe(0)
      expect(state.player.health).toBeGreaterThan(0)
      expect(state.roundsWon).toEqual({ player: 0, opponent: 0 })
    },
  )
  it('shows summon, capture, absorption and revival before awarding a single win', () => {
    const start = killed()
    expect(catsNamePhase(start.catsName!.frame)).toBe('summon')
    const capture = frames(start, 24)
    expect(catsNamePhase(capture.catsName!.frame)).toBe('capture')
    expect(capture.player.health).toBeGreaterThan(0)
    const absorbed = frames(capture, 24)
    expect(catsNamePhase(absorbed.catsName!.frame)).toBe('absorb')
    expect(absorbed.player.health).toBe(0)
    expect(absorbed.opponent.health).toBe(0)
    const revive = frames(absorbed, 36)
    expect(catsNamePhase(revive.catsName!.frame)).toBe('revive')
    const done = frames(revive, 36)
    expect(done.catsName).toBeUndefined()
    expect(done.winner).toBe('opponent')
    expect(done.opponent.health).toBe(done.opponent.maxHealth)
    expect(done.roundsWon.opponent).toBe(1)
    expect(frames(done, 10)).toBe(done)
  })
  it('freezes combat, timer, hazards and inputs during the sequence', () => {
    const start = killed()
    expect(performAttack(start, 'player', 'light')).toBe(start)
    expect(performMove({ state: start, side: 'opponent', action: 'finisher' })).toBe(start)
    const next = tickFight(
      start,
      { ...EMPTY_INPUT, right: true, aura: true },
      { dt: 0.1, ai: true },
    )
    expect(next.time).toBe(start.time)
    expect(next.remainingFrames).toBe(start.remainingFrames)
    expect(next.player.x).toBe(start.player.x)
    expect(next.player.aura).toBe(start.player.aura)
    expect(next.projectiles).toHaveLength(0)
  })
  it('starts through the actual melee collision path and delays the KO overlay', () => {
    const state = frames(performAttack(ready(), 'player', 'heavy'), 25)
    expect(state.catsName).toBeDefined()
    expect(state.phase).toBe('fighting')
    expect(state.winner).toBeNull()
    expect(frames(state, CATS_NAME_FRAMES).winner).toBe('opponent')
  })
  it('attributes a fatal Rising Sun pulse to Feitan instead of bypassing Cat’s Name', () => {
    const base = ready()
    const pain = {
      ...createPainPacker(),
      armour: true,
      sun: {
        x: 50,
        y: 8,
        radius: 30,
        damage: 10,
        age: SUN_PULSE_FRAMES,
        duration: 200,
        scored: [] as FightSide[],
      },
    }
    const heat = resolveSolarHeat({
      ...base,
      player: {
        ...base.player,
        id: 'feitan',
        hatsuEffects: { ...base.player.hatsuEffects, painPacker: pain },
      },
    })
    expect(heat.catsName?.killerSide).toBe('player')
    expect(frames(heat, CATS_NAME_FRAMES).winner).toBe('opponent')
  })
  it('routes Judgment Chain’s explicit death through the same sequence, even in a points format', () => {
    const base = ready({ formatId: 'heavens-arena' })
    const judged = {
      ...base,
      opponent: {
        ...base.opponent,
        judgmentChain: { owner: 'player' as const, rule: 'zetsu' as const },
      },
    }
    const state = chainRuleDeath(judged, 'opponent')
    expect(state.catsName).toBeDefined()
    expect(frames(state, CATS_NAME_FRAMES).winner).toBe('opponent')
  })
  it('never treats points or a TKO as a death', () => {
    const base = ready({ formatId: 'heavens-arena' })
    const points = killed('strike', { ...base, score: { player: 10, opponent: 0 } })
    expect(points.catsName).toBeUndefined()
    expect(points.finishReason).toBe('hits')
    expect(points.winner).toBe('player')
    const tko = resolveFightOutcome({ ...base, knockdowns: { player: 3, opponent: 0 } })
    expect(tko.catsName).toBeUndefined()
    expect(tko.finishReason).toBe('technical-knockout')
  })
  it('does not heal nonlethal damage or invent a killer for self/unknown deaths', () => {
    const base = ready()
    expect(resolveFightOutcome(base).opponent.health).toBe(1)
    for (const killerSide of [null, 'opponent'] as const) {
      const dead = { ...base, opponent: { ...base.opponent, health: 0 } }
      const state = resolveFightOutcome(
        recordFightDeath(dead, { victimSide: 'opponent', killerSide, cause: 'heat' }),
      )
      expect(state.catsName).toBeUndefined()
      expect(state.winner).toBe('player')
    }
  })
  it('resolves simultaneous deaths before asking the cat to extract a living murderer', () => {
    const base = ready()
    const dead = {
      ...base,
      player: { ...base.player, health: 0 },
      opponent: { ...base.opponent, health: 0 },
    }
    const state = resolveFightOutcome(
      recordFightDeath(
        recordFightDeath(dead, { victimSide: 'player', killerSide: 'opponent', cause: 'strike' }),
        { victimSide: 'opponent', killerSide: 'player', cause: 'strike' },
      ),
    )
    expect(state.catsName).toBeUndefined()
    expect(state.winner).toBe('draw')
  })
  it('allows post-mortem Nen in Zetsu and without aura, but not after theft', () => {
    const base = ready()
    expect(
      killed('projectile', { ...base, opponent: { ...forceZetsu(base.opponent), aura: 0 } })
        .catsName,
    ).toBeDefined()
    const stolen = {
      ...base,
      opponent: {
        ...base.opponent,
        hatsuEffects: { ...base.opponent.hatsuEffects, hatsuStolen: 1 },
      },
    }
    expect(killed('strike', stolen).catsName).toBeUndefined()
  })
  it('plays in training then restores both fighters without awarding a round', () => {
    const done = frames(killed('strike', ready({ mode: 'training' })), CATS_NAME_FRAMES)
    expect(done.phase).toBe('fighting')
    expect(done.player.health).toBe(done.player.maxHealth)
    expect(done.opponent.health).toBe(done.opponent.maxHealth)
    expect(done.roundsWon).toEqual({ player: 0, opponent: 0 })
  })
  it('does not recurse forever when one Camilla kills another', () => {
    const base = ready()
    const mirror = killed('strike', { ...base, player: { ...base.player, id: 'camilla' } })
    const done = frames(mirror, CATS_NAME_FRAMES)
    expect(done.winner).toBe('opponent')
    expect(done.player.health).toBe(0)
    expect(nextRound(done).catsName).toBeUndefined()
    expect(nextRound(done).deaths).toBeUndefined()
  })
  it('attributes an actual projectile kill before freezing the rest of the fight', () => {
    const state = frames(performAttack(ready(), 'player', 'ranged'), 40)
    expect(state.catsName?.killerSide).toBe('player')
    expect(state.opponent.health).toBe(0)
  })
  it('judges simultaneous fatal melee hits as a batch without reviving during the first half', () => {
    const base = ready()
    const oneHp = { ...base, player: { ...base.player, health: 1 } }
    let armed = performAttack(performAttack(oneHp, 'player', 'heavy'), 'opponent', 'heavy')
    armed = {
      ...armed,
      player: {
        ...armed.player,
        attack: { ...armed.player.attack!, frame: attackData('heavy', armed.player).startup },
      },
      opponent: {
        ...armed.opponent,
        attack: { ...armed.opponent.attack!, frame: attackData('heavy', armed.opponent).startup },
      },
    }
    const result = resolveFightImpacts(armed, [])
    expect(result.player.health).toBe(0)
    expect(result.opponent.health).toBe(0)
    expect(result.winner).toBe('draw')
    expect(result.catsName).toBeUndefined()
  })
  it('gives Camilla a physical pistol without aura, instead of manual Nen attacks or a low-HP finisher', () => {
    const base = ready()
    const state = {
      ...base,
      player: { ...base.player, x: 12 },
      opponent: { ...forceZetsu(base.opponent), x: 80, aura: 0 },
    }
    const shot = performAttack(state, 'opponent', 'ranged')
    expect(shot.opponent.attack?.kind).toBe('ranged')
    expect(shot.opponent.aura).toBe(0)
    const flight = frames(shot, attackData('ranged', shot.opponent).startup)
    expect(flight.projectiles[0]).toMatchObject({
      shape: 'bullet',
      matter: 'object',
      fighterId: 'camilla',
    })
    expect(moveForSlot('camilla', 'finisher')).toBeNull()
    expect(movesetFor('camilla')?.moves.every((move) => move.kind !== 'special')).toBe(true)
    expect(performAttack(state, 'opponent', 'special')).toBe(state)
  })
  it('does not trigger on timeout and awards no counter for surviving on one HP', () => {
    const base = ready()
    const expired = frames({ ...base, remainingFrames: 1, time: 1 / 60 }, 1)
    expect(expired.finishReason).toBe('time')
    expect(expired.catsName).toBeUndefined()
    expect(expired.winner).toBe('player')
  })
  it.each(['player', 'opponent'] as const)(
    'revives the %s side with the same timing',
    (victimSide) => {
      const killerSide = victimSide === 'player' ? 'opponent' : 'player'
      const base = ready()
      const dead = {
        ...base,
        [victimSide]: { ...base[victimSide], id: 'camilla' as const, health: 0 },
        [killerSide]: { ...base[killerSide], id: 'hisoka' as const, health: 200 },
      }
      const start = resolveFightOutcome(
        recordFightDeath(dead, { victimSide, killerSide, cause: 'projectile' }),
      )
      expect(frames(start, CATS_NAME_FRAMES).winner).toBe(victimSide)
    },
  )
})
