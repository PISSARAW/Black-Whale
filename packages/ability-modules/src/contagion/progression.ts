import { infectionStepsFrom, type InfectionStep, type MorenaGame } from './game.js'
import { KILL_VALUES, UNIQUE_ABILITY_LEVEL, killValue } from './limits.js'

export type VictimStatus = keyof typeof KILL_VALUES

export interface ContagionMember {
  memberId: string
  label: string
  level: number
  kills: number
  uniqueAbilityUnlocked: boolean
}

export interface InfectionProgress {
  witnessedMurder: boolean
  completedSteps: InfectionStep[]
  member: ContagionMember | null
}

export const EMPTY_INFECTION_PROGRESS: InfectionProgress = {
  witnessedMurder: false,
  completedSteps: [],
  member: null,
}

/** Records the post-game witness without manufacturing the other two conditions. */
export function witnessMurder(game: MorenaGame, progress: InfectionProgress): InfectionProgress {
  const witnessedMurder =
    !game.proxied && game.kissed && (game.verdict === 'infected' || game.verdict === 'forced')
  const next = { ...progress, witnessedMurder: progress.witnessedMurder || witnessedMurder }
  return { ...next, completedSteps: infectionStepsFrom(game, next) }
}

/** Creates the browser/branch member once all three canonical steps exist. */
export function completeRecruitment(
  game: MorenaGame,
  progress: InfectionProgress,
  identity: { memberId?: string; label?: string } = {},
): InfectionProgress {
  const completedSteps = infectionStepsFrom(game, progress)
  if (completedSteps.length !== 3) return { ...progress, completedSteps }
  return {
    ...progress,
    completedSteps,
    member:
      progress.member ??
      ({
        memberId: identity.memberId ?? 'local-player',
        label: identity.label ?? 'Vous',
        level: 0,
        kills: 0,
        uniqueAbilityUnlocked: false,
      } satisfies ContagionMember),
  }
}

/** Applies the same canon score as the engine's record-kill action. */
export function recordMemberKill(
  member: ContagionMember,
  victimStatus: VictimStatus,
): ContagionMember {
  const level = member.level + killValue(victimStatus)
  return {
    ...member,
    level,
    kills: member.kills + 1,
    uniqueAbilityUnlocked: member.uniqueAbilityUnlocked || level >= UNIQUE_ABILITY_LEVEL,
  }
}
