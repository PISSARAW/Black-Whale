import { PALETTE, type VvipRecreationSurface } from './vvipRecreationDetailSurface'

function dressBilliardsPockets(surface: VvipRecreationSurface, topY: number): void {
  const halfW = surface.width / 2
  const halfD = surface.depth / 2
  // Corner and side drop pockets with brass caps
  const cornerOffsets: [number, number][] = [
    [-halfW + 0.08, -halfD + 0.08],
    [halfW - 0.08, -halfD + 0.08],
    [-halfW + 0.08, halfD - 0.08],
    [halfW - 0.08, halfD - 0.08],
    [0, -halfD + 0.04],
    [0, halfD - 0.04],
  ]
  for (const [px, pz] of cornerOffsets) {
    surface.cylinder({ radius: 0.09, height: 0.06 }, [px, topY + 0.02, pz], PALETTE.brass)
    surface.cylinder({ radius: 0.07, height: 0.12 }, [px, topY - 0.06, pz], PALETTE.leather)
  }
}

function dressBilliardsBalls(surface: VvipRecreationSurface, topY: number): void {
  // White cue ball and triangle pack
  surface.cylinder({ radius: 0.035, height: 0.04 }, [-0.6, topY + 0.02, 0], PALETTE.alabaster)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col <= row; col++) {
      const bx = 0.5 + row * 0.06
      const bz = (col - row / 2) * 0.065
      const colour = (row + col) % 2 === 0 ? PALETTE.burgundy : PALETTE.gold
      surface.cylinder({ radius: 0.032, height: 0.04 }, [bx, topY + 0.02, bz], colour)
    }
  }
}

export function dressBilliardsTable(surface: VvipRecreationSurface): void {
  const { width, depth, height } = surface
  const halfW = width / 2
  const halfD = depth / 2

  // 4 Turned heavy legs
  const legX = halfW - 0.35
  const legZ = halfD - 0.35
  for (const lx of [-legX, legX]) {
    for (const lz of [-legZ, legZ]) {
      surface.cylinder({ radius: 0.14, bottom: 0.1, height: height - 0.18 }, [lx, (height - 0.18) / 2, lz], PALETTE.mahogany)
      surface.cylinder({ radius: 0.16, height: 0.05 }, [lx, height * 0.45, lz], PALETTE.gold)
    }
  }

  // Apron frame with gold inlays
  const apronY = height - 0.18
  surface.box([width, 0.22, depth], [0, apronY, 0], PALETTE.mahogany)
  surface.box([width - 0.1, 0.04, depth + 0.02], [0, apronY, 0], PALETTE.gold)

  // Emerald green cloth playing surface
  const bedY = height - 0.04
  surface.box([width - 0.3, 0.05, depth - 0.3], [0, bedY, 0], PALETTE.emeraldFelt)

  // Cushions and rails
  const cushionColour = PALETTE.mahogany
  surface.box([width, 0.08, 0.16], [0, height + 0.02, -halfD + 0.08], cushionColour)
  surface.box([width, 0.08, 0.16], [0, height + 0.02, halfD - 0.08], cushionColour)
  surface.box([0.16, 0.08, depth - 0.32], [-halfW + 0.08, height + 0.02, 0], cushionColour)
  surface.box([0.16, 0.08, depth - 0.32], [halfW - 0.08, height + 0.02, 0], cushionColour)

  dressBilliardsPockets(surface, height)
  dressBilliardsBalls(surface, height)
}

export function dressLoungeSofa(surface: VvipRecreationSurface): void {
  const { width, depth, height } = surface
  const halfW = width / 2
  const halfD = depth / 2

  // Bun feet
  for (const fx of [-halfW + 0.18, halfW - 0.18]) {
    for (const fz of [-halfD + 0.15, halfD - 0.15]) {
      surface.cylinder({ radius: 0.065, height: 0.1 }, [fx, 0.05, fz], PALETTE.darkWood)
    }
  }

  // Base plinth and seat cushion
  surface.box([width, 0.2, depth], [0, 0.2, 0], PALETTE.burgundy)
  surface.box([width - 0.3, 0.15, depth - 0.2], [0, 0.38, 0.05], PALETTE.burgundy)

  // Tufted backrest and rolled arms
  surface.box([width, height - 0.35, 0.22], [0, 0.35 + (height - 0.35) / 2, -halfD + 0.11], PALETTE.burgundy)
  surface.box([0.22, 0.28, depth], [-halfW + 0.11, 0.52, 0], PALETTE.burgundy)
  surface.box([0.22, 0.28, depth], [halfW - 0.11, 0.52, 0], PALETTE.burgundy)

  // Gold studding / piping accent along front apron
  surface.box([width - 0.2, 0.02, 0.02], [0, 0.28, halfD - 0.02], PALETTE.gold)
}

