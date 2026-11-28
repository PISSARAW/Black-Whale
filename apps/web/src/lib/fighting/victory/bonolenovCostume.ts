import * as THREE from 'three'
import type { HumanFigure } from '../../tour/humanFigure'
import type { VictoryContext } from './types'
import { addBonolenovBattleArmor } from '../../tour/bonolenovBattleArmor'
import timing from './bonolenovTiming.json'
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
    joints: { elbows: [], hands: [hand], knees: [], feet: [] },
    animate: () => {},
  }
  addBonolenovBattleArmor({ THREE, glow, model: figure })
  const skirt = root.getObjectByName('bonolenov-prologue-attire')!
  const spear = root.getObjectByName('bonolenov-prologue-spear')!
  const bare = glow(0x4b3935)
  const coating = new THREE.Group()
  coating.name = 'bonolenov-prologue-shu'
  const coatingColours = [0x7beef6, 0xc7f8ff]
  coatingColours.forEach((colour, index) => {
    const part = spear.children[index] as THREE.Mesh
    const aura = new THREE.Mesh(part.geometry, glow(colour, 0.38))
    aura.position.copy(part.position)
    aura.scale.set(1.48, 1.014, 1.48)
    aura.material.depthWrite = false
    coating.add(aura)
  })
  spear.add(coating)
  root.name = 'bonolenov-victory-prologue'
  function syncBandages(context: VictoryContext, manifested: boolean) {
    context.hero.root.traverse((node) => {
      const wrapped =
        node.name === 'signature-bandages' ||
        node.name === 'bonolenov-head-wrap' ||
        node.name.startsWith('bonolenov-bandage-')
      const nativePrologue =
        node.name.startsWith('bonolenov-prologue-') || node.name === 'bonolenov-exposed-body-holes'
      if (!wrapped && !nativePrologue) return
      context.save(node)
      node.visible = wrapped && !manifested
    })
  }
  function expose(context: VictoryContext) {
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
      const manifested = age >= timing.armor && age < timing.form + 37
      root.visible = manifested && hero.root.visible
      syncBandages(context, manifested)
      if (root.visible) expose(context)
      const rise = ease((age - timing.armor) / 16)
      const show = Math.max(0.001, rise * (1 - ease((age - timing.form) / 37)))
      coating.visible =
        age < 106 && context.state[context.frame.winner].nen.shu.includes(spear.name)
      hero.root.updateWorldMatrix(true, true)
      head.position.copy(hero.head.getWorldPosition(new THREE.Vector3()))
      head.quaternion.copy(hero.head.getWorldQuaternion(new THREE.Quaternion()))
      head.scale.copy(hero.head.getWorldScale(new THREE.Vector3())).multiplyScalar(show)
      const torso = hero.root.getObjectByName('torso')!
      skirt.position.copy(torso.getWorldPosition(new THREE.Vector3()))
      skirt.quaternion.copy(torso.getWorldQuaternion(new THREE.Quaternion()))
      skirt.scale.copy(torso.getWorldScale(new THREE.Vector3())).multiplyScalar(show)
      const wrist = hero.root.getObjectByName('hand-right')!
      hand.position.copy(wrist.getWorldPosition(new THREE.Vector3()))
      hand.quaternion.identity()
      hand.scale.copy(wrist.getWorldScale(new THREE.Vector3()))
      spear.position.set(0, 0, 0)
      spear.quaternion.identity()
      spear.scale.set(
        show,
        show * Math.max(0.1, (hand.position.y - 0.04) / (1.3 * hand.scale.y)),
        show,
      )
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
