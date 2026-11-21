import { stepCrowd } from '../crowd/step'
import type { CrowdState } from '../crowd/types'
import { closeGalleryFake, pageActive, steerPuppets, triggerBombs } from '../puppets/pipeline'
import { advanceDeathMatch } from '../scenario'
import { advanceDamage, damageFromBlast } from '../stands/damage'
import { FINAL_BLASTS, observedBeats } from './bridge'
import { executeChrollo, type ChrolloOutcome } from './execute'
import { decideChrollo, type ChrolloDecision } from './tactics'
import { hisokaSees, type DeathMatchWorld, type HisokaBody } from './world'

/** Bombs that must stand beside Hisoka before any of them detonates. */
export const BOMB_QUORUM = FINAL_BLASTS

export interface WorldFrame {
  world: DeathMatchWorld
  decision: ChrolloDecision
  outcome: ChrolloOutcome
}

/** Copies Hisoka watches break or vanish no longer pass for people in his eyes. */
function revealBroken(world: DeathMatchWorld): CrowdState {
  const spectators = world.crowd.spectators.map((spectator) =>
    spectator.nature === 'copy' &&
    !spectator.revealedToHisoka &&
    (spectator.posture === 'dead' || spectator.posture === 'vanished') &&
    hisokaSees(world, spectator.at)
      ? { ...spectator, revealedToHisoka: true }
      : spectator,
  )
  return { ...world.crowd, spectators }
}

function settleGallery(before: DeathMatchWorld, after: DeathMatchWorld): DeathMatchWorld {
  const closed =
    pageActive(before.chrollo.book, 'gallery-fake') &&
    !pageActive(after.chrollo.book, 'gallery-fake')
  return closed ? { ...after, crowd: closeGalleryFake(after.crowd) } : after
}

/**
 * One frame of the canonical plan: Chrollo decides and acts, puppets follow their orders,
 * the crowd moves, bombs beside Hisoka go off, and the scenario hears what the hall showed.
 */
export interface WorldInput {
  /** Hisoka's body as the fight engine or the player moves it. */
  hisoka?: Partial<HisokaBody>
  /**
   * Beats the other side shows: Hisoka's own moves and wounds measured by the fight
   * engine (hand, leg, burial). The scenario still checks each one.
   */
  reported?: readonly string[]
}

export function stepDeathMatchWorld(world: DeathMatchWorld, input: WorldInput = {}): WorldFrame {
  const chrollo = { ...world.chrollo, withdrawal: Math.max(0, world.chrollo.withdrawal - 1) }
  const seen = { ...world, chrollo, hisoka: { ...world.hisoka, ...input.hisoka } }
  const decision = decideChrollo(seen)
  const outcome = executeChrollo(seen, decision)
  let next = settleGallery(seen, outcome.world)
  const steered = steerPuppets(next.crowd, { hisoka: next.hisoka.at, chrollo: next.chrollo.at })
  const stepped = stepCrowd(steered, {
    fighters: [next.hisoka.at, next.chrollo.at],
    focus: next.hisoka.at,
    damage: next.damage,
    rescue: next.scenario.done.includes('rescue-arrives'),
  })
  // The last assault waits for the net to close, then every bomb beside him goes at once.
  const bombs = triggerBombs(stepped, next.hisoka.at, BOMB_QUORUM)
  const damage = advanceDamage(bombs.blasts.reduce(damageFromBlast, next.damage))
  next = { ...next, crowd: bombs.crowd, damage }
  next = { ...next, crowd: revealBroken(next) }
  const blasts = outcome.blast ? [outcome.blast, ...bombs.blasts] : bombs.blasts
  const beats = [...(input.reported ?? []), ...observedBeats(next, { outcome, blasts })]
  const scenario = beats.reduce(
    (state, beat) => advanceDeathMatch(state, { beat, frame: next.crowd.frame }),
    next.scenario,
  )
  return { world: { ...next, scenario }, decision, outcome }
}