export function dressLoungeArmchair(surface: VvipRecreationSurface): void {
  const { width, depth, height } = surface
  const halfW = width / 2
  const halfD = depth / 2

  // Turned feet
  for (const fx of [-halfW + 0.12, halfW - 0.12]) {
    for (const fz of [-halfD + 0.12, halfD - 0.12]) {
      surface.cylinder({ radius: 0.05, height: 0.12 }, [fx, 0.06, fz], PALETTE.darkWood)
    }
  }

  // Deep seat and cushion
  surface.box([width, 0.22, depth], [0, 0.22, 0], PALETTE.leather)
  surface.box([width - 0.24, 0.14, depth - 0.2], [0, 0.4, 0.05], PALETTE.leather)

  // Wingback profile
  surface.box([width, height - 0.35, 0.18], [0, 0.35 + (height - 0.35) / 2, -halfD + 0.09], PALETTE.leather)
  surface.box([0.14, 0.32, depth], [-halfW + 0.07, 0.48, 0], PALETTE.leather)
  surface.box([0.14, 0.32, depth], [halfW - 0.07, 0.48, 0], PALETTE.leather)
}

export function dressCoffeeTable(surface: VvipRecreationSurface): void {
  const { width, depth, height } = surface
  const halfW = width / 2
  const halfD = depth / 2

  // Brass legs and stretcher
  for (const lx of [-halfW + 0.12, halfW - 0.12]) {
    for (const lz of [-halfD + 0.12, halfD - 0.12]) {
      surface.cylinder({ radius: 0.035, height }, [lx, height / 2, lz], PALETTE.brass)
    }
  }
  surface.box([width - 0.2, 0.03, depth - 0.2], [0, 0.12, 0], PALETTE.brass)

  // Beveled marble tabletop
  surface.box([width, 0.06, depth], [0, height - 0.03, 0], PALETTE.creamMarble)
  surface.box([width + 0.04, 0.02, depth + 0.04], [0, height - 0.01, 0], PALETTE.gold)

  // Crystal decanter and 2 tumblers on small gold tray
  surface.box([0.35, 0.02, 0.25], [0, height + 0.01, 0], PALETTE.gold)
  surface.cylinder({ radius: 0.045, height: 0.16 }, [-0.07, height + 0.09, 0], PALETTE.crystal)
  surface.cylinder({ radius: 0.028, height: 0.08 }, [0.07, height + 0.05, -0.05], PALETTE.crystal)
  surface.cylinder({ radius: 0.028, height: 0.08 }, [0.07, height + 0.05, 0.05], PALETTE.crystal)
}

export function dressBarCounter(surface: VvipRecreationSurface): void {
  const { width, depth, height } = surface
  const halfD = depth / 2

  // Wooden base and fluted panels facing into the hall (east)
  surface.box([width - 0.15, height - 0.08, depth], [0, (height - 0.08) / 2, 0], PALETTE.mahogany)
  surface.box([0.05, height - 0.15, depth - 0.4], [width / 2 - 0.08, (height - 0.15) / 2 + 0.04, 0], PALETTE.darkWood)
  surface.box([0.06, 0.04, depth], [width / 2 - 0.06, height - 0.16, 0], PALETTE.gold)

  // Brass footrail along front
  surface.box([0.05, 0.05, depth], [width / 2 + 0.06, 0.18, 0], PALETTE.brass)

  // Cream marble counter top
  surface.box([width + 0.12, 0.08, depth + 0.15], [0, height - 0.04, 0], PALETTE.creamMarble)
  surface.box([width + 0.14, 0.02, depth + 0.17], [0, height - 0.01, 0], PALETTE.gold)

  // 4 Bar stools in front of the counter
  const stoolCount = 4
  const stoolSpacing = depth / stoolCount
  for (let i = 0; i < stoolCount; i++) {
    const sz = -halfD + stoolSpacing * (i + 0.5)
    const sx = width / 2 + 0.45
    surface.cylinder({ radius: 0.16, height: 0.04 }, [sx, 0.02, sz], PALETTE.brass)
    surface.cylinder({ radius: 0.035, height: 0.72 }, [sx, 0.38, sz], PALETTE.brass)
    surface.cylinder({ radius: 0.12, height: 0.02 }, [sx, 0.28, sz], PALETTE.brass)
    surface.cylinder({ radius: 0.18, height: 0.1 }, [sx, 0.77, sz], PALETTE.burgundy)
  }
}

