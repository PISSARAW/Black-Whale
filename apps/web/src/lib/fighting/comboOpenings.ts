import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'
import { rosterPhysicalBranch, ROSTER_TECHNIQUE_BRANCHES } from './rosterComboBranches'
import { WHIFF_PUNISH_VARIANTS } from './whiffPunishVariants'

export type ComboOpening = 'tip' | 'anti-air' | 'corner-counter' | 'whiff-punish'

type OpeningReward =
  | 'knockdown'
  | 'backfist'
  | 'chain'
  | 'attach'
  | 'tether'
  | 'short-burst'
  | 'long-burst'
  | 'low-burst'
  | 'advance'
  | 'sweep'
  | 'quick'
  | 'heavy'
  | 'technique'
type OpeningBranch = { slot: MoveSlot; reward: OpeningReward; advance?: true }

const PERSONAL_BRANCHES: Partial<
  Record<FighterId, Partial<Record<ComboOpening, readonly OpeningBranch[]>>>
> = {
  kurapika: {
    tip: [
      { slot: 'lowHeavy', reward: 'knockdown' },
      { slot: 'standingHeavy', reward: 'backfist', advance: true },
      { slot: 'forwardSpecial', reward: 'chain' },
    ],
    'whiff-punish': [
      { slot: 'lowHeavy', reward: 'knockdown', advance: true },
      { slot: 'standingHeavy', reward: 'backfist', advance: true },
      { slot: 'forwardSpecial', reward: 'chain' },
    ],
  },
  hisoka: {
    'corner-counter': [
      { slot: 'neutralSpecial', reward: 'attach' },
      { slot: 'finisher', reward: 'tether' },
    ],
    'whiff-punish': [
      { slot: 'lowHeavy', reward: 'knockdown', advance: true },
      { slot: 'neutralSpecial', reward: 'attach' },
      { slot: 'finisher', reward: 'tether' },
    ],
  },
  franklin: {
    tip: [
      { slot: 'forwardSpecial', reward: 'short-burst' },
      { slot: 'downSpecial', reward: 'low-burst' },
    ],
    'corner-counter': [
      { slot: 'forwardSpecial', reward: 'short-burst' },
      { slot: 'neutralSpecial', reward: 'long-burst' },
      { slot: 'downSpecial', reward: 'low-burst' },
    ],
    'whiff-punish': [
      { slot: 'standingHeavy', reward: 'advance', advance: true },
      { slot: 'forwardSpecial', reward: 'short-burst' },
      { slot: 'downSpecial', reward: 'low-burst' },
    ],
  },
}

type Contact = {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  position: { x: number }
  reach: number
  damage: number
  defence: { blocked: boolean; avoided: boolean }
  launch: boolean
  counter: boolean
  punish: boolean
  wall: boolean
  knockdown: boolean
  hits: number
}

/** The opening is earned on contact, before knockback changes the spacing. */
export function comboOpening(contact: Contact): ComboOpening | undefined {
  const { attacker } = contact
  if (!cleanOpener(contact) || attacker.y > 0) return
  if (contact.launch && usesSlot(attacker, 'standingHeavy')) return 'anti-air'
  if (contact.defender.y === 0) return groundedOpening(contact)
}

function cleanOpener(contact: Contact): boolean {
  return (
    contact.damage > 0 &&
    !contact.defence.blocked &&
    !contact.defence.avoided &&
    !contact.knockdown &&
    contact.hits === 1
  )
}

function groundedOpening(contact: Contact): ComboOpening | undefined {
  const { attacker, defender } = contact
  if (contact.counter && contact.wall && usesSlot(attacker, 'standingLight'))
    return 'corner-counter'
  if (!usesSlot(attacker, 'forwardLight') && !usesSlot(attacker, 'standingLight')) return
  if (
    contact.punish &&
    missedGroundStrike(defender) &&
    rosterPhysicalBranch(attacker.id, 'whiff-punish')
  )
    return 'whiff-punish'
  const distance = attacker.facing * (contact.position.x - attacker.x)
  if (distance >= contact.reach - 1.5) return 'tip'
}

