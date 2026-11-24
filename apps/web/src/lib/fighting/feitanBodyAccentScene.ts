import { feitanIconicIdle, feitanWounded } from './feitanIdentity'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

interface AccentModel {
  finger: import('three').Group
  wounds: import('three').Group
}

/** Raised index and visible injury accents omitted by the shared human rig. */
export function createFeitanBodyAccentScene(options: EffectSceneOptions) {
  const { THREE } = options
  const skin = new THREE.MeshBasicMaterial({ color: 0xd6b7aa })
  const blood = new THREE.MeshBasicMaterial({ color: 0x711d26 })
  const models = new Map<FightSide, AccentModel>()
  const cylinder = new THREE.CylinderGeometry(0.012, 0.014, 0.14, 8)
  const tip = new THREE.SphereGeometry(0.013, 8, 6)
  const cut = new THREE.BoxGeometry(0.075, 0.012, 0.008)

  function model(side: FightSide): AccentModel {
    const held = models.get(side)
    if (held) return held
    const finger = new THREE.Group()
    finger.name = `feitan-raised-index:${side}`
    const shaft = new THREE.Mesh(cylinder, skin)
    shaft.position.y = 0.07
    const cap = new THREE.Mesh(tip, skin)
    cap.position.y = 0.145
    finger.add(shaft, cap)
    const wounds = new THREE.Group()
    wounds.name = `feitan-visible-injury:${side}`
    for (let i = 0; i < 3; i++) {
      const mark = new THREE.Mesh(cut, blood)
      mark.position.set((i - 1) * 0.024, i * 0.018, 0.032)
      mark.rotation.z = -0.45 + i * 0.42
      wounds.add(mark)
    }
    models.set(side, { finger, wounds })
    return { finger, wounds }
  }

  function attach(side: FightSide, state: FightState) {
    const actor = state[side]
    const figure = options.figureOf?.(side)
    if (!figure || actor.id !== 'feitan') return
    const held = model(side)
    const freeHand = figure.getObjectByName('hand-right')
    if (freeHand && held.finger.parent !== freeHand) freeHand.add(held.finger)
    held.finger.position.set(0.018, 0.015, 0.008)
    held.finger.rotation.set(0, 0, 0.08)
    held.finger.visible = feitanIconicIdle(actor)
    if (freeHand && held.wounds.parent !== freeHand) freeHand.add(held.wounds)
    held.wounds.position.set(0, -0.025, 0.006)
    held.wounds.visible = feitanWounded(actor)
  }

  return {
    sync(state: FightState) {
      for (const side of ['player', 'opponent'] as const) {
        const held = models.get(side)
        if (held) {
          held.finger.visible = false
          held.wounds.visible = false
        }
        attach(side, state)
      }
    },
    dispose() {
      models.forEach(({ finger, wounds }) => {
        finger.removeFromParent()
        wounds.removeFromParent()
      })
      cylinder.dispose()
      tip.dispose()
      cut.dispose()
      skin.dispose()
      blood.dispose()
      models.clear()
    },
  }
}
