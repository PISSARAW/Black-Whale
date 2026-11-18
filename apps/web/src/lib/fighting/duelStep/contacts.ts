import { advanceMachiCorpses } from '../machiCorpses'
import { advanceBenjaminToxin } from '../benjaminToxin'
import { advanceRosterGuestActors, armRosterGuests } from '../rosterGuestActors'
import {
  resolveGuestFirstContacts,
  resolveRosterGuestContacts,
  resolveRosterProjectileHits,
} from '../rosterGuestContacts'
import { flushBufferedCancel } from '../bufferedCancel'
import { collideArenaBodies, resolveArenaStrikes } from '../arenaSimulation'
import { resolveFighterSpeech } from '../battleConversation'
import { reconcileBattleCantabile } from '../battleCantabileFrame'
import { canAct } from '../fightActorState'
import { resolveCrossGameMovement } from '../crossGameAction'
import { resolvePredatorThreats } from '../predatorCombat'
import { reconcileMelodySound } from '../melodyChannel'
import { advanceMelodyHearing } from '../melodyHearing'
import { fightResolutionPending } from '../fightOutcome'
import { resolveJudgmentDeaths } from '../kurapikaActions'
import { withDolphinIdentity } from '../kurapikaDolphin'
import { recordFightInjuries } from '../feitanPain'
import { FIXED_STEP } from '../fightClock'
import { advanceHatsuFrames } from '../hatsu'
import { advanceHistoricalWeapons } from '../historicalWeaponFrame'
import { resolveOnImpacts } from '../onTechnique'
import { advanceProjectiles, spawnRangedProjectiles } from '../projectiles'
import { resolveFightImpacts } from '../combatImpact'
import { separateFighterPushboxes } from '../fighterPhysics'
import type { FightSide, FightState } from '../types'
import type { DuelAttack, DuelBodies, DuelInputs, DuelPhaseResult } from './types'

export interface SettleBodiesFrame {
  /** World at the start of the frame, after the shared clocks. */
  start: FightState
  moved: DuelBodies
  inputs: DuelInputs
}

/**
 * Bodies meet the world: arena collision, judgments, speech, buffered commands and
 * Hatsu clocks. Still mixes per-body work with the duel pair (see KAMEOS.md, lot 3).
 */
export function settleBodies(frame: SettleBodiesFrame, attack: DuelAttack): DuelPhaseResult {
  const { start, moved, inputs } = frame
  const judged = resolveJudgmentDeaths(
    resolveCrossGameMovement(start, collideArenaBodies(start, { ...start, ...moved })),
  )
  if (fightResolutionPending(judged)) return { state: judged, pending: true }
  const spoken = resolveFighterSpeech(judged, inputs.player, inputs.opponent)
  const buffered = flushBuffered(flushBuffered(spoken, 'player', attack), 'opponent', attack)
  const withHatsu = advanceRosterGuestActors(
    advanceMelodyHearing(
      advanceMachiCorpses(
        advanceHatsuFrames(advanceBenjaminToxin(advanceHistoricalWeapons(buffered))),
      ),
    ),
    attack,
  )
  if (fightResolutionPending(withHatsu))
    return { state: recordFightInjuries(start, withHatsu), pending: true }
  return { state: withHatsu, pending: false }
}

/** Pair phase: strikes, projectiles, impacts and pushboxes between the two bodies. */
export function resolveContacts(start: FightState, settled: FightState): DuelPhaseResult {
  const armed = resolveGuestFirstContacts(
    armRosterGuests(resolveArenaStrikes(withDolphinIdentity(settled, spawnRangedProjectiles))),
  )
  const flight = advanceProjectiles(resolvePredatorThreats(armed), FIXED_STEP)
  const resolved = reconcileBattleCantabile(
    reconcileMelodySound(
      recordFightInjuries(
        start,
        resolveOnImpacts(
          flight.state,
          resolveRosterGuestContacts(
            resolveFightImpacts(
              resolveRosterProjectileHits(flight.state, flight.hits),
              flight.hits.filter((hit) => !hit.targetBody && !hit.projectile.sourceBody),
            ),
          ),
        ),
      ),
    ),
  )
  if (fightResolutionPending(resolved)) return { state: resolved, pending: true }
  const separated = separateFighterPushboxes(resolved.player, resolved.opponent)
  return { state: { ...resolved, ...separated }, pending: false }
}

function flushBuffered(state: FightState, side: FightSide, attack: DuelAttack): FightState {
  const canceled = flushBufferedCancel(state, side, attack)
  if (canceled) return canceled
  const fighter = state[side]
  const intent = fighter.bufferedAttack
  if (!intent || fighter.attack || !canAct(fighter)) return state
  const cleared = { ...state, [side]: { ...fighter, bufferedAttack: null } }
  return attack({ state: cleared, side, ...intent })
}
