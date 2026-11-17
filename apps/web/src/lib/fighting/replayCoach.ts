import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { coachSupported } from './replayCoachPerception'
import { createReplayCoachObserver } from './replayCoachObserver'
import { COACH_MAX_PACKETS, COACH_MAX_FRAMES, type ReplayCoachReport } from './replayCoachTypes'
import type { FightReplay } from './fightReplayTypes'
import type { FightSide } from './types'

/** Independent verification: analysis never moves the displayed cursor or saves a result. */
export function createReplayCoachScan(source: FightReplay, side: FightSide = 'player') {
  const observer = createReplayCoachObserver(side)
  let frames = 0
  let status: ReplayCoachReport['status'] = 'running'
  let player: ReturnType<typeof createReplayPlayer> | null = null
  try {
    const replay = decodeFightReplay(JSON.stringify(source))
    player = createReplayPlayer(replay, (before, after, packet) => {
      frames++
      if (!coachSupported(after)) status = 'unsupported'
      else observer.observe(before, after, packet)
    })
    if (!coachSupported(player.state)) status = 'unsupported'
    else if (replay.packets.length > COACH_MAX_PACKETS) status = 'limit'
    else if (player.error) status = 'invalid'
  } catch {
    status = 'invalid'
  }
  function report(): ReplayCoachReport {
    return {
      status,
      packet: player?.cursor ?? 0,
      packets: source.packets.length,
      frames,
      probes: observer.probes,
      nonExhaustive: true,
      findings: status === 'complete' ? observer.findings : [],
    }
  }
  return {
    step() {
      if (status !== 'running' || !player) return report()
      player.seek(Math.min(source.packets.length, player.cursor + 24))
      player.advance(0)
      if (status !== 'running') return report()
      if (player.error) status = 'invalid'
      else if (frames > COACH_MAX_FRAMES) status = 'limit'
      else if (player.done) {
        observer.finish()
        status = 'complete'
      }
      return report()
    },
    cancel() {
      status = 'cancelled'
      return report()
    },
    get current() {
      return report()
    },
  }
}
