import { humanAnimationRig } from '../../tour/humanAnimation'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import type { VictoryContext } from './types'
import type { VoconteLayout } from './voconteTrack'
import { VOCONTE_FALL, VOCONTE_LANDING } from './voconteTrack'
import { nativeVictoryFall, victoryFallTrajectory } from './nativeFall'
import { ease } from './resources'

export function voconteFall(context: VictoryContext, layout: VoconteLayout) {
  const launch = { height: layout.elevation, velocityX: 60, velocityY: 0 }
  const last = victoryFallTrajectory(context.state[context.frame.loser], launch).length - 1
  const rate = last / (VOCONTE_LANDING - VOCONTE_FALL)
  const offset = (context.age - VOCONTE_FALL) * rate + (context.age >= VOCONTE_LANDING ? 1e-6 : 0)
  const fall = nativeVictoryFall(
    { ...context, age: VOCONTE_FALL + offset },
    { start: VOCONTE_FALL, ...launch },
  )
  const human = humanAnimationRig(context.victim.root.children[0])!
  // The fall tips onto the back before contact, then joins the native lying pose.
  human.figure.rotation.x -=
    0.8 * ease(fall.flight / 0.8) * (1 - ease((fall.progress - 0.18) / 0.22))
  human.figure.updateWorldMatrix(true, true)
  fightGroundContact({ ...context.state[context.frame.loser], y: fall.airborneY, pose: 'ko' })(
    human,
  )
  return { ...fall, floor: lowestBodyHeight(human) }
}
