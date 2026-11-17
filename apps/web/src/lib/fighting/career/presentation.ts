import { introduction, resolvedCeremonyWinner } from '../presentation/ceremony'
import type { HumanMotion } from '../../tour/humanAnimation'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import type { CareerAppearance } from './types'

export function ceremonyText(state: FightState, language: 'fr' | 'en', side: FightSide): string {
  return introduction(state, language, side)
}
export function winnerForCeremony(state: FightState): FightSide | null {
  return resolvedCeremonyWinner(state)
}
export function victoryMotion(options: {
  state: FightState
  side: FightSide
  victory: CareerAppearance['victory']
  seconds: number
  fallback: HumanMotion
}): HumanMotion {
  const actor = options.state[options.side]
  if (winnerForCeremony(options.state) !== options.side || options.victory === 'still')
    return options.fallback
  if (!canCelebrate(actor)) return options.fallback
  return (rig) => {
    options.fallback(rig)
    if (options.victory === 'salute') {
      rig.arms[1].rotation.x = -1.65
      rig.arms[1].rotation.z = -0.22
      rig.head.rotation.x = 0.08
    } else {
      rig.arms.forEach((arm, index) => {
        arm.rotation.x = -1.05
        arm.rotation.z = index ? -0.24 : 0.24
      })
    }
  }
}
function canCelebrate(actor: ArcadeFighter): boolean {
  if (actor.health <= 0) return false
  if (
    [
      actor.attack,
      actor.hanzoProjection,
      actor.pluggingWounds,
      actor.coveringEars,
      actor.chainJail,
      actor.maryCapture,
      actor.machiThread,
      actor.needlePuppet,
      actor.melodyPerformance,
      actor.battleCantabile?.preparation,
    ].some(Boolean)
  )
    return false
  const effects = actor.hatsuEffects
  return ![
    effects.manipulatedFrames,
    effects.possessedFrames,
    effects.entrancedFrames,
    effects.momozeFrames,
    effects.blinkyFrames,
    effects.arrowNocked,
    actor.hitStun,
    actor.knockdownFrames,
  ].some((frames) => frames > 0)
}
