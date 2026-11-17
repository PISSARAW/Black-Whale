import { activeEnRadius } from '../en/access'
import type { NenTechnique } from '@black-whale/nen-engine'
import { attackData } from '../frameData'
import { nenTacticalState } from '../nen'
import { isThrowTech } from '../reactionMotion'
import type {
  ArcadeFighter,
  FighterId,
  FightImpact,
  FightSide,
  FightState,
  ProjectileShape,
  MoveSlot,
} from '../types'
import { moveById } from '../movesets'
import { chrolloPageForMove, type ChrolloPage } from '../chrolloBook'
import { characterSoundEvents } from './states'
import { clockSubdivision } from './stages'

export type FightSoundKind =
  | 'intro'
  | 'start'
  | 'finish'
  | 'clock'
  | 'watch'
  | 'score'
  | 'stage'
  | 'windup'
  | 'swing'
  | 'hatsu'
  | 'projectile'
  | 'impact'
  | 'guard'
  | 'crouch'
  | 'charge'
  | 'step'
  | 'dash'
  | 'jump'
  | 'land'
  | 'fall'
  | 'wakeup'
  | 'throw-tech'
  | 'nen'
  | 'emperor-on'
  | 'emperor-off'
  | 'heartbeat'
  | 'armour'
  | 'sun'
  | 'transform'
  | 'projection'
  | 'page'
  | 'gum'
  | 'seal'
  | 'lsdf'
  | 'effect'
  | 'easter-egg'

export interface FightSoundEvent {
  kind: FightSoundKind
  x: number
  fighter?: FighterId
  source?: FighterId
  side?: FightSide
  moveId?: string
  value?: number
  technique?: NenTechnique
  impact?: FightImpact
  shape?: ProjectileShape
  slot?: MoveSlot
  page?: ChrolloPage | null
}

export function fighterEvent(
  fighter: ArcadeFighter,
  side: FightSide,
  kind: FightSoundKind,
): FightSoundEvent {
  return { kind, x: fighter.x, fighter: fighter.id, side }
}

export function activeSoundNen(fighter: ArcadeFighter): NenTechnique {
  if (fighter.nen.mode === 'zetsu') return 'zetsu'
  if (fighter.nen.in) return 'in'
  if (activeEnRadius(fighter)) return 'en'
  if (fighter.nen.shu.length > 0) return 'shu'
  return nenTacticalState(fighter).technique
}

export function newSoundRound(before: FightState, after: FightState): boolean {
  return (
    before.roundNumber !== after.roundNumber ||
    after.frame < before.frame ||
    before.player.id !== after.player.id ||
    before.opponent.id !== after.opponent.id ||
    before.environment.stageId !== after.environment.stageId
  )
}

/** Presentation only: consumes immutable snapshots; never mutates the simulation. */
export function fightSoundEvents(before: FightState | null, after: FightState): FightSoundEvent[] {
  if (!before || newSoundRound(before, after)) {
    const events: FightSoundEvent[] = [{ kind: 'intro', x: 50 }]
    if (after.phase === 'fighting') events.push({ kind: 'start', x: 50 })
    return events
  }
  const events = phaseEvents(before, after)
  if (before.phase !== 'fighting') return events
  events.push(...impactEvents(before, after), ...clockEvents(before, after))
  for (const side of ['player', 'opponent'] as const) {
    events.push(
      ...fighterEvents({
        before: before[side],
        after: after[side],
        side,
        state: after,
        previousFrame: before.frame,
      }),
    )
    events.push(...characterSoundEvents(before, after, side))
  }
  const oldIds = new Set(before.projectiles.map((projectile) => projectile.id))
  for (const projectile of after.projectiles) {
    if (!oldIds.has(projectile.id))
      events.push({
        kind: 'projectile',
        side: projectile.owner,
        x: projectile.x,
        fighter: after[projectile.owner].id,
        source: projectile.fighterId,
        shape: projectile.shape,
      })
  }
  if (isThrowTech(after) && !isThrowTech(before)) events.push({ kind: 'throw-tech', x: 50 })
  return events
}

function phaseEvents(before: FightState, after: FightState): FightSoundEvent[] {
  if (before.phase === after.phase) return []
  if (after.phase === 'fighting') return [{ kind: 'start', x: 50 }]
  if (after.phase !== 'finished') return []
  return [
    {
      kind: 'finish',
      x: 50,
      value: after.finishReason === 'time' ? 1 : 0,
      fighter: after.winner && after.winner !== 'draw' ? after[after.winner].id : undefined,
    },
  ]
}

function impactEvents(before: FightState, after: FightState): FightSoundEvent[] {
  const impact = after.impact
  if (!impact || impact.sequence === before.impact?.sequence) return []
  const attacker = after[impact.attacker]
  const events: FightSoundEvent[] = [
    {
      kind: 'impact',
      x: impact.position.x,
      impact,
      side: impact.attacker,
      fighter: attacker.id,
    },
  ]
  if (impact.points > 0) events.push({ kind: 'score', x: 50, value: impact.points })
  return events
}

