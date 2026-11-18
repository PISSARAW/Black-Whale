import * as T from 'three'
import type { VictoryContext } from './types'
import type { BashoPose } from './bashoPose'
import { disposeVictoryObject, ease } from './resources'
import { BASHO_FLAME_FRAGMENT, BASHO_FLAME_VERTEX } from './bashoFlameShader'

const JOINTS = [
  'torso',
  'torso',
  'torso',
  'hip-left',
  'hip-right',
  'shoulder-left',
  'shoulder-right',
  'elbow-left',
  'elbow-right',
  'hand-left',
  'hand-right',
  'knee-left',
  'knee-right',
  'torso',
  'torso',
  'torso',
  'shoulder-left',
  'shoulder-right',
  'manga-head',
  'torso',
  'knee-left',
  'knee-right',
]
type Coloured = T.Material & { color?: T.Color; emissive?: T.Color }
export function createBashoFire() {
  const root = new T.Group(),
    geometry = new T.PlaneGeometry(1, 1)
  const flames = JOINTS.map(
    (_, i) =>
      new T.Mesh(
        geometry,
        new T.ShaderMaterial({
          vertexShader: BASHO_FLAME_VERTEX,
          fragmentShader: BASHO_FLAME_FRAGMENT,
          uniforms: { uTime: { value: 0 }, uSeed: { value: i * 2.39 }, uOpacity: { value: 0 } },
          transparent: true,
          depthWrite: false,
          side: T.DoubleSide,
          toneMapped: false,
        }),
      ),
  )
  const emberGeometry = new T.SphereGeometry(0.009, 4, 3),
    emberMaterial = new T.MeshBasicMaterial({ color: 0xffa34a, transparent: true, opacity: 0.8 })
  const embers = Array.from({ length: 32 }, () => new T.Mesh(emberGeometry, emberMaterial))
  const scorch = new T.Mesh(
    new T.CircleGeometry(0.65, 40),
    new T.MeshBasicMaterial({
      color: 0x1f1512,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  )
  scorch.rotation.x = -Math.PI / 2
  root.name = 'basho-contact-triggered-fire'
  root.add(...flames, ...embers, scorch)
  const materials = new Map<T.Material, Coloured>()
  function char(context: VictoryContext, amount: number) {
    if (amount === 0) return
    context.victim.root.traverse((node) => {
      if (!(node instanceof T.Mesh)) return
      const burned = (original: T.Material) => {
        const source = original as Coloured
        let clone = materials.get(original)
        if (!clone) {
          clone = source.clone() as Coloured
          materials.set(original, clone)
        }
        if (source.color) clone.color?.copy(source.color).lerp(new T.Color(0x211b18), amount)
        if (source.emissive) clone.emissive?.copy(source.emissive).multiplyScalar(1 - amount)
        return clone
      }
      context.material(
        node,
        Array.isArray(node.material) ? node.material.map(burned) : burned(node.material),
      )
    })
  }
  return {
    sync(context: VictoryContext, pose: BashoPose) {
      const { age, victim } = context,
        level = pose.beat.impacts
      const fade = 1 - ease((age - 474) / 24),
        size = victim.height / 2
      const count = level === 0 ? 0 : level === 1 ? 3 : level === 2 ? 10 : 22
      flames.forEach((flame, i) => {
        const joint =
          JOINTS[i] === 'manga-head' ? victim.head : victim.root.getObjectByName(JOINTS[i])!
        flame.position.copy(joint.getWorldPosition(new T.Vector3()))
        flame.position.add(
          new T.Vector3(
            Math.sin(i * 2.39) * 0.12 * size,
            0.15 * size,
            0.1 + Math.cos(i * 1.71) * 0.12,
          ),
        )
        flame.quaternion.copy(context.camera.quaternion)
        flame.scale.set(size * (0.4 + level * 0.07), size * (0.55 + level * 0.13), 1)
        flame.visible = i < count && fade > 0
        flame.material.uniforms.uTime.value = age / 60
        flame.material.uniforms.uOpacity.value = fade * (context.comfort.flashes ? 0.9 : 0.7)
      })
      const smokeFade = 1 - ease((age - 498) / 70)
      embers.forEach((ember, i) => {
        const lift = ((age - 216) * 0.012 + i * 0.173) % 1
        ember.position.set(
          victim.root.position.x + Math.sin(i * 2.39) * 0.45 * size,
          Math.max(0, lift) * victim.height + 0.1,
          victim.root.position.z + 0.2 + Math.cos(i) * 0.2,
        )
        ember.visible = level > 0 && smokeFade > 0 && context.comfort.flashes
      })
      emberMaterial.opacity = 0.8 * smokeFade
      scorch.visible = age >= 420
      scorch.position.set(
        victim.root.position.x + victim.height * 0.2,
        0.015,
        victim.root.position.z,
      )
      scorch.scale.set(1 + size * 0.3, ease((age - 420) / 36) * 0.6, 1)
      char(context, ease((age - 216) / 210) * 0.88)
      context.add(root)
      return {
        ignitions: level,
        fireVisible: count > 0 && fade > 0,
        fireBeforeContact: false,
        arbitrarySpell: false,
        charred: ease((age - 216) / 210),
      }
    },
    dispose() {
      disposeVictoryObject(root)
      materials.forEach((m) => m.dispose())
      materials.clear()
    },
  }
}
