import { humanAnimationRig } from '../../tour/humanAnimation'
import { applyFightPose, borrowFightRig } from '../fightRig'
import type { Turn } from '../fightPose'
import type { VictoryActor, VictoryContext } from './types'
import { bashoBeat } from './bashoTrack'

function chest(context: VictoryContext, actor: VictoryActor, turn: Turn) {
  const human = humanAnimationRig(actor.root.children[0])
  if (!human) throw new Error('Basho requires native fighting anatomy')
  const { rig, restore } = borrowFightRig(human)
  context.save(rig.chest)
  context.save(human.head)
  context.defer(restore)
  applyFightPose(rig, { chest: turn }, 1)
  actor.root.updateWorldMatrix(true, true)
}
export function bashoBodies(context: VictoryContext) {
  if (context.age >= 420) return
  const beat = bashoBeat(context.age)
  const recoil = Math.max(0, 1 - Math.abs(beat.delta - 6) / 20) * Number(context.age >= 216)
  chest(context, context.hero, [beat.extension * 0.09, -beat.extension * 0.25, 0])
  chest(context, context.victim, [recoil * 0.36, recoil * 0.1, 0])
}
