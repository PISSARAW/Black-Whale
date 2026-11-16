import { canAct } from './fightActorState'
import { canStartFighterAttack } from './fighterAttacks'
import { futureAcceptsMove } from './parallelFutureAbility'
import { fightAcceptsCommands } from './fightOutcome'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { TrainingMeasurement } from './trainingTypes'

/** The first opportunity to start an ordinary attack, without using a cancel. */
export function trainingCanAct(fighter: ArcadeFighter): boolean {
  return fighter.attack === null && canAct(fighter) && canStartFighterAttack(fighter, 'light')
}

export function measureTrainingRecovery(before: FightState, after: FightState): FightState {
  if (!after.training || after.forecastSimulation) return after
  const contact = after.impact
  let measurement = after.training.measurement
  if (contact && contact.sequence !== before.impact?.sequence) {
    measurement =
      contact.avoided || contact.invulnerable
        ? undefined
        : {
            sequence: contact.sequence,
            attacker: contact.attacker,
            contactFrame: after.frame,
            blocked: contact.blocked,
            ready: {},
            status: 'pending',
          }
  }
  if (!measurement || measurement.status !== 'pending') return after
  measurement = advanceMeasurement(measurement, after)
  return { ...after, training: { ...after.training, measurement } }
}

function advanceMeasurement(sample: TrainingMeasurement, state: FightState): TrainingMeasurement {
  const ready = { ...sample.ready }
  for (const side of ['player', 'opponent'] as const)
    if (state.hitstop === 0 && ready[side] === undefined && availableInState(state, side))
      ready[side] = state.frame
  const defender = sample.attacker === 'player' ? 'opponent' : 'player'
  const attackerFrame = ready[sample.attacker]
  const defenderFrame = ready[defender]
  if (attackerFrame !== undefined && defenderFrame !== undefined)
    return { ...sample, ready, status: 'complete', advantage: defenderFrame - attackerFrame }
  // A permanent restraint, death or interrupted scenario has no finite recovery to report.
  const expired = state.frame - sample.contactFrame > 600 || state.phase !== 'fighting'
  return { ...sample, ready, status: expired ? 'interrupted' : 'pending' }
}

function availableInState(state: FightState, side: FightSide): boolean {
  return (
    fightAcceptsCommands(state) && futureAcceptsMove(state, side) && trainingCanAct(state[side])
  )
}
