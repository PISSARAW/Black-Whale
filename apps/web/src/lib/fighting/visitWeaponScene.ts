import { attackData, attackPhase, attackProgress } from './frameData'
import type { Object3D, Vector3 } from 'three'
import type { ArcadeFighter, FightSide } from './types'
import {
  visitAttackSource,
  createVisitScenePool,
  freeVisitHand,
  ownsVisitHatsu,
  placeVisitHand,
} from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import { fineControlEase } from './fineControlAnchors'
import { gelSnakeNormalReach } from './gelSnakeNormals'
import { motionOf } from './fighterMovement'
import { supportSaiyuStaff } from './saiyuStaffGrip'

/** Shared conjured props follow the actual user's rig, including active page/loan uses. */
export function createVisitWeaponScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  const hiddenHands = new Map<Object3D, boolean>()
  const up = new options.THREE.Vector3(0, 1, 0)
  const direction = new options.THREE.Vector3()
  return {
    sync(state) {
      restoreSnakeHands(hiddenHands)
      pool.hide()
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        if (ownsVisitHatsu(fighter, 'saiyu')) {
          const staff = pool.get(`priest-staff:${side}`, {
            model: 'priest-staff',
            fit: { height: 1.8 },
          })
          const hand =
            fighter.id === 'saiyu' && fighter.facing === -1 ? 'left' : freeVisitHand(fighter)
          placeVisitHand(options, { state, side, root: staff.root, hand })
          staff.root.rotateZ(fighter.facing * staffSwing(fighter))
          if (fighter.id === 'saiyu')
            supportSaiyuStaff(fighter, options.figureOf?.(side), staff.root)
        }
        const attack = fighter.attack
        const normal = gelSnakeNormalReach(fighter) > 0
        if (
          !attack ||
          (!normal && (attack.kind !== 'special' || visitAttackSource(fighter) !== 'gel'))
        )
          continue
        const snake = pool.get(`gel-snake-arm:${side}`, {
          model: 'snake-arm',
          anchor: 'floor',
          fit: { height: 1.6, width: 0.65 },
          joints: ['gel-snake-head'],
        })
        placeVisitHand(options, { state, side, root: snake.root })
        hideSnakeHand(options, side, hiddenHands)
        const target = state[side === 'player' ? 'opponent' : 'player']
        let extension = armExtension(fighter)
        if (normal) {
          const length = aimNormalSnake(direction, { options, fighter, wrist: snake.root.position })
          extension *= length / (snake.root.scale.y * 1.3)
        } else {
          direction.set(options.worldX(target.x) - snake.root.position.x, 0.03, 0).normalize()
        }
        snake.root.quaternion.setFromUnitVectors(up, direction)
        snake.body.scale.y = extension
        const head = snake.joints.get('gel-snake-head')!
        head.rotation.set(0, direction.x >= 0 ? -Math.PI / 2 : Math.PI / 2, 0)
        head.rotateX(Math.PI / 2)
        head.scale.z = 1 / extension
        snake.root.userData.extension = extension
      }
    },
    dispose() {
      restoreSnakeHands(hiddenHands)
      pool.dispose()
    },
  }
}

function staffSwing(fighter: ArcadeFighter): number {
  const normal = fighter.id === 'saiyu' && saiyuNormalStaffAngle(fighter)
  if (typeof normal === 'number') return -normal
  if (fighter.id === 'saiyu' && !fighter.attack) return -saiyuStaffCarriage(fighter)
  if (!fighter.attack || visitAttackSource(fighter) !== 'saiyu') return -0.12
  return -0.12 + Math.sin(attackProgress(fighter) * Math.PI) * 1.5
}

/** Each normal sets a wind-up and contact angle around the actual grip. */
const SAIYU_STAFF_ARCS: Readonly<Record<string, readonly [number, number]>> = {
  standingLight: [-0.24, 1.28],
  standingHeavy: [-0.86, 1.85],
  lowLight: [0.3, 2.05],
  lowHeavy: [-0.65, 1.65],
  airLight: [0.2, 1.1],
  airHeavy: [-0.77, 2.17],
  forwardLight: [0.45, 1.36],
  forwardHeavy: [-0.94, 1.51],
  backHeavy: [0.92, -0.83],
}

function saiyuNormalStaffAngle(fighter: ArcadeFighter): number | undefined {
  const attack = fighter.attack
  if (!attack || (attack.kind !== 'light' && attack.kind !== 'heavy')) return
  const slot = attack.moveId?.split(':')[1]
  const arc = slot && SAIYU_STAFF_ARCS[slot]
  if (!arc) return
  const { startup, active, recovery } = attackData(attack.kind, fighter)
  const [windup, contact] = arc
  if (attack.frame < startup) {
    return windup + (contact - windup) * fineControlEase(attack.frame / Math.max(1, startup))
  }
  const release = Math.max(0, attack.frame - startup - active) / Math.max(1, recovery)
  return contact + (saiyuStaffCarriage(fighter) - contact) * fineControlEase(Math.min(1, release))
}

function saiyuStaffCarriage(fighter: ArcadeFighter): number {
  if (fighter.blocking) return 1.12
  const { dash, heldDirection, landingFrames } = motionOf(fighter)
  if (landingFrames > 0) return 0.55
  if (fighter.y > 0) return -0.59
  if (dash) return dash.direction === fighter.facing ? 0.83 : -0.68
  if (heldDirection) return heldDirection === fighter.facing ? 0.28 : -0.51
  return -0.12
}

function aimNormalSnake(
  direction: Vector3,
  aim: { options: EffectSceneOptions; fighter: ArcadeFighter; wrist: Vector3 },
): number {
  const { options, fighter, wrist } = aim
  const { box } = attackData(fighter.attack!.kind, fighter)
  const x = options.worldX(fighter.x + fighter.facing * box.right)
  const y = options.worldY(fighter.y + (box.top + box.bottom) / 2)
  const forward = Math.max(0.16, (x - wrist.x) * fighter.facing)
  direction.set(fighter.facing * forward, y - wrist.y, 0)
  const length = direction.length()
  direction.normalize()
  return length
}

function armExtension(fighter: ArcadeFighter): number {
  const attack = fighter.attack!
  const data = attackData(attack.kind, fighter)
  const phase = attackPhase(fighter)
  if (phase === 'startup')
    return 0.45 + 0.55 * fineControlEase(attack.frame / Math.max(1, data.startup))
  if (phase === 'active') return 1
  const recovery = (attack.frame - data.startup - data.active) / Math.max(1, data.recovery)
  return 1 - Math.min(1, recovery) * 0.65
}

function hideSnakeHand(
  options: EffectSceneOptions,
  side: FightSide,
  hidden: Map<Object3D, boolean>,
) {
  const hand = options.figureOf?.(side)?.getObjectByName('hand-right')
  if (!hand) return
  hidden.set(hand, hand.visible)
  hand.visible = false
}
function restoreSnakeHands(hidden: Map<Object3D, boolean>) {
  hidden.forEach((visible, hand) => {
    hand.visible = visible
  })
  hidden.clear()
}