function missedGroundStrike(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  return Boolean(
    attack &&
    (attack.kind === 'light' || attack.kind === 'heavy') &&
    attack.variant !== 'throw' &&
    attack.variant !== 'air' &&
    !attack.impacted &&
    !attack.projectileSpawned,
  )
}

function confirmedOpening(fighter: ArcadeFighter): ComboOpening | undefined {
  return fighter.attack?.confirmedHit ? fighter.attack.comboOpening : undefined
}

function signatureBranches(id: FighterId, opening: ComboOpening): readonly OpeningBranch[] {
  const personal = PERSONAL_BRANCHES[id]?.[opening]
  if (personal) return personal
  if (opening === 'whiff-punish') {
    const variant = WHIFF_PUNISH_VARIANTS[id]
    return variant && !variant.via ? [{ slot: variant.slot, reward: 'technique' }] : []
  }
  return ROSTER_TECHNIQUE_BRANCHES[id]?.[opening] ?? []
}

function openingBranches(fighter: ArcadeFighter, opening: ComboOpening): readonly OpeningBranch[] {
  const signatures = signatureBranches(fighter.id, opening)
  const physical = rosterPhysicalBranch(fighter.id, opening)
  if (!physical || signatures.some(({ slot }) => slot === physical.slot)) return signatures
  return [physical, ...signatures]
}

function physicalDestination(fighter: ArcadeFighter, opening: ComboOpening) {
  return `${fighter.id}:${opening === 'corner-counter' ? 'backHeavy' : 'forwardHeavy'}`
}

export function openingDestinations(fighter: ArcadeFighter): string[] {
  const opening = confirmedOpening(fighter)
  if (!opening) return []
  return [
    physicalDestination(fighter, opening),
    ...openingBranches(fighter, opening).map(({ slot }) => `${fighter.id}:${slot}`),
  ]
}

export function openingReward(fighter: ArcadeFighter, moveId: string): OpeningReward | undefined {
  const opening = confirmedOpening(fighter)
  if (!opening) return
  return openingBranches(fighter, opening).find(({ slot }) => `${fighter.id}:${slot}` === moveId)
    ?.reward
}

export function openingAllows(fighter: ArcadeFighter, moveId: string): boolean {
  const opening = confirmedOpening(fighter)
  return Boolean(
    opening && (physicalDestination(fighter, opening) === moveId || openingReward(fighter, moveId)),
  )
}

export function openingFollowup(fighter: ArcadeFighter, moveId?: string): ComboOpening | undefined {
  const opening = confirmedOpening(fighter)
  if (!opening || !moveId) return
  if (physicalDestination(fighter, opening) === moveId) return opening
  if (
    openingBranches(fighter, opening).some(
      ({ slot, advance }) => advance && `${fighter.id}:${slot}` === moveId,
    )
  )
    return opening
}

/** Only these physical follow-ups get support. Their recovery and damage stay intact. */
export function openingFrameData(data: AttackFrameData, opening?: ComboOpening): AttackFrameData {
  if (!opening) return data
  const startup = openingStartup(data.startup, opening)
  return {
    ...data,
    startup,
    lunge: data.lunge + (opening === 'corner-counter' ? 0 : 2),
    cancelEnd: data.cancelEnd - (data.startup - startup),
    box: opening === 'anti-air' ? { ...data.box, top: Math.max(data.box.top, 17) } : data.box,
  }
}

const STARTUP_CAP: Record<ComboOpening, number> = {
  tip: 10,
  'anti-air': 8,
  'corner-counter': 10,
  'whiff-punish': 12,
}

export function openingStartup(startup: number, opening?: ComboOpening): number {
  return opening ? Math.min(startup, STARTUP_CAP[opening]) : startup
}

function usesSlot(fighter: ArcadeFighter, slot: MoveSlot): boolean {
  return fighter.attack?.moveId === `${fighter.id}:${slot}`
}
