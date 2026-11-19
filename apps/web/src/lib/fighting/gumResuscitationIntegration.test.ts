import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { priorityArsenalAi } from './priorityArsenalAi'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { fightRigOf } from './fightRig'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpSetup, parsePvpPacket } from './pvp/protocol'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightSide } from './types'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
describe('cardiopulmonary Bungee Gum through the actual application boundaries', () => {
  it('lets the AI give a prior order without inventing a death certificate', () => {
    const base = beginFight(createFight('theta', 'hisoka', { mode: 'versus-ai' }))
    const low = { ...base, opponent: { ...base.opponent, health: 20 } }
    const prepared = priorityArsenalAi(low)!
    expect(prepared.opponent.gumResuscitationProgram).toBeDefined()
    expect(prepared.opponent.asphyxiaCertificate).toBeUndefined()
    expect(prepared.arsenalTrace?.command.action).toBe('gum-program-resuscitation')
    expect(
      priorityArsenalAi({ ...low, opponent: { ...low.opponent, x: low.player.x + 5 } }),
    ).toBeNull()
  })
  it('animates the same shared chest rig, without adding a new body or granting health', () => {
    const state = beginFight(
      createFight('hisoka', 'theta', {
        mode: 'versus-local',
        environment: {
          preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] },
        },
      }),
    )
    const first = { ...state.player, gumResuscitationFrame: 2 },
      second = { ...first, gumResuscitationFrame: 7 }
    const context = { seconds: 4, progress: 1 }
    expect(bodyPlan(first, context)?.key).toBe('gum-resuscitation')
    expect(bodyPlan(first, context)?.pose.chest).not.toEqual(bodyPlan(second, context)?.pose.chest)
    expect(fightFigureKey(first)).toBe(fightFigureKey(second))
    const figure = buildFightFigure({ THREE, glow, fighter: first })
    let rig: ReturnType<typeof fightRigOf> | undefined
    figure.animate(4, 'idle', {
      transitionSeconds: 0,
      motion: (human) => {
        fightBodyMotion({ fighter: first, ...context })(human)
        rig = fightRigOf(human)
      },
    })
    const chest = rig!.chest,
      rotation = chest.rotation.x
    figure.animate(5, 'idle', {
      transitionSeconds: 0,
      motion: (human) => {
        fightBodyMotion({ fighter: second, ...context })(human)
        expect(fightRigOf(human).chest).toBe(chest)
      },
    })
    expect(chest.rotation.x).not.toBe(rotation)
    expect(state.player.health).toBe(0)
  })
  it.each<FightSide>(['player', 'opponent'])(
    'records and restores the live preparation of %s',
    (side) => {
      let state = beginFight(
        createFight(
          side === 'player' ? 'hisoka' : 'theta',
          side === 'opponent' ? 'hisoka' : 'theta',
          { mode: 'versus-local' },
        ),
      )
      const recorder = createReplayRecorder(state)!
      for (let frame = 0; frame < 25; frame++) {
        const preview =
          frame === 0
            ? performArsenalAction(
                { state, side, command: { action: 'gum-program-resuscitation' } },
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
      expect(state[side].gumResuscitationProgram).toBeDefined()
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let i = 0; i < 30 && !replay.done; i++) replay.advance(0.05, 2)
      expect(replay.error).toBe('')
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it.each<FightSide>(['player', 'opponent'])(
    'replays the complete historical post-mortem sequence of %s',
    (side) => {
      let state = beginFight(
        createFight(
          side === 'player' ? 'hisoka' : 'theta',
          side === 'opponent' ? 'hisoka' : 'theta',
          {
            mode: 'versus-local',
            formatId: 'knockout',
            environment: {
              preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] },
            },
          },
        ),
      )
      const recorder = createReplayRecorder(state)!
      for (let frame = 0; frame < 121; frame++) {
        const packet: ReplayPacket = [1 / 60, 0, 0, []]
        const next = executeReplayPacket(state, packet)
        recorder.append(state, packet, next)
        state = next
      }
      expect(state[side].gumResuscitationCompleted).toBe(true)
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let i = 0; i < 130 && !replay.done; i++) replay.advance(0.05, 2)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it('accepts only the declared setup and typed command, never a client death certificate', () => {
    const state = createFight('hisoka', 'theta', {
      environment: {
        preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] },
      },
    })
    expect(
      parsePvpSetup({
        player: 'hisoka',
        opponent: 'theta',
        formatId: 'knockout',
        environment: state.environment,
      }),
    ).not.toBeNull()
    const packet = {
      sequence: 0,
      input: 0,
      commands: [{ kind: 'arsenal', command: { action: 'gum-program-resuscitation' } }],
    }
    expect(parsePvpPacket(packet)).not.toBeNull()
    expect(
      parsePvpPacket({ ...packet, commands: [{ ...packet.commands[0], heartIntact: true }] }),
    ).toBeNull()
  })
})
