import type { DeathMatchWorld } from '../chrolloPlan/world'
import { distance, REFEREE_ID } from '../chrolloPlan/world'
import { headsOf } from '../crowd/heads'
import { living, present } from '../crowd/types'
import { REACH, type HisokaIntent } from './tactics'

const GUM_REACH = 2.5

/** In a manual run, a different decapitation order can leave the wrong head in hand. */
export function takeLinkedHead(world: DeathMatchWorld): HisokaIntent | null {
  const marked = new Set(
    world.crowd.spectators.filter((body) => present(body) && body.marks.sun).map((body) => body.id),
  )
  let closest = Infinity
  let intent: HisokaIntent | null = null
  for (const head of headsOf(world.crowd)) {
    if (head.spent || !marked.has(head.bodyId)) continue
    if (head.tiedTo === 'left-hand') return { kind: 'hold' }
    const gap = distance(head.at, world.hisoka.at)
    if (gap >= closest) continue
    closest = gap
    intent =
      gap <= GUM_REACH
        ? { kind: 'tie-head', head: head.id, limb: 'left-hand', replace: true }
        : { kind: 'move', to: head.at }
  }
  return intent ?? approachMarkedPuppet(world, marked)
}

function approachMarkedPuppet(
  world: DeathMatchWorld,
  marked: ReadonlySet<string>,
): HisokaIntent | null {
  let closest = Infinity
  let intent: HisokaIntent | null = null
  for (const body of world.crowd.spectators) {
    if (!marked.has(body.id) || !living(body) || body.id === REFEREE_ID) continue
    const gap = distance(body.at, world.hisoka.at)
    if (gap >= closest) continue
    closest = gap
    intent = gap <= REACH ? { kind: 'decapitate', target: body.id } : { kind: 'move', to: body.at }
  }
  return intent
}
