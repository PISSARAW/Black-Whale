import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'
import { ZHANG_LEI_GOLD, ZHANG_LEI_WOOD } from './zhangLeiDetailSurface'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function wallPanelling(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    // Plinths, dado rail, mid-wall moulding and upper cornice
    for (const [y, height, depth, col] of [
      [0.16, 0.28, 0.08, ZHANG_LEI_WOOD],
      [0.92, 0.06, 0.09, ZHANG_LEI_WOOD],
      [0.96, 0.02, 0.095, ZHANG_LEI_GOLD],
      [2.45, 0.03, 0.06, ZHANG_LEI_GOLD],
      [3.82, 0.14, 0.15, ZHANG_LEI_WOOD],
      [3.93, 0.04, 0.17, ZHANG_LEI_GOLD],
    ]) {
      into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: depth / 2 }),
        rotation: [0, run.angle, 0],
        colour: col,
      })
    }

    // Repeated moulded vertical panels
    const panelCount = Math.max(1, Math.floor(run.length / 1.5))
    for (let i = 0; i < panelCount; i++) {
      const along = ((i + 0.5) * run.length) / panelCount
      into.box([0.92, 1.25, 0.03], {
        at: wallPoint(run, { along, y: floor + 1.72, inset: 0.035 }),
        rotation: [0, run.angle, 0],
        colour: ZHANG_LEI_WOOD,
      })
      into.box([0.82, 1.15, 0.035], {
        at: wallPoint(run, { along, y: floor + 1.72, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: ZHANG_LEI_GOLD,
      })
      into.box([0.72, 1.05, 0.04], {
        at: wallPoint(run, { along, y: floor + 1.72, inset: 0.045 }),
        rotation: [0, run.angle, 0],
        colour: 0x2b180d,
      })
    }
  }
}

function parquetFlooring(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier) + 0.008
  const xs = space.footprint.map(([x]) => x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const zs = space.footprint.map(([, z]) => z)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const w = maxX - minX
  const d = maxZ - minZ
  const border = 0.35

  // Outer dark mahogany border
  into.box([w, 0.006, border], { at: [(minX + maxX) / 2, floor, minZ + border / 2], colour: 0x24140b })
  into.box([w, 0.006, border], { at: [(minX + maxX) / 2, floor, maxZ - border / 2], colour: 0x24140b })
  into.box([border, 0.006, d - border * 2], {
    at: [minX + border / 2, floor, (minZ + maxZ) / 2],
    colour: 0x24140b,
  })
  into.box([border, 0.006, d - border * 2], {
    at: [maxX - border / 2, floor, (minZ + maxZ) / 2],
    colour: 0x24140b,
  })

  // Inlaid grid field
  const cols = 6
  const rows = 4
  const stepX = (w - border * 2) / cols
  const stepZ = (d - border * 2) / rows
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const px = minX + border + (c + 0.5) * stepX
      const pz = minZ + border + (r + 0.5) * stepZ
      const col = (c + r) % 2 === 0 ? 0x482d1c : 0x3d2415
      into.box([stepX - 0.02, 0.006, stepZ - 0.02], { at: [px, floor, pz], colour: col })
    }
  }
}

function ceilingCoffers(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceil = ceilingOf(space, plan.tier)
  const y = floor + ceil - 0.03
  const xs = space.footprint.map(([x]) => x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const zs = space.footprint.map(([, z]) => z)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const w = maxX - minX
  const d = maxZ - minZ

  // Cross beams creating coffered bays
  for (let c = 1; c < 5; c++) {
    const x = minX + (c * w) / 5
    into.box([0.16, 0.1, d], { at: [x, y, (minZ + maxZ) / 2], colour: ZHANG_LEI_WOOD })
    into.box([0.04, 0.11, d], { at: [x, y, (minZ + maxZ) / 2], colour: ZHANG_LEI_GOLD })
  }
  for (let r = 1; r < 4; r++) {
    const z = minZ + (r * d) / 4
    into.box([w, 0.16, 0.1], { at: [(minX + maxX) / 2, y, z], colour: ZHANG_LEI_WOOD })
    into.box([w, 0.04, 0.11], { at: [(minX + maxX) / 2, y, z], colour: ZHANG_LEI_GOLD })
  }
}

function doorwaysAndPassages(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)

  // Doorways to living room and kitchen
  for (const door of plan.doorways.filter((d) => d.a === space.id || d.b === space.id)) {
    const cx = (door.start[0] + door.end[0]) / 2
    const cz = (door.start[1] + door.end[1]) / 2
    const dx = door.end[0] - door.start[0]
    const dz = door.end[1] - door.start[1]
    const len = Math.hypot(dx, dz)
    const angle = Math.atan2(dz, dx)

    // Inset door frame slightly towards room interior so it stays within wall envelope
    const inwardZ = cz < -2 ? 0.04 : -0.04
    const zPos = cz + inwardZ

    // Molded lintel and entablature above door
    into.box([len, 0.14, 0.2], {
      at: [cx, floor + 2.45, zPos],
      rotation: [0, -angle, 0],
      colour: ZHANG_LEI_WOOD,
    })
    into.box([len + 0.04, 0.03, 0.22], {
      at: [cx, floor + 2.52, zPos],
      rotation: [0, -angle, 0],
      colour: ZHANG_LEI_GOLD,
    })

    // Vertical jambs
    for (const side of [-1, 1]) {
      const jx = cx + (side * (len / 2 - 0.07) * dx) / len
      const jz = zPos + (side * (len / 2 - 0.07) * dz) / len
      into.box([0.14, 2.4, 0.18], {
        at: [jx, floor + 1.2, jz],
        rotation: [0, -angle, 0],
        colour: ZHANG_LEI_WOOD,
      })
    }
  }
}

export function dressZhangLeiArchitecture(context: ArchitectureContext): void {
  wallPanelling(context)
  parquetFlooring(context)
  ceilingCoffers(context)
  doorwaysAndPassages(context)
}
