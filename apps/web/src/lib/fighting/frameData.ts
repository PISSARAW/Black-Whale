import { fighterDefinition } from './roster'
import type {
  ArcadeFighter,
  AttackKind,
  AttackPhase,
  FightNenZone,
  FightSide,
} from './types'

export const FIGHT_FPS = 60
export const FIXED_STEP = 1 / FIGHT_FPS
export const ROUND_FRAMES = 60 * FIGHT_FPS
export const INPUT_BUFFER_FRAMES = 6

export interface FightBox {
  left: number
  right: number
  bottom: number
  top: number
}

export interface AttackFrameData {
  startup: number
  active: number
  recovery: number
  damage: number
  hitstun: number
  blockstun: number
  hitstop: number
  knockback: number
  lunge: number
  cancelEnd: number
  targetZone: FightNenZone
  auraZone: FightNenZone
  box: FightBox
}

const ATTACK_DATA: Record<AttackKind, AttackFrameData> = {
  light: {
    startup: 5,
    active: 3,
    recovery: 10,
    damage: 7,
    hitstun: 12,
    blockstun: 8,
    hitstop: 4,
    knockback: 1.8,
    lunge: 0.55,
    cancelEnd: 12,
    targetZone: 'head',
    auraZone: 'hands',
    box: { left: 1.7, right: 7.5, bottom: 5.2, top: 10.8 },
  },
  heavy: {
    startup: 12,
    active: 4,
    recovery: 18,
    damage: 12,
    hitstun: 18,
    blockstun: 12,
    hitstop: 7,
    knockback: 3,
    lunge: 0.9,
    cancelEnd: 24,
    targetZone: 'feet',
    auraZone: 'feet',
    box: { left: 1.4, right: 9.6, bottom: 1.2, top: 8.4 },
  },
  special: {
    startup: 16,
    active: 6,
    recovery: 28,
    damage: 19,
    hitstun: 26,
    blockstun: 18,
    hitstop: 10,
    knockback: 4.5,
    lunge: 1.2,
    cancelEnd: 50,
    targetZone: 'torso',
    auraZone: 'hands',
    box: { left: 1.5, right: 20, bottom: 3.4, top: 11.5 },
  },
}

export function attackData(kind: AttackKind, fighter: ArcadeFighter): AttackFrameData {
  const definition = fighterDefinition(fighter.id)
  const right =
    kind === 'special' ? definition.specialRange : definition.reach + (kind === 'heavy' ? 2 : 0)
  return { ...ATTACK_DATA[kind], box: { ...ATTACK_DATA[kind].box, right } }
}

export function attackTotal(data: AttackFrameData): number {
  return data.startup + data.active + data.recovery
}

export function attackPhase(fighter: ArcadeFighter): AttackPhase | null {
  if (!fighter.attack) return null
  const data = attackData(fighter.attack.kind, fighter)
  const frame = fighter.attack.frame
  if (frame < data.startup) return 'startup'
  if (frame < data.startup + data.active) return 'active'
  return 'recovery'
}

export function attackProgress(fighter: ArcadeFighter): number {
  if (!fighter.attack) return 0
  return Math.min(1, fighter.attack.frame / attackTotal(attackData(fighter.attack.kind, fighter)))
}

export function activeHitbox(fighter: ArcadeFighter): FightBox | null {
  if (!fighter.attack || attackPhase(fighter) !== 'active') return null
  return worldBox(fighter, attackData(fighter.attack.kind, fighter).box)
}

export function hurtboxes(fighter: ArcadeFighter): FightBox[] {
  const crouch = fighter.blocking ? 1.2 : 0
  return [
    worldBox(fighter, { left: -1.7, right: 1.7, bottom: 0, top: 5.2 - crouch }),
    worldBox(fighter, { left: -2.1, right: 2.1, bottom: 4.8 - crouch, top: 12 - crouch }),
  ]
}

export function boxesOverlap(first: FightBox, second: FightBox): boolean {
  return (
    first.left <= second.right &&
    first.right >= second.left &&
    first.bottom <= second.top &&
    first.top >= second.bottom
  )
}

export function contactPoint(hitbox: FightBox, hurtbox: FightBox): { x: number; y: number } {
  return {
    x: (Math.max(hitbox.left, hurtbox.left) + Math.min(hitbox.right, hurtbox.right)) / 2,
    y: (Math.max(hitbox.bottom, hurtbox.bottom) + Math.min(hitbox.top, hurtbox.top)) / 2,
  }
}

export function otherSide(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}

function worldBox(fighter: ArcadeFighter, box: FightBox): FightBox {
  const horizontal =
    fighter.facing === 1
      ? { left: fighter.x + box.left, right: fighter.x + box.right }
      : { left: fighter.x - box.right, right: fighter.x - box.left }
  return {
    ...horizontal,
    bottom: fighter.y + box.bottom,
    top: fighter.y + box.top,
  }
}
