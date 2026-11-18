import { attackData, attackPhase, attackProgress } from './frameData'
import type { Object3D } from 'three'
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
          placeVisitHand(options, { state, side, root: staff.root, hand: freeVisitHand(fighter) })
          staff.root.rotateZ(fighter.facing * staffSwing(fighter))
        }
        const attack = fighter.attack
        if (!attack || visitAttackSource(fighter) !== 'gel' || attack.kind !== 'special') continue
        const snake = pool.get(`gel-snake-arm:${side}`, {
          model: 'snake-arm',
          anchor: 'floor',
          fit: { height: 1.6, width: 0.65 },
          joints: ['gel-snake-head'],
        })
        placeVisitHand(options, { state, side, root: snake.root })
        hideSnakeHand(options, side, hiddenHands)
        const target = state[side === 'player' ? 'opponent' : 'player']
        direction.set(options.worldX(target.x) - snake.root.position.x, 0.03, 0).normalize()
        snake.root.quaternion.setFromUnitVectors(up, direction)
        const extension = armExtension(fighter)
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
  if (!fighter.attack || visitAttackSource(fighter) !== 'saiyu') return -0.12
  return -0.12 + Math.sin(attackProgress(fighter) * Math.PI) * 1.5
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
