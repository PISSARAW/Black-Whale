import { beginFight, createFight } from '../../src/lib/fighting/engine'
import { attackPhase } from '../../src/lib/fighting/frameData'
import { executeReplayPacket } from '../../src/lib/fighting/fightReplayCommands'
import { createReplayRecorder } from '../../src/lib/fighting/fightReplayRecorder'
import { localPerspective } from '../../src/lib/fighting/pvp/view'
import { trainingCanAct } from '../../src/lib/fighting/trainingMeasurement'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import {
  EMPTY_INPUT,
  type FighterId,
  type FightSide,
  type FightState,
} from '../../src/lib/fighting/types'
import type { ReplayCommand, ReplayPacket } from '../../src/lib/fighting/fightReplayTypes'

/** A real low heavy is guarded, then either left unanswered or actually punished.
 * Initial positions are explicit lab premises; contacts and timings are never forced. */
export function coachFixtureReplay(
  options: {
    fighter?: FighterId
    side?: FightSide
    punished?: boolean
    answer?: boolean
    batch?: number
  } = {},
) {
  const side = options.side ?? 'player'
  const enemy: FightSide = side === 'player' ? 'opponent' : 'player'
  let state = beginFight(
    createFight(options.fighter ?? 'bill', 'franklin', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 7, facing: 1 },
    opponent: { ...state.opponent, x: 13, facing: -1 },
  }
  if (side === 'opponent') state = localPerspective(state, true) as FightState
  const recorder = createReplayRecorder(state)!
  let answered = false
  const initial = state
  const activeSide = options.punished ? side : enemy
  const responder = options.punished ? enemy : side
  const guard = packReplayInput({ ...EMPTY_INPUT, guard: true, down: true })
  const down = packReplayInput({ ...EMPTY_INPUT, down: true })
  for (let index = 0; index < 90; index++) {
    const commands: ReplayCommand[] = []
    if (index === 15)
      commands.push({ kind: 'move', side: activeSide, action: 'heavy', input: down })
    if (
      !answered &&
      state.hitstop === 0 &&
      trainingCanAct(state[responder]) &&
      attackPhase(state[activeSide]) === 'recovery' &&
      (options.answer || options.punished)
    ) {
      answered = true
      commands.push({ kind: 'move', side: responder, action: 'light', input: 0 })
    }
    const packet: ReplayPacket = [
      (options.batch ?? 1) / 60,
      responder === 'player' ? guard : 0,
      responder === 'opponent' ? guard : 0,
      commands,
    ]
    const after = executeReplayPacket(state, packet)
    recorder.append(state, packet, after)
    state = after
  }
  return { replay: recorder.snapshot()!, initial, final: state }
}
