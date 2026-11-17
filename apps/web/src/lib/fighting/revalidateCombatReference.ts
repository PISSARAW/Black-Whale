import { initialReplayState, executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { fightReplayHash } from './fightReplayHash'
import { decodeFightReplay } from './fightReplayCodec'
import { REPLAY_RULESET, type FightReplay } from './fightReplayTypes'

/** New recording under the measured engine, accepted only after every original state checkpoint matches. */
export function revalidateCombatReference(original: FightReplay) {
  let state = initialReplayState(original.setup)
  const recorder = createReplayRecorder(state)
  if (!recorder) throw Error('Reference initial state is not recordable under the measured engine')
  const expected = new Map(original.checkpoints.map((row) => [row.packet, row.hash]))
  function verify(packet: number) {
    const hash = expected.get(packet)
    if (hash && fightReplayHash(state) !== hash)
      throw Error(`Reference changed at checkpoint ${packet}`)
  }
  verify(0)
  for (let index = 0; index < original.packets.length; index++) {
    const packet = original.packets[index]
    const next = executeReplayPacket(state, packet)
    recorder.append(state, packet, next)
    state = next
    verify(index + 1)
  }
  const recorded = recorder.snapshot()
  if (!recorded || recorder.error) throw Error(`Reference recording failed: ${recorder.error}`)
  const replay = decodeFightReplay(JSON.stringify(recorded))
  return {
    replay,
    originalRuleset: original.ruleset,
    measuredRuleset: REPLAY_RULESET,
    checkpointsVerified: original.checkpoints.length,
  }
}
