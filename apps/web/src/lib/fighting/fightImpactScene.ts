import type * as Three from 'three'
import { comfortableImpact, type FightComfort } from './fightComfort'
import { createCombatImpactShake } from './combatImpactShake'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { fightContactStyle } from './fightContactStyle'
import { closeFightPosition } from './fightCloseSpacing'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { physicalRosterPair } from './fightPhysicalRoster'
import { fightContactTarget } from './fightContactAlignment'
import { fightRigOf } from './fightRig'
import { anatomicalContactZone, surfaceContactAt } from './fightSurfaceContact'
import { fightImpactPunctuation } from './fightImpactPunctuation'
import type { FightImpact, FightSide, FightState } from './types'

export function createFightImpactScene(options: {
  THREE: typeof Three
  scene: Three.Scene
  initial: FightState
  comfort: () => FightComfort
  figureOf?: (side: FightSide) => Three.Object3D
  geometry: <T extends Three.BufferGeometry>(made: T) => T
  glow: (colour: number, opacity: number) => Three.MeshBasicMaterial
}) {
  const { THREE, scene, comfort } = options
  const shapes = {
    hit: options.geometry(new THREE.SphereGeometry(0.045, 5, 4)),
    guard: options.geometry(new THREE.BoxGeometry(0.025, 0.09, 0.025)),
    parry: options.geometry(new THREE.TorusGeometry(0.16, 0.014, 4, 24)),
    clash: options.geometry(new THREE.TorusGeometry(0.22, 0.025, 6, 32)),
    ray: options.geometry(new THREE.BoxGeometry(0.24, 0.014, 0.014)),
    wave: options.geometry(new THREE.TorusGeometry(0.13, 0.012, 5, 28)),
  }
  const materials = {
    hit: options.glow(0xffd36a, 1),
    guard: options.glow(0x67d9ff, 1),
    parry: options.glow(0xffffff, 1),
    clash: options.glow(0x9ee7ff, 1),
  }
  const sparks: Array<{
    mesh: Three.Mesh
    velocity: Three.Vector3
    born: number
    size: number
    ring: boolean
  }> = []
  let last = options.initial.impact?.sequence ?? 0
  let lastClash = options.initial.attackClash?.sequence ?? 0
  const shake = createCombatImpactShake()
  return {
    emit(state: FightState, now: number) {
      shake.observe(state)
      const clash = state.attackClash
      if (clash && clash.sequence !== lastClash) {
        lastClash = clash.sequence
        const origin = new THREE.Vector3(
          fightWorldX(clash.position.x),
          fightWorldY(clash.position.y),
          0.3,
        )
        for (let i = 0; i < 2; i++) {
          const mesh = new THREE.Mesh(shapes.clash, materials.clash)
          mesh.name = 'fight-contact-clash'
          mesh.rotation.z = i * (Math.PI / 2)
          mesh.position.copy(origin)
          scene.add(mesh)
          sparks.push({
            mesh,
            velocity: new THREE.Vector3(),
            born: now,
            size: 0.9 + i * 0.25,
            ring: true,
          })
        }
      }
      const impact = state.impact
      if (!impact || impact.sequence === last) return
      last = impact.sequence
      const style = fightContactStyle(impact)
      if (style === 'evaded') return
      const profile = comfortableImpact({
        impact,
        attacker: state[impact.attacker].id,
        moveId: state[impact.attacker].attack?.moveId,
        comfort: comfort(),
      })
      const punctuation = fightImpactPunctuation(impact)
      shake.hit(impact, { profile, facing: state[impact.attacker].facing })
      const origin = new THREE.Vector3(
        fightWorldX(impact.position.x),
        fightWorldY(displayContactHeight(state, impact)),
        0.25,
      )
      alignCloseImpact(origin, { state, impact, figureOf: options.figureOf })
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
      if (punctuation.wave) {
        const mesh = new THREE.Mesh(shapes.wave, materials[style])
        mesh.name = 'fight-contact-wave'
        mesh.position.copy(origin)
        scene.add(mesh)
        sparks.push({
          mesh,
          velocity: new THREE.Vector3(),
          born: now,
          size: 0.8 + punctuation.rank * 0.18,
          ring: true,
        })
      }
      for (let i = 0; i < punctuation.rays; i++) {
        const spread = punctuation.rays <= 1 ? 0 : i / (punctuation.rays - 1) - 0.5
        const angle = spread * Math.PI * 1.15 + (punctuation.direction < 0 ? Math.PI : 0)
        const mesh = new THREE.Mesh(shapes.ray, materials[style])
        mesh.name = 'fight-contact-ray'
        mesh.rotation.z = angle
        mesh.position.copy(origin)
        scene.add(mesh)
        sparks.push({
          mesh,
          velocity: new THREE.Vector3(
            Math.cos(angle) * profile.sparkSpeed * 0.72,
            Math.sin(angle) * profile.sparkSpeed * 0.72,
            0,
          ),
          born: now,
          size: 0.55 + punctuation.rank * 0.12,
          ring: false,
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
    shake(camera: Three.PerspectiveCamera, _now: number) {
      if (comfort().shake <= 0) return
      const offset = shake.offset()
      camera.position.x += offset.x
      camera.position.y += offset.y
    },
    dispose() {
      for (const spark of sparks) scene.remove(spark.mesh)
      sparks.length = 0
    },
  }
}

function alignCloseImpact(
  origin: Three.Vector3,
  options: {
    state: FightState
    impact: FightImpact
    figureOf?: (side: FightSide) => Three.Object3D
  },
) {
  const { state, impact } = options
  const side = impact.attacker === 'player' ? 'opponent' : 'player'
  const attacker = state[impact.attacker]
  const target = state[side]
  if (alignPhysicalHit(origin, options)) return
  const close = closeFightPosition(state, side, { body: target, rival: attacker })
  origin.x += fightWorldX(close.x) - fightWorldX(target.x)
  if (close.z) origin.z = 0.38
  alignNeedleHead(origin, options)
}

function alignNeedleHead(
  origin: Three.Vector3,
  options: Parameters<typeof alignCloseImpact>[1],
): void {
  const { state, impact } = options
  const side = impact.attacker === 'player' ? 'opponent' : 'player'
  const attacker = state[impact.attacker]
  if (attacker.attack?.moveId !== 'illumi:neutralSpecial' || impact.zone !== 'head') return
  const figure = options.figureOf?.(side)
  const head = figure && humanAnimationRig(figure)?.head
  if (head) {
    head.getWorldPosition(origin)
    origin.x -= attacker.facing * 0.12
    origin.z += 0.25
  }
}

function alignPhysicalHit(
  origin: Three.Vector3,
  options: Parameters<typeof alignCloseImpact>[1],
): boolean {
  const { state, impact } = options
  const side = impact.attacker === 'player' ? 'opponent' : 'player'
  const human = options.figureOf && humanAnimationRig(options.figureOf(side))
  if (!human || !anatomicalPhysicalHit(state, impact)) return false
  const attacker = state[impact.attacker]
  const recorded =
    options.figureOf &&
    surfaceContactAt(options.figureOf(impact.attacker), state.frame, impact.sequence)
  const zone = anatomicalContactZone(attacker, state[side], impact.zone)
  origin.copy(recorded ?? fightContactTarget(fightRigOf(human), zone, attacker.facing))
  origin.z += 0.12
  return true
}

function anatomicalPhysicalHit(state: FightState, impact: FightImpact): boolean {
  const other = impact.attacker === 'player' ? 'opponent' : 'player'
  return (
    physicalRosterPair(state[impact.attacker].id, state[other].id) &&
    !impact.blocked &&
    !impact.parried &&
    impact.projectileId === null &&
    !impact.transfer &&
    !impact.objectTransfer
  )
}

/** Elevated melee silhouettes can cross the lower collision box before reaching the body. */
function displayContactHeight(state: FightState, impact: FightImpact): number {
  if (!elevatedStrike(state[impact.attacker].attack?.moveId, impact)) return impact.position.y
  const target = state[impact.attacker === 'player' ? 'opponent' : 'player']
  if (target.hanzoProjection || target.knockdownFrames > 0) return impact.position.y
  const height = impact.blocked || target.crouching ? 9 : 14
  return Math.max(impact.position.y, target.y + height)
}

function elevatedStrike(moveId: string | undefined, impact: FightImpact): boolean {
  if (impact.projectileId !== null || impact.transfer || impact.objectTransfer) return false
  return moveId === 'hisoka:standingHeavy' || moveId === 'kurapika:standingHeavy'
}
