import type * as Three from 'three'
import { comfortableImpact, type FightComfort } from './fightComfort'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { fightContactStyle } from './fightContactStyle'
import type { FightState } from './types'

export function createFightImpactScene(options: {
  THREE: typeof Three
  scene: Three.Scene
  initial: FightState
  comfort: () => FightComfort
  geometry: <T extends Three.BufferGeometry>(made: T) => T
  glow: (colour: number, opacity: number) => Three.MeshBasicMaterial
}) {
  const { THREE, scene, comfort } = options
  const shapes = {
    hit: options.geometry(new THREE.SphereGeometry(0.045, 5, 4)),
    guard: options.geometry(new THREE.BoxGeometry(0.025, 0.09, 0.025)),
    parry: options.geometry(new THREE.TorusGeometry(0.16, 0.014, 4, 24)),
  }
  const materials = {
    hit: options.glow(0xffd36a, 1),
    guard: options.glow(0x67d9ff, 1),
    parry: options.glow(0xffffff, 1),
  }
  const sparks: Array<{
    mesh: Three.Mesh
    velocity: Three.Vector3
    born: number
    size: number
    ring: boolean
  }> = []
  let last = options.initial.impact?.sequence ?? 0
  let shake = { started: 0, until: 0, x: 0, y: 0 }
  return {
    emit(state: FightState, now: number) {
      const impact = state.impact
      if (!impact || impact.sequence === last) return
      last = impact.sequence
      const style = fightContactStyle(impact)
      if (style === 'evaded') return
      const profile = comfortableImpact({
        impact,
        attacker: state[impact.attacker].id,
        comfort: comfort(),
      })
      shake = { started: now, until: now + profile.shakeMs, x: profile.shakeX, y: profile.shakeY }
      const origin = new THREE.Vector3(
        fightWorldX(impact.position.x),
        fightWorldY(impact.position.y),
        0.25,
      )
      const count = style === 'parry' && profile.sparks > 0 ? 1 : profile.sparks
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const mesh = new THREE.Mesh(shapes[style], materials[style])
        mesh.name = `fight-contact-${style}`
        mesh.rotation.z = angle
        mesh.position.copy(origin)
        scene.add(mesh)
        sparks.push({
          mesh,
          velocity: new THREE.Vector3(
            style === 'parry' ? 0 : Math.cos(angle) * profile.sparkSpeed,
            style === 'parry' ? 0 : Math.sin(angle) * profile.sparkSpeed,
            0,
          ),
          born: now,
          size: profile.sparkSize,
          ring: style === 'parry',
        })
      }
    },
    animate(now: number) {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i],
          age = now - spark.born
        spark.mesh.position.add(spark.velocity)
        if (!spark.ring) spark.velocity.y -= 0.0008
        spark.mesh.scale.setScalar(
          spark.size * (spark.ring ? 0.5 + age / 180 : Math.max(0.01, 1 - age / 360)),
        )
        if (age > 360) {
          scene.remove(spark.mesh)
          sparks.splice(i, 1)
        }
      }
    },
    shake(camera: Three.PerspectiveCamera, now: number) {
      if (comfort().shake <= 0 || now >= shake.until) return
      const fade = (shake.until - now) / Math.max(1, shake.until - shake.started)
      camera.position.x += Math.sin(now * 0.15) * shake.x * fade
      camera.position.y += Math.cos(now * 0.19) * shake.y * fade
    },
    dispose() {
      for (const spark of sparks) scene.remove(spark.mesh)
      sparks.length = 0
    },
  }
}