export function dressBarBackShelf(surface: VvipRecreationSurface): void {
  const { width, depth, height } = surface

  // Back panel and side uprights
  surface.box([width, height, depth], [0, height / 2, 0], PALETTE.darkWood)
  surface.box([0.02, height - 0.2, depth - 0.2], [width / 2 - 0.01, height / 2, 0], PALETTE.alabaster) // mirror effect

  // 3 Display shelves
  for (let tier = 1; tier <= 3; tier++) {
    const sy = (height / 4) * tier
    surface.box([width + 0.15, 0.04, depth - 0.1], [0.08, sy, 0], PALETTE.mahogany)
    surface.box([width + 0.17, 0.015, depth - 0.1], [0.08, sy + 0.02, 0], PALETTE.gold)

    // Bottle bottles and glasses
    const bottleCount = 8
    const bSpacing = (depth - 0.4) / bottleCount
    for (let b = 0; b < bottleCount; b++) {
      const bz = -depth / 2 + 0.2 + bSpacing * (b + 0.5)
      const bCol = b % 3 === 0 ? PALETTE.burgundy : b % 3 === 1 ? PALETTE.gold : PALETTE.crystal
      surface.cylinder({ radius: 0.035, height: 0.22 }, [0.12, sy + 0.13, bz], bCol)
    }
  }
}

export function dressCardTable(surface: VvipRecreationSurface): void {
  const { width, height } = surface

  // Central carved pedestal and 4 scrolled feet
  surface.cylinder({ radius: 0.15, height: height - 0.1 }, [0, (height - 0.1) / 2, 0], PALETTE.mahogany)
  for (let foot = 0; foot < 4; foot++) {
    const angle = (foot * Math.PI) / 2
    const fx = Math.cos(angle) * 0.35
    const fz = Math.sin(angle) * 0.35
    surface.box([0.12, 0.08, 0.35], [fx, 0.04, fz], PALETTE.darkWood)
  }

  // Octagonal table top with green baize center
  surface.cylinder({ radius: width / 2, height: 0.06, sides: 8 }, [0, height - 0.03, 0], PALETTE.mahogany)
  surface.cylinder({ radius: width / 2 - 0.12, height: 0.02, sides: 8 }, [0, height - 0.01, 0], PALETTE.emeraldFelt)
  surface.cylinder({ radius: width / 2 - 0.1, height: 0.015, sides: 8 }, [0, height, 0], PALETTE.gold)

  // 4 Bridge chairs around table
  const chairDist = width / 2 + 0.32
  for (let c = 0; c < 4; c++) {
    const angle = (c * Math.PI) / 2 + Math.PI / 4
    const cx = Math.cos(angle) * chairDist
    const cz = Math.sin(angle) * chairDist
    surface.cylinder({ radius: 0.025, height: 0.42 }, [cx, 0.21, cz], PALETTE.brass)
    surface.box([0.4, 0.06, 0.4], [cx, 0.45, cz], PALETTE.burgundy)
    surface.box([0.4, 0.42, 0.05], [cx, 0.68, cz], PALETTE.burgundy)
  }
}

/** Dispatches furniture dressing based on structure ID. */
export function dressVvipRecreationFurniture(surface: VvipRecreationSurface): void {
  const { id } = surface.structure
  if (id.includes('billiards-table')) dressBilliardsTable(surface)
  else if (id.includes('lounge-sofa')) dressLoungeSofa(surface)
  else if (id.includes('lounge-armchair')) dressLoungeArmchair(surface)
  else if (id.includes('lounge-coffee-table')) dressCoffeeTable(surface)
  else if (id.includes('bar-counter')) dressBarCounter(surface)
  else if (id.includes('bar-back-shelf')) dressBarBackShelf(surface)
  else if (id.includes('card-table')) dressCardTable(surface)
}
