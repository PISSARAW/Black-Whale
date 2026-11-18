import { recordFightDeath } from './fightDeaths'
import { bashoQuestionCurrent } from './bashoInterrogation'
import { resolveFightOutcome } from './fightOutcome'
import { hatsuDefenceFactor } from './hatsu'
import { nenDamageFactor } from './nen'
import {
  BASHO_FIRE_FRAMES,
  BASHO_FIRE_INTERVAL,
  bashoWriting,
  hasBashoPoem,
  writingBodyAvailable,
} from './bashoPoem'
import type { ArcadeFighter, FightSide, FightState } from './types'

const PUNCH_SLOTS = ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'airLight']

/** Only an actual, non-parried fist contact satisfies this poem. No bonus to kicks or shots. */
export function resolveBashoPoemImpact(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  const fighter = before[side]
  const poem = fighter.bashoPoem
  if (
    !poem?.ready ||
    poem.effect !== 'ignite-punched-target' ||
    !hasBashoPoem(fighter, poem.sourceMoveId)
  )
    return after
  if (!punchContact(fighter, after)) return after
  const target = side === 'player' ? 'opponent' : 'player'
  return {
    ...after,
    [target]: { ...after[target], bashoBurn: { owner: side, remainingFrames: BASHO_FIRE_FRAMES } },
  }
}

function punchContact(fighter: ArcadeFighter, state: FightState): boolean {
  const impact = state.impact
  if (!impact || impact.avoided || impact.parried || impact.projectileId !== null) return false
  const attack = fighter.attack
  if (!attack || !['light', 'heavy'].includes(attack.kind)) return false
  if (!attack.moveId) return attack.kind === 'light' && attack.variant !== 'throw'
  return PUNCH_SLOTS.some((slot) => attack.moveId!.endsWith(`:${slot}`))
}

export function advanceBashoPoems(state: FightState): FightState {
  if (state.phase !== 'fighting' || state.catsName) return state
  let next = { ...state, player: advancePoem(state.player), opponent: advancePoem(state.opponent) }
  for (const side of ['player', 'opponent'] as const) next = advanceBurn(next, side)
  for (const side of ['player', 'opponent'] as const)
    if (next[side].bashoPrompt && !bashoQuestionCurrent(next, side))
      next = { ...next, [side]: { ...next[side], bashoPrompt: undefined } }
  return resolveFightOutcome(next)
}

function advancePoem(fighter: ArcadeFighter): ArcadeFighter {
  const poem = fighter.bashoPoem
  if (!poem) return fighter
  if (!hasBashoPoem(fighter, poem.sourceMoveId)) return { ...fighter, bashoPoem: undefined }
  if (!bashoWriting(fighter)) return fighter
  if (!writingBodyAvailable(fighter) || fighter.x !== poem.originX)
    return { ...fighter, bashoPoem: undefined }
  const writingFrames = poem.writingFrames - 1
  return { ...fighter, bashoPoem: { ...poem, writingFrames, ready: writingFrames === 0 } }
}

function advanceBurn(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const burn = fighter.bashoBurn
  if (!burn) return state
  const remainingFrames = burn.remainingFrames - 1
  const pulse = remainingFrames % BASHO_FIRE_INTERVAL === 0
  const damage = pulse
    ? Math.max(0, Math.round(2 * nenDamageFactor(fighter, 'torso') * hatsuDefenceFactor(fighter)))
    : 0
  const next = {
    ...state,
    [side]: {
      ...fighter,
      health: Math.max(0, fighter.health - damage),
      bashoBurn: remainingFrames > 0 ? { ...burn, remainingFrames } : undefined,
    },
  }
  return recordFightDeath(next, { victimSide: side, killerSide: burn.owner, cause: 'heat' })
}
