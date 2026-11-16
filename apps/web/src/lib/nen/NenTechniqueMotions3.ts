import type { TechniqueMotion } from './NenTechniqueMotions1'
export const TECHNIQUE_MOTIONS_3: Record<string, TechniqueMotion> = {
  'fish-swim': ({ mesh, localEase, time }) => {
    const angle = (mesh.userData.angle ?? 0) + time * 0.0016 + localEase * 2
    const radius = (mesh.userData.radius ?? 1.5) * (1 - localEase * 0.35)
    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.6) * 0.7,
      Math.sin(angle) * 0.75 + 0.7,
    )
    mesh.rotation.z = angle + Math.PI / 2
    if (mesh.userData.baseScale)
      mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(0.4 + localEase * 0.8)
  },
  'scan-cone': ({ mesh, localEase, time }) => {
    mesh.rotation.z = Math.sin(time * 0.0025) * 0.65
    mesh.scale.setScalar(0.35 + localEase * 0.8)
  },
  'double-figure': ({ mesh, material, phase, time }) => {
    mesh.position.x += Math.sin(time * 0.003 + phase * 4) * 0.0015
    material.opacity *= 0.6 + Math.sin(time * 0.008 + phase) * 0.25
  },
  'transform-box': ({ mesh, localEase }) => {
    mesh.scale.setScalar(Math.max(0.05, 1 - localEase))
    mesh.rotation.y = localEase * Math.PI
  },
  'transform-animal': ({ mesh, localEase }) => {
    mesh.scale.set(1.2 * localEase, 0.75 * localEase, 1.5 * localEase)
    mesh.rotation.y = -localEase * Math.PI
  },
}
