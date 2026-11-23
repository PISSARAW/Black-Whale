import type { BufferGeometry, Group, Material, Mesh, Object3D, Quaternion, Vector3 } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

type Three = HumanFigureBuild['THREE']

interface DeformingJoint {
  hinge: Object3D
  volume: Group
  restScale: Vector3
  range: number
  compression: number
  breadth: number
}

interface DeformingShoulder {
  arm: Object3D
  volume: Group
  restRotation: Quaternion
  restScale: Vector3
}

export interface FightJointVolumes {
  sync: () => void
}

const geometryByThree = new WeakMap<object, BufferGeometry>()

/**
 * Fight-only articulated anatomy shared by the roster.
 *
 * The authored skeleton remains authoritative. These masses sit on its live
 * hinges and squash as the elbow or knee closes, so a bent limb reads as one
 * body instead of two rigid tubes meeting at a pivot.
 */
export function addFightJointVolumes(options: {
  THREE: Three
  model: HumanFigure
  profile: HumanProfile
}): FightJointVolumes | null {
  const { THREE, model, profile } = options
  if (!profile.likeness || model.root.getObjectByName('fight-joint-volumes')) return null

  const owner = new THREE.Group()
  owner.name = 'fight-joint-volumes'
  owner.userData.rollout = 'roster-articulated-anatomy'
  owner.userData.identity = profile.likeness
  model.turns.add(owner)

  const joints: DeformingJoint[] = []
  const shoulders: DeformingShoulder[] = []
  const girth =
    profile.likeness === 'kurapika' ? 1 : { slim: 0.9, average: 1, broad: 1.12 }[profile.build]
  for (const side of ['left', 'right'] as const) {
    const arm = model.root.getObjectByName(`shoulder-${side}`)
    const elbow = model.root.getObjectByName(`elbow-${side}`)
    const knee = model.root.getObjectByName(`knee-${side}`)
    if (arm) {
      const cap = arm.children[2] as Group | undefined
      if (cap) {
        cap.name = `fight-shoulder-volume-${side}`
        cap.userData.deformableJoint = 'shoulder'
        shoulders.push({
          arm,
          volume: cap,
          restRotation: arm.quaternion.clone(),
          restScale: cap.scale.clone(),
        })
      }
    }
    if (elbow) {
      const volume = jointVolume(THREE, elbow, `fight-elbow-volume-${side}`, 0.052 * girth)
      if (volume)
        joints.push({
          hinge: elbow,
          volume,
          restScale: volume.scale.clone(),
          range: 1.55,
          compression: 0.18,
          breadth: 0.12,
        })
    }
    if (knee) {
      const volume = jointVolume(THREE, knee, `fight-knee-volume-${side}`, 0.066 * girth)
      if (volume)
        joints.push({
          hinge: knee,
          volume,
          restScale: volume.scale.clone(),
          range: 1.45,
          compression: 0.16,
          breadth: 0.1,
        })
    }
  }

  const sync = (): void => {
    for (const joint of joints) {
      const flex = Math.min(1, Math.abs(joint.hinge.rotation.x) / joint.range)
      joint.volume.scale.set(
        joint.restScale.x * (1 + flex * joint.breadth),
        joint.restScale.y * (1 - flex * joint.compression),
        joint.restScale.z * (1 + flex * joint.breadth * 0.78),
      )
      joint.volume.position.z = flex * 0.008
    }
    for (const shoulder of shoulders) {
      const flex = Math.min(1, shoulder.arm.quaternion.angleTo(shoulder.restRotation) / 1.45)
      shoulder.volume.scale.set(
        shoulder.restScale.x * (1 + flex * 0.08),
        shoulder.restScale.y * (1 - flex * 0.12),
        shoulder.restScale.z * (1 + flex * 0.06),
      )
      shoulder.volume.position.z = flex * 0.006
    }
  }
  sync()
  return { sync }
}

function jointVolume(THREE: Three, hinge: Object3D, name: string, radius: number): Group | null {
  const materials = segmentMaterials(hinge.children[0])
  if (!materials) return null
  const group = new THREE.Group()
  group.name = name
  group.userData.deformableJoint = name.includes('elbow') ? 'elbow' : 'knee'
  const geometry = jointGeometry(THREE)
  const edge = new THREE.Mesh(geometry, materials.edge)
  edge.scale.setScalar(1.072)
  const surface = new THREE.Mesh(geometry, materials.surface)
  group.add(edge, surface)
  group.scale.set(radius, radius * 0.86, radius)
  hinge.add(group)
  return group
}

function segmentMaterials(
  segment: Object3D | undefined,
): { edge: Material; surface: Material } | null {
  if (!segment) return null
  const meshes = segment.children.filter((child): child is Mesh => (child as Mesh).isMesh === true)
  const edge = meshes[0]?.material
  const surface = meshes[1]?.material
  if (!edge || !surface || Array.isArray(edge) || Array.isArray(surface)) return null
  return { edge, surface }
}

function jointGeometry(THREE: Three): BufferGeometry {
  const key = THREE as unknown as object
  const held = geometryByThree.get(key)
  if (held) return held
  const geometry = new THREE.SphereGeometry(1, 8, 6)
  geometry.userData = { ...geometry.userData, sharedHuman: true, fightJointVolume: true }
  geometryByThree.set(key, geometry)
  return geometry
}
