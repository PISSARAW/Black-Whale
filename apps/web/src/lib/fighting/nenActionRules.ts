import { hatsuFor } from './hatsu/registry'
import { retainedSoulBowReady } from './halkenburgSoulBow'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed, dolphinActor } from './kurapika'
import { stolenAuraActor } from './dolphinSupply'
import { moveById } from './movesets'
import { voluntaryNenAvailable } from './nenAccess'
import { melodyMusicIntent } from './melodyRules'
import { nenCognitiveAllows } from './nenCognitiveLoad'
import type { ArcadeFighter, AttackKind, FightSide, FightState, FighterId } from './types'

interface NenAction {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}

const NEN_RANGED: readonly FighterId[] = ['leorio', 'machi', 'franklin', 'bonolenov', 'kalluto']

/** Shared admission check, including the direct/AI and buffered execution paths. */
export function nenActionAllowed(options: NenAction): boolean {
  const fighter = dolphinCommandActor(options)
  const move = moveById(options.moveId)
  if (move && (move.id.split(':')[0] !== fighter.id || move.kind !== options.kind)) return false
  if (passiveNenCommand(options, fighter)) return true
  const allowVoluntaryZetsu = futureZetsuCommand(options, fighter)
  return (
    voluntaryNenAvailable(fighter, { allowVoluntaryZetsu }) &&
    !chainAbilitySealed(fighter, nenMoveId(fighter, options)) &&
    nenCognitiveAllows(options.state, options.side, options)
  )
}

function futureZetsuCommand(options: NenAction, fighter: ArcadeFighter): boolean {
  if (options.state.parallelFuture?.owner === options.side && fighter.parallelEyesClosed)
    return true
  return Boolean(
    fighter.futureIllusionActive &&
    options.kind === 'special' &&
    options.moveId === 'tserriednich:neutralSpecial',
  )
}

function passiveNenCommand(options: NenAction, fighter: ArcadeFighter): boolean {
  return (
    finishedDolphinCommand(options) ||
    Boolean(
      fighter.melodyPerformance && melodyMusicIntent(fighter, options.kind, options.moveId),
    ) ||
    !usesVoluntaryNen(fighter, options)
  )
}

function finishedDolphinCommand(options: NenAction): boolean {
  const fighter = options.state[options.side]
  return (
    fighter.id === 'kurapika' &&
    options.moveId === 'kurapika:backSpecial' &&
    Boolean(fighter.kurapika?.held?.used)
  )
}

function dolphinCommandActor(options: NenAction): ArcadeFighter {
  const fighter = options.state[options.side]
  if (
    fighter.id !== 'kurapika' ||
    options.moveId !== 'kurapika:backSpecial' ||
    !fighter.kurapika?.held?.loaded
  )
    return fighter
  const actor = stolenAuraActor(fighter)
  return fighter.kurapika.held.used ? { ...actor, auraExhausted: false } : actor
}

export function usesVoluntaryNen(
  fighter: ArcadeFighter,
  action: Pick<NenAction, 'kind' | 'moveId'>,
): boolean {
  if (action.kind === 'ranged') return NEN_RANGED.includes(fighter.id)
  if (action.kind !== 'special') return false
  if (fighter.id === 'chrollo') return true
  const hatsu = hatsuFor(fighter.id)
  if (hatsu.martialOnly) return preparedUtility(fighter.id, action.moveId)
  return !hatsu.sourceFor || hatsu.sourceFor(fighter, action.moveId) !== null
}

function preparedUtility(id: FighterId, moveId?: string): boolean {
  return (
    ['sayird', 'cluck', 'bill', 'luini'].includes(id) &&
    (!moveId ||
      [`${id}:neutralSpecial`, 'sayird:littleEye', 'cluck:birdManipulation'].includes(moveId))
  )
}

function nenMoveId(
  fighter: ArcadeFighter,
  action: Pick<NenAction, 'kind' | 'moveId'>,
): string | undefined {
  if (action.kind !== 'ranged') return action.moveId
  return fighter.id === 'machi' ? `${fighter.id}:forwardSpecial` : `${fighter.id}:neutralSpecial`
}

/** Cancel a maintained action when its access is lost; released projectiles stay independent. */
export function interruptUnavailableNen(fighter: ArcadeFighter): ArcadeFighter {
  const attack = fighter.attack
  if (!attack?.hatsuSource) return fighter
  if (attack.moveId === 'halkenburg:neutralSpecial' && retainedSoulBowReady(fighter)) return fighter
  const actor = dolphinActor(fighter)
  if (
    voluntaryNenAvailable(actor) &&
    !chainAbilitySealed(actor, attack.moveId) &&
    copiedPageActive(actor, attack.hatsuSource) &&
    (!attack.copiedPage || chrolloHasActivePage(fighter, attack.copiedPage))
  )
    return fighter
  return { ...fighter, attack: null, bufferedAttack: null, hatsuChargeFrames: 0 }
}

function copiedPageActive(fighter: ArcadeFighter, source: FighterId): boolean {
  return fighter.id !== 'chrollo' || source === 'chrollo' || chrolloHasActivePage(fighter, source)
}
