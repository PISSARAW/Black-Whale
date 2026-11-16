import { sleepingBody } from './hanzoProjection'
import { secretWindowVisibleTo } from './secretWindow'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** The default scene is P1's view: an enemy observer's private bird stays invisible. */
export function createSecretWindowScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const aura = new THREE.MeshBasicMaterial({ color: 0xe5d9bc, transparent: true, opacity: 0.85 })
  const dark = new THREE.MeshBasicMaterial({ color: 0x30251b })
  const bodyShape = new THREE.SphereGeometry(0.13, 9, 6)
  const headShape = new THREE.SphereGeometry(0.11, 9, 6)
  const eyeShape = new THREE.SphereGeometry(0.027, 6, 4)
  const wingShape = new THREE.BoxGeometry(0.06, 0.17, 0.025)
  const makeOwl = (side: FightSide) => {
    const owl = new THREE.Group()
    owl.name = `secret-window-${side}`
    const body = new THREE.Mesh(bodyShape, aura)
    body.scale.set(0.8, 1.2, 0.7)
    const head = new THREE.Mesh(headShape, aura)
    head.position.y = 0.15
    owl.add(body, head)
    const wings = [-1, 1].map((sign) => {
      const eye = new THREE.Mesh(eyeShape, dark)
      eye.position.set(sign * 0.047, 0.17, 0.09)
      const wing = new THREE.Mesh(wingShape, aura)
      wing.position.set(sign * 0.13, 0, 0)
      owl.add(eye, wing)
      return wing
    })
    scene.add(owl)
    return { owl, wings }
  }
  const owls = { player: makeOwl('player'), opponent: makeOwl('opponent') }
  const syncSide = (state: FightState, side: FightSide, seconds: number) => {
    const model = owls[side]
    model.owl.visible = secretWindowVisibleTo(state, side, 'player')
    const targetSide = state[side].secretWindow?.target
    if (!targetSide) return
    const original = state[targetSide]
    const target = sleepingBody(original)
    const low = Boolean(original.hanzoProjection) || target.knockdownFrames > 0
    const height = low ? 5 : target.crouching ? 8 : 12.5
    model.owl.position.set(
      worldX(target.x) - 0.2,
      worldY(target.y + height) + Math.sin(seconds * 4) * 0.035,
      0.25,
    )
    model.wings.forEach((wing, index) => {
      wing.rotation.z = (index === 0 ? -1 : 1) * (0.2 + Math.sin(seconds * 5) * 0.08)
    })
  }
  return {
    sync: (state, seconds) => {
      syncSide(state, 'player', seconds)
      syncSide(state, 'opponent', seconds)
    },
    dispose: () => {
      scene.remove(owls.player.owl, owls.opponent.owl)
      for (const shape of [bodyShape, headShape, eyeShape, wingShape]) shape.dispose()
      aura.dispose()
      dark.dispose()
    },
  }
}
