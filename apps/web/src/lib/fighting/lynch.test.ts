import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { resolveFightImpacts } from './combatImpact'
import { attackData, activeHitbox } from './frameData'
import { hatsuDefenceFactor } from './hatsu'
import { hatsuFor } from './hatsu/registry'
import { askLynchQuestion } from './lynchAction'
import { privateLynchReplies } from './lynchInterrogation'
import { lynchReplyText } from './lynchPresentation'
import { LYNCH_MOVE, type LynchQuestionId } from './lynchTypes'
import { finisherReady, moveForSlot, movesetFor } from './movesets'
import { chooseMovesetAttack } from './movesetAi'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function ready(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'lynch' : 'hisoka', side === 'opponent' ? 'lynch' : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 49, aura: 100 },
  }
}
const ask = (
  state: FightState,
  side: FightSide = 'player',
  question: LynchQuestionId = 'identity',
) => askLynchQuestion({ state, side, question }, performAuraAttack)
function hit(
  state: FightState,
  side: FightSide = 'player',
  action: 'light' | 'heavy' | 'throw' = 'light',
): FightState {
  const armed = performMove({ state, side, action })
  const fighter = armed[side]
  expect(fighter.attack).not.toBeNull()
  return resolveFightImpacts(
    {
      ...armed,
      [side]: {
        ...fighter,
        attack: { ...fighter.attack!, frame: attackData(fighter.attack!.kind, fighter).startup },
      },
    },
    [],
  )
}

