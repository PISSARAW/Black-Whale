import { describe, expect, it } from 'vitest'
import { ARSENAL_AI } from './arsenalAi'
import { chooseMovesetAttack } from './movesetAi'
import { beginFight, createFight, opponentAttack, performAuraAttack, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { hatsuFor } from './hatsu'
import { forceZetsu } from './nen'
import { SENSE_BITS } from './saiyuSenses'
import { nativeArsenalAiAction } from './arsenalAiAction'
import { kurapikaAiActivation } from './kurapikaActions'
import { createKurapika } from './kurapika'
import { emptyBattleCantabile } from './battleCantabileTypes'
import { speakBattleWords } from './battleConversation'
import { canUseMovesetMove } from './movesets'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

function duel(id: FighterId, gap = 5, target: FighterId = 'illumi'): FightState {
  const state = beginFight(
    createFight(target, id, {
      mode: 'versus-ai',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: ['animals', 'birds', 'plants', 'rooms'],
          cohorts: ['opponent'],
        },
      },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 40 },
    opponent: { ...state.opponent, x: 40 + gap, aura: 100 },
  }
}
const choose = (state: FightState, roll = 0.5) =>
  chooseMovesetAttack(state, roll, Math.abs(state.player.x - state.opponent.x))

function advance(state: FightState, frames: number): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return next
}

