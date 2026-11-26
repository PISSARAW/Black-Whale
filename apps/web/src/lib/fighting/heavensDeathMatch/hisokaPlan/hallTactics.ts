import { frontierBeat } from '../chrolloPlan/phases'
import { distance, type DeathMatchWorld } from '../chrolloPlan/world'
import { isMobileBomb, LEG_TRAP_OFFSET } from '../puppets/pipeline'
import { takeLinkedHead } from './linkedHead'
import { living } from '../crowd/types'
import {
  decideHisoka,
  nearestTo,
  SWING_EVERY,
  type HisokaDecision,
  type HisokaIntent,
} from './tactics'

function landNearPuppet(world: DeathMatchWorld): HisokaIntent {
  const at = world.hisoka.at
  const bombs = world.crowd.spectators.filter(isMobileBomb)
  const armed = bombs.find((body) => body.order === 'trip-hisoka')
  const closest =
    armed ??
    bombs.reduce<(typeof bombs)[number] | undefined>(
      (best, body) => (!best || distance(body.at, at) < distance(best.at, at) ? body : best),
      undefined,
    )
  if (!closest) return { kind: 'move', to: { x: 0, y: 0, z: 0 } }
  // The earlier hammer tactic cuts attacking puppets. Here the escape is interrupted
  // by one charged puppet, which has to reach the support leg to cause the wound.
  const target = { ...closest.at, x: closest.at.x - LEG_TRAP_OFFSET }
  return distance(target, at) <= 0.12 ? { kind: 'hold' } : { kind: 'move', to: target }
}

function swingRemainingHammer(world: DeathMatchWorld): HisokaIntent | null {
  if (!world.hisoka.hammer.length) return null
  const copy = (body: Parameters<typeof living>[0]) => living(body) && body.nature === 'copy'
  const target =
    nearestTo(world, (body) => copy(body) && Boolean(body.order)) ?? nearestTo(world, copy)
  if (!target) return { kind: 'scan' }
  if (distance(world.hisoka.at, target.at) >= 2.8) return { kind: 'move', to: target.at }
  return world.crowd.frame - world.hisoka.lastSwing >= SWING_EVERY
    ? { kind: 'hammer-swing', target: target.id }
    : { kind: 'hold' }
}

export function decideHisokaInHall(world: DeathMatchWorld): HisokaDecision {
  const decision = decideHisoka(world)
  switch (frontierBeat(world.scenario)) {
    case 'hammer-breaks':
      return { ...decision, intent: swingRemainingHammer(world) ?? decision.intent }
    case 'hand-destroyed':
      return { ...decision, intent: takeLinkedHead(world) ?? decision.intent }
    case 'leg-destroyed':
      return world.hisoka.wounds.rightLowerLeg
        ? decision
        : { ...decision, intent: landNearPuppet(world) }
    default:
      return decision
  }
}
