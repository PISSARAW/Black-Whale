import { FIXED_STEP } from './fightClock'
import { attackData } from './frameData'
import type { ArcadeFighter, FightState } from './types'

type Position = { x: number; y: number }
type TravelContext = Pick<FightState, 'frame' | 'roundNumber' | 'frameAccumulator' | 'hitstop'>

export function attackPoseFraction(state: Pick<TravelContext, 'frameAccumulator' | 'hitstop'>) {
  return state.hitstop > 0 ? 0 : Math.min(1, Math.max(0, state.frameAccumulator / FIXED_STEP))
}

interface Sample {
  tick: number
  round: number
  id: ArcadeFighter['id']
  x: number
  facing: ArcadeFighter['facing']
  move?: string
  frame?: number
  travel: number
}

/** The body catches up with the attack's committed ground advance by its first active frame. */
export function createAttackTravel() {
  let previous: Sample | undefined
  return (position: Position, fighter: ArcadeFighter, state: TravelContext): Position => {
    const attack = fighter.attack
    const sample = travelSample(fighter, state)
    const old = previous
    previous = sample
    if (!attack || fighter.y > 0 || fighter.hitStun > 0 || !sameBody(old, sample)) return position
    const frames = attackData(attack.kind, fighter)
    if (attack.frame >= frames.startup || frames.lunge <= 0) return position
    sample.travel = committedAdvance(old, sample, frames.lunge)
    if (sample.travel === 0) return position
    const t = (attack.frame + attackPoseFraction(state)) / frames.startup
    const advance = t * t * (3 - 2 * t)
    return { ...position, x: fighter.x - fighter.facing * sample.travel * (1 - advance) }
  }
}

function travelSample(fighter: ArcadeFighter, state: TravelContext): Sample {
  const attack = fighter.attack
  return {
    tick: state.frame,
    round: state.roundNumber,
    id: fighter.id,
    x: fighter.x,
    facing: fighter.facing,
    move: attack ? (attack.moveId ?? attack.kind) : undefined,
    frame: attack?.frame,
    travel: 0,
  }
}

function sameBody(old: Sample | undefined, next: Sample): old is Sample {
  return Boolean(
    old &&
    old.id === next.id &&
    old.round === next.round &&
    old.facing === next.facing &&
    next.tick >= old.tick &&
    next.tick - old.tick <= 6,
  )
}

function committedAdvance(old: Sample, next: Sample, lunge: number): number {
  const frame = next.frame ?? 0
  if (old.move === next.move && old.frame !== undefined && old.frame <= frame) return old.travel
  if (frame > 2) return 0
  const distance = (next.x - old.x) * next.facing
  return distance > 0 && distance <= lunge + 0.25 ? Math.min(lunge, distance) : 0
}
