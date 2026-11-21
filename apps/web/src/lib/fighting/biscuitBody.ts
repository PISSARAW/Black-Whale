import { isBiscuitTrueForm } from './biscuitForm'
import { fightStance, type FightStance } from './fightStance'
import { composeStance, LEGS_WIDE } from './fightStanceParts'
import { ROSTER_CHOREOGRAPHY, type RosterChoreography } from './rosterChoreography'
import type { ArcadeFighter } from './types'

/**
 * Two bodies, two fighting plans. The compact form keeps the roster's light
 * choreography; the natural body stands wide and square, loads from the hips
 * and drives through heavier, slower strikes. Rig values are interpretation,
 * not manga measurements.
 */
export const BISCUIT_NATURAL_STANCE: FightStance = composeStance(
  [
    LEGS_WIDE,
    {
      body: [0.04, 0, 0],
      chest: [0.03, -0.14, 0],
      head: [0.06, 0, 0],
      leadShoulder: [-0.6, 0, 0.12],
      leadElbow: [-1.25, 0, 0],
      rearShoulder: [-0.35, 0, -0.14],
      rearElbow: [-1.4, 0, 0],
    },
  ],
  0.008,
  0.3,
)

export const BISCUIT_NATURAL_CHOREOGRAPHY: RosterChoreography = {
  ...ROSTER_CHOREOGRAPHY.biscuit,
  strikes: ['cross', 'hook', 'lowJab', 'sweep', 'airPunch', 'dive', 'hammer', 'uppercut', 'charge'],
  load: { root: [0, -0.05, 0], rearHip: [0, 0.12, 0], rearElbow: [-0.26, 0, 0] },
  drive: { chest: [0.06, -0.12, 0], rearHip: [0, -0.16, 0], leadWrist: [-0.3, 0, 0] },
  release: { rearElbow: [-0.28, 0, 0], root: [0, -0.02, 0] },
  amplitude: 1.18,
  anticipation: 0.92,
  recovery: 0.42,
}

/** The resting stance of the body actually on stage. */
export function fighterStance(fighter: ArcadeFighter): FightStance | null {
  return isBiscuitTrueForm(fighter) ? BISCUIT_NATURAL_STANCE : fightStance(fighter.id)
}

/** The strike grammar of the body actually on stage. */
export function fighterMotionStyle(fighter: ArcadeFighter): RosterChoreography | undefined {
  if (isBiscuitTrueForm(fighter)) return BISCUIT_NATURAL_CHOREOGRAPHY
  return ROSTER_CHOREOGRAPHY[fighter.id as keyof typeof ROSTER_CHOREOGRAPHY]
}
