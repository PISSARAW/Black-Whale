import * as THREE from 'three'
import type { VictoryContext } from './types'
import { createBeyondCurseEye } from './beyondCurseFace'
import { disposeVictoryObject, ease } from './resources'
import { BEYOND_CURSE_TIMING as T } from './beyondCursePose'

const SEGMENTS = 40
const SIDES = 5

function strand(material: THREE.Material) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute((SEGMENTS + 1) * SIDES * 3, 3))
  const indices: number[] = []
  for (let i = 0; i < SEGMENTS; i++)
    for (let j = 0; j < SIDES; j++) {
      const a = i * SIDES + j,
        b = i * SIDES + ((j + 1) % SIDES)
      indices.push(a, b, a + SIDES, b, b + SIDES, a + SIDES)
    }
  geometry.setIndex(indices)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  return mesh
}

function trace(mesh: THREE.Mesh, points: THREE.Vector3[], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const positions = mesh.geometry.attributes.position
  const axes = curve.computeFrenetFrames(SEGMENTS, false)
  for (let i = 0; i <= SEGMENTS; i++) {
    const point = curve.getPointAt(i / SEGMENTS)
    const taper = radius * (0.25 + 0.75 * Math.sin((Math.PI * i) / SEGMENTS))
    for (let j = 0; j < SIDES; j++) {
      const angle = (j / SIDES) * Math.PI * 2
      const p = point
        .clone()
        .addScaledVector(axes.normals[i], Math.cos(angle) * taper)
        .addScaledVector(axes.binormals[i], Math.sin(angle) * taper)
      positions.setXYZ(i * SIDES + j, p.x, p.y, p.z)
    }
  }
  positions.needsUpdate = true
}

function cursePath(
  options: { source: THREE.Vector3; target: THREE.Vector3; age: number },
  index: number,
) {
  const { source, target, age } = options
  const travel = ease((age - T.release) / (T.contact - T.release))
  const bind = ease((age - T.contact) / 54)
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * travel
    const phase = (index * Math.PI) / 4 + t * Math.PI * (2 + bind * 4) - age * 0.025
    const spread = Math.sin(Math.PI * t) * (0.16 + bind * 0.2)
    const p = source.clone().lerp(target, t)
    p.y += Math.sin(Math.PI * t) * 0.65 + Math.sin(phase) * spread
    p.z += Math.cos(phase) * spread
    p.x += Math.sin(phase * 0.7) * spread * 0.4
    points.push(p)
  }
  return points
}

export function createBeyondCurseEffects() {
  const root = new THREE.Group()
  root.name = 'beyond-post-mortem-curse'
  const ink = new THREE.MeshBasicMaterial({ color: 0x140c21, side: THREE.DoubleSide })
  const vein = new THREE.MeshBasicMaterial({ color: 0x984753, side: THREE.DoubleSide })
  const strands = Array.from({ length: 8 }, (_, i) => strand(i % 3 === 0 ? vein : ink))
  root.add(...strands)
  const eye = createBeyondCurseEye()
  eye.name = 'beyond-curse-looming-eye'
  root.add(eye)
  const smokeMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, power: { value: 0 } },
    vertexShader: `varying vec3 p; void main(){p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 p; uniform float time; uniform float power; void main(){float f=pow(abs(sin(atan(p.z,p.x)*7.+p.y*9.-time*1.4)),5.); vec3 c=mix(vec3(.035,.012,.06),vec3(.23,.065,.13),f); gl_FragColor=vec4(c,(.09+.27*f)*power);}`,
  })
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), smokeMaterial)
  root.add(smoke)
  const coils = Array.from({ length: 5 }, () => strand(ink))
  root.add(...coils)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.012, 6, 96), vein)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.022
  root.add(ring)
  return {
    root,
    sync(context: VictoryContext, source: THREE.Vector3) {
      const { age, hero } = context
      const active = age >= T.release
      const bound = age >= T.contact && age < T.princeDeath + 24
      const fade = 1 - ease((age - T.princeDeath) / 100)
      const target = hero.head.getWorldPosition(new THREE.Vector3())
      target.y -= hero.height * 0.28
      strands.forEach((mesh, i) => {
        mesh.visible = active && age < T.princeDeath
        if (mesh.visible) trace(mesh, cursePath({ source, target, age }, i), 0.012)
      })
      coils.forEach((mesh, i) => {
        mesh.visible = bound
        if (!bound) return
        const points = Array.from({ length: 25 }, (_, j) => {
          const t = j / 24,
            theta = t * Math.PI * 4 + i * 1.7 + age * 0.016
          const radius = hero.width * 0.65 * (1 - ease((age - 378) / 54) * 0.3)
          return new THREE.Vector3(
            hero.root.position.x + Math.cos(theta) * radius,
            hero.height * (0.22 + t * 0.68),
            hero.root.position.z + Math.sin(theta) * radius,
          )
        })
        trace(mesh, points, 0.011)
      })
      eye.visible = active
      eye.position.set(context.centre, Math.max(hero.height, context.victim.height) + 0.35, -0.65)
      eye.scale.set(0.8, (0.03 + ease((age - T.release) / 54) * 0.5) * fade, 0.8)
      smoke.visible = active && age < T.princeDeath
      smoke.position.set(hero.root.position.x, hero.height * 0.5, hero.root.position.z)
      smoke.scale.set(hero.width * 1.05, hero.height * 0.68, hero.width * 0.9)
      smokeMaterial.uniforms.power.value = ease((age - T.contact) / 36)
      smokeMaterial.uniforms.time.value = context.comfort.flashes ? age / 60 : 0
      ring.visible = age >= T.seal
      ring.position.x = context.victim.head.getWorldPosition(new THREE.Vector3()).x
      ring.position.z = context.victim.root.position.z
      const arrival = Math.min(1, Math.max(0, (age - T.release) / (T.contact - T.release)))
      return { arrival, bound, active }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
