import * as THREE from 'three'
import type { TechniqueMotion } from './NenTechniqueMotions1'
export const TECHNIQUE_MOTIONS_2: Record<string, TechniqueMotion> = {
  'life-orb': ({ mesh, localEase, time }) => {
    mesh.position.x = THREE.MathUtils.lerp(1.8, 0, localEase)
    mesh.position.y = THREE.MathUtils.lerp(-0.8, 0.2, localEase)
    mesh.scale.setScalar(0.4 + Math.sin(time * 0.012) * 0.15 + localEase * 0.7)
  },
  'life-stream': ({ mesh, localEase }) => {
    mesh.scale.y = 0.15 + localEase * 0.9
    mesh.rotation.z += 0.006
  },
  drain: ({ mesh, localEase }) => {
    mesh.scale.y = 0.15 + localEase * 0.9
    mesh.rotation.z += 0.006
  },
  maw: ({ mesh, localEase, phase, time }) => {
    mesh.scale.setScalar(1.4 - localEase * 0.72)
    mesh.rotation.z = time * 0.002 + phase
  },
  write: ({ mesh, material, local }) => {
    mesh.scale.x = Math.max(0.001, Math.min(1, local * 2.6))
    material.opacity *= local < 0.85 ? 1 : (1 - local) / 0.15
  },
  'loan-orb': ({ mesh, local, localEase, time }) => {
    mesh.position.x = THREE.MathUtils.lerp(-1.4, 1.25, localEase)
    mesh.position.y = 0.2 + Math.sin(local * Math.PI) * 1.1
    mesh.scale.setScalar(0.55 + Math.sin(time * 0.012) * 0.12)
  },
  'web-thread': ({ mesh, localEase }) => {
    mesh.scale.y = Math.max(0.001, localEase)
  },
  'vacuum-dust': ({ mesh, localEase, time }) => {
    const radius = (mesh.userData.radius ?? 1.4) * (1 - localEase)
    const angle = (mesh.userData.angle ?? 0) + localEase * 12 + time * 0.001
    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.3) * radius * 0.5,
      0.8 + Math.sin(angle) * 0.3,
    )
    mesh.scale.setScalar(Math.max(0.05, 1 - localEase * 0.8))
  },
  chain: ({ mesh, local }) => {
    mesh.scale.setScalar(Math.max(0.001, Math.min(1, local * 2.2)))
    mesh.rotation.z += 0.004
  },
  'portal-ring': ({ mesh, localEase, phase, time }) => {
    mesh.scale.setScalar(0.25 + localEase * 1.15)
    mesh.rotation.z = time * (0.0008 + phase * 0.0005)
  },
  'cloth-fold': ({ mesh, local, localEase, time }) => {
    mesh.scale.set(0.25 + localEase * 0.9, 0.35 + localEase * 0.75, 1)
    mesh.rotation.y = Math.sin(local * Math.PI * 2) * 0.7 * (1 - local)
    mesh.rotation.x = Math.sin(time * 0.003) * 0.08
  },
  'sun-rise': ({ mesh, localEase, time }) => {
    mesh.position.y = THREE.MathUtils.lerp(-1.4, 1.45, Math.min(1, localEase * 1.3))
    mesh.scale.setScalar(0.2 + localEase * 1.15)
    mesh.rotation.y = time * 0.001
  },
  'planet-fall': ({ mesh, localEase, time }) => {
    mesh.position.y = THREE.MathUtils.lerp(3.2, 0.25, localEase)
    mesh.scale.setScalar(0.35 + localEase * 0.8)
    mesh.rotation.y = time * 0.0012
  },
}
