import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { speakPaperWords } from './kallutoListening'
import { speakDeclaredFact } from './recordedStatements'
import { judgmentInquiryAi } from './judgmentInquiryAi'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import type { ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function advance(state: FightState, count = 120): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function implant(
  initial = createFight('kurapika', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
): FightState {
  let state = beginFight(initial)
  state = {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48 },
  }
  state = performArsenalCommand(state, 'player', { action: 'judgment-preset', target: 'answers' })
  state = toggleEmperorTime(state, 'player')
  state = performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:finisher',
    auraCharged: false,
  })
  state = advance(state)
  expect(state.opponent.judgmentChain?.rule).toBe('truthful-answers')
  return state
}
function ask(state: FightState, question = 'identity'): FightState {
  return performArsenalCommand(state, 'player', { action: 'judgment-ask', target: question })
}
function answer(state: FightState, target = 'sincere', side: FightSide = 'opponent'): FightState {
  return performArsenalCommand(state, side, { action: 'judgment-answer', target })
}

describe('Judgment Chain’s demonstrated truthful-answer clause (chapter 84)', () => {
  it('is declared before real implantation, does not impose Zetsu, and accepts a voluntary truthful answer', () => {
    const state = implant()
    expect(state.opponent.nen.mode).toBe('ten')
    expect(state.opponent.heardWords).toBeUndefined()
    const asked = ask(state)
    expect(asked.opponent.judgmentChain?.inquiry).toMatchObject({
      fact: 'identity',
      text: 'Qui es-tu réellement ?',
    })
    expect(asked.opponent.heardWords?.text).toBe('Qui es-tu réellement ?')
    const answered = answer(asked)
    expect(answered.opponent.health).toBe(state.opponent.health)
    expect(answered.opponent.judgmentChain?.inquiry).toBeUndefined()
    expect(answered.opponent.judgmentChain?.rule).toBe('truthful-answers')
    expect(answered.player.heardWords?.text).toContain('Hisoka')
    expect(asked.opponent.judgmentChain?.inquiry).toBeDefined()
  })
  it.each(['lie', 'refuse'])(
    'makes the actual %s response fatal, without needing to turn Emperor Time back on',
    (choice) => {
      const prepared = toggleEmperorTime(implant(), 'player')
      expect(prepared.player.kurapika?.emperorTime).toBe(false)
      const broken = answer(ask(prepared), choice)
      expect(broken.opponent.health).toBe(0)
      expect(broken.winner).toBe('player')
    },
  )
  it('does not treat silence, free text, unrelated statements or absence of a question as refusal', () => {
    const state = implant()
    expect(answer(state, 'lie')).toBe(state)
    const asked = ask(state)
    const silent = advance(asked, 400)
    expect(silent.opponent.health).toBe(state.opponent.health)
    const free = speakPaperWords(silent, 'opponent', 'Je refuse de répondre à ta question.')
    expect(free.opponent.health).toBe(silent.opponent.health)
    expect(free.opponent.judgmentChain?.inquiry).toBeDefined()
    const unrelated = speakDeclaredFact(free, 'opponent', { question: 'in', lie: true })
    expect(unrelated.opponent.health).toBe(state.opponent.health)
    expect(unrelated.opponent.judgmentChain?.inquiry).toBeDefined()
  })
  it('enforces answers made through the shared declared-fact speech path rather than just its dedicated buttons', () => {
    const asked = ask(implant())
    expect(
      speakDeclaredFact(asked, 'opponent', { question: 'identity', lie: true }).opponent.health,
    ).toBe(0)
    const honest = speakDeclaredFact(asked, 'opponent', { question: 'identity', lie: false })
    expect(honest.opponent.judgmentChain?.inquiry).toBeUndefined()
    expect(honest.opponent.health).toBe(asked.opponent.health)
  })
  it('requires an audible question, real heart chain and voluntary voice instead of fabricating knowledge or forced speech', () => {
    const state = implant()
    const far = { ...state, opponent: { ...state.opponent, x: 90 } }
    expect(ask(far)).toBe(far)
    const deaf = { ...state, opponent: { ...state.opponent, coveringEars: true } }
    expect(ask(deaf)).toBe(deaf)
    const ordinary = beginFight(createFight('kurapika', 'hisoka'))
    expect(ask(ordinary)).toBe(ordinary)
    const asked = ask(state)
    const controlled = {
      ...asked,
      opponent: {
        ...asked.opponent,
        hatsuEffects: { ...asked.opponent.hatsuEffects, manipulatedFrames: 60 },
      },
    }
    expect(answer(controlled, 'lie')).toBe(controlled)
    expect(ask(state, 'question:' + 'x'.repeat(161))).toBe(state)
    expect(answer(asked, 'truth:' + 'x'.repeat(161))).toBe(asked)
    const longest = ask(state, 'question:' + 'x'.repeat(160))
    expect(longest.opponent.judgmentChain?.inquiry?.text).toHaveLength(160)
    expect(
      answer(longest, 'truth:' + 'y'.repeat(160)).opponent.judgmentChain?.inquiry,
    ).toBeUndefined()
  })
  it('supports other spoken questions and explicitly declared answers without claiming automatic truth assessment of their text', () => {
    const state = ask(implant(), 'question:Où se trouvent les autres membres ?')
    expect(state.opponent.judgmentChain?.inquiry?.fact).toBeUndefined()
    expect(answer(state)).toBe(state)
    const honest = answer(state, 'truth:Je ne connais pas leur position actuelle.')
    expect(honest.opponent.health).toBe(state.opponent.health)
    expect(honest.player.heardWords?.text).toBe('Je ne connais pas leur position actuelle.')
    expect(answer(state, 'lie:Ils sont dans la salle voisine.').opponent.health).toBe(0)
  })
  it('stores the actual issuing member after entry and rejects replacement-body authority', () => {
    const initial = beginFight(
      createTeamFight({
        player: ['bill', 'kurapika', 'melody'],
        opponent: ['hisoka', 'chrollo', 'biscuit'],
      }),
    )
    const entered = requestTeamAssist(
      { ...initial, player: { ...initial.player, x: 7 } },
      'player',
      1,
    )
    expect(entered.teamMatch!.seats.player.active).toBe(1)
    const state = ask(implant(entered))
    expect(state.opponent.judgmentChain?.ownerMember).toBe(1)
    const honest = answer(state)
    expect(honest.player.id).toBe('kurapika')
    expect(honest.player.heardWords?.text).toContain('Hisoka')
    expect(honest.teamMatch!.seats.player.members[0].heardWords).toBeUndefined()
    const forged = {
      ...state,
      teamMatch: {
        ...state.teamMatch!,
        seats: {
          ...state.teamMatch!.seats,
          player: { ...state.teamMatch!.seats.player, active: 0 },
        },
      },
    }
    expect(ask(forged)).toBe(forged)
  })
  it('preserves the seal through snapshots and validates a real P2 semantic reply through the referee', () => {
    const asked = ask(implant())
    const decoded = decodeFightSnapshot(encodeFightSnapshot(asked), {
      player: 'kurapika',
      opponent: 'hisoka',
      mode: asked.mode,
      formatId: asked.formatId,
      environment: asked.environment,
    })
    expect(fightReplayHash(decoded)).toBe(fightReplayHash(asked))
    const own = privatePvpState(asked, 'opponent')
    expect(own.player.judgmentChain?.owner).toBe('opponent')
    const answered = applyPvpCommand(asked, 'opponent', {
      kind: 'arsenal',
      command: { action: 'judgment-answer', target: 'sincere' },
    })
    expect(answered.opponent.judgmentChain?.inquiry).toBeUndefined()
    expect(answered.player.heardWords?.text).toContain('Hisoka')
  })
  it('lets the AI give an admissible truthful answer and keeps On from cancelling an already implanted clause', () => {
    const asked = ask(implant())
    const later = {
      ...asked,
      frame: asked.frame + 30,
      opponent: { ...asked.opponent, on: { sealFrames: 60, grudge: 0 } },
    }
    expect(judgmentInquiryAi(later)?.opponent.judgmentChain?.inquiry).toBeUndefined()
    expect(answer(later, 'refuse').opponent.health).toBe(0)
    expect(
      arsenalOptions(asked, 'opponent').some(
        (option) => option.command.target === 'refuse' && option.ready,
      ),
    ).toBe(true)
  })
  it('replays actual questions and responses without changing the heart rule or conscious intent', () => {
    const initial = implant()
    const recorder = createReplayRecorder(initial)!
    const asked = ask(initial)
    const packet: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(initial, asked)]]
    const afterQuestion = executeReplayPacket(initial, packet)
    recorder.append(initial, packet, afterQuestion)
    const answered = answer(afterQuestion)
    const replyPacket: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(afterQuestion, answered)]]
    const final = executeReplayPacket(afterQuestion, replyPacket)
    recorder.append(afterQuestion, replyPacket, final)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !replay.done && index < 100; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(final))
  })
})
