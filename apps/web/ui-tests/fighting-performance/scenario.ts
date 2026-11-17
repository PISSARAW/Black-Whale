import { beginFight, createFight } from '../../src/lib/fighting/engine'
import { createReplayRecorder } from '../../src/lib/fighting/fightReplayRecorder'
import { executeReplayPacket } from '../../src/lib/fighting/fightReplayCommands'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import { setTrainingResources } from '../../src/lib/fighting/trainingSession'
import type { ReplayCommand, ReplayPacket } from '../../src/lib/fighting/fightReplayTypes'
import type { FightStageId } from '../../src/lib/fighting/stages'
import { EMPTY_INPUT, type FighterId, type FightState } from '../../src/lib/fighting/types'
import {
  prepareStressState,
  stressCommands,
  stressInputs,
  type StressScenario,
} from './stressScenario'
import type { FightGraphics } from '../../src/lib/fighting/fightGraphics'

export interface PerformanceScenario {
  fighter: FighterId
  stage: FightStageId
  effects: boolean
  live?: boolean
  scenario?: StressScenario
  graphics?: FightGraphics
}
/** One recorded tick per packet: browser cadence can change, the combat sequence cannot. */
export function performanceTape(options: PerformanceScenario) {
  let state = createFight(
    options.fighter,
    options.scenario === 'post-mortem'
      ? 'benjamin'
      : options.fighter === 'chrollo'
        ? 'hisoka'
        : 'chrollo',
    {
      mode: options.effects ? 'training' : 'versus-local',
      formatId: 'knockout',
      environment: {
        stageId: options.stage,
        arenaInteractions: false,
        ...(options.scenario === 'guards'
          ? { morenaPresent: true, unlawfulIntruders: { player: false, opponent: true } }
          : {}),
      },
    },
  )
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
  if (options.effects)
    for (const side of ['player', 'opponent'] as const)
      state = setTrainingResources(state, side, {
        aura: 100,
        infiniteAura: true,
        infiniteHealth: true,
      })
  state = prepareStressState(state, options.scenario)
  const recorder = createReplayRecorder(state)!
  const first: ReplayPacket = [0, 0, 0, [{ kind: 'start' }]]
  let after = beginFight(state)
  recorder.append(state, first, after)
  state = after
  for (let tick = 0; tick < 1200 && !state.matchWinner; tick++) {
    let commands = options.scenario
      ? stressCommands(state, tick, options.scenario)
      : scenarioCommands(state, tick)
    if (commands.some((command) => command.kind === 'round' || command.kind === 'start')) {
      const control: ReplayPacket = [0, 0, 0, commands]
      after = executeReplayPacket(state, control)
      recorder.append(state, control, after)
      state = after
      commands = []
    }
    const phase = Math.floor(tick / 120) % 8
    const close = Math.abs(state.player.x - state.opponent.x) > 6
    const input = {
      ...EMPTY_INPUT,
      right: close && state.player.x < state.opponent.x,
      left: close && state.player.x > state.opponent.x,
      jump: tick % 180 === 15,
      down: tick % 160 > 140,
      aura: options.effects && [2, 3, 4].includes(phase),
      guard: phase === 3,
      en: options.effects && phase === 5,
      shu: options.effects && phase === 6,
      gyo: options.effects && phase >= 5,
      focusHands: options.effects && phase === 7,
    }
    const opponent = {
      ...EMPTY_INPUT,
      guard: tick % 200 > 150,
      down: tick % 200 > 175,
      jump: tick % 220 === 130,
    }
    const packet: ReplayPacket = [
      1 / 60,
      packReplayInput(options.scenario ? stressInputs(options.scenario).player : input),
      packReplayInput(options.scenario ? stressInputs(options.scenario).opponent : opponent),
      commands,
    ]
    after = executeReplayPacket(state, packet)
    recorder.append(state, packet, after)
    state = after
  }
  const replay = recorder.snapshot()
  if (!replay) throw Error('Could not create performance tape')
  return replay
}
function scenarioCommands(state: FightState, tick: number): ReplayCommand[] {
  if (state.phase === 'ready') return [{ kind: 'start' }]
  if (state.phase === 'finished') return [{ kind: 'round' }]
  const result: ReplayCommand[] = []
  if (tick % 30 === 0)
    result.push({
      kind: 'move',
      side: 'player',
      action: tick % 120 === 0 ? 'special' : tick % 60 === 0 ? 'heavy' : 'light',
      input: 0,
    })
  if (tick % 70 === 0)
    result.push({
      kind: 'move',
      side: 'opponent',
      action: tick % 140 === 0 ? 'ranged' : 'light',
      input: 0,
    })
  return result
}
