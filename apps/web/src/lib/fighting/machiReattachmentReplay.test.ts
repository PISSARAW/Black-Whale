import { describe, expect, it } from 'vitest'
import { stitchingSetup, severedPart, RELAX_ARMS } from './machiReattachmentTestSetup'
import { performArsenalAction } from './arsenalExecution'
import { performAuraAttack } from './engine'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { packReplayInput } from './fightReplayInput'
import { parsePvpSetup, parsePvpPacket } from './pvp/protocol'
import { createFightEnvironment } from './fightEnvironment'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightSide } from './types'

describe('original limb surgery through the serialized command boundary', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'replays the real work and patient Zetsu for %s',
    (side) => {
      let state = stitchingSetup(side)
      const target = side === 'player' ? 'opponent' : 'player'
      const health = state[target].health
      const recorder = createReplayRecorder(state)!
      const relaxed = packReplayInput(RELAX_ARMS)
      for (let frame = 0; frame < 190; frame++) {
        const id =
          frame === 0
            ? severedPart(state).id
            : frame === 94
              ? severedPart(state, 'right-forearm').id
              : undefined
        const command = id ? { action: 'machi-reattach' as const, target: id } : undefined
        const preview = command
          ? performArsenalAction({ state, side, command }, performAuraAttack)
          : state
        if (command) expect(preview[side].machiReattachment).toBeDefined()
        const packet: ReplayPacket = [
          1 / 60,
          side === 'player' ? 0 : relaxed,
          side === 'player' ? relaxed : 0,
          command ? [panelReplayCommand(state, preview)] : [],
        ]
        const next = executeReplayPacket(state, packet)
        recorder.append(state, packet, next)
        state = next
      }
      expect(state[target].bodyDamage?.parts).toEqual([])
      expect(state[target].health).toBe(health)
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let i = 0; i < 190 && !replay.done; i++) replay.advance(0.05, 2)
      expect(replay.done).toBe(true)
      expect(replay.error).toBe('')
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it('accepts the explicit injury premise and surgery command without client-supplied new flesh', () => {
    const setup = {
      player: 'machi',
      opponent: 'hisoka',
      formatId: 'knockout',
      environment: {
        ...createFightEnvironment(),
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { opponent: 'severed-forearms' },
        },
      },
    }
    expect(parsePvpSetup(setup)?.environment.preparation?.injuries).toEqual({
      opponent: 'severed-forearms',
    })
    expect(
      parsePvpSetup({
        ...setup,
        environment: {
          ...setup.environment,
          preparation: { ...setup.environment.preparation, mode: 'duel' },
        },
      }),
    ).toBeNull()
    expect(
      parsePvpPacket({
        sequence: 0,
        input: 0,
        commands: [
          {
            kind: 'arsenal',
            command: { action: 'machi-reattach', target: 'forearm:opponent:0:left-forearm' },
          },
        ],
      }),
    ).not.toBeNull()
  })
})
