import * as THREE from 'three'
import type { HumanFigure } from '../../tour/humanFigure'
import type { VictoryContext } from './types'
import { addBonolenovBattleArmor } from '../../tour/bonolenovBattleArmor'
import { BONOLENOV_ARMOR, BONOLENOV_TAPS } from './bonolenovPose'
import { ease } from './resources'

export function createBonolenovCostume() {
  const root = new THREE.Group(),
    head = new THREE.Group(),
    hand = new THREE.Group(),
    anchor = new THREE.Object3D()
  anchor.name = 'face-mouth'
  head.add(anchor)
  root.add(head, hand)
  hand.name = 'hand-right'
  const materials: THREE.MeshBasicMaterial[] = []
  const glow = (color: number, opacity = 1) => {
    const material = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    materials.push(material)
    return material
  }
  const figure: HumanFigure = {
    root,
    turns: root,
    lod: { near: root, far: new THREE.Group() },
    animate: () => {},
  }
  addBonolenovBattleArmor({ THREE, glow, model: figure })
  const skirt = root.getObjectByName('bonolenov-prologue-attire')!
  const spear = root.getObjectByName('bonolenov-prologue-spear')!
  const bare = glow(0x4b3935)
  root.name = 'bonolenov-victory-prologue'
  function expose(context: VictoryContext) {
    context.hero.root.traverse((node) => {
      if (!node.name.startsWith('bonolenov-') && node.name !== 'signature-bandages') return
      context.save(node)
      node.visible = false
    })
    const routes: Array<[string, ...number[]]> = [['torso', 1]]
    for (const side of ['left', 'right']) {
      for (const part of ['shoulder', 'elbow', 'hip', 'knee'])
        routes.push([`${part}-${side}`, 0, 1])
      routes.push([`shoulder-${side}`, 2, 1], [`hand-${side}`, 1])
    }
    for (const [name, ...indices] of routes) {
      let node = context.hero.root.getObjectByName(name)
      for (const index of indices) node = node?.children[index]
      if (node instanceof THREE.Mesh) context.material(node, bare)
    }
  }
  return {
    root,
    sync(context: VictoryContext) {
      const { hero, age } = context
      root.visible = age >= BONOLENOV_ARMOR && hero.root.visible
      if (age >= BONOLENOV_ARMOR) expose(context)
      hero.root.updateWorldMatrix(true, true)
      head.position.copy(hero.head.getWorldPosition(new THREE.Vector3()))
      head.quaternion.copy(hero.head.getWorldQuaternion(new THREE.Quaternion()))
      head.scale.copy(hero.head.getWorldScale(new THREE.Vector3()))
      const torso = hero.root.getObjectByName('torso')!
      skirt.position.copy(torso.getWorldPosition(new THREE.Vector3()))
      skirt.quaternion.copy(torso.getWorldQuaternion(new THREE.Quaternion()))
      skirt.scale.copy(torso.getWorldScale(new THREE.Vector3()))
      const wrist = hero.root.getObjectByName('hand-right')!
      hand.position.copy(wrist.getWorldPosition(new THREE.Vector3()))
      hand.quaternion.identity()
      hand.scale.copy(wrist.getWorldScale(new THREE.Vector3()))
      const reach = 1.59 * hand.scale.y
      const down = Math.max(-0.98, Math.min(-0.01, (0.028 - hand.position.y) / reach))
      const floorDirection = new THREE.Vector3(Math.sqrt(1 - down * down), down, 0)
      const strike = BONOLENOV_TAPS.reduce(
        (max, frame) =>
          Math.max(max, ease((age - frame + 12) / 12) * (1 - ease((age - frame) / 12))),
        0,
      )
      const up = new THREE.Vector3(0.25, 0.9, 0.1).normalize()
      const direction = up.lerp(floorDirection, strike).normalize()
      spear.position.set(0, 0, 0)
      spear.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
      root.updateWorldMatrix(true, true)
      return {
        spearTip: spear.localToWorld(new THREE.Vector3(0, 1.59, 0)),
        grip: hand.position.clone(),
      }
    },
    dispose() {
      root.removeFromParent()
      materials.forEach((material) => material.dispose())
    },
  }
}