function clockEvents(before: FightState, after: FightState): FightSoundEvent[] {
  if (after.phase !== 'fighting') return []
  const events: FightSoundEvent[] = []
  if (after.mode !== 'training') {
    if (before.time > 15 && after.time <= 15) events.push({ kind: 'watch', x: 50 })
    const step = clockSubdivision(after.time)
    if (Math.ceil(before.remainingFrames / step) !== Math.ceil(after.remainingFrames / step)) {
      events.push({ kind: 'clock', x: 50, value: Math.ceil(after.remainingFrames / step) })
    }
  }
  if (Math.floor(before.frame / 240) !== Math.floor(after.frame / 240)) {
    events.push({ kind: 'stage', x: 50, value: Math.floor(after.frame / 240) })
  }
  return events
}

interface FighterTransition {
  before: ArcadeFighter
  after: ArcadeFighter
  side: FightSide
  state: FightState
  previousFrame: number
}

function fighterEvents(change: FighterTransition): FightSoundEvent[] {
  const { before, after, side } = change
  const events = movementEvents(change)
  events.push(...attackEvents(before, after, side))
  events.push(...nenEvents(before, after, side))
  if (after.blocking && !before.blocking) events.push(fighterEvent(after, side, 'guard'))
  if (Boolean(before.crouching) !== Boolean(after.crouching))
    events.push(fighterEvent(after, side, 'crouch'))
  if (after.hatsuChargeFrames > 0 && before.hatsuChargeFrames === 0)
    events.push(fighterEvent(after, side, 'charge'))
  return events
}

function nenEvents(
  before: ArcadeFighter,
  after: ArcadeFighter,
  side: FightSide,
): FightSoundEvent[] {
  const technique = activeSoundNen(after)
  const changed = technique !== activeSoundNen(before)
  const shifted =
    technique === 'ryu' && nenTacticalState(after).focusZone !== nenTacticalState(before).focusZone
  return changed || shifted ? [{ ...fighterEvent(after, side, 'nen'), technique }] : []
}

function attackEvents(
  before: ArcadeFighter,
  after: ArcadeFighter,
  side: FightSide,
): FightSoundEvent[] {
  const attack = after.attack
  if (!attack) return []
  const previous = before.attack
  const fresh = newAttack(before, after)
  const event = attackEvent(after, side)
  const events: FightSoundEvent[] = fresh ? [event] : []
  const startup = attackData(attack.kind, after).startup
  const previousFrame = fresh ? -1 : (previous?.frame ?? -1)
  if (attack.frame >= startup && previousFrame < startup) {
    events.push({ ...event, kind: 'swing', value: attack.kind === 'heavy' ? 1.4 : 1 })
    if (attack.kind === 'special') events.push({ ...event, kind: 'hatsu' })
  }
  return events
}

function attackEvent(fighter: ArcadeFighter, side: FightSide): FightSoundEvent {
  const attack = fighter.attack!
  return {
    ...fighterEvent(fighter, side, 'windup'),
    moveId: attack.moveId,
    source: attack.hatsuSource ?? fighter.id,
    slot: moveById(attack.moveId)?.slot,
    page: chrolloPageForMove(fighter, attack.moveId),
  }
}

function newAttack(before: ArcadeFighter, after: ArcadeFighter): boolean {
  if (!before.attack || !after.attack) return true
  return (
    after.attack.moveId !== before.attack.moveId ||
    after.attack.kind !== before.attack.kind ||
    after.attack.frame < before.attack.frame
  )
}

function movementEvents(change: FighterTransition): FightSoundEvent[] {
  const { before, after, side } = change
  const events = aerialEvents(change)
  const push = (kind: FightSoundKind) => events.push(fighterEvent(after, side, kind))
  if (after.pose === 'down' && before.pose !== 'down') push('fall')
  if (after.pose === 'wakeup' && before.pose !== 'wakeup') push('wakeup')
  if (after.motion?.dash && !before.motion?.dash) push('dash')
  if (walkingStep(change)) push('step')
  return events
}

function aerialEvents({ before, after, side }: FighterTransition): FightSoundEvent[] {
  const events: FightSoundEvent[] = []
  if (after.y > 0 && before.y === 0) events.push(fighterEvent(after, side, 'jump'))
  if (after.y === 0 && before.y > 0) events.push(fighterEvent(after, side, 'land'))
  return events
}

function walkingStep({ before, after, state, previousFrame }: FighterTransition): boolean {
  if (after.pose !== 'walk' || after.y !== 0 || after.motion?.dash) return false
  const cadence = Math.floor(state.frame / 18) !== Math.floor(previousFrame / 18)
  return cadence && Math.abs(after.x - before.x) > 0.01
}