describe('the forty opponents use their own Nen arsenal', () => {
  it('covers the exact selectable roster and makes only legal choices', () => {
    expect(Object.keys(ARSENAL_AI).sort()).toEqual(FIGHTING_ROSTER.map(({ id }) => id).sort())
    for (const { id } of FIGHTING_ROSTER) expect(hatsuFor(id).onFrame, id).toBeTypeOf('function')
    for (const { id } of FIGHTING_ROSTER) {
      for (const gap of [4, 14, 35])
        for (const roll of [0.1, 0.3, 0.5, 0.7, 0.9]) {
          const state = duel(id, gap)
          const original = structuredClone(state)
          const move = choose(state, roll)
          if (move) {
            expect(move.id.startsWith(`${id}:`), id).toBe(true)
            expect(canUseMovesetMove(state, 'opponent', move), move.id).toBe(true)
          }
          expect(state).toEqual(original)
        }
    }
  })

  it.each(FIGHTING_ROSTER.map(({ id }) => [id] as const))(
    '%s falls back to physical combat when Nen is unavailable',
    (id) => {
      const state = duel(id)
      state.opponent = forceZetsu(state.opponent)
      const move = choose(state)
      if (move) expect(canUseMovesetMove(state, 'opponent', move)).toBe(true)
      expect(chooseMovesetAttack(state, 0.5, Infinity)).toBeNull()
    },
  )

  it('uses each monkey, then avoids repeatedly sealing an already missing sense', () => {
    const state = duel('saiyu')
    expect([0.1, 0.5, 0.9].map((roll) => choose(state, roll)?.slot)).toEqual([
      'neutralSpecial',
      'forwardSpecial',
      'downSpecial',
    ])
    state.player.hatsuEffects.senseSeals = SENSE_BITS.sight | SENSE_BITS.hearing
    expect(choose(state, 0.1)?.slot).toBe('downSpecial')
  })

  it('reveals Biscuit’s natural body through the real action without an aura charge', () => {
    const state = duel('biscuit')
    const next = opponentAttack(state)
    expect(next.opponent.biscuitTrueForm).toBe(true)
    expect(next.opponent.aura).toBe(state.opponent.aura)
    expect(next.player.health).toBe(state.player.health)
  })

  it('heals with Holy Chain when hurt and does not waste it at full health', () => {
    const state = duel('kurapika', 16)
    state.opponent.health -= 30
    expect(choose(state)?.slot).toBe('downSpecial')
    state.opponent.health = state.opponent.maxHealth
    expect(choose(state)?.slot).not.toBe('downSpecial')
  })

  it('never proposes fatal Chain Jail on a non-Spider', () => {
    const state = duel('kurapika', 5, 'leorio')
    for (const roll of [0.1, 0.5, 0.9]) expect(choose(state, roll)?.slot).not.toBe('neutralSpecial')
    expect(state.opponent.health).toBe(state.opponent.maxHealth)
  })

  it('activates Emperor Time to load a stolen use and switches it off between applications', () => {
    const state = duel('kurapika', 20)
    state.opponent.kurapika = {
      ...createKurapika(),
      held: {
        victim: 'player',
        source: 'illumi',
        moveId: 'illumi:neutralSpecial',
        loaded: false,
        used: false,
        sustainedKeys: [],
      },
    }
    const next = kurapikaAiActivation(state)!
    expect(next.opponent.kurapika?.emperorTime).toBe(true)
    expect(choose(next)?.slot).toBe('backSpecial')
    const empty = {
      ...next,
      opponent: { ...next.opponent, kurapika: { ...next.opponent.kurapika!, held: null } },
    }
    expect(kurapikaAiActivation(empty)?.opponent.kurapika?.emperorTime).toBe(false)
  })

  it('recalls or rebounds along Hisoka’s real attachment', () => {
    const state = duel('hisoka', 18)
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: false, retracting: false }
    expect(choose(state, 0.1)?.slot).toBe('forwardSpecial')
    expect(choose(state, 0.9)?.slot).toBe('backSpecial')
    const next = advance(opponentAttack(state), 35)
    expect(Math.abs(next.player.x - next.opponent.x)).toBeLessThan(18)
  })

  it('completes Sun and Moon with the free right hand instead of applying Sun again', () => {
    const state = duel('chrollo')
    state.opponent.chrolloBook = {
      pages: ['sun-and-moon', 'black-voice'],
      page: 0,
      open: false,
      bookmark: 'sun-and-moon',
    }
    state.player.hatsuEffects.sunMark = 1
    expect(choose(state)?.slot).toBe('finisher')
    const next = advance(opponentAttack(state), 30)
    expect(next.player.hatsuEffects.sunMark).toBe(0)
    expect(next.player.health).toBeLessThan(state.player.health - 20)
  })

  it('uses all three of Padaille’s attested tools', () => {
    const state = duel('padaille')
    expect([0.1, 0.5, 0.9].map((roll) => choose(state, roll)?.slot)).toEqual([
      'neutralSpecial',
      'forwardSpecial',
      'downSpecial',
    ])
  })

  it.each([
    ['theta', ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial']],
    ['franklin', ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial', 'finisher']],
    ['gel', ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial']],
    ['biscuit', ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher']],
  ] as const)(
    'does not starve %s’s other available executions behind its first attack',
    (id, slots) => {
      const state = duel(id)
      if (id === 'biscuit') state.opponent.biscuitTrueForm = true
      const selected = new Set(Array.from({ length: 100 }, (_, i) => choose(state, i / 100)?.slot))
      for (const slot of slots) expect(selected, `${id}:${slot}`).toContain(slot)
    },
  )

  it('chooses actual aerial attacks while airborne', () => {
    const state = duel('saiyu')
    state.opponent.y = 6
    expect(choose(state)?.slot).toMatch(/^air/)
  })

  it('does not create scenario resources for the four support users', () => {
    for (const id of ['bill', 'cluck', 'sayird', 'luini'] as const) {
      const state = beginFight(createFight('hisoka', id, { mode: 'versus-ai' }))
      state.player.x = 45
      state.opponent.x = 50
      expect(choose(state)?.slot).not.toBe('neutralSpecial')
      expect(state.battlefield?.entities ?? []).toHaveLength(0)
    }
  })

  it('uses carried ranged weapons, without giving a stone or an aura bullet to everyone', () => {
    for (const id of ['hisoka', 'theta', 'musse', 'camilla'] as const) {
      const state = duel(id, 30)
      state.rng = 0
      const next = nativeArsenalAiAction(state, performAuraAttack)!
      expect(next.opponent.attack?.kind, id).toBe('ranged')
    }
    expect(nativeArsenalAiAction(duel('beyond', 30), performAuraAttack)).toBeNull()
  })

  it('does not fabricate Bonolenov’s conversation or learned appearance', () => {
    const state = duel('bonolenov', 14)
    state.opponent.battleCantabile = emptyBattleCantabile()
    expect(nativeArsenalAiAction(state, performAuraAttack)).toBeNull()
    expect(choose(state, 0.9)?.slot).not.toBe('downSpecial')
    // A human utterance receives an actual AI reply via the shared speech handler.
    const spoken = speakBattleWords(state, 'player', 'Je suis ici.')
    expect(spoken.opponent.battleUtteranceFrame).toBe(state.frame)
    spoken.opponent.battleCantabile = {
      ...emptyBattleCantabile(),
      models: { illumi: { spoken: true, frames: 120 } },
    }
    expect(choose(spoken, 0.9)?.slot).toBe('downSpecial')
  })

  it('cannot use hidden player input or a concealed attack to choose Sweet Home', () => {
    const state = duel('terebellum')
    const attack = performAuraAttack({ state, side: 'player', kind: 'heavy', auraCharged: false })
    const concealed = {
      ...attack,
      player: { ...attack.player, attack: { ...attack.player.attack!, concealed: true } },
    }
    expect(choose(concealed)?.slot).not.toBe('neutralSpecial')
    expect(choose(attack)?.slot).toBe('neutralSpecial')
  })
})
