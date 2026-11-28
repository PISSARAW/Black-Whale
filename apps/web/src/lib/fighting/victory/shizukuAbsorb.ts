import { Color, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import type { Material } from 'three'
import type { VictoryContext } from './types'
import type { ShizukuVictoryPose } from './shizukuPose'
import {
  SHIZUKU_PULL,
  SHIZUKU_CONSUMED,
  SHIZUKU_DEATH,
  SHIZUKU_NOZZLE_CONTACT,
  SHIZUKU_NOZZLE_RELEASE,
} from './shizukuTiming'
import { ease } from './resources'

function drawIntoNozzle(context: VictoryContext, feet: Vector3, mouth: Vector3) {
  const { age, victim } = context
  const root = victim.root
  const slide = ease((age - SHIZUKU_PULL) / (SHIZUKU_NOZZLE_CONTACT - SHIZUKU_PULL))
  const lift = ease((age - 365) / (SHIZUKU_NOZZLE_CONTACT - 365))
  const swallow = ease((age - SHIZUKU_NOZZLE_RELEASE) / (SHIZUKU_CONSUMED - SHIZUKU_NOZZLE_RELEASE))
  const anchor = root.worldToLocal(feet.clone())
  const destination = feet.clone().lerp(mouth, slide)
  destination.y = feet.y + (mouth.y - feet.y) * lift

  // The shoes reach the mouth at full size. Then the body compresses into the opening.
  root.rotation.z -= 0.27 * lift * (1 - swallow)
  const width = 1 - swallow ** 0.76 * 0.995
  const length = 1 - swallow * 0.995
  root.scale.multiply(new Vector3(width, length, width))
  root.position.add(destination.sub(root.localToWorld(anchor)))
}

export function createShizukuAbsorption() {
  const materials = new Map<Material, MeshBasicMaterial>()
  return {
    sync(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
      const { victim, age } = context
      const next = (source: Material) => {
        if (!(source instanceof MeshBasicMaterial)) return source
        const material =
          materials.get(source) ??
          new MeshBasicMaterial({
            side: source.side,
            transparent: source.transparent,
            opacity: source.opacity,
            depthWrite: source.depthWrite,
            blending: source.blending,
          })
        materials.set(source, material)
        const colour = (source as MeshBasicMaterial).color ?? new Color(0x777777)
        material.color.copy(colour).lerp(new Color(0xaaa3a2), pose.drain * 0.25)
        return material
      }
      victim.root.traverse((node) => {
        if (!(node instanceof Mesh)) return
        context.material(
          node,
          Array.isArray(node.material) ? node.material.map(next) : next(node.material),
        )
      })
      const absorption = ease((age - SHIZUKU_PULL) / (SHIZUKU_CONSUMED - SHIZUKU_PULL))
      if (age < SHIZUKU_DEATH) return absorption
      victim.root.traverse((node) => {
        if (
          !node.userData.visitModel &&
          !['shizuku-blinky', 'chrollo-open-book', 'chrollo-closed-book'].includes(node.name)
        )
          return
        context.save(node)
        node.visible = false
      })
      if (absorption > 0) drawIntoNozzle(context, pose.feet, mouth)
      victim.root.visible = age < SHIZUKU_CONSUMED
      return absorption
    },
    dispose() {
      materials.forEach((material) => material.dispose())
      materials.clear()
    },
  }
}
