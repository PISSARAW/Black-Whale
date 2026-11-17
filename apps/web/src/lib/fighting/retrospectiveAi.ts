import { bashoArsenalAi } from './bashoArsenalAi'
import { gallerySenseAi } from './galleryAi'
import { deviceAi } from './deviceAi'
import { dowsingAi } from './dowsingAi'
import { judgmentAiPreset } from './judgmentAction'
import { judgmentForbidsContact } from './judgmentCommunication'
import { copiedArsenalAi } from './copiedArsenalAi'
import { performGumCommand, ownsBungeeGum } from './hisokaArsenal'
import { perceivesProjectile } from './nenPerception'
import { performHunterInterview, SKILL_HUNTER_WINDOW } from './skillHunterAcquisition'
import { performArsenalCommand } from './retrospectiveArsenal'
import { chrolloPageForMove } from './chrolloBook'
import { cookieCanStart, ownsCookie } from './cookie'
import { canAct } from './fightActorState'
import { LUINI_ROOM_HALF_WIDTH } from './luiniSpatial'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** No resources, consent, interview answers or book pages are fabricated by an AI plan. */
export function retrospectiveAiAction(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (!canAct(state.opponent) || state.opponent.attack) return null
  return (
    utilityArsenalAi(state, perform) ??
    gumAi(state) ??
    interviewAi(state) ??
    supportAi(state) ??
    copiedArsenalAi(state, perform) ??
    historicalAi(state, perform)
  )
}

function utilityArsenalAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  return (
    bashoArsenalAi(state, perform) ??
    deviceAi(state) ??
    dowsingAi(state) ??
    gallerySenseAi(state) ??
    judgmentAiPreset(state)
  )
}

function supportAi(state: FightState): FightState | null {
  if (ownsCookie(state.opponent) && cookieOpening(state)) {
    const treated = performArsenalCommand(state, 'opponent', { action: 'cookie-massage' })
    if (treated !== state) return treated
  }
  return null
}

function historicalAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (state.opponent.id !== 'chrollo') return null
  const plan = state.opponent.chrolloHistorical?.aiPlan
  if (plan) return followHistoricalPlan(state, perform)
  if (!historicalAiDue(state)) return null
  const page = historicalOpportunity(state)
  if (!page) return null
  const started = performArsenalCommand(state, 'opponent', { action: 'history-page', target: page })
  if (started === state) return null
  return {
    ...started,
    opponent: {
      ...started.opponent,
      chrolloHistorical: {
        ...started.opponent.chrolloHistorical,
        aiPlan: { page, startedAt: state.frame },
      },
    },
  }
}

function cookieOpening(state: FightState): boolean {
  return (
    state.opponent.aura < 45 &&
    Math.abs(state.player.x - state.opponent.x) > 35 &&
    state.projectiles.length === 0 &&
    cookieCanStart(state, 'opponent', 'opponent')
  )
}

function historicalOpportunity(state: FightState): string | null {
  const actor = state.opponent
  if (actor.aura < 30) return null
  if (fishOpportunity(state)) return 'indoor-fish'
  if (Math.abs(actor.x - state.player.x) > 6) return null
  const copies = historicalAiCopies(state)
  if (copies.some(unstampedPuppet)) return 'order-stamp'
  if (clothOpportunity(state)) return 'fun-fun-cloth'
  return actor.aura >= 55 && copies.length === 0 ? 'gallery-fake' : null
}

function closedRoomOpportunity(state: FightState): boolean {
  return Boolean(
    state.battlefield?.entities.some(
      (entry) =>
        entry.kind === 'room' &&
        entry.present &&
        entry.sealed &&
        Math.abs(state.opponent.x - entry.x) <= LUINI_ROOM_HALF_WIDTH &&
        Math.abs(state.player.x - entry.x) <= LUINI_ROOM_HALF_WIDTH,
    ),
  )
}

function followHistoricalPlan(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const plan = state.opponent.chrolloHistorical!.aiPlan!
  if (state.frame - plan.startedAt > 180 || chrolloPageForMove(state.opponent) !== plan.page)
    return finishPlan(state)
  if (['gallery-fake', 'fun-fun-cloth'].includes(plan.page) && state.opponent.chrolloBook?.open)
    return perform({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: 'chrollo:downSpecial',
      auraCharged: false,
    })
  const command: ArsenalCommand = { action: 'history-use' }
  const used = performArsenalCommand(state, 'opponent', command)
  return used !== state ? finishPlan(used) : null
}

function finishPlan(state: FightState): FightState {
  return {
    ...state,
    opponent: {
      ...state.opponent,
      chrolloHistorical: {
        ...state.opponent.chrolloHistorical,
        aiPlan: undefined,
        aiLastUse: state.frame,
      },
    },
  }
}

function historicalAiDue(state: FightState): boolean {
  return (
    state.frame >= 180 && state.frame - (state.opponent.chrolloHistorical?.aiLastUse ?? 0) >= 300
  )
}
function historicalAiCopies(state: FightState) {
  return (
    state.battlefield?.entities.filter(
      (entry) => entry.copy?.owner === 'opponent' && entry.present,
    ) ?? []
  )
}
function unstampedPuppet(entry: import('./preparationTypes').PreparedEntity): boolean {
  return entry.kind === 'puppet' && !entry.copy?.order
}

function gumAi(state: FightState): FightState | null {
  const fighter = state.opponent
  if (!ownsBungeeGum(fighter)) return null
  const action = fighter.gumCatch?.projectile
    ? 'gum-return'
    : shouldSealWounds(state)
      ? 'gum-seal'
      : incomingObject(state)
        ? 'gum-catch'
        : null
  if (!action) return null
  const next = performGumCommand(state, 'opponent', { action })
  return next === state ? null : next
}
function shouldSealWounds(state: FightState): boolean {
  return (
    (state.opponent.openWounds ?? 0) > (state.opponent.gumWoundSeals ?? 0) &&
    Math.abs(state.opponent.x - state.player.x) > 12
  )
}
function incomingObject(state: FightState): boolean {
  return state.projectiles.some(
    (shot) =>
      shot.owner === 'player' &&
      shot.matter === 'object' &&
      !shot.living &&
      perceivesProjectile(state.opponent, shot) &&
      Math.abs(shot.x - state.opponent.x) < 18 &&
      shot.velocityX * state.opponent.facing < 0 &&
      Math.abs(shot.y - state.opponent.y - 7) < 3,
  )
}
function interviewAi(state: FightState): FightState | null {
  const fighter = state.opponent
  const previous = fighter.hunterInterview
  if (fighter.id !== 'chrollo' || fighter.hatsuEffects.witnessedHatsu !== state.player.id)
    return null
  if (judgmentForbidsContact(fighter, state.player.id)) return null
  if (previous && state.frame - previous.askedAt <= SKILL_HUNTER_WINDOW) return null
  const next = performHunterInterview(state, 'opponent', { action: 'hunter-ask' })
  return next === state ? null : next
}

function fishOpportunity(state: FightState): boolean {
  return closedRoomOpportunity(state) && !state.opponent.chrolloHistorical?.fish
}
function clothOpportunity(state: FightState): boolean {
  return state.player.hitStun >= 35 && !state.opponent.chrolloHistorical?.cloth
}
