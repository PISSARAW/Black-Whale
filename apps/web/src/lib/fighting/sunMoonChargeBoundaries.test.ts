import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpPacket } from './pvp/protocol'
import { privatePvpState } from './pvp/view'
import type { FightSide } from './types'
import type { ReplayPacket } from './fightReplayTypes'

for (const side of ['player', 'opponent'] as const) {
  describe(`Sun and Moon application boundaries for ${side}`, () => {
    it('replays a complete five-second material hold with identical checkpoints', () => {
      const base = beginFight(
        createFight(
          side === 'player' ? 'chrollo' : 'theta',
          side === 'opponent' ? 'chrollo' : 'theta',
          { mode: 'versus-local', environment: { arenaInteractions: true } },
        ),
      )
      const other: FightSide = side === 'player' ? 'opponent' : 'player'
      let state = {
        ...base,
        [other]: { ...base[other], x: 78 },
        [side]: { ...base[side], x: 27, facing: 1 as const, aura: 100 },
      }
      const recorder = createReplayRecorder(state)!
      expect(recorder).not.toBeNull()
      for (let frame = 0; frame < 301; frame++) {
        const preview =
          frame === 0
            ? performArsenalAction(
                {
                  state,
                  side,
                  command: { action: 'sun-moon-charge-sun', target: 'arena:crate:34' },
                },
                performAuraAttack,
              )
            : state
        const packet: ReplayPacket = [
          1 / 60,
          0,
          0,
          frame === 0 ? [panelReplayCommand(state, preview)] : [],
        ]
        const next = executeReplayPacket(state, packet)
        recorder.append(state, packet, next)
        state = next
      }
      expect(
        state.battlefield!.entities.find((entry) => entry.id === 'arena:crate:34')!.arena!
          .sunCharge,
      ).toBe(300)
      const player = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let i = 0; i < 100 && !player.done; i++) player.advance(0.1, 2)
      expect(player.error).toBe('')
      expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
    })
    it('maps either canonical seat to the local player while preserving continuous contact in the private PvP view', () => {
      const base = beginFight(
        createFight('chrollo', 'chrollo', {
          mode: 'versus-local',
          environment: { arenaInteractions: true },
        }),
      )
      const ready = { ...base, [side]: { ...base[side], x: 27, facing: 1 as const, aura: 100 } }
      const held = performArsenalAction(
        {
          state: ready,
          side,
          command: { action: 'sun-moon-charge-sun', target: 'arena:crate:34' },
        },
        performAuraAttack,
      )
      const view = privatePvpState(held, side)
      expect(view.player.sunMoonCharging).toBe('sun')
      expect(view.arena!.pending.player).toMatchObject({
        frames: 300,
        charge: true,
        contact: { x: 7, y: 0 },
      })
      expect(
        view.battlefield!.entities.find((entry) => entry.id === 'arena:crate:34')!.arena!.sun,
      ).toBe('player')
    })
  })
}
it('accepts only the typed charge commands through the actual PvP protocol', () => {
  for (const action of ['sun-moon-charge-sun', 'sun-moon-charge-moon', 'sun-moon-release']) {
    const packet = {
      sequence: 0,
      input: 0,
      commands: [{ kind: 'arsenal', command: { action, target: 'arena:crate:34' } }],
    }
    expect(parsePvpPacket(packet)).not.toBeNull()
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          { kind: 'arsenal', command: { action, target: 'arena:crate:34', chargeFrames: 300 } },
        ],
      }),
    ).toBeNull()
  }
})
