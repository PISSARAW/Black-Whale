import { collideArenaBodies, resolveArenaStrikes } from './arenaSimulation'
import { withDolphinIdentity } from './kurapikaDolphin'
import { advanceLoanGuest, cancelLoanGuest } from './dolphinLoan'
import { updateControlledFighter } from './duelStep/actors'
import { canAct } from './fightActorState'
import { blackVoiceAvailable } from './blackVoiceControl'
import {
  guestProjection,
  mergeGuestProjection,
  storeRosterGuest,
  type RosterGuest,
} from './rosterGuests'
import { spawnRangedProjectiles } from './projectiles'
import { poseFighter } from './fightActorPose'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'
import type { DuelAttack } from './duelStep/types'

export function advanceRosterGuestActors(state: FightState, attack: DuelAttack): FightState {
  let next = state
  for (const guest of state.rosterGuests ?? []) next = advanceGuest(next, guest, attack)
  return next
}

function advanceGuest(state: FightState, original: RosterGuest, attack: DuelAttack): FightState {
  if (original.phase === 'eliminated') return state
  if (original.fighter.health <= 0) return removeDeadGuest(state, original, attack)
  const guest = {
    ...original,
    frames: original.frames + 1,
    cooldown: Math.max(0, original.cooldown - 1),
  }
  if (guestMustLeave(state, guest)) return leaveGuest(state, guest)
  if (guest.phase === 'preparing') return prepareGuest(state, guest)
  return actGuest(state, guest, attack)
}
function removeDeadGuest(state: FightState, guest: RosterGuest, attack: DuelAttack): FightState {
  const ended = cancelLoanGuest(state, guest, attack)
  const current = ended.rosterGuests!.find((entry) => entry.id === guest.id)!
  return storeRosterGuest(ended, { ...current, phase: 'eliminated' })
}
function guestMustLeave(state: FightState, guest: RosterGuest): boolean {
  const controlled = guest.role === 'loan' || blackVoiceAvailable(state, guest.owner)
  return !controlled || state[guest.owner].health <= 0 || guest.phase === 'leaving'
}
function prepareGuest(state: FightState, guest: RosterGuest): FightState {
  const owner = state[guest.owner]
  const interrupted =
    !canAct(owner) || Boolean(owner.attack) || Math.abs(owner.x - guest.fighter.x) > 6
  const phase = interrupted ? 'leaving' : guest.frames >= 18 ? 'acting' : 'preparing'
  return storeRosterGuest(state, { ...guest, phase })
}
function actGuest(state: FightState, guest: RosterGuest, attack: DuelAttack): FightState {
  guest = moveGuest(state, guest)
  let next = storeRosterGuest(state, guest)
  if (guest.role === 'loan') return advanceLoanGuest(next, guest, attack)
  const order = state[guest.owner].blackOrder ?? 'attack'
  if (order !== 'attack' || guest.cooldown || !canAct(guest.fighter) || guest.fighter.attack)
    return next
  const kind = guestAttackKind(state, guest)
  if (!kind) return next
  const used = attack({
    state: guestProjection(next, guest),
    side: guest.owner,
    kind,
    auraCharged: false,
  })
  next = mergeGuestProjection(next, used, guest)
  const held = next.rosterGuests!.find((item) => item.id === guest.id)!
  return storeRosterGuest(next, { ...held, cooldown: 36 })
}
function moveGuest(state: FightState, guest: RosterGuest): RosterGuest {
  const view = guestProjection(state, guest)
  const fighter = updateControlledFighter(guest.fighter, guestInput(state, guest))
  const collided = collideArenaBodies(view, { ...view, [guest.owner]: fighter })
  return { ...guest, fighter: collided[guest.owner] }
}

function guestAttackKind(state: FightState, guest: RosterGuest) {
  const other = guest.owner === 'player' ? 'opponent' : 'player'
  const gap = Math.abs(guest.fighter.x - state[other].x)
  if (gap > 18) return 'ranged' as const
  if (gap > 9) return null
  return guest.frames % 3 ? ('light' as const) : ('heavy' as const)
}

function guestInput(state: FightState, guest: RosterGuest): FightInput {
  const enemy = state[guest.owner === 'player' ? 'opponent' : 'player']
  const order = state[guest.owner].blackOrder ?? 'attack'
  if (guest.role === 'loan' || order === 'wait') return EMPTY_INPUT
  if (order === 'guard') return { ...EMPTY_INPUT, guard: true }
  const gap = enemy.x - guest.fighter.x
  const direction = guestDirection(order, gap)
  return {
    ...EMPTY_INPUT,
    left: direction < 0,
    right: direction > 0,
    guard: Boolean(
      enemy.attack && !enemy.attack.concealed && Math.abs(gap) < 10 && guest.frames % 90 < 20,
    ),
  }
}

function guestDirection(order: string, gap: number): number {
  if (order === 'retreat') return -Math.sign(gap)
  return Math.abs(gap) > 7 ? Math.sign(gap) : 0
}

function leaveGuest(state: FightState, guest: RosterGuest): FightState {
  const direction = guest.fighter.x < 50 ? -1 : 1
  const fighter = poseFighter(updateControlledFighter(guest.fighter, EMPTY_INPUT))
  const x = fighter.x + direction * 0.3
  return storeRosterGuest(state, {
    ...guest,
    fighter: { ...fighter, x },
    phase: x < 2 || x > 98 ? 'eliminated' : 'leaving',
  })
}

/** Spawn only this body's projectiles. The enemy already had its own spawn pass. */
export function armRosterGuests(state: FightState): FightState {
  let next = state
  for (const guest of state.rosterGuests ?? []) {
    if (guest.phase !== 'acting') continue
    const other: FightSide = guest.owner === 'player' ? 'opponent' : 'player'
    const view = guestProjection(next, guest)
    const passive = { ...view, [other]: { ...view[other], attack: null } }
    const armed = resolveArenaStrikes(withDolphinIdentity(passive, spawnRangedProjectiles))
    const projectiles = armed.projectiles.map((shot) =>
      shot.id >= next.nextProjectileId ? { ...shot, sourceBody: guest.id } : shot,
    )
    next = mergeGuestProjection(next, { ...armed, [other]: next[other], projectiles }, guest)
  }
  return next
}
