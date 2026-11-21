import type * as Three from 'three'
import { sceneryBox, type FightScenery, type SceneryKit } from './stageKit'
import {
  BALCONY,
  PIT,
  RING,
  STAND_START,
  STAND_WIDTH,
  TIERS,
  TIER_DEPTH,
  TIER_RISE,
} from './heavensArenaLayout'

/**
 * The Heavens Arena ring: a raised stone platform under spotlights, with the
 * stands climbing into the dark behind it.
 *
 * Authored, unlike the ship rooms — the tower is not aboard the Black Whale and
 * the blueprint has nothing to raise it from. Dimensions live in
 * `heavensArenaLayout.ts`, shared with the playable stands of the death match.
 */
const CROWD_PALETTE = [0x6f5a4c, 0x8a6d5a, 0x4d5b70, 0x7a4040, 0x5d6b4a, 0x9a8a72, 0x3f4656]

/** A fixed sequence, so the crowd sits in the same seats on every visit. */
function sequence(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function addRing(kit: SceneryKit, root: Three.Group): void {
  const [width, depth] = RING
  root.add(
    sceneryBox(kit, { size: [60, 0.1, 44], at: [0, -PIT - 0.05, -4], colour: 0x221f1d }),
    sceneryBox(kit, { size: [width, PIT, depth], at: [0, -PIT / 2, 0.3], colour: 0xb9b3a2 }),
    sceneryBox(kit, {
      size: [width + 0.5, 0.16, depth + 0.5],
      at: [0, -PIT + 0.08, 0.3],
      colour: 0x77705f,
    }),
  )
  // The joints between the slabs: one tile a metre, as the ring is always drawn.
  for (let x = -width / 2 + 1; x < width / 2; x += 1) {
    root.add(sceneryBox(kit, { size: [0.03, 0.01, depth], at: [x, 0.004, 0.3], colour: 0x8e8775 }))
  }
  for (let z = -depth / 2 + 1; z < depth / 2; z += 1) {
    root.add(
      sceneryBox(kit, { size: [width, 0.01, 0.03], at: [0, 0.004, z + 0.3], colour: 0x8e8775 }),
    )
  }
}

function addStands(kit: SceneryKit, root: Three.Group): void {
  for (let tier = 0; tier < TIERS; tier += 1) {
    const top = -PIT + (tier + 1) * TIER_RISE
    root.add(
      sceneryBox(kit, {
        size: [STAND_WIDTH, top + PIT, TIER_DEPTH],
        at: [0, (top - PIT) / 2, STAND_START - tier * TIER_DEPTH],
        colour: tier % 2 === 0 ? 0x2c2731 : 0x25212a,
      }),
    )
  }
  // The barrier between the pit and the first row.
  root.add(
    sceneryBox(kit, {
      size: [STAND_WIDTH, 1.1, 0.18],
      at: [0, -PIT + 0.55, STAND_START + TIER_DEPTH / 2 + 0.1],
      colour: 0x4a3b2c,
    }),
  )
}

function addCrowd(kit: SceneryKit, root: Three.Group): void {
  const { THREE, glow, geometry } = kit
  const seats = Math.floor(STAND_WIDTH / 0.62)
  const crowd = new THREE.InstancedMesh(
    geometry(new THREE.BoxGeometry(0.36, 0.52, 0.3)),
    glow(0xffffff, 1),
    TIERS * seats,
  )
  const next = sequence(1999)
  const placed = new THREE.Object3D()
  const colour = new THREE.Color()
  let index = 0
  for (let tier = 0; tier < TIERS; tier += 1) {
    const top = -PIT + (tier + 1) * TIER_RISE
    for (let seat = 0; seat < seats; seat += 1) {
      const x = -STAND_WIDTH / 2 + 0.4 + seat * 0.62 + (next() - 0.5) * 0.12
      placed.position.set(x, top + 0.26 + next() * 0.07, STAND_START - tier * TIER_DEPTH)
      // One seat in nine is empty: a full house reads as a wall, not a crowd.
      placed.scale.setScalar(next() < 0.11 ? 0 : 0.9 + next() * 0.2)
      placed.updateMatrix()
      crowd.setMatrixAt(index, placed.matrix)
      const shade = 0.3 + next() * 0.22 - tier * 0.015
      colour.setHex(CROWD_PALETTE[Math.floor(next() * CROWD_PALETTE.length)])
      crowd.setColorAt(index, colour.multiplyScalar(Math.max(0.18, shade)))
      index += 1
    }
  }
  root.add(crowd)
}

/** The second level along the back wall, with its rail: the one Hisoka climbs to. */
function addBalcony(kit: SceneryKit, root: Three.Group): void {
  const depth = BALCONY.zFront - BALCONY.zBack
  const width = BALCONY.halfWidth * 2
  const z = (BALCONY.zFront + BALCONY.zBack) / 2
  root.add(
    sceneryBox(kit, { size: [width, 0.3, depth], at: [0, BALCONY.y - 0.15, z], colour: 0x2a2530 }),
    sceneryBox(kit, {
      size: [width, 1, 0.08],
      at: [0, BALCONY.y + 0.5, BALCONY.zFront],
      colour: 0x4a3b2c,
    }),
  )
}

function addHall(kit: SceneryKit, root: Three.Group): void {
  const back = STAND_START - TIERS * TIER_DEPTH - 0.4
  root.add(sceneryBox(kit, { size: [60, 22, 0.4], at: [0, 9, back], colour: 0x15131b }))
  for (const side of [-1, 1]) {
    root.add(sceneryBox(kit, { size: [0.6, 22, 30], at: [side * 24, 9, -8], colour: 0x121017 }))
  }
  // Banners between the piers of the back wall.
  for (const x of [-16.5, -5.5, 5.5, 16.5]) {
    root.add(
      sceneryBox(kit, { size: [3.2, 7.5, 0.08], at: [x, 11.2, back + 0.3], colour: 0x7c2a26 }),
      sceneryBox(kit, { size: [3.2, 0.22, 0.1], at: [x, 14.6, back + 0.34], colour: 0xc9a24a }),
      sceneryBox(kit, { size: [1.2, 1.2, 0.1], at: [x, 11.6, back + 0.34], colour: 0xc9a24a }),
    )
  }
  for (const x of [-11, 0, 11]) {
    root.add(sceneryBox(kit, { size: [1, 22, 0.7], at: [x, 9, back + 0.3], colour: 0x231f2a }))
  }
}

function addLights(kit: SceneryKit, root: Three.Group): void {
  const { THREE, glow, geometry } = kit
  root.add(sceneryBox(kit, { size: [30, 0.35, 0.35], at: [0, 13.6, -1.5], colour: 0x2b2a31 }))
  const cone = geometry(new THREE.ConeGeometry(4.6, 14, 28, 1, true))
  for (const x of [-7.5, -2.5, 2.5, 7.5]) {
    const beam = new THREE.Mesh(cone, glow(0xfff1c4, 0.055))
    beam.material.side = THREE.DoubleSide
    beam.material.depthWrite = false
    beam.position.set(x, 6.6, -1.2)
    beam.rotation.z = -x * 0.045
    root.add(
      beam,
      sceneryBox(kit, { size: [0.7, 0.5, 0.7], at: [x, 13.3, -1.5], colour: 0xf2e3b0 }),
    )
  }
  const pool = new THREE.Mesh(geometry(new THREE.CircleGeometry(5.4, 40)), glow(0xfff4d0, 0.1))
  pool.rotation.x = -Math.PI / 2
  pool.position.set(0, 0.012, 0.3)
  root.add(pool)
}

export function buildHeavensArenaScenery(kit: SceneryKit): FightScenery {
  const root = new kit.THREE.Group()
  addRing(kit, root)
  addStands(kit, root)
  addBalcony(kit, root)
  addCrowd(kit, root)
  addHall(kit, root)
  addLights(kit, root)
  return {
    root,
    fog: { kind: 'linear', colour: 0x0c0a10, near: 9, far: 46 },
    cameraFar: 80,
    clipped: false,
    dispose: () => undefined,
  }
}
