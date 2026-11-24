import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { ArcadeFighter, FightSide } from './types'
import { createFeitanBladeTrail } from './feitanBladeTrail'
import { feitanIconicIdle } from './feitanIdentity'

/** Physical blade attached to the anatomical weapon hand, including after a rig rebuild. */
export function createFeitanBladeScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE } = options
  const blade = new THREE.BoxGeometry(0.045, 0.72, 0.016)
  const grip = new THREE.CylinderGeometry(0.026, 0.026, 0.16, 8)
  const guard = new THREE.CylinderGeometry(0.045, 0.045, 0.012, 12)
  const tip = new THREE.ConeGeometry(0.023, 0.09, 4)
  const silver = new THREE.MeshBasicMaterial({ color: '#dce4eb' })
  const dark = new THREE.MeshBasicMaterial({ color: '#281b2c' })
  const models = new Map<FightSide, import('three').Group>()
  const originals = new Map<import('three').Object3D, boolean>()
  const trail = createFeitanBladeTrail(options)

  function model(side: FightSide) {
    const held = models.get(side)
    if (held) return held
    const root = new THREE.Group()
    root.name = `feitan-blade:${side}`
    const edge = new THREE.Mesh(blade, silver)
    edge.position.y = -0.5
    const point = new THREE.Mesh(tip, silver)
    point.rotation.z = Math.PI
    point.position.y = -0.905
    const tsuba = new THREE.Mesh(guard, dark)
    tsuba.position.y = -0.12
    root.add(new THREE.Mesh(grip, dark), edge, point, tsuba)
    models.set(side, root)
    return root
  }

  function syncHand(actor: ArcadeFighter, side: FightSide) {
    const figure = options.figureOf?.(side)
    if (!figure) {
      trail.drop(side)
      return
    }
    const hand = figure.getObjectByName('hand-left')
    const source = figure.getObjectByName('signature-umbrella')
    if (!hand || !source) {
      trail.drop(side)
      return
    }
    syncWeapon({ actor, side, figure, hand, source })
  }

  function syncWeapon({
    actor,
    side,
    figure,
    hand,
    source,
  }: {
    actor: ArcadeFighter
    side: FightSide
    figure: import('three').Object3D
    hand: import('three').Object3D
    source: import('three').Object3D
  }) {
    const root = model(side)
    if (root.parent !== hand) hand.add(root)
    const usable = !actor.weaponsConfiscated && !actor.hatsuEffects.painPacker?.armour
    root.visible = usable
    const iconic = feitanIconicIdle(actor)
    const forwardHeavy = ['feitan:standingHeavy', 'feitan:forwardHeavy'].includes(
      actor.attack?.moveId ?? '',
    )
    root.rotation.set(0, 0, iconic ? -Math.PI / 2 : forwardHeavy ? 0.58 : 0)
    root.position.set(iconic ? 0.04 : 0, iconic ? -0.01 : 0, 0)
    setOriginal(source, usable && !actor.umbrellaFeintFrames)
    const cloth = figure.getObjectByName('signature-umbrella-cloth')
    if (cloth) setOriginal(cloth, source.visible)
    trail.sync(actor, root, side)
  }

  function setOriginal(object: import('three').Object3D, visible: boolean) {
    if (!originals.has(object)) originals.set(object, object.visible)
    object.visible = visible
  }

  return {
    sync(state) {
      models.forEach((root) => {
        root.visible = false
      })
      for (const side of ['player', 'opponent'] as const) {
        if (state[side].id === 'feitan') syncHand(state[side], side)
        else trail.drop(side)
      }
    },
    dispose() {
      trail.dispose()
      models.forEach((root) => root.removeFromParent())
      originals.forEach((visible, object) => {
        object.visible = visible
      })
      models.clear()
      originals.clear()
      for (const geometry of [blade, grip, guard, tip]) geometry.dispose()
      silver.dispose()
      dark.dispose()
    },
  }
}
