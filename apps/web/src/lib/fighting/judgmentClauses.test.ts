import { requestTeamAssist, nextTeamRound, createTeamFight } from './teamMatch'
import { speakBattleWords } from './battleConversation'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { performArsenalCommand } from './retrospectiveArsenal'
import { speakPaperWords } from './kallutoListening'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { chooseMovesetAttack } from './movesetAi'
import { planOpponentNen } from './opponentNenPlan'
import { cookieCanStart, performCookie } from './cookie'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
import type { JudgmentPreset } from './judgmentRules'

function frames(state: FightState, count = 120): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function ready(target: FighterId = 'hisoka', preset: JudgmentPreset = 'nen'): FightState {
  let state = beginFight(
    createFight('kurapika', target, { mode: 'versus-local', formatId: 'knockout' }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
  state = performArsenalCommand(state, 'player', { action: 'judgment-preset', target: preset })
  return toggleEmperorTime(state, 'player')
}
function cast(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:finisher',
    auraCharged: false,
  })
}
function bound(preset: JudgmentPreset = 'nen', target: FighterId = 'hisoka'): FightState {
  const state = frames(cast(ready(target, preset)))
  expect(state.opponent.judgmentChain).toBeTruthy()
  return state
}
function teamBound(preset: JudgmentPreset = 'contact'): FightState {
  let state = beginFight(
    createTeamFight({
      player: ['kurapika', 'bill', 'melody'],
      opponent: ['chrollo', 'machi', 'hisoka'],
    }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
  state = toggleEmperorTime(
    performArsenalCommand(state, 'player', { action: 'judgment-preset', target: preset }),
    'player',
  )
  state = frames(cast(state))
  expect(state.opponent.judgmentChain).toBeTruthy()
  return { ...state, opponent: { ...state.opponent, x: 90 } }
}

describe('Judgment Chain declares immutable independent clauses before heart contact', () => {
  it('allows a communication-only clause without imposing Zetsu or blocking voluntary Nen', () => {
    const state = bound('contact')
    expect(state.opponent.judgmentChain?.rule).toBe('no-troupe-contact')
    expect(state.opponent.nen.mode).toBe('ten')
    const ren = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, aura: true },
    })
    expect(ren.opponent.nen.mode).toBe('ren')
    expect(ren.opponent.health).toBe(state.opponent.health)
    const attached = performMove({ state, side: 'opponent', action: 'special' })
    expect(attached.opponent.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(attached.opponent.health).toBe(state.opponent.health)
  })
  it('declares two clauses at startup and keeps them unchanged when a later preset is selected', () => {
    const started = cast(ready('hisoka', 'nen-contact'))
    expect(started.player.judgmentDeclaration).toMatchObject({
      clauses: ['zetsu', 'no-troupe-contact'],
      frame: 0,
    })
    expect(
      performArsenalCommand(started, 'player', { action: 'judgment-preset', target: 'contact' }),
    ).toBe(started)
    const implanted = frames(started)
    const changed = performArsenalCommand(implanted, 'player', {
      action: 'judgment-preset',
      target: 'contact',
    })
    expect(changed.player.judgmentPreset).toBe('contact')
    expect(changed.opponent.judgmentChain?.clauses).toEqual(['zetsu', 'no-troupe-contact'])
  })
  it.each([
    'gyo',
    'en',
    'shu',
    'conceal',
    'focusHead',
    'focusTorso',
    'focusHands',
    'focusFeet',
  ] as const)(
    'enforces the Nen clause on the deliberate %s input without silently treating it as a forced seal',
    (key) => {
      const state = bound()
      const broken = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, [key]: true },
      })
      expect(broken.opponent.health).toBe(0)
      expect(broken.winner).toBe('player')
    },
  )
  it('checks the direct native command path as well as the directional move path', () => {
    const state = bound()
    const broken = performAuraAttack({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: 'hisoka:neutralSpecial',
      auraCharged: false,
    })
    expect(broken.opponent.health).toBe(0)
    expect(broken.winner).toBe('player')
    const unavailable = { ...state, opponent: { ...state.opponent, hitStun: 20 } }
    expect(
      performAuraAttack({
        state: unavailable,
        side: 'opponent',
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(unavailable)
  })
  it('permits Biscuit’s physical form and a real firearm under the no-Nen clause', () => {
    const biscuit = bound('nen', 'biscuit')
    const transformed = performMove({ state: biscuit, side: 'opponent', action: 'special' })
    expect(transformed.opponent.biscuitTrueForm).toBe(true)
    expect(transformed.opponent.health).toBe(biscuit.opponent.health)
    expect(transformed.opponent.nen.mode).toBe('zetsu')
    const theta = bound('nen', 'theta')
    const fired = performAuraAttack({
      state: theta,
      side: 'opponent',
      kind: 'ranged',
      auraCharged: false,
    })
    expect(fired.opponent.attack?.kind).toBe('ranged')
    expect(fired.opponent.health).toBe(theta.opponent.health)
  })
  it('can implant the heart chain in a sleeping physical body without inventing a waking or consent condition', () => {
    let state = ready('biscuit', 'contact')
    expect(cookieCanStart(state, 'opponent', 'opponent')).toBe(true)
    state = performCookie(state, 'opponent', { action: 'cookie-piano' })
    expect(state.opponent.arsenalSleep).toBeTruthy()
    expect(frames(cast(state)).opponent.judgmentChain?.rule).toBe('no-troupe-contact')
  })
  it('does not treat Nen use prevented by an independent forced seal as a real violation', () => {
    const state = bound()
    const sealed = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, forcedZetsuFrames: 20 },
      },
    }
    const next = tickFight(sealed, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, aura: true },
    })
    expect(next.opponent.health).toBe(state.opponent.health)
    expect(next.opponent.nen.mode).toBe('zetsu')
  })
  it('lets only the caster remove its implanted chain, without Emperor Time or restoring health', () => {
    const state = bound('contact')
    expect(performArsenalCommand(state, 'opponent', { action: 'judgment-release' })).toBe(state)
    const noEmperor = toggleEmperorTime(state, 'player')
    expect(noEmperor.player.kurapika?.emperorTime).toBe(false)
    const released = performArsenalCommand(noEmperor, 'player', { action: 'judgment-release' })
    expect(released.opponent.judgmentChain).toBeUndefined()
    expect(released.opponent.health).toBe(state.opponent.health)
  })
})

