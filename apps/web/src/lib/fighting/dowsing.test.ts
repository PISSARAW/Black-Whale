import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { dowsingAi } from './dowsingAi'
import { advanceDowsing } from './dowsingAction'
import { canAskDowsing } from './dowsingRules'
import { kurapikaChainMotions } from './kurapikaChainMotion'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState, localPerspective } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
import type { DowsingQuestion } from './dowsingTypes'

function duel(player: FighterId = 'kurapika', opponent: FighterId = 'hisoka'): FightState {
  const state = beginFight(createFight(player, opponent, { mode: 'versus-local' }))
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100, facing: 1 },
    opponent: { ...state.opponent, x: 48, aura: 100, facing: -1 },
  }
}
function ask(state = duel(), question: DowsingQuestion = 'identity'): FightState {
  return performArsenalCommand(state, 'player', { action: 'dowsing-ask', target: question })
}
function answer(state: FightState, target = 'sincere'): FightState {
  return performArsenalCommand(state, 'opponent', { action: 'dowsing-answer', target })
}

describe('Dowsing Chain screens an actual voluntary statement without becoming a truth oracle', () => {
  it('questions face to face without Emperor Time, damage, or a forced answer', () => {
    const state = duel(),
      asked = ask(state)
    expect(asked.player.kurapika?.emperorTime).toBe(false)
    expect(asked.player.aura).toBe(97)
    expect(asked.opponent.health).toBe(state.opponent.health)
    expect(asked.player.heardWords).toBeUndefined()
    expect(asked.opponent.heardWords?.text).toContain('réellement')
    expect(asked.opponent.dowsingPrompt?.asker).toBe('player')
    expect(asked.player.dowsingReading).toBeUndefined()
    const silent = tickFight(asked, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(silent.player.dowsingReading).toBeUndefined()
    expect(kurapikaChainMotions(silent, 'player')).toContainEqual({
      stage: 0,
      mode: 'dowsing',
      extension: 1,
      reach: 0,
    })
    expect(asked.opponent.hatsuEffects.witnessedMoveId).toBe('kurapika:forwardSpecial')
  })
  it.each(['identity', 'nen', 'in'] as const)(
    'distinguishes a sincere %s reply from a deliberate lie at the instant of speech',
    (question) => {
      const asked = ask(duel(), question),
        sincere = answer(asked),
        lie = answer(asked, 'lie')
      expect(sincere.player.dowsingReading?.swings).toBe(false)
      expect(lie.player.dowsingReading?.swings).toBe(true)
      expect(lie.player.dowsingReading?.frame).toBe(asked.frame)
      expect(lie.player.dowsingReading?.text).not.toBe(sincere.player.dowsingReading?.text)
      expect(lie.opponent.dowsingPrompt).toBeUndefined()
      expect(lie.opponent.health).toBe(asked.opponent.health)
      expect(answer(lie)).toBe(lie)
    },
  )
  it('reports only the stated lie and pendulum indication, without disclosing the hidden true identity', () => {
    const state = answer(ask(), 'lie')
    expect(state.player.dowsingReading).toMatchObject({ text: 'Je suis Kurapika.', swings: true })
    expect(JSON.stringify(state.player.dowsingReading)).not.toContain('hisoka')
    const changed = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, mode: 'ren' as const } },
    }
    expect(changed.player.dowsingReading).toEqual(state.player.dowsingReading)
  })
  it('never classifies arbitrary free text, a greeting, or silence as a truthful reply', () => {
    const state = ask()
    const spoken = speakPaperWords(state, 'opponent', 'Je suis Kurapika.')
    expect(spoken.player.heardWords?.text).toBe('Je suis Kurapika.')
    expect(spoken.player.dowsingReading).toBeUndefined()
    expect(
      performArsenalCommand(state, 'opponent', { action: 'dowsing-answer', target: 'video' }),
    ).toBe(state)
    expect(
      performArsenalCommand(duel(), 'opponent', { action: 'dowsing-answer', target: 'lie' }).player
        .dowsingReading,
    ).toBeUndefined()
  })
  it('keeps normal voiced speech legal when Nen is unavailable to the respondent', () => {
    const asked = ask(duel(), 'nen'),
      zetsu = {
        ...asked,
        opponent: { ...asked.opponent, nen: { ...asked.opponent.nen, mode: 'zetsu' as const } },
      }
    expect(answer(zetsu).player.dowsingReading?.text).toContain('zetsu')
  })
  it('requires vision, facing, hearing, a free mind and real voice range without spending aura on refusal', () => {
    const state = duel()
    for (const patch of [
      { facing: -1 as const },
      { aura: 2 },
      { nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { parallelEyesClosed: true },
      { coveringEars: true },
      { x: 10 },
      { hitStun: 20 },
    ]) {
      const blocked: FightState = { ...state, player: { ...state.player, ...patch } }
      expect(ask(blocked)).toBe(blocked)
    }
    for (const patch of [
      { facing: 1 as const },
      { coveringEars: true },
      { health: 0 },
      { arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const } },
      { hatsuEffects: { ...state.opponent.hatsuEffects, possessedFrames: 30 } },
    ]) {
      const blocked: FightState = { ...state, opponent: { ...state.opponent, ...patch } }
      expect(ask(blocked)).toBe(blocked)
    }
  })
  it('interrupts on loss of focus or Nen, clears the pending prompt, and retains an earned reading as past knowledge', () => {
    const state = ask()
    const struck = { ...state, player: { ...state.player, hitStun: 20 } }
    const stopped = advanceDowsing(struck)
    expect(stopped.player.dowsingSession).toBeUndefined()
    expect(stopped.opponent.dowsingPrompt).toBeUndefined()
    expect(answer(struck)).toBe(struck)
    const read = answer(state, 'lie')
    const sealed = advanceDowsing({
      ...read,
      player: {
        ...read.player,
        hatsuEffects: { ...read.player.hatsuEffects, forcedZetsuFrames: 60 },
      },
    })
    expect(sealed.player.dowsingSession).toBeUndefined()
    expect(sealed.player.dowsingReading).toEqual(read.player.dowsingReading)
    const putAway = performArsenalCommand(state, 'player', { action: 'dowsing-stop' })
    expect(putAway.opponent.dowsingPrompt).toBeUndefined()
  })
  it('seals this chain independently from other chains and never gives it to a fighter who lacks it', () => {
    const state = duel()
    const otherChain = {
      ...state,
      player: {
        ...state.player,
        stolenChainAbility: { owner: 'opponent' as const, moveId: 'kurapika:backSpecial' },
      },
    }
    expect(canAskDowsing(otherChain, 'player')).toBe(true)
    const stolen = {
      ...state,
      player: {
        ...state.player,
        stolenChainAbility: { owner: 'opponent' as const, moveId: 'kurapika:forwardSpecial' },
      },
    }
    expect(ask(stolen)).toBe(stolen)
    const missing = duel('hisoka'),
      bound = {
        ...missing,
        player: {
          ...missing.player,
          judgmentChain: { owner: 'opponent' as const, rule: 'zetsu' as const },
        },
      }
    expect(ask(bound)).toBe(bound)
  })
  it('requires the actual copied page to be active and usable, then stops when its bookmark is removed', () => {
    const state = duel('chrollo')
    const copied = {
      ...state,
      player: {
        ...state.player,
        chrolloBook: {
          pages: ['kurapika:forwardSpecial' as const],
          page: 0,
          bookmark: 'kurapika:forwardSpecial' as const,
          open: false,
        },
      },
    }
    const asked = ask(copied)
    expect(asked.player.dowsingSession).toBeTruthy()
    const closed = advanceDowsing({
      ...asked,
      player: { ...asked.player, chrolloBook: { ...asked.player.chrolloBook!, bookmark: null } },
    })
    expect(closed.player.dowsingSession).toBeUndefined()
    expect(closed.opponent.dowsingPrompt).toBeUndefined()
    const unrelated = {
      ...copied,
      player: {
        ...copied.player,
        chrolloBook: {
          ...copied.player.chrolloBook!,
          pages: ['kurapika:backSpecial' as const],
          bookmark: 'kurapika:backSpecial' as const,
        },
      },
    }
    expect(ask(unrelated)).toBe(unrelated)
  })
  it('enforces Judgment on deliberate Nen activation and a forbidden voluntary answer, without fabricating a reading after death', () => {
    const state = duel(),
      bound = {
        ...state,
        player: {
          ...state.player,
          judgmentChain: { owner: 'opponent' as const, rule: 'zetsu' as const },
        },
      }
    expect(ask(bound).player.health).toBe(0)
    const copied = duel('chrollo')
    const asked = ask({
      ...copied,
      player: {
        ...copied.player,
        chrolloBook: {
          pages: ['kurapika:forwardSpecial' as const],
          page: 0,
          bookmark: 'kurapika:forwardSpecial' as const,
          open: false,
        },
      },
      opponent: {
        ...copied.opponent,
        judgmentChain: { owner: 'player' as const, rule: 'no-troupe-contact' as const },
      },
    })
    const dead = answer(asked)
    expect(dead.opponent.health).toBe(0)
    expect(dead.player.dowsingReading).toBeUndefined()
  })
  it('uses authenticated P2 answers, keeps the reading private, and restores the same result from a snapshot', () => {
    const asked = ask(),
      result = applyPvpCommand(asked, 'opponent', {
        kind: 'arsenal',
        command: { action: 'dowsing-answer', target: 'lie' },
      })
    expect(result.player.dowsingReading?.swings).toBe(true)
    expect(privatePvpState(result, 'opponent').opponent.dowsingReading).toBeUndefined()
    expect(privatePvpState(result, 'player').player.dowsingReading).toEqual(
      result.player.dowsingReading,
    )
    const restored = decodeFightSnapshot(encodeFightSnapshot(asked), {
      player: 'kurapika',
      opponent: 'hisoka',
      mode: asked.mode,
      formatId: asked.formatId,
      environment: asked.environment,
    })
    expect(
      fightReplayHash(
        applyPvpCommand(restored, 'opponent', {
          kind: 'arsenal',
          command: { action: 'dowsing-answer', target: 'lie' },
        }),
      ),
    ).toBe(fightReplayHash(result))
  })
  it('keeps button previews pure and gives only an actual AI control over its own voluntary reply', () => {
    const state = duel('hisoka', 'kurapika'),
      before = fightReplayHash(state)
    expect(
      arsenalOptions(state, 'opponent').filter((o) => o.command.action === 'dowsing-ask'),
    ).toHaveLength(3)
    expect(fightReplayHash(state)).toBe(before)
    const asked = dowsingAi(state)!
    expect(asked.opponent.dowsingSession).toBeTruthy()
    expect(asked.player.dowsingReading).toBeUndefined()
    expect(asked.opponent.dowsingReading).toBeUndefined()
    const pending = ask(),
      ready = { ...pending, frame: pending.frame + 30 }
    expect(dowsingAi(ready)?.player.dowsingReading?.swings).toBe(false)
  })
  it('keeps On available to the respondent and records its real state without consuming it', () => {
    const asked = ask(duel(), 'nen')
    const enabled = {
      ...asked,
      opponent: { ...asked.opponent, nen: { ...asked.opponent.nen, on: true } },
    }
    const replied = answer(enabled)
    expect(replied.player.dowsingReading?.text).toContain('on')
    expect(replied.opponent.nen.on).toBe(true)
    expect(replied.opponent.aura).toBe(enabled.opponent.aura)
  })
  it('translates the asker for P2 and conceals a pendulum hidden with In until Gyo can see it', () => {
    const asked = ask()
    const local = localPerspective(asked, true) as FightState
    expect(local.player.dowsingPrompt?.asker).toBe('opponent')
    const hidden = {
      ...answer(asked, 'lie'),
      player: { ...answer(asked, 'lie').player, nen: { ...asked.player.nen, in: true } },
    }
    expect(privatePvpState(hidden, 'opponent').opponent.dowsingSession).toBeUndefined()
    const gyo = {
      ...hidden,
      opponent: { ...hidden.opponent, nen: { ...hidden.opponent.nen, gyo: true } },
    }
    expect(privatePvpState(gyo, 'opponent').opponent.dowsingSession?.swings).toBe(true)
    expect(privatePvpState(gyo, 'opponent').opponent.dowsingReading).toBeUndefined()
  })
})
