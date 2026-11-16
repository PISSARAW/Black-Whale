import { BIOHAZARD_COST, biohazardCanLaunch, biohazardPreparing } from './biohazard'
import type { BodyPlan } from './fightPose'
import type { ArcadeFighter } from './types'
import { writingBodyAvailable } from './bashoPoem'
import type { FightState } from './types'

export function biohazardPresentation(state: FightState, language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Pigeon-menottes' : 'Handcuff pigeon',
    ready: biohazardCanLaunch(state.player) && writingBodyAvailable(state.player),
    hint:
      language === 'fr'
        ? `L : transformer / lancer · ${BIOHAZARD_COST} aura · ↓+L : rappeler, ouvrir au contact`
        : `L: transform / release · ${BIOHAZARD_COST} aura · ↓+L: recall, unlock at contact`,
  }
}

export function biohazardBodyPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (fighter.health <= 0) return null
  if (fighter.biohazardRestraint)
    return {
      key: 'biohazard-cuffed',
      blend: 0.06,
      plant: true,
      pose: {
        chest: [0.13, -0.2, 0],
        head: [0.08, 0, 0],
        leadShoulder: [-0.3, -0.15, -0.1],
        rearShoulder: [-0.3, 0.15, 0.1],
        leadElbow: [-1.5, 0, 0],
        rearElbow: [-1.5, 0, 0],
        leadKnee: [0.08, 0, 0],
        rearKnee: [0.08, 0, 0],
      },
    }
  if (!biohazardPreparing(fighter)) return null
  return {
    key: 'biohazard-transform',
    blend: 0.06,
    plant: true,
    pose: {
      chest: [0, -0.15, 0],
      head: [0.2, 0, 0],
      leadShoulder: [-0.65, 0, 0.1],
      leadElbow: [-1, 0, 0],
      rearShoulder: [-0.6, 0, -0.1],
      rearElbow: [-1.1, 0, 0],
    },
  }
}