describe('a no-contact clause follows actual initiated communications, not proximity or disguises', () => {
  it('allows speech to Kurapika, then kills on an actual greeting received by a Troupe teammate at the gate', () => {
    const state = teamBound()
    const talkingToCaster = speakPaperWords(
      { ...state, opponent: { ...state.opponent, x: 48 } },
      'opponent',
      'Je suis ici.',
    )
    expect(talkingToCaster.opponent.health).toBe(state.opponent.health)
    const contacted = performArsenalCommand(state, 'opponent', {
      action: 'judgment-call',
      target: 'reserve:opponent:1',
    })
    expect(contacted.teamMatch?.seats.opponent.members[1].heardWords?.text).toBe('Je suis ici.')
    expect(contacted.opponent.health).toBe(0)
    expect(contacted.winner).toBe('player')
    expect(contacted.teamMatch?.seats.opponent.members[0].health).toBe(0)
    expect(nextTeamRound(contacted).opponent.id).toBe('machi')
  })
  it('does not call Hisoka a genuine Troupe member', () => {
    const state = teamBound('nen-contact')
    const contacted = performArsenalCommand(state, 'opponent', {
      action: 'judgment-call',
      target: 'reserve:opponent:2',
    })
    expect(contacted.teamMatch?.seats.opponent.members[2].heardWords?.text).toBe('Je suis ici.')
    expect(contacted.opponent.health).toBe(state.opponent.health)
    expect(contacted.opponent.nen.mode).toBe('zetsu')
  })
  it('requires a present, living, awake listener within real voice range', () => {
    const state = teamBound()
    const far = { ...state, opponent: { ...state.opponent, x: 45 } }
    expect(
      performArsenalCommand(far, 'opponent', {
        action: 'judgment-call',
        target: 'reserve:opponent:1',
      }),
    ).toBe(far)
    const team = state.teamMatch!,
      seat = team.seats.opponent
    for (const patch of [
      { health: 0 },
      { coveringEars: true },
      { arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const } },
    ]) {
      const unavailable = {
        ...state,
        teamMatch: {
          ...team,
          seats: {
            ...team.seats,
            opponent: {
              ...seat,
              members: seat.members.map((member, index) =>
                index === 1 ? { ...member, ...patch } : member,
              ),
            },
          },
        },
      }
      expect(
        performArsenalCommand(unavailable, 'opponent', {
          action: 'judgment-call',
          target: 'reserve:opponent:1',
        }),
      ).toBe(unavailable)
    }
  })
  it('uses actual membership even when the recipient has another appearance', () => {
    const state = teamBound(),
      team = state.teamMatch!,
      seat = team.seats.opponent
    const disguised = {
      ...state,
      teamMatch: {
        ...team,
        seats: {
          ...team.seats,
          opponent: {
            ...seat,
            members: seat.members.map((member, index) =>
              index === 1
                ? {
                    ...member,
                    chrolloHistorical: {
                      appearance: { owner: 'player' as const, model: 'theta' as const },
                    },
                  }
                : member,
            ),
          },
        },
      },
    }
    expect(
      performArsenalCommand(disguised, 'opponent', {
        action: 'judgment-call',
        target: 'reserve:opponent:1',
      }).opponent.health,
    ).toBe(0)
  })
  it('keeps the authenticated seat in P2 reserve commands and hides private presets and received words', () => {
    const state = teamBound()
    const contacted = applyPvpCommand(state, 'opponent', {
      kind: 'arsenal',
      command: { action: 'judgment-call', target: 'reserve:player:1' },
    })
    expect(contacted.opponent.health).toBe(0)
    const view = privatePvpState(contacted, 'player')
    expect(view.opponent.judgmentPreset).toBeUndefined()
    expect(view.teamMatch?.seats.opponent.members[1].heardWords).toBeUndefined()
  })
  it('does not kill a passive recipient merely because a Troupe member speaks to them', () => {
    const base = beginFight(createFight('machi', 'kalluto', { mode: 'versus-local' }))
    const state = {
      ...base,
      player: { ...base.player, x: 42 },
      opponent: {
        ...base.opponent,
        x: 48,
        judgmentChain: { owner: 'player' as const, rule: 'no-troupe-contact' as const },
      },
    }
    expect(speakPaperWords(state, 'player', 'Bonjour.').opponent.health).toBe(state.opponent.health)
  })
  it('teaches the AI to retain Nen and avoid initiating a forbidden question', () => {
    const base = beginFight(createFight('machi', 'lynch', { mode: 'versus-ai' }))
    const state = {
      ...base,
      player: { ...base.player, x: 42 },
      opponent: {
        ...base.opponent,
        x: 48,
        judgmentChain: { owner: 'player' as const, rule: 'no-troupe-contact' as const },
      },
    }
    expect(planOpponentNen(state).opponent.nen.mode).not.toBe('zetsu')
    expect(chooseMovesetAttack(state, 0.8, 6)?.id).not.toBe('lynch:neutralSpecial')
  })
  it('does not let manipulation fabricate a voluntary forbidden utterance', () => {
    const state = teamBound()
    const puppet = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, manipulatedFrames: 60 },
      },
    }
    expect(
      performArsenalCommand(puppet, 'opponent', {
        action: 'judgment-call',
        target: 'reserve:opponent:1',
      }),
    ).toBe(puppet)
  })
  it('keeps inert speech and uncast choices from blocking a legitimate team assist', () => {
    let state = beginFight(
      createTeamFight({
        player: ['kurapika', 'bill', 'melody'],
        opponent: ['chrollo', 'machi', 'hisoka'],
      }),
    )
    state = { ...state, player: { ...state.player, x: 10 }, opponent: { ...state.opponent, x: 22 } }
    state = performArsenalCommand(speakPaperWords(state, 'opponent', 'Bonjour.'), 'player', {
      action: 'judgment-preset',
      target: 'nen-contact',
    })
    expect(state.player.heardWords?.text).toBe('Bonjour.')
    expect(requestTeamAssist(state, 'player', 1).teamMatch?.seats.player.assistUsed).toBe(true)
  })

  it('keeps the AI silent when replying would communicate with a Troupe member', () => {
    const base = beginFight(createFight('bonolenov', 'hisoka', { mode: 'versus-ai' }))
    const state = {
      ...base,
      player: { ...base.player, x: 42 },
      opponent: {
        ...base.opponent,
        x: 48,
        judgmentChain: { owner: 'player' as const, rule: 'no-troupe-contact' as const },
      },
    }
    const spoken = speakBattleWords(state, 'player', 'Bonjour.')
    expect(spoken.opponent.health).toBe(state.opponent.health)
    expect(spoken.opponent.battleUtteranceFrame).toBeUndefined()
    expect(spoken.player.heardWords).toBeUndefined()
  })
  it('does not record an exchange from a sleeping or controlled speaker', () => {
    const base = beginFight(createFight('bonolenov', 'hisoka', { mode: 'versus-local' }))
    const state = {
      ...base,
      player: { ...base.player, x: 42 },
      opponent: {
        ...base.opponent,
        x: 48,
        arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const },
      },
    }
    expect(speakBattleWords(state, 'opponent')).toBe(state)
    const controlled = {
      ...state,
      opponent: {
        ...state.opponent,
        arsenalSleep: undefined,
        hatsuEffects: { ...state.opponent.hatsuEffects, possessedFrames: 60 },
      },
    }
    expect(speakBattleWords(controlled, 'opponent')).toBe(controlled)
  })
  it('ends a Skill Hunter interview on a fatal forbidden answer without validating its conditions', () => {
    const base = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    let state: FightState = {
      ...base,
      player: { ...base.player, x: 42 },
      opponent: {
        ...base.opponent,
        x: 48,
        judgmentChain: { owner: 'player' as const, rule: 'no-troupe-contact' as const },
      },
    }
    state = performArsenalCommand(state, 'player', { action: 'hunter-ask' })
    const answered = performArsenalCommand(state, 'opponent', { action: 'hunter-answer' })
    expect(answered.opponent.health).toBe(0)
    expect(answered.player.hunterInterview?.answeredAt).toBeUndefined()
    expect(answered.player.heardWords?.text).toBeTruthy()
  })

  it('restores both clauses and the actual reserve death from an encoded snapshot', () => {
    const state = teamBound('nen-contact')
    const setup = {
      player: state.player.id,
      opponent: state.opponent.id,
      mode: state.mode,
      formatId: state.formatId,
      environment: state.environment,
    }
    const restored = decodeFightSnapshot(encodeFightSnapshot(state), setup)
    const contact = { action: 'judgment-call' as const, target: 'reserve:opponent:1' }
    const direct = nextTeamRound(performArsenalCommand(state, 'opponent', contact))
    const replayed = nextTeamRound(performArsenalCommand(restored, 'opponent', contact))
    expect(replayed.opponent.id).toBe('machi')
    expect(fightReplayHash(replayed)).toBe(fightReplayHash(direct))
  })
})
