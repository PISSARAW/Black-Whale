import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { canAct } from './fightActorState'
import { witnessedHatsuState } from './nenWitness'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Ch. 149: thirty minutes of actual sleep provide eight hours' recovery. */
export const COOKIE_PIANO_FRAMES = 30 * 60 * 60
export const COOKIE_SUMMON_COST = 20 // Duel tuning, not a manga quantity.
const REACH = 8

export function ownsCookie(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'biscuit') return fighter.hatsuEffects.hatsuStolen === 0
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'biscuit')
  const held = fighter.kurapika?.held
  return (
    held?.source === 'biscuit' &&
    held.loaded &&
    fighter.kurapika!.emperorTime &&
    (!held.used || Boolean(fighter.cookie))
  )
}

export function cookieTarget(state: FightState, side: FightSide, target?: string): FightSide {
  return target === 'player' || target === 'opponent' ? target : side
}

export function cookieCanStart(state: FightState, side: FightSide, target: FightSide): boolean {
  const caster = state[side]
  if (!ownsCookie(caster) || !voluntaryNenAvailable(caster)) return false
  if (chainAbilitySealed(caster, 'biscuit:cookie') || caster.cookie) return false
  if (!treatmentBodyFree(caster)) return false
  if (caster.aura < COOKIE_SUMMON_COST) return false
  const recipient = state[target]
  if (!treatmentBodyFree(recipient)) return false
  if (target !== side && !recipient.supportConsent) return false
  return Math.hypot(recipient.x - caster.x, recipient.y - caster.y) <= REACH
}

function treatmentBodyFree(fighter: ArcadeFighter): boolean {
  return canAct(fighter) && !fighter.attack && fighter.y === 0
}

export function performCookie(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const caster = state[side]
  if (command.action === 'cookie-stop') return stopCookie(state, side)
  const target = cookieTarget(state, side, command.target)
  if (!cookieCanStart(state, side, target)) return state
  const recipient = state[target]
  const mode = command.action === 'cookie-piano' ? 'piano' : 'massage'
  const next = {
    ...state,
    [side]: {
      ...caster,
      aura: caster.aura - COOKIE_SUMMON_COST,
      kurapika: cookieDolphinUse(caster),
      cookie: {
        target,
        mode,
        frames: 0,
        targetHealth: recipient.health,
        targetX: recipient.x,
        targetY: recipient.y,
      },
    },
  }
  const other = side === 'player' ? 'opponent' : 'player'
  const witnessed = {
    ...next,
    [other]: {
      ...next[other],
      hatsuEffects: {
        ...next[other].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'biscuit' }),
      },
    },
  }
  return mode === 'piano'
    ? {
        ...witnessed,
        [target]: {
          ...witnessed[target],
          arsenalSleep: { owner: side, cause: 'cookie' as const },
          blocking: false,
          guardFrames: 0,
        },
      }
    : witnessed
}

export function stopCookie(state: FightState, side: FightSide): FightState {
  const session = state[side].cookie
  if (!session) return state
  const target = session.target
  const next = { ...state, [side]: { ...state[side], cookie: undefined } }
  return state[target].arsenalSleep?.cause === 'cookie' &&
    state[target].arsenalSleep?.owner === side
    ? { ...next, [target]: { ...next[target], arsenalSleep: undefined } }
    : next
}

export function advanceCookie(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceSession(next, side)
  return next
}

function advanceSession(state: FightState, side: FightSide): FightState {
  const caster = state[side]
  const session = caster.cookie
  if (!session) return state
  if (!sessionContinues(state, side)) return stopCookie(state, side)
  const frames = session.frames + 1
  const target = session.target
  if (session.mode === 'piano' && frames >= COOKIE_PIANO_FRAMES) {
    const rested = stopCookie(state, side)
    return { ...rested, [target]: { ...rested[target], aura: 100, auraExhausted: false } }
  }
  const next = { ...state, [side]: { ...caster, cookie: { ...session, frames } } }
  // Lotion relieves fatigue progressively. It does not repair a wound or regrow a limb.
  if (session.mode === 'massage' && frames % 60 === 0)
    return { ...next, [target]: { ...next[target], aura: Math.min(100, next[target].aura + 1) } }
  return next
}

function sessionContinues(state: FightState, side: FightSide): boolean {
  const caster = state[side]
  const session = caster.cookie!
  const target = state[session.target]
  if (!ownsCookie(caster) || !voluntaryNenAvailable(caster)) return false
  if (chainAbilitySealed(caster, 'biscuit:cookie') || target.health < session.targetHealth)
    return false
  if (target.health <= 0 || target.attack || target.hitStun > 0) return false
  if (Math.hypot(target.x - session.targetX, target.y - session.targetY) > 1) return false
  return session.target === side || Boolean(target.supportConsent)
}

export function cookieOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsCookie(state[side]) && !state[side].cookie) return []
  const targets: FightSide[] = [side, side === 'player' ? 'opponent' : 'player']
  return [
    ...targets.flatMap((target) => cookieTreatmentOptions(state, side, target)),
    {
      command: { action: 'cookie-stop' },
      labelFr: 'Terminer le traitement',
      labelEn: 'End treatment',
      ready: Boolean(state[side].cookie),
      conditionFr: 'Un traitement est en cours.',
      conditionEn: 'A treatment is in progress.',
    },
  ]
}

function cookieTreatmentOptions(
  state: FightState,
  side: FightSide,
  target: FightSide,
): ArsenalOption[] {
  const ready = cookieCanStart(state, side, target)
  const name = target === side ? ['soi', 'self'] : ['partenaire consentant', 'consenting partner']
  return [
    {
      command: { action: 'cookie-massage', target },
      labelFr: `Cookie · Massage (${name[0]})`,
      labelEn: `Cookie · Massage (${name[1]})`,
      ready,
      conditionFr:
        'Traitement continu de la fatigue, sans soin des blessures. Contact et consentement du partenaire.',
      conditionEn:
        'Continuous fatigue treatment, without repairing wounds. Contact and partner consent.',
    },
    {
      command: { action: 'cookie-piano', target },
      labelFr: `Cookie · Piano Massage (${name[0]})`,
      labelEn: `Cookie · Piano Massage (${name[1]})`,
      ready,
      conditionFr: 'Dormir trente minutes réelles de simulation ; le corps reste vulnérable.',
      conditionEn: 'Sleep for thirty actual simulated minutes; the body remains vulnerable.',
    },
  ]
}

function cookieDolphinUse(fighter: ArcadeFighter): ArcadeFighter['kurapika'] {
  const chain = fighter.kurapika
  if (!chain?.held || chain.held.source !== 'biscuit') return chain
  return { ...chain, held: { ...chain.held, used: true, sustainedKeys: ['cookie'] } }
}
