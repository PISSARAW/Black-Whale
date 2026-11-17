import { humanAnimationRig } from '../../tour/humanAnimation'
import { applyFightPose, borrowFightRig } from '../fightRig'
import type { Turn } from '../fightPose'
import type { VictoryActor, VictoryContext } from './types'
import { lynchBeat } from './lynchTiming'
import { ease } from './resources'

function bendChest(context: VictoryContext, actor: VictoryActor, chest: Turn) {
  const human = humanAnimationRig(actor.root.children[0])
  if (!human) throw new Error('Lynch requires the native fighting anatomy')
  const { rig, restore } = borrowFightRig(human)
  context.save(rig.chest)
  context.save(human.head)
  context.defer(restore)
  applyFightPose(rig, { chest }, 1)
  actor.root.updateWorldMatrix(true, true)
}
export function lynchUpperBodies(context: VictoryContext) {
  if (context.age >= 397) return
  const beat = lynchBeat(context.age)
  const shock = Math.max(0, 1 - Math.abs(beat.delta - 5) / 16) * Number(context.age >= 132)
  const crumple = ease((context.age - 246) / 36) * 0.14
  const twist = (beat.side === 'right' ? -1 : 1) * beat.extension
  bendChest(context, context.hero, [0.07 * beat.extension, twist * 0.26, 0])
  bendChest(context, context.victim, [crumple + shock * 0.38, -twist * 0.12, shock * 0.04])
}
