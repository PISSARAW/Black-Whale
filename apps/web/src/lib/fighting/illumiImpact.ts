import { activeHitbox, boxesOverlap, otherSide } from './frameData'
import { hasIllumiNeedles } from './illumiEquipment'
import { illumiState } from './illumiState'
import { recordDolphinEffects } from './kurapikaDolphin'
import type { ImpactDefence } from './combatDamage'
import type { ArcadeFighter, FightSide, FightState } from './types'

interface NeedleContact {
  state: FightState
  side: FightSide
  defence: ImpactDefence
  spent: ArcadeFighter
}

/** A resolved skull contact is the only implantation path. No generic carrier hit can control. */
export function resolveIllumiContact(options: NeedleContact): FightState | null {
  const { state, side, defence, spent } = options
  const attacker = state[side]
  if (attacker.attack?.kind !== 'special' || attacker.attack.hatsuSource !== 'illumi') return null
  const targetSide = otherSide(side)
  const target = defence.fighter
  const captured = canImplant(options)
  const next = {
    ...state,
    [side]: spent,
    [targetSide]: captured
      ? {
          ...target,
          ...(attacker.illumiNeedleMode === 'condition'
            ? {
                conditionedNeedle: { owner: side, implantedAt: state.frame },
              }
            : {
                needlePuppet: {
                  owner: side,
                  order: illumiState(attacker).order,
                  needleEmbedded: true,
                },
              }),
          attack: null,
          bufferedAttack: null,
          blocking: false,
          guardFrames: 0,
        }
      : target,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: 'special' as const,
      damage: 0,
      blocked: defence.blocked,
      parried: defence.parried,
      avoided: defence.avoided,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      invulnerable: defence.invulnerable,
      comboHits: 0,
      damageScale: 1,
      points: 0,
      zone: 'head' as const,
      concealed: Boolean(attacker.attack.concealed),
      projectileId: null,
      position: { x: target.x, y: target.y + 10 },
    },
    hitstop: 0,
  }
  return recordDolphinEffects(state, next, side)
}

function canImplant({ state, side, defence }: NeedleContact): boolean {
  if (defence.blocked || defence.parried || defence.avoided) return false
  const target = state[otherSide(side)]
  return (
    hasIllumiNeedles(state[side]) &&
    target.health > 0 &&
    !alreadyControlled(target) &&
    skullContact(state[side], target)
  )
}

function alreadyControlled(target: ArcadeFighter): boolean {
  return Boolean(
    target.needlePuppet ||
    target.conditionedNeedle ||
    target.hatsuEffects.manipulatedFrames > 0 ||
    target.hatsuEffects.possessedFrames > 0,
  )
}

function skullContact(attacker: ArcadeFighter, target: ArcadeFighter): boolean {
  if (target.hanzoProjection || target.knockdownFrames > 0) return false
  const hitbox = activeHitbox(attacker)
  const offset = target.crouching ? 4 : 0
  return Boolean(
    hitbox &&
    boxesOverlap(hitbox, {
      left: target.x - 2.1,
      right: target.x + 2.1,
      bottom: target.y + 8 - offset,
      top: target.y + 12 - offset,
    }),
  )
}
