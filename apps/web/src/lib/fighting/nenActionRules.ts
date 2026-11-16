import { hatsuFor } from './hatsu/registry'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { moveById } from './movesets'
import { voluntaryNenAvailable } from './nenAccess'
import { melodyMusicIntent } from './melodyRules'
import type { ArcadeFighter, AttackKind, FightSide, FightState, FighterId } from './types'

interface NenAction {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}

const NEN_RANGED: readonly FighterId[] = [
  'kurapika',
  'leorio',
  'machi',
  'franklin',
  'bonolenov',
  'kalluto',
]

/** Shared admission check, including the direct/AI and buffered execution paths. */
export function nenActionAllowed(options: NenAction): boolean {
  const fighter = options.state[options.side]
  const move = moveById(options.moveId)
  if (move && (move.id.split(':')[0] !== fighter.id || move.kind !== options.kind)) return false
  if (fighter.melodyPerformance && melodyMusicIntent(fighter, options.kind, options.moveId))
    return true
  if (!usesVoluntaryNen(fighter, options)) return true
  const allowVoluntaryZetsu =
    options.state.parallelFuture?.owner === options.side && fighter.parallelEyesClosed === true
  return (
    voluntaryNenAvailable(fighter, { allowVoluntaryZetsu }) &&
    !chainAbilitySealed(fighter, nenMoveId(fighter, options))
  )
}

function usesVoluntaryNen(
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
  return ['kurapika', 'machi'].includes(fighter.id)
    ? `${fighter.id}:forwardSpecial`
    : `${fighter.id}:neutralSpecial`
}

/** Cancel a maintained action when its access is lost; released projectiles stay independent. */
export function interruptUnavailableNen(fighter: ArcadeFighter): ArcadeFighter {
  const attack = fighter.attack
  if (!attack?.hatsuSource) return fighter
  if (
    voluntaryNenAvailable(fighter) &&
    !chainAbilitySealed(fighter, attack.moveId) &&
    copiedPageActive(fighter, attack.hatsuSource)
  )
    return fighter
  return { ...fighter, attack: null, bufferedAttack: null, hatsuChargeFrames: 0 }
}

function copiedPageActive(fighter: ArcadeFighter, source: FighterId): boolean {
  return fighter.id !== 'chrollo' || source === 'chrollo' || chrolloHasActivePage(fighter, source)
}
