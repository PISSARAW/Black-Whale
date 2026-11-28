import { describe, expect, it } from 'vitest'
import { createQwenDuel } from './duel'
import { createFightMatchRuntime } from '../fightMatchRuntime'
import { createFight, beginFight } from '../engine'
import { packReplayInput } from '../fightReplayInput'
import { EMPTY_INPUT } from '../types'
import type { TacticalReply } from './protocol'
import { initialReplayState, executeReplayPacket } from '../fightReplayCommands'
import { fightReplayHash } from '../fightReplayHash'

const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('player versus Rayxie', () => {
  it('requests only the opponent and keeps it moving while inference is pending', async () => {
    const seats: string[] = []
    let deliver!: (reply: TacticalReply | null) => void
    const duel = createQwenDuel({
      clock: () => 0,
      transport: (_, __, seat) => {
        seats.push(seat)
        return new Promise((resolve) => {
          deliver = resolve
        })
      },
    })
    duel.setEnabled(true, 'opponent')
    const state = {
      ...beginFight(createFight('hisoka', 'machi', { mode: 'versus-local' })),
      frame: 20,
    }
    const driven = duel.step(state)!
    expect(driven.player).toBeUndefined()
    expect(driven.opponent).not.toEqual(EMPTY_INPUT)
    expect(driven.commands.every((command) => command.side === 'opponent')).toBe(true)
    expect(seats).toEqual(['opponent'])
    deliver(null)
    await settle()
    let failures = 0
    const unsubscribe = duel.subscribe((status) => {
      failures = status.failures
    })
    expect(failures).toBe(1)
    expect(duel.step(state)!.player).toBeUndefined()
    unsubscribe()
    duel.dispose()
  })

  it('preserves human input and replays a match with accepted tactical plans', async () => {
    let now = 0
    const seats: string[] = []
    const duel = createQwenDuel({
      clock: () => now,
      transport: async (_, __, seat) => {
        seats.push(seat)
        return {
          plan: { goal: 'pressure', nen: 'ten', move: 'none' },
          model: 'rayxie-fixture',
          requestId: String(now),
          elapsedMs: 1,
        }
      },
    })
    const match = createFightMatchRuntime(() => now, { qwen: duel })
    let state = createFight('hisoka', 'machi', { mode: 'versus-local' })
    match.begin(state)
    state = match.apply(state, { kind: 'start' })
    duel.setEnabled(true, 'opponent')
    for (let frame = 0; frame < 150; frame++) {
      now += 1000 / 60
      state = match.advance(state, { ...EMPTY_INPUT, left: true }, { dt: 1 / 60 })
      await settle()
    }
    expect(seats.length).toBeGreaterThan(1)
    expect(new Set(seats)).toEqual(new Set(['opponent']))
    expect(duel.evidence.length).toBeGreaterThan(0)
    const entry = await match.replays.save()
    const replay = entry!.replay
    expect(
      replay.packets
        .filter((packet) => packet[0] > 0)
        .every((packet) => packet[1] === packReplayInput({ ...EMPTY_INPUT, left: true })),
    ).toBe(true)
    let verified = initialReplayState(replay.setup)
    for (const packet of replay.packets) verified = executeReplayPacket(verified, packet)
    expect(fightReplayHash(verified)).toBe(fightReplayHash(state))
    duel.dispose()
    expect(duel.step(state)).toBeNull()
  })
})
