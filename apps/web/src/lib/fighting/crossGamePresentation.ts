import { crossGameCanWarn, crossGameRestrained } from './crossGame'
import type { BodyPlan } from './fightPose'
import type { ArcadeFighter, FightState } from './types'

export function crossGamePresentation(state: FightState, language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Cross Game · Carton jaune' : 'Cross Game · Yellow Card',
    ready: crossGameCanWarn(state, 'player'),
    hint:
      language === 'fr'
        ? 'L : avertir · Ne bougez plus, ni déplacement ni nouvelle attaque. Désobéir entraîne une contrainte brève.'
        : 'L: warn · Do not move or start another attack. Disobedience causes brief restraint.',
  }
}

export function crossGameBodyPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (crossGameRestrained(fighter))
    return { key: 'cross-game-confined', plant: false, blend: 0.04, pose: {} }
  if (!fighter.crossGameCardFrames || fighter.hitStun > 0) return null
  return {
    key: 'cross-game-yellow-card',
    plant: true,
    blend: 0.06,
    pose: {
      chest: [0, -0.2, 0],
      leadShoulder: [-0.9, 0, 0.1],
      leadElbow: [-1.35, 0, 0],
      leadWrist: [0, 0.2, 0],
      rearShoulder: [-0.2, 0, -0.1],
      rearElbow: [-1, 0, 0],
    },
  }
}
