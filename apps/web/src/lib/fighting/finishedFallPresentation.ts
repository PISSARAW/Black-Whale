import { FIXED_STEP } from './fightClock'
import { advanceAirborne } from './fighterMovement'
import { KO_DURATION } from './fightMoves'
import type { ArcadeFighter, FightSide, FightState } from './types'

interface Position {
  x: number
  y: number
}
interface Fall {
  key: string
  started: number
  samples: { y: number; velocityY: number }[]
}
interface FallInput {
  fighter: ArcadeFighter
  position: Position
  seconds: number
}

/** The verdict stays immutable; only the displayed body completes its flight. */
export function createFinishedFallPresentation() {
  const falls: Partial<Record<FightSide, Fall>> = {}
  return (state: FightState, side: FightSide, input: FallInput) => {
    const { fighter, position, seconds } = input
    if (!needsFinishedFall(state, fighter)) {
      delete falls[side]
      return { fighter, position, progress: undefined as number | undefined }
    }
    const key = fallKey(state, side)
    let fall = falls[side]
    if (!fall || fall.key !== key || seconds < fall.started) {
      fall = { key, started: seconds, samples: flight(fighter, position.y) }
      falls[side] = fall
    }
    const elapsed = Math.max(0, seconds - fall.started)
    const frame = elapsed / FIXED_STEP
    const last = fall.samples.length - 1
    const index = Math.min(last, Math.floor(frame))
    const from = fall.samples[index]
    const to = fall.samples[Math.min(last, index + 1)]
    const y = from.y + (to.y - from.y) * Math.min(1, frame - index)
    const progress = ['ko', 'down'].includes(fighter.pose)
      ? finishedFallProgress({ elapsed, last, y })
      : undefined
    return {
      fighter: landedPose({ ...fighter, y, velocityY: y > 0 ? from.velocityY : 0 }),
      position: { ...position, y },
      progress,
    }
  }
}

function needsFinishedFall(state: FightState, fighter: ArcadeFighter): boolean {
  return (
    state.phase === 'finished' &&
    !fighter.hanzoProjection &&
    (fighter.y > 0 || ['ko', 'down'].includes(fighter.pose))
  )
}

function landedPose(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.y > 0 || (fighter.pose !== 'jump' && fighter.attack?.variant !== 'air'))
    return fighter
  return { ...fighter, pose: 'idle', attack: null }
}

export function finishedFallProgress({
  elapsed,
  last,
  y,
}: {
  elapsed: number
  last: number
  y: number
}): number {
  const duration = KO_DURATION * 1.35
  if (y > 0) return Math.min(0.18, elapsed / duration)
  return Math.min(1, (last > 0 ? 0.18 : 0) + (elapsed - last * FIXED_STEP) / duration)
}

/** Repeated network snapshots of the same verdict must not restart its flight. */
function fallKey(state: FightState, side: FightSide): string {
  const body = state[side]
  return JSON.stringify([
    state.player.id,
    state.opponent.id,
    state.roundNumber,
    state.frame,
    state.winner,
    state.roundsWon.player,
    state.roundsWon.opponent,
    body.x,
    body.y,
    body.velocityY,
    body.pose,
  ])
}

function flight(fighter: ArcadeFighter, y: number) {
  let body = { ...fighter, y }
  const samples = [{ y, velocityY: body.velocityY }]
  for (let i = 0; body.y > 0 && i < 600; i++) {
    body = { ...body, ...advanceAirborne(body) }
    samples.push({ y: body.y, velocityY: body.velocityY })
  }
  return samples
}
