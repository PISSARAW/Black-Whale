import { createSunMoonMarks, type SunMoonMarks } from './visitHatsuMarks'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { PreparedEntity } from './preparationTypes'
import type { FightState, FightSide } from './types'

/** Transient rendering only; simulation and forecasts never depend on wall-clock animation. */
export function createArenaScene({ THREE, scene, worldX, worldY }: EffectSceneOptions) {
  const flameGeometry = new THREE.ConeGeometry(0.22, 0.9, 7)
  const shockGeometry = new THREE.RingGeometry(0.82, 1, 32)
  const fire = new THREE.MeshBasicMaterial({ color: 0xff771f, transparent: true, opacity: 0.8 })
  const dust = new THREE.MeshBasicMaterial({
    color: 0xd6bd8a,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })
  const objects = new Map<
    string,
    {
      root: import('three').Group
      sun: import('three').Group
      moon: import('three').Group
      marks: SunMoonMarks
      flame: import('three').Mesh
      shock: import('three').Mesh
      health: number
      brokenAt: number
    }
  >()
  const lines = (['player', 'opponent'] as const).map((side) => {
    const material = new THREE.LineBasicMaterial({ color: side === 'player' ? 0xff76c9 : 0xb1a0ff })
    const line = new THREE.Line(new THREE.BufferGeometry(), material)
    scene.add(line)
    return { side, line, material }
  })

  return {
    sync(state: FightState, seconds: number) {
      for (const held of objects.values()) held.root.visible = false
      for (const entry of state.battlefield?.entities ?? []) {
        if (!entry.arena) continue
        syncObject(state, entry, seconds)
      }
      for (const held of lines) syncTether(state, held)
    },
    dispose() {
      for (const held of objects.values()) {
        held.marks.dispose()
        scene.remove(held.root)
      }
      for (const { line, material } of lines) {
        scene.remove(line)
        line.geometry.dispose()
        material.dispose()
      }
      objects.clear()
      flameGeometry.dispose()
      shockGeometry.dispose()
      fire.dispose()
      dust.dispose()
    },
  }

  function ensureObject(entry: PreparedEntity) {
    let held = objects.get(entry.id)
    if (!held) {
      const root = new THREE.Group()
      const marks = createSunMoonMarks(THREE)
      const { sun: sunMesh, moon: moonMesh } = marks
      const flame = new THREE.Mesh(flameGeometry, fire)
      const shock = new THREE.Mesh(shockGeometry, dust)
      flame.position.y = 0.9
      shock.rotation.x = -Math.PI / 2
      shock.position.y = 0.03
      root.add(sunMesh, moonMesh, flame, shock)
      scene.add(root)
      held = {
        root,
        marks,
        sun: sunMesh,
        moon: moonMesh,
        flame,
        shock,
        health: entry.health,
        brokenAt: -100,
      }
      objects.set(entry.id, held)
    }
    return held
  }

  function syncObject(state: FightState, entry: PreparedEntity, seconds: number) {
    const held = ensureObject(entry)
    if (held.health > 0 && entry.health <= 0) held.brokenAt = state.frame
    held.health = entry.health
    const age = state.frame - held.brokenAt
    const breaking = age >= 0 && age < 36 && entry.health <= 0
    held.root.visible = entry.present
    held.root.position.set(worldX(entry.x), worldY(entry.y), 0.4)
    held.sun.visible = entry.health > 0 && Boolean(entry.arena!.sun)
    held.moon.visible = entry.health > 0 && Boolean(entry.arena!.moon)
    held.flame.visible = entry.health > 0 && Boolean(entry.arena!.burning)
    held.flame.scale.set(1 + Math.sin(seconds * 17) * 0.15, 0.8 + Math.cos(seconds * 13) * 0.25, 1)
    held.shock.visible = breaking
    held.shock.scale.setScalar(0.25 + age * 0.05)
  }

  function syncTether(
    state: FightState,
    effect: {
      side: FightSide
      line: import('three').Line
      material: import('three').LineBasicMaterial
    },
  ) {
    const { side, line, material } = effect
    const tether = state.arena?.tether[side]
    const entry = state.battlefield?.entities.find((object) => object.id === tether?.objectId)
    line.visible = Boolean(tether && entry?.present && entry.health > 0)
    if (!line.visible || !entry || !tether) return
    material.color.setHex(tether.kind === 'gum' ? 0xff76c9 : 0xffccd9)
    const fighter = state[side]
    line.geometry.setFromPoints(
      Array.from({ length: 25 }, (_, index) => {
        const ratio = index / 24
        return new THREE.Vector3(
          worldX(fighter.x + (entry.x - fighter.x) * ratio),
          worldY(fighter.y) + 1.2 + (0.4 - 1.2) * ratio - Math.sin(ratio * Math.PI) * 0.08,
          0.55,
        )
      }),
    )
  }
}
