import { physicalHandOccupancy } from './deviceHands'
import { writingHandsFree, writingPaperExists } from './bashoMaterials'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { hatsuDefenceFactor } from './hatsu'
import { nenDamageFactor } from './nen'
import {
  BASHO_FIRE_FRAMES,
  BASHO_FIRE_INTERVAL,
  bashoWriting,
  bashoEffectPoem,
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
  const poem = bashoEffectPoem(fighter, 'ignite-punched-target')
  if (!poem?.ready || !hasBashoPoem(fighter, poem.sourceMoveId, poem.loan)) return after
  if (!punchContact(fighter, after) || physicalHandOccupancy(before, side).size >= 2) return after
  const target = side === 'player' ? 'opponent' : 'player'
  return {
    ...after,
    [target]: { ...after[target], bashoBurn: { owner: side, remainingFrames: BASHO_FIRE_FRAMES } },
  }
}

function punchContact(fighter: ArcadeFighter, state: FightState): boolean {
  const impact = state.impact
  if (!impact || impact.avoided || impact.parried || impact.projectileId !== null) return false
  return bashoFistAttack(fighter)
}
export function bashoFistAttack(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack || !['light', 'heavy'].includes(attack.kind)) return false
  if (!attack.moveId) return attack.kind === 'light' && attack.variant !== 'throw'
  return PUNCH_SLOTS.some((slot) => attack.moveId!.endsWith(`:${slot}`))
}

export function advanceBashoPoems(state: FightState): FightState {
  if (state.phase !== 'fighting' || state.catsName) return state
  let next = {
    ...state,
    player: advancePoem(state, 'player'),
    opponent: advancePoem(state, 'opponent'),
  }
  for (const side of ['player', 'opponent'] as const) next = advanceBurn(next, side)
  return resolveFightOutcome(next)
}

function advancePoem(state: FightState, side: FightSide): ArcadeFighter {
  let fighter = state[side]
  fighter = maintainPoemArchive(state, fighter)
  const poem = fighter.bashoPoem
  if (!poem) return fighter
  if (
    !hasBashoPoem(fighter, poem.sourceMoveId, poem.loan) ||
    !writingPaperExists(state, poem.paperCopyId)
  )
    return { ...fighter, bashoPoem: undefined }
  if (!bashoWriting(fighter)) return fighter
  if (
    !writingBodyAvailable(fighter) ||
    !writingHandsFree(state, side) ||
    fighter.x !== poem.originX
  )
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

function maintainPoemArchive(state: FightState, fighter: ArcadeFighter): ArcadeFighter {
  const live = fighter.bashoArchive?.filter(
    (poem) =>
      hasBashoPoem(fighter, poem.sourceMoveId, poem.loan) &&
      writingPaperExists(state, poem.paperCopyId),
  )
  const archive = live?.length ? live : undefined
  return archive?.length !== fighter.bashoArchive?.length
    ? { ...fighter, bashoArchive: archive }
    : fighter
}
