import type * as Three from 'three'
import { attackAuraColour } from './techniqueAuraColours'
import { motionOf } from './fighterMovement'
import type { FightComfort } from './fightComfort'
import type { FightSide, FightState } from './types'

const ANCHORS = ['hand-left', 'hand-right', 'knee-left', 'knee-right'] as const
const POOL_SIZE = 24
const LIFE_MS = 105

interface TrailMesh extends Three.Mesh<Three.CylinderGeometry, Three.MeshBasicMaterial> {
  userData: { born?: number; life?: number }
}

/** Short limb-speed smears. They never persist long enough to become an aura trail. */
export function createFightMotionTrailScene(options: {
  THREE: typeof Three
  scene: Three.Scene
  figureOf: (side: FightSide) => Three.Object3D | undefined
  comfort: () => FightComfort
}) {
  const { THREE, scene } = options
  const geometry = new THREE.CylinderGeometry(0.014, 0.035, 1, 5, 1, true)
  const pool: TrailMesh[] = Array.from({ length: POOL_SIZE }, () => {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const mesh = new THREE.Mesh(geometry, material) as TrailMesh
    mesh.name = 'fight-motion-trail'
    mesh.visible = false
    scene.add(mesh)
    return mesh
  })
  const previous = new Map<string, Three.Vector3>()
  const up = new THREE.Vector3(0, 1, 0)
  let cursor = 0
  let key = ''
  let lastFrame = -1
  return {
    sync(state: FightState, now: number) {
      const identity = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
      if (identity !== key || state.frame < lastFrame) {
        key = identity
        previous.clear()
        hideAll(pool)
      }
      const advanced = state.frame > lastFrame
      lastFrame = state.frame
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const figure = options.figureOf(side)
        if (!figure) continue
        const samples = ANCHORS.flatMap((name) => {
          const anchor = figure.getObjectByName(name)
          if (!anchor) return []
          const current = anchor.getWorldPosition(new THREE.Vector3())
          const id = `${side}:${name}`
          const from = previous.get(id)
          previous.set(id, current.clone())
          return from ? [{ name, from, current, distance: from.distanceTo(current) }] : []
        })
        if (!shouldTrail(state, side, advanced, options.comfort())) continue
        const dashEcho = fighter.id === 'kurapika' && Boolean(motionOf(fighter).dash)
        const heavy = fighter.attack?.kind === 'heavy'
        const threshold = dashEcho ? 0.025 : heavy ? 0.045 : 0.065
        const limit = dashEcho ? 4 : heavy ? 2 : 1
        const colour = fighter.attack
          ? attackAuraColour(fighter)
          : fighter.kurapika?.emperorTime
            ? 0xd44a65
            : 0x91abc8
        for (const sample of samples
          .filter(({ distance }) => distance >= threshold && distance <= 1.1)
          .sort((a, b) => b.distance - a.distance)
          .slice(0, limit)) {
          const mesh = pool[cursor++ % pool.length]
          const direction = sample.current.clone().sub(sample.from)
          mesh.position.copy(sample.from).lerp(sample.current, 0.5)
          mesh.quaternion.setFromUnitVectors(up, direction.clone().normalize())
          mesh.scale.set(1, sample.distance, 1)
          mesh.material.color.set(colour)
          mesh.material.opacity = dashEcho ? 0.26 : heavy ? 0.42 : 0.3
          mesh.userData.born = now
          mesh.userData.life = dashEcho ? LIFE_MS + 55 : LIFE_MS + (heavy ? 35 : 0)
          mesh.visible = true
        }
      }
    },
    animate(now: number) {
      for (const mesh of pool) {
        if (!mesh.visible) continue
        const age = now - (mesh.userData.born ?? now)
        const life = mesh.userData.life ?? LIFE_MS
        if (age >= life || !options.comfort().flashes) {
          mesh.visible = false
          continue
        }
        const progress = Math.max(0, age / life)
        mesh.material.opacity *= Math.max(0, 1 - progress * 0.32)
        mesh.scale.x = mesh.scale.z = 1 + progress * 0.8
      }
    },
    dispose() {
      previous.clear()
      for (const mesh of pool) {
        scene.remove(mesh)
        mesh.material.dispose()
      }
      geometry.dispose()
    },
  }
}

function shouldTrail(
  state: FightState,
  side: FightSide,
  advanced: boolean,
  comfort: FightComfort,
): boolean {
  const fighter = state[side]
  const attack = fighter.attack
  const kurapikaDash = fighter.id === 'kurapika' && Boolean(motionOf(fighter).dash)
  return Boolean(
    advanced &&
    comfort.flashes &&
    state.phase === 'fighting' &&
    state.hitstop === 0 &&
    (kurapikaDash || (attack && attack.variant !== 'throw' && attack.kind !== 'ranged')),
  )
}

function hideAll(pool: readonly TrailMesh[]): void {
  for (const mesh of pool) mesh.visible = false
}
