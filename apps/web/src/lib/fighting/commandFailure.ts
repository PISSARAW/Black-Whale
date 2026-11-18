import { attackAuraCost } from './fightAttackCost'
import { nenActionAllowed } from './nenActionRules'
import { preparationCheck } from './preparationRequirements'
import { moveById, moveForAction } from './movesets'
import { fightAcceptsCommands } from './fightOutcome'
import { HANZO_BODY_REACH } from './hanzoProjection'
import { SUPER_THROW_COST } from './superThrow'
import { voluntaryNenAvailable } from './nenAccess'
import type { CommandIntent } from './commandFeedback'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

export type CommandFailure =
  | 'phase'
  | 'stun'
  | 'recovery'
  | 'hands'
  | 'nen'
  | 'aura'
  | 'equipment'
  | 'preparation'
  | 'range'
  | 'condition'

/** Explain a refused attempt using the actor's body and known prerequisites, never enemy secrets. */
export function commandFailure(state: FightState, intent: CommandIntent): CommandFailure {
  if (!fightAcceptsCommands(state)) return 'phase'
  const fighter = state[intent.side]
  const body = bodyFailure(fighter)
  if (body) return body
  if (intent.action === 'utility') return 'condition'
  return techniqueFailure(state, intent)
}

function selectedCommand(fighter: ArcadeFighter, intent: CommandIntent) {
  const move = intent.moveId
    ? moveById(intent.moveId)
    : intent.action === 'ranged' || intent.action === 'utility'
      ? null
      : moveForAction(fighter, intent.action, intent.input ?? EMPTY_INPUT)
  return { kind: move?.kind ?? fallbackKind(intent.action), moveId: intent.moveId ?? move?.id }
}

function fallbackKind(action: CommandIntent['action']) {
  if (action === 'finisher' || action === 'utility') return 'special'
  return action === 'throw' ? 'heavy' : action
}

function techniqueFailure(state: FightState, intent: CommandIntent): CommandFailure {
  const fighter = state[intent.side]
  const grab = superThrowFailure(fighter, intent)
  if (grab) return grab
  const { kind, moveId } = selectedCommand(fighter, intent)
  if (!nenActionAllowed({ state, side: intent.side, kind, moveId })) return 'nen'
  if (kind === 'special') {
    const required = preparationFailure(state, { ...intent, moveId })
    if (required) return required
    if (farFromOwnBody(fighter)) return 'range'
  }
  const cost = attackAuraCost({
    fighter,
    kind,
    moveId,
    concealed: kind === 'special' && fighter.nen.in,
  })
  return fighter.aura < cost ? 'aura' : 'condition'
}

function superThrowFailure(fighter: ArcadeFighter, intent: CommandIntent): CommandFailure | null {
  if (fighter.id !== 'bonolenov' || intent.action !== 'throw' || !intent.input?.aura) return null
  if (!voluntaryNenAvailable(fighter, { requireHatsu: false })) return 'nen'
  return fighter.aura < SUPER_THROW_COST ? 'aura' : null
}

function bodyFailure(fighter: ArcadeFighter): CommandFailure | null {
  if (fighter.coveringEars || fighter.pluggingWounds || fighter.melodyPerformance) return 'hands'
  if (
    fighter.health <= 0 ||
    Math.max(fighter.hitStun, fighter.blockStun, fighter.knockdownFrames) > 0
  )
    return 'stun'
  if (fighter.attack || fighter.throwTechRecoveryFrames || fighter.arenaRecovery) return 'recovery'
  return null
}

function preparationFailure(state: FightState, intent: CommandIntent): CommandFailure | null {
  const missing = preparationCheck(state, intent.side, intent.moveId)
    .requirements.filter((entry) => !entry.satisfied)
    .map((entry) => entry.id)
  if (missing.some((id) => ['needles', 'flute', 'book'].includes(id))) return 'equipment'
  if (missing.includes('free-hands')) return 'hands'
  if (missing.some((id) => ['small-animal', 'bird', 'living-target', 'room-interior'].includes(id)))
    return 'range'
  return missing.length ? 'preparation' : null
}

function farFromOwnBody(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.hanzoProjection &&
    (Math.abs(fighter.x - fighter.hanzoProjection.bodyX) > HANZO_BODY_REACH ||
      fighter.y > HANZO_BODY_REACH),
  )
}
