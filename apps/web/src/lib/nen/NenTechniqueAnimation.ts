import * as THREE from 'three'
import type { NenArchiveKind } from './archive'
import { TECHNIQUE_BUILDERS_1 } from './NenTechniqueBuilders1'
import { TECHNIQUE_BUILDERS_2 } from './NenTechniqueBuilders2'
import { TECHNIQUE_BUILDERS_3 } from './NenTechniqueBuilders3'
import { MODE_BY_KIND } from './NenTechniqueModes'
import { TECHNIQUE_MOTIONS_1 } from './NenTechniqueMotions1'
import { TECHNIQUE_MOTIONS_2 } from './NenTechniqueMotions2'
import { TECHNIQUE_MOTIONS_3 } from './NenTechniqueMotions3'
import { clamp01, easeOut, type AnimatedMesh } from './NenTechniquePrimitives'
const builders = { ...TECHNIQUE_BUILDERS_1, ...TECHNIQUE_BUILDERS_2, ...TECHNIQUE_BUILDERS_3 }
const motions = { ...TECHNIQUE_MOTIONS_1, ...TECHNIQUE_MOTIONS_2, ...TECHNIQUE_MOTIONS_3 }
export function buildTechniqueAnimation(kind: NenArchiveKind, colour: number): THREE.Group {
  const mode = MODE_BY_KIND[kind]
  const group = new THREE.Group()
  group.name = `technique-${mode}`
  group.userData.mode = mode
  group.visible = false

  const pale = new THREE.Color(colour).lerp(new THREE.Color(0xffffff), 0.42).getHex()
  const gold = 0xf1d477
  const red = 0xd85162

  builders[mode]?.(group, { mode, colour, pale, gold, red })

  return group
}
export function updateTechniqueAnimation(
  group: THREE.Group | null,
  progress: number,
  { time, active }: { time: number; active: boolean },
) {
  if (!group) return
  group.visible = active
  if (!active) return

  const eased = easeOut(progress)
  const globalFade = clamp01(Math.min(progress * 7, (1 - progress) * 6))
  group.rotation.y = Math.sin(time * 0.0008) * 0.08

  group.traverse((part) => {
    const mesh = part as AnimatedMesh
    if (!mesh.isMesh || !mesh.userData.motion) return
    const delay = mesh.userData.delay ?? 0
    const local = clamp01((progress - delay) / Math.max(0.001, 1 - delay))
    const localEase = easeOut(local)
    const phase = mesh.userData.phase ?? 0
    const material = mesh.material as THREE.MeshBasicMaterial
    material.opacity = (mesh.userData.baseOpacity ?? 0.7) * globalFade

    motions[mesh.userData.motion]?.({
      mesh,
      material,
      progress,
      eased,
      local,
      localEase,
      phase,
      time,
    })
  })
}
