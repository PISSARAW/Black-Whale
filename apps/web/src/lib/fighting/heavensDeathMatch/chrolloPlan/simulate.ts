import { headStriking, spendHead, stepHeads } from '../crowd/heads'
import { stepCrowd } from '../crowd/step'
import { stepHisokaBody } from '../hisokaPlan/body'
import { executeHisoka, type HisokaOutcome } from '../hisokaPlan/execute'
import { decideHisokaInHall } from '../hisokaPlan/hallTactics'
import type { CrowdState, DetachedHead } from '../crowd/types'
import { closeGalleryFake, pageActive, steerPuppets, triggerBombs } from '../puppets/pipeline'
import { advanceDeathMatch } from '../scenario'
import { advanceDamage, damageFromBlast, type Blast } from '../stands/damage'
import { FINAL_BLASTS, observedBeats } from './bridge'
import { executeChrollo, type ChrolloOutcome } from './execute'
import { decideChrollo, linkedBody, type ChrolloDecision } from './tactics'
import { hisokaSees, type DeathMatchWorld, type HisokaBody } from './world'

/** Bombs that must stand beside Hisoka before any of them detonates. */
export const BOMB_QUORUM = FINAL_BLASTS

export interface WorldFrame {
  world: DeathMatchWorld
  decision: ChrolloDecision
  outcome: ChrolloOutcome
  /** Every detonation of the frame: Chrollo's own and the bombs beside Hisoka. */
  blasts: readonly Blast[]
  /** A head thrown by Hisoka struck Chrollo this frame. */
  chrolloHit: DetachedHead | null
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

export interface WorldInput {
  /** Hisoka's body as the fight engine or the player moves it. */
  hisoka?: Partial<HisokaBody>
  /**
   * Beats the other side shows that the hall cannot see for itself: a player's Hisoka
   * until his moves are read. The scenario still checks each one.
   */
  reported?: readonly string[]
  /** Hisoka's own canonical plan plays him (CPU or scripted replay). */
  hisokaPlan?: boolean
  /** A human-controlled Hisoka is holding the dedicated hall action. */
  hisokaAction?: boolean
}

/** A head Hisoka threw that reached Chrollo this frame. */
function headOnChrollo(world: DeathMatchWorld): {
  world: DeathMatchWorld
  hit: DetachedHead | null
} {
  const head = headStriking(world.crowd, world.chrollo.at)
  if (!head) return { world, hit: null }
  return { world: { ...world, crowd: spendHead(world.crowd, head.id) }, hit: head }
}

function actHisoka(world: DeathMatchWorld, input: WorldInput): HisokaOutcome | null {
  return input.hisokaPlan || input.hisokaAction
    ? executeHisoka(world, decideHisokaInHall(world))
    : null
}

function moveCrowd(next: DeathMatchWorld): DeathMatchWorld {
  const steered = steerPuppets(next.crowd, {
    hisoka: next.hisoka.at,
    chrollo: next.chrollo.at,
    sun: linkedBody(next)?.at,
  })
  const stepped = stepCrowd(steered, {
    fighters: [next.hisoka.at, next.chrollo.at],
    focus: next.hisoka.at,
    damage: next.damage,
    rescue: next.scenario.done.includes('rescue-arrives'),
  })
  return { ...next, crowd: stepHeads(stepped, next.hisoka.at) }
}

/**
 * One frame of the canonical plan: Chrollo decides and acts, Hisoka too when his plan
 * plays him, puppets follow their orders, the crowd moves, bombs beside Hisoka go off,
 * his wounds and breath follow, and the scenario hears what the hall showed.
 */
export function stepDeathMatchWorld(world: DeathMatchWorld, input: WorldInput = {}): WorldFrame {
  const chrollo = { ...world.chrollo, withdrawal: Math.max(0, world.chrollo.withdrawal - 1) }
  const seen = { ...world, chrollo, hisoka: { ...world.hisoka, ...input.hisoka } }
  const decision = decideChrollo(seen)
  const outcome = executeChrollo(seen, decision)
  const settled = settleGallery(seen, outcome.world)
  const hisokaOutcome = actHisoka(settled, input)
  let next = moveCrowd(hisokaOutcome?.world ?? settled)
  const struck = headOnChrollo(next)
  next = struck.world
  // The last assault waits for the net to close, then every bomb beside him goes at once.
  // Once the ten-body net has closed, the mass detonation covers the whole three-metre
  // pocket around Hisoka; it does not wait for every body centre to overlap his model.
  const triggerDistance = next.scenario.done.includes('net-closes') ? 3 : undefined
  const bombs = triggerBombs(next.crowd, next.hisoka.at, BOMB_QUORUM, triggerDistance)
  const blasts = [...outcome.blasts, ...bombs.blasts]
  const damage = advanceDamage(bombs.blasts.reduce(damageFromBlast, next.damage))
  next = { ...next, crowd: bombs.crowd, damage }
  next = {
    ...next,
    crowd: revealBroken(next),
    hisoka: stepHisokaBody(next.hisoka, blasts, next.crowd),
  }
  const facts = {
    outcome,
    blasts,
    hisoka: hisokaOutcome?.intent ?? null,
    chrolloHit: struck.hit !== null,
    decision,
  }
  const beats = [...(input.reported ?? []), ...observedBeats(next, facts)]
  const diedAt = next.scenario.survival.deathFrame
  const narrativeFrame =
    diedAt !== null && next.hisoka.wounds.deadFor !== null
      ? diedAt + next.hisoka.wounds.deadFor
      : next.crowd.frame
  // Post-match rescue advances on narrative time (deadFor), while the fight itself uses
  // rendered crowd frames. Keeping the larger clock lets the short aftermath replay cross
  // the ten-minute rescue delay without simulating 36,000 empty visual frames.
  const eventFrame = Math.max(next.crowd.frame, next.scenario.frame, narrativeFrame)
  const scenario = beats.reduce(
    (state, beat) => advanceDeathMatch(state, { beat, frame: eventFrame }),
    next.scenario,
  )
  return { world: { ...next, scenario }, decision, outcome, blasts, chrolloHit: struck.hit }
}
