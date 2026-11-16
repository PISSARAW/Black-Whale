import { readCounterplay, type CounterplayCue } from './fightCounterplay'
import { styleMatchup } from './styleMatchups'
import { styleReactionFrames } from './styleMobility'
import { steerFighter } from './fighterMovement'
import { canMove, playerCanJump, canGuard } from './fightActorState'
import { moveOpponent } from './opponentMovement'
import { sleepingBody } from './hanzoProjection'
import { melodyInput } from './melodyChannel'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState } from './types'

export interface CounterplayRead {
  key: string
  frames: number
  coveringEars: boolean
}
declare module './types' {
  interface ArcadeFighter {
    counterplayRead?: CounterplayRead
  }
}

/** Ordinary movement and guard; this cannot activate, copy, clear or grant a Hatsu. */
export function moveCounterplayOpponent(options: {
  state: FightState
  fighter: ArcadeFighter
  target: ArcadeFighter
}): ArcadeFighter {
  const { state, target } = options
  let fighter = options.fighter
  if (fighter.counterplayRead?.coveringEars) fighter = melodyInput(fighter, EMPTY_INPUT)
  const view = { ...state, opponent: fighter, player: target }
  const cue = readCounterplay(view, 'opponent')
  if (!cue) return moveOpponent({ ...fighter, counterplayRead: undefined }, sleepingBody(target))
  const frames = observedFrames(fighter, cue)
  fighter = { ...fighter, counterplayRead: { key: cue.key, frames, coveringEars: false } }
  if (frames <= styleReactionFrames(fighter) || !canRespond(fighter, cue))
    return moveOpponent(fighter, sleepingBody(target))
  const input = responseInput(fighter, cue)
  const prepared = melodyInput(fighter, input)
  const blocking = input.guard && canGuard(prepared)
  const next = {
    ...prepared,
    blocking,
    crouching: input.down,
    guardFrames: blocking ? (fighter.blocking ? fighter.guardFrames + 1 : 1) : 0,
    counterplayRead: { key: cue.key, frames, coveringEars: Boolean(input.coverEars) },
  }
  return steerFighter(next, { input, mobile: canMove(next), jumpable: playerCanJump(next, input) })
}

function observedFrames(fighter: ArcadeFighter, cue: CounterplayCue): number {
  return fighter.counterplayRead?.key === cue.key ? fighter.counterplayRead.frames + 1 : 1
}

function canRespond(fighter: ArcadeFighter, cue: CounterplayCue): boolean {
  if (fighter.hanzoProjection || fighter.needlePuppet || fighter.attack) return false
  return cue.kind === 'music' || canMove(fighter)
}

function responseInput(fighter: ArcadeFighter, cue: CounterplayCue): FightInput {
  const toward = cue.position.x >= fighter.x ? 1 : -1
  if (cue.kind === 'heat') return heatResponse(fighter, cue)
  if (cue.kind === 'music') return { ...EMPTY_INPUT, coverEars: true }
  if (cue.kind === 'projectile') {
    if (styleMatchup(fighter.id).role === 'mobile') return { ...EMPTY_INPUT, jump: true }
    return { ...EMPTY_INPUT, guard: true, down: cue.guard === 'low' }
  }
  return directionInput(toward)
}

function directionInput(direction: number): FightInput {
  return { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 }
}

function escapeDirection(fighter: ArcadeFighter, toward: number): number {
  if (fighter.x <= 9) return 1
  if (fighter.x >= 91) return -1
  return -toward
}

function heatResponse(fighter: ArcadeFighter, cue: CounterplayCue): FightInput {
  if (Math.abs(fighter.x - cue.position.x) > (cue.radius ?? 0) + 6) return { ...EMPTY_INPUT }
  const toward = cue.position.x >= fighter.x ? 1 : -1
  return directionInput(escapeDirection(fighter, toward))
}
