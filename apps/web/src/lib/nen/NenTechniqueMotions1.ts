import * as THREE from 'three'
import type { AnimatedMesh } from './NenTechniquePrimitives'
export type MotionContext = {
  mesh: AnimatedMesh
  material: THREE.MeshBasicMaterial
  progress: number
  eased: number
  local: number
  localEase: number
  phase: number
  time: number
}
export type TechniqueMotion = (context: MotionContext) => void
export const TECHNIQUE_MOTIONS_1: Record<string, TechniqueMotion> = {
  'expand-ring': ({ mesh, material, local, localEase }) => {
    const scale = 0.2 + localEase * 1.35
    mesh.scale.setScalar(scale)
    material.opacity *= 1 - local * 0.72
  },
  'restore-wave': ({ mesh, material, local, localEase }) => {
    const scale = 0.2 + localEase * 1.35
    mesh.scale.setScalar(scale)
    material.opacity *= 1 - local * 0.72
  },
  'music-wave': ({ mesh, material, local, localEase }) => {
    const scale = 0.2 + localEase * 1.35
    mesh.scale.setScalar(scale)
    material.opacity *= 1 - local * 0.72
  },
  signal: ({ mesh, material, local, localEase }) => {
    const scale = 0.2 + localEase * 1.35
    mesh.scale.setScalar(scale)
    material.opacity *= 1 - local * 0.72
  },
  'seal-ring': ({ mesh, material, local, localEase }) => {
    const scale = 0.2 + localEase * 1.35
    mesh.scale.setScalar(scale)
    material.opacity *= 1 - local * 0.72
  },
  'coin-halo': ({ mesh, material, local, localEase }) => {
    const scale = 0.2 + localEase * 1.35
    mesh.scale.setScalar(scale)
    material.opacity *= 1 - local * 0.72
  },
  shell: ({ mesh, eased, time }) => {
    mesh.scale.setScalar(0.45 + eased * 0.75 + Math.sin(time * 0.006) * 0.025)
  },
  orbit: ({ mesh, eased, localEase, phase, time }) => {
    const radius =
      (mesh.userData.radius ?? 1.4) * (mesh.userData.motion === 'levy-orbit' ? 1 - eased * 0.45 : 1)
    const angle =
      (mesh.userData.angle ?? 0) + time * (mesh.userData.motion === 'swarm' ? 0.0018 : 0.001)
    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.7 + phase * 5) * 0.6,
      Math.sin(angle) * 0.7 + 0.7,
    )
    mesh.scale.setScalar(0.35 + localEase * 0.75)
  },
  'levy-orbit': ({ mesh, eased, localEase, phase, time }) => {
    const radius =
      (mesh.userData.radius ?? 1.4) * (mesh.userData.motion === 'levy-orbit' ? 1 - eased * 0.45 : 1)
    const angle =
      (mesh.userData.angle ?? 0) + time * (mesh.userData.motion === 'swarm' ? 0.0018 : 0.001)
    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.7 + phase * 5) * 0.6,
      Math.sin(angle) * 0.7 + 0.7,
    )
    mesh.scale.setScalar(0.35 + localEase * 0.75)
  },
  swarm: ({ mesh, eased, localEase, phase, time }) => {
    const radius =
      (mesh.userData.radius ?? 1.4) * (mesh.userData.motion === 'levy-orbit' ? 1 - eased * 0.45 : 1)
    const angle =
      (mesh.userData.angle ?? 0) + time * (mesh.userData.motion === 'swarm' ? 0.0018 : 0.001)
    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.7 + phase * 5) * 0.6,
      Math.sin(angle) * 0.7 + 0.7,
    )
    mesh.scale.setScalar(0.35 + localEase * 0.75)
  },
  'charge-beam': ({ mesh, material, local, localEase }) => {
    mesh.scale.y = Math.max(0.001, localEase)
    material.opacity *= Math.sin(local * Math.PI)
  },
  command: ({ mesh, material, local, localEase }) => {
    mesh.scale.y = Math.max(0.001, localEase)
    material.opacity *= Math.sin(local * Math.PI)
  },
  strike: ({ mesh, material, local, localEase }) => {
    mesh.scale.y = Math.max(0.001, localEase)
    material.opacity *= Math.sin(local * Math.PI)
  },
  verdict: ({ mesh, material, local, localEase }) => {
    mesh.scale.setScalar(0.25 + localEase * 0.9)
    material.opacity *= local < 0.55 ? 1 : 1 - (local - 0.55) / 0.45
  },
  afterimage: ({ mesh, material, eased, local, phase }) => {
    mesh.position.x = Math.sin((phase + eased) * Math.PI * 2) * 0.5
    mesh.rotation.y = (phase - 0.5) * 0.35
    material.opacity *= Math.sin(local * Math.PI)
  },
  tendril: ({ mesh, localEase, phase, time }) => {
    mesh.scale.y = 0.2 + localEase * (0.7 + Math.sin(time * 0.004 + phase * 8) * 0.15)
    mesh.rotation.z = Math.sin(time * 0.003 + phase * 9) * 0.18
  },
  cloud: ({ mesh, eased, localEase, phase, time }) => {
    const angle = (mesh.userData.angle ?? 0) + eased * 2.4 + Math.sin(time * 0.001 + phase)
    const radius = (mesh.userData.radius ?? 1) * (0.15 + localEase)
    mesh.position.set(
      Math.cos(angle) * radius,
      -0.7 + localEase * (0.6 + phase * 0.18),
      Math.sin(angle) * radius * 0.65 + 0.45,
    )
    mesh.scale.setScalar(0.25 + localEase * 1.3)
  },
  'coin-drop': ({ mesh, localEase, time }) => {
    mesh.position.y = THREE.MathUtils.lerp(1.8, -0.85, Math.min(1, localEase * 1.25))
    mesh.rotation.z = time * 0.008
  },
  bait: ({ mesh, localEase, time }) => {
    mesh.scale.setScalar(0.5 + Math.sin(time * 0.012) * 0.18 + localEase * 0.5)
  },
  jaw: ({ mesh, localEase, phase }) => {
    mesh.position.x = (phase || 1) * THREE.MathUtils.lerp(1.5, 0.4, localEase)
    mesh.rotation.z = (phase || 1) * (Math.PI / 2 - localEase * 0.85)
  },
  'seal-wall': ({ mesh, material, localEase, time }) => {
    mesh.scale.x = Math.max(0.001, localEase)
    material.opacity *= 0.55 + Math.sin(time * 0.008) * 0.25
  },
}
