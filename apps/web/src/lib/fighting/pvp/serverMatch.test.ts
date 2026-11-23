import { describe, expect, it } from 'vitest'
import { completePredatorSheet } from '../predatorSheet'
import { AuthoritativeClashMatch } from './serverMatch'
import { applyPvpCommand } from './commands'
import { beginFight, createFight, tickFight, performMove } from '../engine'
import { fightReplayHash } from '../fightReplayHash'
import { BASHO_POEMS } from '../bashoPoem'
import { resolveFightOutcome } from '../fightOutcome'
import { recordFightDeath } from '../fightDeaths'
import { privatePvpState } from './view'
import { EMPTY_INPUT, type FightState, type FighterId } from '../types'
import type { PvpCommand } from './types'

function duel(player: FighterId = 'hisoka', opponent: FighterId = 'kurapika') {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function step(match: AuthoritativeClashMatch, count: number) {
  for (let frame = 0; frame < count; frame++) match.advance((frame * 1000) / 60)
  return match.snapshot()
}
describe('server-side Clash command execution', () => {
  it('limits named battle actions to Bonolenov’s actual panel commands', () => {
    const initial = duel('bonolenov')
    const rejected = applyPvpCommand(initial, 'player', {
      kind: 'battle',
      moveId: 'bonolenov:standLight',
    })
    expect(rejected.player.attack).toBeNull()
    expect(rejected.player.aura).toBe(100)
    const started = applyPvpCommand(initial, 'player', {
      kind: 'battle',
      moveId: 'bonolenov:neutralSpecial',
    })
    expect(started.player.battleCantabile?.preparation?.piece).toBe('prologue')
    expect(started.player.aura).toBe(60)
  })
  it('resolves simultaneous impacts with the same deterministic referee as local combat', () => {
    let local = duel('kurapika', 'kurapika')
    const server = new AuthoritativeClashMatch(local)
    const command = { kind: 'move', action: 'light', input: 0 } as const
    server.submit('player', { sequence: 0, input: 0, commands: [command] }, 0)
    server.submit('opponent', { sequence: 0, input: 0, commands: [command] }, 0)
    local = applyPvpCommand(applyPvpCommand(local, 'player', command), 'opponent', command)
    for (let frame = 0; frame < 40; frame++) {
      local = tickFight(local, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
      server.advance((frame * 1000) / 60)
      expect(fightReplayHash(server.snapshot())).toBe(fightReplayHash(local))
    }
    expect(local.player.health).toBeLessThan(local.player.maxHealth)
    expect(local.opponent.health).toBeLessThan(local.opponent.maxHealth)
  })
  it('composes a real poem with its cost and interruption instead of accepting panel deltas', () => {
    const server = new AuthoritativeClashMatch(duel('basho'))
    server.submit(
      'player',
      { sequence: 0, input: 0, commands: [{ kind: 'poem', text: BASHO_POEMS.fr }] },
      0,
    )
    const writing = step(server, 1)
    expect(writing.player.bashoPoem?.writingFrames).toBeGreaterThan(0)
    expect(writing.player.aura).toBeLessThan(100)
    server.submit('player', { sequence: 1, input: 2, commands: [] }, 20)
    expect(step(server, 1).player.bashoPoem?.ready).not.toBe(true)
  })
  it('requires each authenticated recipient to accept their own Moonlight contract', () => {
    const server = new AuthoritativeClashMatch(duel('longhi'))
    server.submit('player', { sequence: 0, input: 0, commands: [{ kind: 'offer' }] }, 0)
    expect(step(server, 1).moonlight?.offer).toBeDefined()
    server.submit(
      'player',
      { sequence: 1, input: 0, commands: [{ kind: 'respond', accept: true }] },
      20,
    )
    expect(step(server, 1).moonlight?.active).toBeUndefined()
    server.submit(
      'opponent',
      { sequence: 0, input: 0, commands: [{ kind: 'respond', accept: true }] },
      40,
    )
    expect(step(server, 1).moonlight?.active?.recipient).toBe('opponent')
  })
  it('does not supply the flute of a copied page, nor allow a foreign battle move', () => {
    const state = duel('chrollo')
    state.player.chrolloBook = { pages: ['melody'], page: 0, open: false, bookmark: 'melody' }
    const server = new AuthoritativeClashMatch(state)
    server.submit(
      'player',
      {
        sequence: 0,
        input: 0,
        commands: [
          { kind: 'move', action: 'special', input: 0 },
          { kind: 'battle', moveId: 'franklin:neutralSpecial' },
        ],
      },
      0,
    )
    const after = step(server, 1)
    expect(after.player.melodyPerformance).toBeUndefined()
    expect(after.player.aura).toBe(100)
    expect(after.projectiles).toHaveLength(0)
  })
  it('waits for Cat’s Name before producing a shared round verdict', () => {
    const state = duel('hisoka', 'camilla')
    state.opponent.health = 0
    const killed = resolveFightOutcome(
      recordFightDeath(state, { victimSide: 'opponent', killerSide: 'player', cause: 'strike' }),
    )
    const server = new AuthoritativeClashMatch(killed)
    const during = step(server, 1)
    expect(during.catsName).toBeDefined()
    expect(during.winner).toBeNull()
    server.submit(
      'player',
      { sequence: 0, input: 2, commands: [{ kind: 'move', action: 'heavy', input: 0 }] },
      0,
    )
    const done = step(server, 140)
    expect(done.winner).toBe('opponent')
    expect(done.opponent.health).toBe(done.opponent.maxHealth)
    expect(privatePvpState(done, 'player').winner).toBe('opponent')
    expect(privatePvpState(done, 'opponent').winner).toBe('player')
  })
  it('keeps Parallel Future under the server clock and opens the eyes only from the owner command', () => {
    const state = performMove({ state: duel('tserriednich'), side: 'player', action: 'special' })
    const server = new AuthoritativeClashMatch(state)
    const vision = step(server, 32)
    expect(vision.parallelFuture?.phase).toBe('vision')
    expect(privatePvpState(vision, 'opponent').parallelFuture).toBeUndefined()
    expect(privatePvpState(vision, 'player').parallelFuture?.frames).toHaveLength(
      vision.parallelFuture!.frames.length,
    )
    server.submit(
      'opponent',
      { sequence: 0, input: 0, commands: [{ kind: 'move', action: 'special', input: 0 }] },
      600,
    )
    expect(step(server, 1).parallelFuture?.phase).toBe('vision')
    server.submit(
      'player',
      { sequence: 0, input: 0, commands: [{ kind: 'move', action: 'special', input: 0 }] },
      620,
    )
    expect(step(server, 1).parallelFuture?.phase).toBe('diverging')
  }, 20000)
  it('bounds per-frame queues, expires held inputs and snapshots without exposing mutable server state', () => {
    const server = new AuthoritativeClashMatch(duel())
    const commands: PvpCommand[] = Array.from({ length: 8 }, () => ({ kind: 'call' }))
    for (let sequence = 0; sequence < 2; sequence++)
      expect(server.submit('player', { sequence, input: 2, commands }, 0)).toBe('accepted')
    expect(server.submit('player', { sequence: 2, input: 2, commands }, 0)).toBe('busy')
    const before = server.snapshot()
    before.player.health = 0
    expect(server.snapshot().player.health).toBeGreaterThan(0)
    server.release()
    server.advance(300)
    expect(server.snapshot().player.x).toBe(44)
  })
})

describe('seat-specific Nen information', () => {
  it('preserves spoken text while remapping owners and public verdicts for P2', () => {
    const state = duel('kalluto', 'hisoka')
    state.player.kallutoPaper = {
      zone: 'torso',
      heard: { frame: 1, speaker: 'player', text: 'player' },
    }
    state.opponent.kallutoPaper = {
      zone: 'torso',
      heard: { frame: 1, speaker: 'player', text: 'player' },
    }
    const view = privatePvpState(state, 'opponent')
    expect(view.player.kallutoPaper?.heard).toEqual({
      frame: 1,
      speaker: 'opponent',
      text: 'player',
    })
    expect(view.opponent.kallutoPaper?.heard).toBeUndefined()
  })
  it('keeps hidden aura and concealed attack identity out of the opponent snapshot until Gyo', () => {
    const state = performMove({ state: duel('franklin'), side: 'player', action: 'special' })
    state.player.nen.in = true
    state.player.attack = state.player.attack ? { ...state.player.attack, concealed: true } : null
    expect(state.player.attack).not.toBeNull()
    const hidden = privatePvpState(state, 'opponent')
    expect(hidden.opponent.nen.in).toBe(false)
    expect(hidden.opponent.attack).toBeNull()
    state.opponent.nen.gyo = true
    expect(privatePvpState(state, 'opponent').opponent.attack?.hatsuSource).toBe('franklin')
    expect(state.player.nen.in).toBe(true)
  })
  it('removes enemy private observations and buffered inputs while keeping the owner’s information', () => {
    const state: FightState = duel('musse', 'rihan')
    state.player.secretWindow = {
      target: 'opponent',
      attachedAt: 0,
      observation: { frame: 0, action: 'idle' },
    }
    state.opponent.predator = {
      watching: true,
      known: ['bungee-gum'],
      analysis: {
        owner: 'player',
        preyId: 'bungee-gum',
        observedFrames: 180,
        sheet: completePredatorSheet(),
      },
      hunt: null,
      successes: 0,
      sealFrames: 0,
    }
    state.opponent.bodyAndSoulReplies = [
      {
        frame: 1,
        question: 'identity',
        questioner: 'opponent',
        target: 'player',
        identity: 'musse',
      },
    ]
    const host = privatePvpState(state, 'player'),
      guest = privatePvpState(state, 'opponent')
    expect(host.player.secretWindow).toBeDefined()
    expect(host.opponent.bodyAndSoulReplies).toBeUndefined()
    expect(host.opponent.predator?.analysis).toBeNull()
    expect(guest.player.predator?.analysis?.owner).toBe('opponent')
    expect(guest.opponent.secretWindow).toBeUndefined()
    expect(state.opponent.predator.analysis).not.toBeNull()
  })
  it('does not transmit an In tether to a seat without perception; Gyo reveals it', () => {
    const state = duel()
    state.bungeeGum = {
      owner: 'player',
      target: 'opponent',
      retracting: false,
      hidden: true,
    }
    expect(privatePvpState(state, 'opponent').bungeeGum).toBeNull()
    state.opponent.nen.gyo = true
    expect(privatePvpState(state, 'opponent').bungeeGum?.owner).toBe('opponent')
  })
})
