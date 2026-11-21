import { fighterStance } from './biscuitBody'
import { bashoWriting, BASHO_WRITING_FRAMES } from './bashoPoem'
import { addPoses, type BodyPlan } from './fightPose'
import { stanceAt, type FightStance } from './fightStance'
import { TECHNIQUE_GESTURES } from './rosterTechniqueGestures'
import type { ArcadeFighter } from './types'

/** Maintained gestures use simulated counters, so pause/hitstop cannot advance a pen stroke. */
function interrupted(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.health <= 0 ||
    fighter.attack ||
    fighter.y > 0 ||
    fighter.pose !== 'idle' ||
    fighter.hitStun > 0 ||
    fighter.blockStun > 0 ||
    fighter.knockdownFrames > 0,
  )
}

export function rosterSustainedMotion(fighter: ArcadeFighter, seconds: number): BodyPlan | null {
  if (interrupted(fighter) || fighter.coveringEars || fighter.pluggingWounds || fighter.blocking)
    return null
  const stance = fighterStance(fighter)
  if (!stance) return null
  // No render-clock breathing during a fixed writing counter.
  if (bashoWriting(fighter)) {
    const elapsed = BASHO_WRITING_FRAMES - fighter.bashoPoem!.writingFrames
    const stroke = Math.sin((elapsed * Math.PI) / 6) * 0.08
    return {
      key: 'roster-writing',
      plant: true,
      blend: 0.06,
      pose: addPoses(stance.pose, TECHNIQUE_GESTURES.write.contact, {
        leadWrist: [0, stroke, stroke * 0.5],
      }),
    }
  }
  return idleTechnique({ fighter, seconds, stance })
}

function idleTechnique(options: {
  fighter: ArcadeFighter
  seconds: number
  stance: FightStance
}): BodyPlan | null {
  const { fighter, seconds, stance } = options
  if (fighter.id === 'furykov' && fighter.comboMaster)
    return {
      key: 'roster-console',
      plant: true,
      blend: 0.08,
      pose: addPoses(stanceAt(stance, seconds), TECHNIQUE_GESTURES.console.contact),
    }
  if (fighter.id === 'rihan' && fighter.predator?.watching)
    return {
      key: 'roster-observation',
      plant: true,
      blend: 0.12,
      pose: addPoses(stanceAt(stance, seconds), TECHNIQUE_GESTURES.observe.contact),
    }
  return null
}
