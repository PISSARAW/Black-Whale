import { physicalBodyAt } from './fightBodyIdentity'
import {
  changeVoiceTarget,
  hasVoiceControl,
  voiceTargets,
  type VoiceTarget,
} from './blackVoiceTargets'
import { releaseBlackVoicePage, voiceSourceActive } from './blackVoice'
import { startFighterAttack } from './fighterAttacks'
import { canReceiveCombatHit } from './combatTargets'
import { resolveHistoricalContact } from './historicalContact'
import type { ArcadeFighter, FightState } from './types'

/** Orders persist until the antenna is removed, the subject dies or Skill Hunter loses its page. */
export function advanceBlackVoice(state: FightState): FightState {
  if (!hasVoiceControl(state)) return state
  let next = releaseBlackVoicePage(releaseBlackVoicePage(state, 'player'), 'opponent')
  for (const target of voiceTargets(next)) {
    if (!target.control?.active) continue
    next = advanceSubject(next, target)
  }
  return next
}
function advanceSubject(state: FightState, target: VoiceTarget): FightState {
  const control = target.control!,
    owner = physicalBodyAt(state, control.owner, control.ownerMember)
  if (target.health <= 0 || !owner || !voiceSourceActive(state, control))
    return changeVoiceTarget(state, target, {
      blackVoiceControl: { ...control, active: false },
      ...(target.body
        ? { hatsuEffects: { ...target.body.hatsuEffects, manipulatedFrames: 0 } }
        : {}),
    })
  if (target.body) return obeyBody(state, target, owner)
  return obeyPerson(state, target, owner)
}
function orderX(target: VoiceTarget, owner: ArcadeFighter): number {
  const order = target.control!.order
  const direction = Math.sign(owner.x - target.x)
  if (order === 'stay' || (order === 'approach' && Math.abs(owner.x - target.x) <= 6))
    return target.x
  return Math.max(7, Math.min(93, target.x + (order === 'retreat' ? -direction : direction) * 0.3))
}
function obeyBody(state: FightState, target: VoiceTarget, owner: ArcadeFighter): FightState {
  const actor = target.body!,
    control = target.control!
  const body = {
    ...actor,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
    coveringEars: false,
    pluggingWounds: false,
    hatsuChargeFrames: 0,
    hatsuEffects: { ...actor.hatsuEffects, manipulatedFrames: 1 },
  }
  if (actor.hitStun > 0 || actor.knockdownFrames > 0) return changeVoiceTarget(state, target, body)
  if (control.order !== 'attack')
    return changeVoiceTarget(state, target, { ...body, attack: null, x: orderX(target, owner) })
  // The actual body fights with its own ordinary strike; the controller supplies no copied Hatsu.
  if (actor.attack) return changeVoiceTarget(state, target, body)
  if (!activeSubject(state, target)) return changeVoiceTarget(state, target, body)
  const enemy = state[target.side === 'player' ? 'opponent' : 'player']
  if (Math.abs(actor.x - enemy.x) > 6)
    return changeVoiceTarget(state, target, {
      ...body,
      x: Math.max(7, Math.min(93, actor.x + Math.sign(enemy.x - actor.x) * 0.3)),
    })
  return changeVoiceTarget(
    state,
    target,
    startFighterAttack({
      fighter: body,
      kind: 'light',
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
    }),
  )
}
function activeSubject(state: FightState, target: VoiceTarget): boolean {
  if (!target.side) return false
  const seat = state.teamMatch?.seats[target.side]
  return !seat || seat.active === target.member
}

function obeyPerson(state: FightState, target: VoiceTarget, owner: ArcadeFighter): FightState {
  const entry = target.entity!,
    control = target.control!
  if (control.order !== 'attack')
    return changeVoiceTarget(state, target, { x: orderX(target, owner) })
  const enemySide = control.owner === 'player' ? 'opponent' : 'player',
    enemy = state[enemySide]
  if (Math.abs(entry.x - enemy.x) > 5)
    return changeVoiceTarget(state, target, {
      x: Math.max(7, Math.min(93, entry.x + Math.sign(enemy.x - entry.x) * 0.3)),
    })
  if (state.frame % 45 !== 0 || !canReceiveCombatHit(enemy)) return state
  // Ordinary scenario person's punch; these numbers are duel tuning, not a Nen boost.
  return resolveHistoricalContact(state, {
    owner: control.owner,
    target: enemySide,
    x: entry.x,
    y: entry.y + 6,
    damage: 5,
  })
}
