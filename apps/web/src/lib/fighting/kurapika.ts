import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import { judgmentForbidsNen } from './judgmentRules'
import { chainAbilityGroup } from './chainAbilityGroup'
export { chainAbilityGroup } from './chainAbilityGroup'
import { voluntaryNenAvailable } from './nenAccess'
import { abilityCategoryEfficiency } from './nenCategories'
import { transitionNen } from '@black-whale/nen-engine'
import { outsideDuelAbility } from './outsideDuelAbility'
import { dolphinMissingBattleBody } from './battleCantabileRules'
import { requestsZetsu } from './fightInputTypes'
import type { ArcadeFighter, FightInput, FightSide, FighterId } from './types'

export interface StolenChainAbility {
  theftId?: string
  /** The original Hatsu is already usable again; the equipped device can still await dismissal. */
  returned?: boolean
  victim: FightSide
  victimMember?: number
  auraSupply?: import('./dolphinAura').DolphinAuraSupply
  source: FighterId
  moveId: string
  loaded: boolean
  used: boolean
  /** Effects created by this single use must finish before Dolphin can be dismissed. */
  lentTo?: string
  sustainedKeys: string[]
}

export interface KurapikaState {
  emperorTime: boolean
  /** Confirmed Chain Jail vow breach; retained after the verdict, reset with the round. */
  vowBroken?: boolean
  /** Integer simulation frames: 60 spent frames = one hour of lifespan lost. */
  lifespanFrames: number
  continuousFrames: number
  blackoutFrames: number
  held: StolenChainAbility | null
}

export const EMPEROR_BLACKOUT_THRESHOLD = 3 * 60 * 60 * 60
export const EMPEROR_BLACKOUT_FRAMES = 9 * 60 * 60 * 60
export const STEAL_DRAIN_PER_SECOND = 40
export const STEAL_TETHER_RANGE = 24

export function createKurapika(): KurapikaState {
  return {
    emperorTime: false,
    lifespanFrames: 0,
    continuousFrames: 0,
    blackoutFrames: 0,
    held: null,
  }
}

export function kurapikaNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter)
}

export function chainsImmobilize(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.chainJail || (fighter.kurapika?.blackoutFrames ?? 0) > 0)
}

export function kurapikaMoveAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  if (chainAbilitySealed(fighter, moveId)) return false
  if (chainsImmobilize(fighter)) return false
  if (!moveId?.startsWith('kurapika:')) return true
  if (fighter.id !== 'kurapika') return false
  if (!kurapikaNenActive(fighter))
    return ![
      'kurapika:neutralSpecial',
      'kurapika:forwardSpecial',
      'kurapika:downSpecial',
      'kurapika:backSpecial',
      'kurapika:finisher',
    ].includes(moveId)
  return kurapikaHeldMoveAvailable(fighter, moveId)
}

function kurapikaHeldMoveAvailable(fighter: ArcadeFighter, moveId: string): boolean {
  if (fighter.hanzoProjection && moveId !== 'kurapika:backSpecial')
    return !/Special$|:finisher$/.test(moveId)
  if (moveId === 'kurapika:finisher') return Boolean(fighter.kurapika?.emperorTime)
  if (moveId === 'kurapika:backSpecial' && fighter.kurapika?.held)
    return heldChainAvailable(fighter)
  return true
}

function heldChainAvailable(fighter: ArcadeFighter): boolean {
  const chain = fighter.kurapika!
  return chain.emperorTime && !dolphinMissingBattleBody(fighter)
}

/** Emperor Time changes efficiency at the attained level, never mastery or aura reserves. */
export function kurapikaEfficiency(
  fighter: ArcadeFighter,
  category: 'enhancer' | 'emitter',
): number {
  return abilityCategoryEfficiency(fighter, category)
}

export function chainAbilitySealed(fighter: ArcadeFighter, moveId?: string): boolean {
  const selected = moveId ?? `${fighter.id}:neutralSpecial`
  if (borrowedChainChannel(fighter, selected)) return false
  if (
    fighter.skillHunterStolen?.some(
      (entry) => chainAbilityGroup(entry.moveId) === chainAbilityGroup(selected),
    )
  )
    return true
  const stolen = fighter.stolenChainAbility
  if (!stolen) return false
  if (outsideDuelAbility(stolen.moveId)) return selected === stolen.moveId
  if (!/:(neutralSpecial|forwardSpecial|downSpecial|backSpecial|finisher)$/.test(selected))
    return false
  return chainAbilityGroup(stolen.moveId) === chainAbilityGroup(selected)
}

function borrowedChainChannel(fighter: ArcadeFighter, selected: string): boolean {
  const held = fighter.kurapika?.held
  return Boolean(
    fighter.dolphinExecution &&
    held &&
    chainAbilityGroup(held.moveId) === chainAbilityGroup(selected),
  )
}

export function zetsuFighter(fighter: ArcadeFighter): ArcadeFighter {
  return { ...fighter, nen: transitionNen(fighter.nen, { type: 'ZETSU' }).state }
}

/** Neutral input obeys the announced Judgment rule; deliberate aura use breaks it. */
export function judgmentInput(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (!judgmentForbidsNen(fighter)) return fighter
  if (judgmentNenInput(fighter, input))
    return { ...fighter, health: 0, attack: null, bufferedAttack: null }
  return zetsuFighter(fighter)
}

export function isKurapikaUtility(fighter: ArcadeFighter): boolean {
  return fighter.attack?.moveId === 'kurapika:downSpecial'
}

export function dolphinActor(fighter: ArcadeFighter): ArcadeFighter {
  const held = equippedDolphin(fighter)
  return held?.used && !held.returned && dolphinAttackMatches(fighter, held)
    ? stolenAuraActor({
        ...loanCarrier(fighter),
        id: held.source,
        nenOwner: fighter.nenOwner ?? fighter.id,
      })
    : fighter
}
function dolphinAttackMatches(fighter: ArcadeFighter, held: StolenChainAbility): boolean {
  const origin = fighter.attack?.nenOrigin
  if (!origin?.source) return fighter.attack?.moveId === held.moveId
  return (
    origin.source === 'dolphin' &&
    origin.theftId === held.theftId &&
    chainAbilityGroup(fighter.attack?.moveId ?? '') === chainAbilityGroup(held.moveId)
  )
}

export function restrictedChainAura(
  fighter: ArcadeFighter,
  input: FightInput,
): ArcadeFighter | null {
  if (
    chainsImmobilize(fighter) ||
    fighter.drainingChain ||
    fighter.hatsuEffects.forcedZetsuFrames > 0
  )
    return zetsuFighter(fighter)
  if (judgmentForbidsNen(fighter)) return judgmentInput(fighter, input)
  return null
}

function judgmentNenInput(fighter: ArcadeFighter, input: FightInput): boolean {
  if (
    !voluntaryNenAvailable(fighter, {
      allowVoluntaryZetsu: true,
      requireHatsu: false,
      requireReserve: true,
    })
  )
    return false
  if (requestsZetsu(input)) return false
  if (input.aura) return true
  if (fighter.hitStun > 0 || fighter.knockdownFrames > 0) return false
  return [
    input.gyo,
    input.lowGyoIntent,
    input.onIntent,
    input.en,
    input.shu,
    input.conceal,
    input.focusHead,
    input.focusTorso,
    input.focusHands,
    input.focusFeet,
  ].some(Boolean)
}