describe('Lynch: question, fist contact and private truth', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'requires a question before a subsequent fist strike (%s)',
    (side) => {
      const base = ready(side)
      const target = side === 'player' ? 'opponent' : 'player'
      const unasked = hit(base, side)
      expect(unasked[target].health).toBeLessThan(base[target].health)
      expect(privateLynchReplies(unasked, side)).toHaveLength(0)
      const asked = ask(base, side)
      expect(asked[side].attack).toBeNull()
      expect(asked[side].aura).toBe(100)
      expect(activeHitbox(asked[side])).toBeNull()
      const answered = hit(asked, side)
      expect(answered[side].aura).toBe(90)
      expect(answered[target].health).toBe(unasked[target].health)
      expect(answered[target].hitStun).toBe(unasked[target].hitStun)
      expect(hatsuDefenceFactor(answered[target])).toBe(1)
      expect(privateLynchReplies(answered, side)).toEqual(privateLynchReplies(answered, target))
      expect(privateLynchReplies(answered, side)[0]).toMatchObject({
        question: 'identity',
        identity: 'hisoka',
        questioner: side,
        target,
      })
      expect(answered.impact).toEqual(unasked.impact)
      expect(answered.score).toEqual(unasked.score)
    },
  )

  it('cannot retroactively attach a question to an already started attack', () => {
    const armed = performAttack(ready(), 'player', 'light')
    expect(ask(armed)).toBe(armed)
    expect(armed.player.lynchQuestion).toBeUndefined()
  })

  it.each(['nextAction', 'toString'])(
    'refuses an unsupported question rather than inventing an answer (%s)',
    (question) => {
      const state = ready()
      expect(ask(state, 'player', question as LynchQuestionId)).toBe(state)
      expect(privateLynchReplies(state, 'player')).toHaveLength(0)
    },
  )

  it('answers identity truthfully through a Metamorphosen disguise', () => {
    const state = ready()
    const disguised = {
      ...state,
      opponent: {
        ...state.opponent,
        id: 'bonolenov' as const,
        battleCantabile: {
          models: {},
          preparation: null,
          prologue: false,
          form: { model: 'hisoka' as const, remaining: 300, duration: 300 },
        },
      },
    }
    const reply = privateLynchReplies(hit(ask(disguised)), 'player')[0]
    expect(reply.identity).toBe('bonolenov')
    expect(lynchReplyText(reply, 'fr')).toContain('Bonolenov')
  })

  it('captures the current Nen state at contact, rather than when the question is asked', () => {
    const asked = ask(ready(), 'player', 'nen')
    const changed = {
      ...asked,
      opponent: { ...asked.opponent, nen: { ...asked.opponent.nen, mode: 'ren' as const } },
    }
    const answered = hit(changed)
    const reply = privateLynchReplies(answered, 'player')[0]
    expect(reply.nenMode).toBe('ren')
    const later = {
      ...answered,
      opponent: { ...answered.opponent, nen: { ...answered.opponent.nen, mode: 'ten' as const } },
    }
    expect(lynchReplyText(privateLynchReplies(later, 'player')[0], 'en')).toContain('REN')
  })

  it.each([false, true])(
    'answers the supported In question with the actual fact (%s)',
    (concealed) => {
      const state = ask(ready(), 'player', 'in')
      const hidden = {
        ...state,
        opponent: { ...state.opponent, nen: { ...state.opponent.nen, in: concealed } },
      }
      const reply = privateLynchReplies(hit(hidden), 'player')[0]
      expect(reply.concealed).toBe(concealed)
      expect(reply).not.toHaveProperty('nextAction')
      expect(reply).not.toHaveProperty('aura')
    },
  )

  it('requires consciousness when asking and after the blow; normal hitstun remains conscious', () => {
    const state = ready()
    for (const target of [
      { ...state.opponent, health: 0 },
      { ...state.opponent, knockdownFrames: 30 },
      {
        ...state.opponent,
        hanzoProjection: {
          bodyX: 49,
          bodyFacing: -1 as const,
          bodyNen: state.opponent.nen,
          startupFrames: 0,
        },
      },
    ]) {
      const asleep = { ...state, opponent: target }
      expect(ask(asleep)).toBe(asleep)
    }
    const stunned = { ...state, opponent: { ...state.opponent, hitStun: 5 } }
    expect(privateLynchReplies(hit(ask(stunned)), 'player')).toHaveLength(1)
    const asked = ask(state)
    const fragile = { ...asked, opponent: { ...asked.opponent, health: 1 } }
    const ko = hit(fragile)
    expect(ko.opponent.health).toBe(0)
    expect(privateLynchReplies(ko, 'player')).toHaveLength(0)
    expect(ko.player.aura).toBe(100)
  })

  it('does not replace ordinary guard with immunity to a fist contact; a parry gives no answer', () => {
    const asked = ask(ready())
    const guarded = hit({
      ...asked,
      opponent: { ...asked.opponent, blocking: true, guardFrames: 20 },
    })
    expect(guarded.impact?.blocked).toBe(true)
    expect(privateLynchReplies(guarded, 'player')).toHaveLength(1)
    const parried = hit({
      ...asked,
      opponent: { ...asked.opponent, blocking: true, guardFrames: 1 },
    })
    expect(parried.impact?.parried).toBe(true)
    expect(privateLynchReplies(parried, 'player')).toHaveLength(0)
  })

  it('does not treat kicks or throws as truth punches', () => {
    const asked = ask(ready())
    const kick = performMove({
      state: asked,
      side: 'player',
      action: 'light',
      input: { ...EMPTY_INPUT, down: true },
    })
    const fighter = kick.player
    const kicked = resolveFightImpacts(
      {
        ...kick,
        player: {
          ...fighter,
          attack: { ...fighter.attack!, frame: attackData('light', fighter).startup },
        },
      },
      [],
    )
    expect(kicked.impact).not.toBeNull()
    expect(privateLynchReplies(kicked, 'player')).toHaveLength(0)
    expect(privateLynchReplies(hit(asked, 'player', 'throw'), 'player')).toHaveLength(0)
  })

  it('a missed punch or an ordinary travelling projectile emits no reply', () => {
    let state = ask(ready())
    state = { ...state, opponent: { ...state.opponent, x: 80 } }
    expect(privateLynchReplies(hit(state), 'player')).toHaveLength(0)
    let shot = performAttack(state, 'player', 'ranged')
    for (let n = 0; n < 160; n++)
      shot = tickFight(shot, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(shot.opponent.health).toBeLessThan(state.opponent.health)
    expect(privateLynchReplies(shot, 'player')).toHaveLength(0)
  })

  it('requires an audible question and usable Nen, with no answer cost on refusal', () => {
    const state = ready()
    for (const fighter of [
      { ...state.player, aura: 9 },
      { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 4 } },
    ]) {
      const sealed = { ...state, player: fighter }
      expect(ask(sealed)).toBe(sealed)
    }
    expect(
      ask({ ...state, opponent: { ...state.opponent, coveringEars: true } }).player.lynchQuestion,
    ).toBeUndefined()
    expect(
      ask({ ...state, opponent: { ...state.opponent, x: 80 } }).player.lynchQuestion,
    ).toBeUndefined()
    const asked = ask(state)
    const drained = { ...asked, player: { ...asked.player, aura: 9 } }
    expect(privateLynchReplies(hit(drained), 'player')).toHaveLength(0)
  })

  it('preserves learned information when the Hatsu is lost but prevents further interrogation', () => {
    const answered = hit(ask(ready()))
    const sealed = {
      ...answered,
      player: {
        ...answered.player,
        attack: null,
        hatsuEffects: { ...answered.player.hatsuEffects, hatsuStolen: 1 },
      },
    }
    const cleared = hatsuFor('lynch').onFrame(sealed)
    expect(cleared.player.lynchQuestion).toBeUndefined()
    expect(privateLynchReplies(cleared, 'player')).toHaveLength(1)
    expect(privateLynchReplies(hit(cleared), 'player')).toHaveLength(1)
  })

  it('keeps the same conditions for Skill Hunter and retains factual replies after closing the page', () => {
    const base = beginFight(
      createFight('chrollo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const state = {
      ...base,
      player: {
        ...base.player,
        x: 44,
        aura: 100,
        chrolloBook: { pages: ['lynch'] as const, page: 0, open: true, bookmark: null },
      },
      opponent: { ...base.opponent, x: 49 },
    }
    const asked = ask(state)
    expect(asked.player.lynchQuestion?.id).toBe('identity')
    const answered = hit(asked)
    expect(privateLynchReplies(answered, 'player')[0].identity).toBe('hisoka')
    const closed = hatsuFor('lynch').onFrame({
      ...answered,
      player: { ...answered.player, chrolloBook: { ...answered.player.chrolloBook!, open: false } },
    })
    expect(closed.player.lynchQuestion).toBeUndefined()
    expect(privateLynchReplies(closed, 'player')).toHaveLength(1)
  })

  it('has no magical carrier effect, defence debuff or offensive finisher', () => {
    const state = ready()
    expect(
      hatsuFor('lynch').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'lynch',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    expect(movesetFor('lynch')?.moves.filter((move) => move.category === 'special')).toHaveLength(1)
    expect(moveForSlot('lynch', 'finisher')).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'lynch:finisher',
        auraCharged: false,
      }),
    ).toBe(state)
    expect(moveForSlot('lynch', 'neutralSpecial')?.id).toBe(LYNCH_MOVE)
  })

  it('lets Dolphin complete one question-and-punch use, then returns the ability without erasing knowledge', () => {
    const base = beginFight(
      createFight('kurapika', 'lynch', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const state: FightState = {
      ...base,
      player: {
        ...base.player,
        x: 44,
        aura: 100,
        kurapika: {
          ...base.player.kurapika!,
          emperorTime: true,
          held: {
            victim: 'opponent',
            source: 'lynch',
            moveId: LYNCH_MOVE,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
      opponent: {
        ...base.opponent,
        x: 49,
        stolenChainAbility: { owner: 'player', moveId: LYNCH_MOVE },
      },
    }
    const asked = ask(state, 'player', 'in')
    expect(asked.player.id).toBe('kurapika')
    expect(asked.player.lynchQuestion?.id).toBe('in')
    expect(asked.player.kurapika?.held?.sustainedKeys).toContain('body-and-soul')
    const answered = hit(asked)
    expect(answered.player.lynchQuestion).toBeUndefined()
    expect(privateLynchReplies(answered, 'player')[0].concealed).toBe(false)
    let returned = answered
    for (let frame = 0; frame < 30; frame++)
      returned = tickFight(returned, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(returned.player.kurapika?.held).toBeNull()
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
    expect(privateLynchReplies(returned, 'player')).toHaveLength(1)
  })

  it('restricts reply delivery to participants and resets questions and replies between rounds', () => {
    const answered = hit(ask(ready()))
    expect(privateLynchReplies(answered)).toHaveLength(0)
    const misplaced = {
      ...answered,
      player: {
        ...answered.player,
        bodyAndSoulReplies: [
          {
            ...answered.player.bodyAndSoulReplies![0],
            questioner: 'opponent' as const,
            target: 'opponent' as const,
          },
        ],
      },
    }
    expect(privateLynchReplies(misplaced, 'player')).toHaveLength(0)
    const reset = nextRound({ ...answered, phase: 'finished', winner: 'player' })
    expect(reset.player.lynchQuestion).toBeUndefined()
    expect(privateLynchReplies(reset, 'player')).toHaveLength(0)
    expect(privateLynchReplies(reset, 'opponent')).toHaveLength(0)
  })

  it('lets the AI ask before switching to punches', () => {
    const state = ready('opponent')
    expect(chooseMovesetAttack(state, 0.9, 5)?.id).toBe(LYNCH_MOVE)
    expect(chooseMovesetAttack(ask(state, 'opponent'), 0.9, 5)?.category).toBe('normal')
  })
})
