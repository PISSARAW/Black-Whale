import { describe, expect, it, vi } from 'vitest'
import {
  beginFight,
  createFight,
  opponentAttack,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT } from './types'

function advance(state: ReturnType<typeof createFight>, seconds: number, input = EMPTY_INPUT) {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, input, 0.02)
  }
  return next
}

describe('fighting engine', () => {
  it('starts a duel with the selected Black Whale fighters', () => {
    const state = createFight('kurapika', 'hisoka')
    expect(state.player.id).toBe('kurapika')
    expect(state.opponent.id).toBe('hisoka')
    expect(beginFight(state).phase).toBe('fighting')
  })

  it('deals damage on the strike frame rather than on button press', () => {
    let state = beginFight(createFight('benjamin', 'morena'))
    state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 52 } }
    const armed = performAttack(state, 'player', 'heavy')
    expect(armed.opponent.health).toBe(100)
    expect(armed.impact).toBeNull()
    const struck = advance(armed, 0.24)
    expect(struck.opponent.health).toBeLessThan(100)
    expect(struck.impact?.kind).toBe('heavy')
  })

  it('reduces damage while guarding', () => {
    let state = beginFight(createFight('kurapika', 'chrollo'))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52, blocking: true },
    }
    const struck = advance(performAttack(state, 'player', 'heavy'), 0.24)
    expect(struck.impact?.blocked).toBe(true)
    expect(struck.impact?.damage).toBeLessThan(12)
  })

  it('spends aura on a special attack', () => {
    let state = beginFight(createFight('hisoka', 'tserriednich'))
    state = {
      ...state,
      player: { ...state.player, x: 40, aura: 70 },
      opponent: { ...state.opponent, x: 58 },
    }
    const armed = performAttack(state, 'player', 'special')
    expect(armed.player.aura).toBe(30)
    expect(armed.opponent.health).toBe(100)
    const struck = advance(armed, 0.4)
    expect(struck.opponent.health).toBeLessThan(100)
  })

  it('lets a quicker strike interrupt a heavy attack before impact', () => {
    let state = beginFight(createFight('benjamin', 'hisoka'))
    state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 52 } }
    state = performAttack(state, 'player', 'heavy')
    state = performAttack(state, 'opponent', 'light')
    const interrupted = advance(state, 0.3)
    expect(interrupted.player.health).toBeLessThan(100)
    expect(interrupted.opponent.health).toBe(100)
    expect(interrupted.player.attack).toBeNull()
  })

  it('ends on time and awards the healthier fighter', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = { ...state, time: 0.01, opponent: { ...state.opponent, health: 60 } }
    const ended = tickFight(state, EMPTY_INPUT, 0.02)
    expect(ended.phase).toBe('finished')
    expect(ended.winner).toBe('player')
  })

  it('lets the opponent attack at close range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    let state = beginFight(createFight('kurapika', 'benjamin'))
    state = { ...state, player: { ...state.player, x: 47 }, opponent: { ...state.opponent, x: 53 } }
    const armed = opponentAttack(state)
    expect(armed.player.health).toBe(100)
    expect(advance(armed, 0.25).player.health).toBeLessThan(100)
    vi.restoreAllMocks()
  })

  it('derives Ren, Ken, Zetsu and Gyo from one held Aura input', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    expect(state.player.nen.mode).toBe('ten')
    state = advance(state, 0.02, { ...EMPTY_INPUT, aura: true })
    expect(state.player.nen.mode).toBe('ren')
    state = advance(state, 0.02, { ...EMPTY_INPUT, aura: true, jump: true })
    expect(state.player.nen.gyo).toBe(true)
    expect(state.player.y).toBe(0)
    state = advance(state, 0.02, { ...EMPTY_INPUT, aura: true, guard: true })
    expect(state.player.nen.ken).toBe(true)
    state = advance(state, 0.02, { ...EMPTY_INPUT, aura: true, down: true })
    expect(state.player.nen.mode).toBe('zetsu')
    state = advance(state, 0.02)
    expect(state.player.nen.mode).toBe('ten')
  })

  it('uses Zetsu to recover aura but prevents Hatsu', () => {
    let state = beginFight(createFight('hisoka', 'morena'))
    state = {
      ...state,
      player: { ...state.player, x: 40, aura: 50 },
      opponent: { ...state.opponent, x: 58 },
    }
    state = advance(state, 0.02, { ...EMPTY_INPUT, aura: true, down: true })
    const denied = performAttack(state, 'player', 'special')
    expect(denied.opponent.health).toBe(100)
    expect(
      tickFight(state, { ...EMPTY_INPUT, aura: true, down: true }, 0.05).player.aura,
    ).toBeGreaterThan(state.player.aura)
  })

  it('makes Ken reduce incoming Nen damage', () => {
    let exposed = beginFight(createFight('benjamin', 'chrollo'))
    exposed = {
      ...exposed,
      player: { ...exposed.player, x: 46 },
      opponent: { ...exposed.opponent, x: 52 },
    }
    const guarded = {
      ...exposed,
      opponent: applyAuraContext(exposed.opponent, {
        ...EMPTY_INPUT,
        aura: true,
        guard: true,
      }),
    }
    const exposedHit = advance(performAttack(exposed, 'player', 'heavy'), 0.24)
    const guardedHit = advance(performAttack(guarded, 'player', 'heavy'), 0.24)
    expect(guardedHit.impact!.damage).toBe(0)
    expect(guardedHit.impact!.damage).toBeLessThan(exposedHit.impact!.damage)
  })

  it('commits Ko by releasing Aura during a strike, then exposes no lingering focus', () => {
    let base = beginFight(createFight('kurapika', 'hisoka'))
    base = {
      ...base,
      player: { ...base.player, x: 46, aura: 90 },
      opponent: { ...base.opponent, x: 52 },
    }
    const normalHit = advance(performAttack(base, 'player', 'light'), 0.18)
    let focused = advance(base, 0.02, { ...EMPTY_INPUT, aura: true })
    focused = performAuraAttack({
      state: focused,
      side: 'player',
      kind: 'light',
      auraCharged: true,
    })
    const koHit = advance(focused, 0.18, EMPTY_INPUT)
    expect(koHit.impact!.damage).toBeGreaterThan(normalHit.impact!.damage)
    expect(koHit.impact!.critical).toBe(true)
    expect(koHit.impact!.points).toBe(2)
    expect(koHit.player.nen.ko).toBeNull()
    expect(koHit.player.nen.ryu).toEqual({})
  })

  it('turns a last-instant guard into a zone-specific Ryu parry', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52 },
    }
    state = performAttack(state, 'opponent', 'light')
    const parried = advance(state, 0.12, { ...EMPTY_INPUT, guard: true })
    expect(parried.impact).toMatchObject({ parried: true, damage: 0, zone: 'head' })
    expect(parried.player.nen.ryu.head).toBeGreaterThan(parried.player.nen.ryu.torso ?? 0)
  })

  it('moves Ryu to the striking limb when attacking out of guard', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = {
      ...state,
      player: { ...state.player, blocking: true, guardFrames: 3 },
    }
    const jab = performAttack(state, 'player', 'light')
    expect(jab.player.nen.ryu.hands).toBeGreaterThan(jab.player.nen.ryu.torso ?? 0)
    const kick = performAttack(
      { ...state, player: { ...state.player, attack: null } },
      'player',
      'heavy',
    )
    expect(kick.player.nen.ryu.feet).toBeGreaterThan(kick.player.nen.ryu.torso ?? 0)
  })

  it('forces an exhausted aura reserve into defenceless Zetsu', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = {
      ...state,
      player: applyAuraContext({ ...state.player, aura: 0.01 }, { ...EMPTY_INPUT, aura: true }),
    }
    const exhausted = advance(state, 0.5, { ...EMPTY_INPUT, aura: true })
    expect(exhausted.player.auraExhausted).toBe(true)
    expect(exhausted.player.nen.mode).toBe('zetsu')
    expect(exhausted.player.aura).toBeLessThan(18)
  })

  it('keeps the historical arcade rule at ten points', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = {
      ...state,
      score: { player: 9, opponent: 4 },
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52 },
    }
    const ended = advance(performAttack(state, 'player', 'light'), 0.18)
    expect(ended.score.player).toBe(10)
    expect(ended.phase).toBe('finished')
    expect(ended.winner).toBe('player')
  })

  it('ends a Heavens Arena fight on the third unblocked hit', () => {
    let state = beginFight(createFight('kurapika', 'hisoka', 'heavens-arena'))
    state = {
      ...state,
      score: { player: 2, opponent: 1 },
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52 },
    }
    const ended = advance(performAttack(state, 'player', 'light'), 0.18)
    expect(ended.score.player).toBe(3)
    expect(ended.phase).toBe('finished')
    expect(ended.finishReason).toBe('hits')
  })

  it('keeps Heavens Arena governed by hits rather than the health bar', () => {
    let state = beginFight(createFight('kurapika', 'hisoka', 'heavens-arena'))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52, health: 1 },
    }
    const firstHit = advance(performAttack(state, 'player', 'light'), 0.18)
    expect(firstHit.score.player).toBe(1)
    expect(firstHit.opponent.health).toBe(1)
    expect(firstHit.phase).toBe('fighting')
  })

  it('ignores points in a KO fight and waits for health to reach zero', () => {
    let scored = beginFight(createFight('kurapika', 'hisoka', 'knockout'))
    scored = {
      ...scored,
      score: { player: 9, opponent: 0 },
      player: { ...scored.player, x: 46 },
      opponent: { ...scored.opponent, x: 52 },
    }
    scored = advance(performAttack(scored, 'player', 'light'), 0.18)
    expect(scored.score.player).toBe(10)
    expect(scored.phase).toBe('fighting')

    let finalHit = beginFight(createFight('kurapika', 'hisoka', 'knockout'))
    finalHit = {
      ...finalHit,
      player: { ...finalHit.player, x: 46 },
      opponent: { ...finalHit.opponent, x: 52, health: 1 },
    }
    const ended = advance(performAttack(finalHit, 'player', 'light'), 0.18)
    expect(ended.opponent.health).toBe(0)
    expect(ended.winner).toBe('player')
    expect(ended.finishReason).toBe('knockout')
  })
})
