import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'node:fs'

import { buildShip, spawnPoint } from './blueprint'
import { buildTierMesh } from './mesh'
import { resolveMovement, wallsNear } from './navigation'

const OUT = process.env.TOUR_VIEW_DIR ?? '/tmp'

/**
 * Not a test of the reconstruction — a look at what the walk actually holds,
 * through the same calls `/tour` makes. Delete once read.
 */
describe('what the tour holds', () => {
  const ship = buildShip()

  const cases = [
    {
      tier: 'tier-1',
      space: 'tier-1-banquet-hall',
      view: [-92, -40, 75, 2] as const,
      file: 'tour-banquet.svg',
    },
    { tier: 'tier-1', space: 'tier-1-vip-casino', view: [-62, -1, -36, 61] as const, file: 'tour-casino.svg' },
    {
      tier: 'tier-3',
      space: 'tier-3-observation-deck',
      view: [44, -26, 121, 23] as const,
      file: 'tour-observation.svg',
    },
  ]

  for (const probe of cases) {
    it(`draws ${probe.space} the way the blueprint lays it`, () => {
      const plan = ship.plans.get(probe.tier)!
      const room = plan.spaces.find((space) => space.id === probe.space)!
      const solids = plan.structures.filter((structure) => structure.spaceId === probe.space)

      // The mesh the page builds: it must survive the room's new contents.
      const mesh = buildTierMesh(plan)
      expect(mesh.positions.length).toBeGreaterThan(0)
      expect([...mesh.positions].every(Number.isFinite)).toBe(true)

      // Walking: from the room's spawn point, a step in each direction stays
      // inside the ship rather than through the furniture.
      const from = spawnPoint(room, plan.structures)
      for (const [dx, dz] of [
        [3, 0],
        [-3, 0],
        [0, 3],
        [0, -3],
      ]) {
        const to: [number, number] = [from[0] + dx, from[1] + dz]
        const landed = resolveMovement(from, to, wallsNear(plan.walls, from, 6))
        expect(landed.every(Number.isFinite)).toBe(true)
      }

      // Draw the plan view: room outline, every solid, every wall the walk
      // collides with, and the spawn point the tour drops the visitor on.
      const [x0, z0, x1, z1] = probe.view
      const scale = 900 / (x1 - x0)
      const px = (x: number) => (x - x0) * scale + 40
      const pz = (z: number) => (z - z0) * scale + 40
      const height = (z1 - z0) * scale + 80

      const parts: string[] = []
      parts.push(
        `<polygon points="${room.footprint.map(([x, z]) => `${px(x)},${pz(z)}`).join(' ')}" fill="rgba(255,255,240,.04)" stroke="#fffff0" stroke-width="2"/>`,
      )
      for (const wall of plan.walls) {
        parts.push(
          `<line x1="${px(wall.start[0])}" y1="${pz(wall.start[1])}" x2="${px(wall.end[0])}" y2="${pz(wall.end[1])}" stroke="#5b6672" stroke-width="1.5"/>`,
        )
      }
      for (const solid of solids) {
        const outline = structureOutline(solid)
        const colour = solid.base > 0 ? '#9dc4e0' : '#d9a441'
        parts.push(
          `<polygon points="${outline.map(([x, z]) => `${px(x)},${pz(z)}`).join(' ')}" fill="${colour}33" stroke="${colour}" stroke-width="1.5"/>`,
        )
      }
      parts.push(`<circle cx="${px(from[0])}" cy="${pz(from[1])}" r="6" fill="#ff5f5f"/>`)
      parts.push(
        `<text x="470" y="26" fill="#FFD700" font-size="18" font-family="sans-serif" text-anchor="middle">${probe.space} — ${solids.length} solids</text>`,
      )
      writeFileSync(
        `${OUT}/${probe.file}`,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 ${height}" width="980" height="${height}"><rect width="980" height="${height}" fill="#0b0b0b"/>${parts.join('')}</svg>`,
      )
    })
  }
})

function structureOutline(structure: {
  at: [number, number]
  size: [number, number]
  rotation: number
  sides: number | null
}): [number, number][] {
  const [hw, hd] = [structure.size[0] / 2, structure.size[1] / 2]
  const angle = (structure.rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const local: [number, number][] = structure.sides
    ? Array.from({ length: structure.sides }, (_, index) => {
        const step = (index * 2 * Math.PI) / structure.sides!
        return [Math.sin(step) * hw, Math.cos(step) * hd] as [number, number]
      })
    : [
        [-hw, -hd],
        [hw, -hd],
        [hw, hd],
        [-hw, hd],
      ]
  return local.map(([x, z]) => [
    structure.at[0] + x * cos - z * sin,
    structure.at[1] + x * sin + z * cos,
  ])
}
