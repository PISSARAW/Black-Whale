import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { advanceCookie, COOKIE_PIANO_FRAMES, COOKIE_SUMMON_COST } from './cookie'
import { performArsenalCommand } from './retrospectiveArsenal'
import { parsePvpPacket } from './pvp/protocol'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const s = beginFight(createFight('biscuit', 'hisoka', { mode: 'versus-local' }))
  return { ...s, player: { ...s.player, x: 44, aura: 50 }, opponent: { ...s.opponent, x: 49 } }
}
const command = (
  s: FightState,
  action: 'cookie-piano' | 'cookie-massage' | 'cookie-stop',
  target?: string,
) => performArsenalCommand(s, 'player', { action, target })

describe('Cookie is an executable treatment, separate from Biscuit’s body', () => {
  it('summons the masseuse without attacking or changing the body', () => {
    const s = duel()
    const next = command(s, 'cookie-massage')
    expect(next.player.aura).toBe(50 - COOKIE_SUMMON_COST)
    expect(next.player.cookie?.mode).toBe('massage')
    expect(next.player.attack).toBeNull()
    expect(next.player.biscuitTrueForm).toBe(s.player.biscuitTrueForm)
    expect(next.opponent.health).toBe(s.opponent.health)
  })
  it('requires thirty actual simulated minutes of sleep and never heals injuries', () => {
    let s = command(duel(), 'cookie-piano')
    const health = s.player.health - 25
    s = {
      ...s,
      player: { ...s.player, health, cookie: { ...s.player.cookie!, targetHealth: health } },
    }
    for (let frame = 0; frame < COOKIE_PIANO_FRAMES - 1; frame++) s = advanceCookie(s)
    expect(s.player.arsenalSleep).toBeTruthy()
    expect(s.player.aura).toBe(30)
    s = advanceCookie(s)
    expect(s.player.cookie).toBeUndefined()
    expect(s.player.arsenalSleep).toBeUndefined()
    expect(s.player.aura).toBe(100)
    expect(s.player.health).toBe(health)
  })
  it('keeps the sleeping body vulnerable and prevents voluntary attacks', () => {
    let s = command(duel(), 'cookie-piano')
    expect(performAttack(s, 'player', 'heavy')).toBe(s)
    s = performMove({
      state: s,
      side: 'opponent',
      action: 'light',
      input: { ...EMPTY_INPUT, down: true },
    })
    for (let i = 0; i < 30; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(s.player.health).toBeLessThan(duel().player.health)
    expect(s.player.cookie).toBeUndefined()
    expect(s.player.arsenalSleep).toBeUndefined()
  })
  it('requires consent for another participant and ends if consent is withdrawn', () => {
    const s = duel()
    expect(command(s, 'cookie-piano', 'opponent')).toBe(s)
    const willing = { ...s, opponent: { ...s.opponent, supportConsent: true } }
    const started = command(willing, 'cookie-piano', 'opponent')
    expect(started.opponent.arsenalSleep?.owner).toBe('player')
    const withdrawn = { ...started, opponent: { ...started.opponent, supportConsent: false } }
    expect(advanceCookie(withdrawn).opponent.arsenalSleep).toBeUndefined()
  })
  it('stops on loss of Nen and rejects injected network actions', () => {
    const s = command(duel(), 'cookie-piano')
    s.player.hatsuEffects.hatsuStolen = 1
    expect(advanceCookie(s).player.cookie).toBeUndefined()
    expect(
      parsePvpPacket({
        sequence: 0,
        input: 0,
        commands: [{ kind: 'arsenal', command: { action: 'cookie-piano' } }],
      }),
    ).not.toBeNull()
    expect(
      parsePvpPacket({
        sequence: 0,
        input: 0,
        commands: [{ kind: 'arsenal', command: { action: 'restore-health', target: 'opponent' } }],
      }),
    ).toBeNull()
  })
})
