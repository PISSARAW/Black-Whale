import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { LOVE_DIAL_DAY } from './chrolloHistoricalPhone'
import { advanceMoonlightContract, moonlightZetsu } from './moonlightContract'
import { MOONLIGHT_PENALTY_FRAMES } from './moonlightPenalty'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { stealableChainMove } from './kurapikaDolphin'
import { createKurapika } from './kurapika'
import { stopCookie } from './cookie'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightState } from './types'

function phone(): FightState {
  const state = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
  return {
    ...state,
    player: {
      ...state.player,
      x: 42,
      chrolloBook: {
        pages: ['love-dial-6700'],
        page: 0,
        open: true,
        bookmark: null,
      },
    },
    opponent: { ...state.opponent, x: 52 },
  }
}
function ready(state: FightState): FightState {
  return {
    ...state,
    player: { ...state.player, arenaRecovery: 0 },
    opponent: { ...state.opponent, arenaRecovery: 0 },
  }
}

describe('retrospective utility admission, clocks and network boundaries', () => {
  it('requires entering criteria before dialing, consumes a limited allowance, and reports actual coordinates privately', () => {
    const state = phone()
    expect(performArsenalCommand(state, 'player', { action: 'history-phone-call' })).toBe(state)
    const criteria = ready(
      performArsenalCommand(state, 'player', {
        action: 'history-phone-criteria',
        target: 'ability:hisoka',
      }),
    )
    const first = performArsenalCommand(criteria, 'player', { action: 'history-phone-call' })
    expect(first.player.chrolloHistorical?.phone?.guidance).toMatchObject({
      kind: 'located',
      x: 52,
      y: 0,
    })
    const second = performArsenalCommand(ready(first), 'player', { action: 'history-phone-call' })
    expect(second.player.chrolloHistorical?.phone?.calls).toBe(2)
    const exhausted = ready(second)
    expect(performArsenalCommand(exhausted, 'player', { action: 'history-phone-call' })).toBe(
      exhausted,
    )
    const nextDay = { ...exhausted, frame: exhausted.frame + LOVE_DIAL_DAY }
    const entered = ready(
      performArsenalCommand(nextDay, 'player', {
        action: 'history-phone-criteria',
        target: 'ability:hisoka',
      }),
    )
    expect(
      performArsenalCommand(entered, 'player', { action: 'history-phone-call' }).player
        .chrolloHistorical?.phone?.calls,
    ).toBe(1)
    expect(privatePvpState(first, 'opponent').opponent.chrolloHistorical?.phone).toBeUndefined()
  })
  it('does not mutate simulation when deriving button readiness', () => {
    const state = phone(),
      before = fightReplayHash(state)
    expect(arsenalOptions(state, 'player').length).toBeGreaterThan(5)
    expect(fightReplayHash(state)).toBe(before)
  })
  it('keeps consent on the authenticated seat and translates only target perspectives', () => {
    const state = phone()
    const consent = applyPvpCommand(state, 'opponent', {
      kind: 'arsenal',
      command: { action: 'support-consent' },
    })
    expect(consent.opponent.supportConsent).toBe(true)
    expect(consent.player.supportConsent).toBeUndefined()
  })
  it('steals Cookie as support, never Biscuit’s natural body, and permits one Dolphin treatment only', () => {
    const state = beginFight(createFight('kurapika', 'biscuit', { mode: 'versus-local' }))
    expect(stealableChainMove(state.opponent)).toBe('biscuit:cookie')
    const actor = {
      ...state,
      player: {
        ...state.player,
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          held: {
            victim: 'opponent' as const,
            source: 'biscuit' as const,
            moveId: 'biscuit:cookie',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const used = performArsenalCommand(actor, 'player', { action: 'cookie-massage' })
    expect(used.player.cookie).toBeTruthy()
    expect(used.player.kurapika?.held?.used).toBe(true)
    const stopped = stopCookie(used, 'player')
    expect(performArsenalCommand(stopped, 'player', { action: 'cookie-massage' })).toBe(stopped)
  })
  it('counts an actual week of Moonlight Zetsu and also advances its clock through hitstop', () => {
    const state = phone(),
      penalty = moonlightZetsu(state.player)
    expect(penalty.moonlightPenaltyFrames).toBe(MOONLIGHT_PENALTY_FRAMES)
    const almost = { ...state, player: { ...penalty, moonlightPenaltyFrames: 2 }, hitstop: 1 }
    const last = tickFight(almost, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(last.player.moonlightPenaltyFrames).toBe(1)
    expect(last.player.moonlightZetsu).toBe(true)
    const expired = advanceMoonlightContract(last)
    expect(expired.player.moonlightZetsu).toBe(false)
    expect(expired.player.moonlightPenaltyFrames).toBe(0)
  })
})
