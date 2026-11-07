import {
  JUSTICE_BRASS,
  JUSTICE_LEATHER_DARK,
  JUSTICE_LEATHER_GREEN,
  JUSTICE_OAK,
  JUSTICE_PAPER,
  JUSTICE_STEEL,
  JUSTICE_WOOD,
  JusticeBureauSurface,
  dressFileDossier,
} from './justiceBureauDetailSurface'

/** Classic banker's desk lamp with brass neck and oblong green glass shade */
function dressBankerLamp(surface: JusticeBureauSurface, at: [number, number, number]): void {
  const [x, y, z] = at
  surface.cylinder({ radius: 0.08, height: 0.02 }, [x, y + 0.01, z], JUSTICE_BRASS)
  surface.cylinder({ radius: 0.015, height: 0.32 }, [x, y + 0.17, z], JUSTICE_BRASS)
  surface.box([0.18, 0.08, 0.1], [x, y + 0.34, z], 0x1d4428)
  surface.cylinder({ radius: 0.01, height: 0.05 }, [x + 0.07, y + 0.28, z], JUSTICE_BRASS)
}

/** Magistrate desk: heavy panelled executive desk with drawers and desktop items */
export function dressMagistrateDesk(surface: JusticeBureauSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Desktop with bevelled edge
  surface.box([w + 0.08, 0.06, d + 0.08], [0, h - 0.03, 0], JUSTICE_WOOD)

  // Pedestals with drawers on both sides
  const pedWidth = w * 0.3
  for (const side of [-1, 1]) {
    const px = side * (w / 2 - pedWidth / 2)
    surface.box([pedWidth, h - 0.06, d * 0.9], [px, (h - 0.06) / 2, 0], JUSTICE_WOOD)
    // Brass drawer pulls
    for (const dy of [0.15, 0.35, 0.55]) {
      surface.box([0.1, 0.025, 0.02], [px, dy, d * 0.46], JUSTICE_BRASS)
    }
  }

  // Modesty panel between pedestals
  surface.box([w - 2 * pedWidth, h * 0.65, 0.03], [0, h * 0.55, -d * 0.2], JUSTICE_WOOD)

  // Desktop equipment: Leather blotter, banker lamp, files and inkstand
  surface.box([w * 0.42, 0.01, d * 0.6], [0, h + 0.005, 0.05], JUSTICE_LEATHER_DARK)
  dressBankerLamp(surface, [-w * 0.32, h, -d * 0.2])
  dressFileDossier(surface, [w * 0.28, h, 0])
  dressFileDossier(surface, [w * 0.26, h + 0.045, -0.05])

  // Inkwell and pen tray
  surface.box([0.18, 0.02, 0.1], [0, h + 0.01, -d * 0.25], JUSTICE_WOOD)
  surface.sphere([0.025, 0.025, 0.025], [-0.04, h + 0.03, -d * 0.25], JUSTICE_BRASS)
  surface.cylinder({ radius: 0.004, height: 0.16 }, [0.03, h + 0.08, -d * 0.25], JUSTICE_BRASS)

  // Magistrate executive high-back leather chair
  dressMagistrateChair(surface, [0, 0, -d * 0.65])
}

/** Executive high-back armchair for the magistrate */
function dressMagistrateChair(surface: JusticeBureauSurface, at: [number, number, number]): void {
  const [x, y, z] = at
  // 5-star swivel base & column
  surface.cylinder({ radius: 0.32, height: 0.05 }, [x, y + 0.05, z], JUSTICE_STEEL)
  surface.cylinder({ radius: 0.04, height: 0.38 }, [x, y + 0.24, z], JUSTICE_STEEL)
  // Seat cushion
  surface.box([0.62, 0.12, 0.58], [x, y + 0.48, z], JUSTICE_LEATHER_DARK)
  // Tufted high backrest
  surface.box([0.58, 0.82, 0.12], [x, y + 0.94, z - 0.24], JUSTICE_LEATHER_DARK)
  // Armrests
  for (const side of [-1, 1]) {
    surface.box([0.08, 0.28, 0.45], [x + side * 0.32, y + 0.65, z], JUSTICE_WOOD)
    surface.box([0.1, 0.04, 0.48], [x + side * 0.32, y + 0.8, z], JUSTICE_LEATHER_DARK)
  }
}

/** Formal visitor chair for interrogation / hearing */
export function dressVisitorChair(surface: JusticeBureauSurface): void {
  const { width: w, depth: d } = surface

  // Four solid wooden legs
  const legR = 0.028
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      surface.cylinder(
        { radius: legR, height: 0.45 },
        [(sx * w) / 2.6, 0.225, (sz * d) / 2.6],
        JUSTICE_WOOD,
      )
    }
  }

  // Padded green leather seat cushion
  surface.box([w * 0.88, 0.09, d * 0.88], [0, 0.48, 0], JUSTICE_LEATHER_GREEN)
  surface.box([w * 0.92, 0.03, d * 0.92], [0, 0.43, 0], JUSTICE_WOOD)

  // Curved wooden backrest with vertical spindles
  surface.box([w * 0.82, 0.48, 0.06], [0, 0.74, -d * 0.4], JUSTICE_WOOD)
  surface.box([w * 0.72, 0.36, 0.04], [0, 0.74, -d * 0.38], JUSTICE_LEATHER_GREEN)
}

/** Lobby reception desk with registration book and terminal */
export function dressReceptionCounter(surface: JusticeBureauSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Counter front panel and base
  surface.box([w, h * 0.94, d * 0.85], [0, (h * 0.94) / 2, 0], JUSTICE_WOOD)
  surface.box([w + 0.08, 0.06, d + 0.08], [0, h - 0.03, 0], JUSTICE_OAK)

  // Raised customer transaction ledge
  surface.box([w * 0.92, 0.22, 0.08], [0, h + 0.11, d * 0.38], JUSTICE_WOOD)
  surface.box([w * 0.94, 0.04, 0.26], [0, h + 0.24, d * 0.38], JUSTICE_OAK)

  // Administrative monitor
  surface.box([0.16, 0.02, 0.14], [-w * 0.25, h + 0.01, 0], 0x222222)
  surface.cylinder({ radius: 0.02, height: 0.16 }, [-w * 0.25, h + 0.09, 0], JUSTICE_STEEL)
  surface.box([0.48, 0.32, 0.04], [-w * 0.25, h + 0.25, 0], 0x111111)
  surface.box([0.44, 0.28, 0.005], [-w * 0.25, h + 0.25, 0.022], 0x3d4b54)

  // Open visitor logbook
  surface.box([0.38, 0.025, 0.28], [w * 0.15, h + 0.015, 0], JUSTICE_PAPER)
  surface.box([0.01, 0.028, 0.28], [w * 0.15, h + 0.016, 0], 0x6e2828)

  // Registration stamp & pen stand
  surface.cylinder({ radius: 0.022, height: 0.06 }, [w * 0.32, h + 0.03, -0.05], JUSTICE_WOOD)
  surface.cylinder({ radius: 0.018, height: 0.05 }, [w * 0.32, h + 0.08, -0.05], JUSTICE_BRASS)
}

/** Standard interrogation table in interrogation room */
export function dressInterrogationTable(surface: JusticeBureauSurface): void {
  const { width: w, depth: d, structure } = surface
  const h = structure.height

  // Utilitarian grey steel table with dark linoleum top
  surface.box([w, 0.05, d], [0, h - 0.025, 0], 0x3d4144)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      surface.box([0.05, h - 0.05, 0.05], [(sx * (w - 0.1)) / 2, (h - 0.05) / 2, (sz * (d - 0.1)) / 2], JUSTICE_STEEL)
    }
  }

  // Central handcuffs anchor loop on tabletop
  surface.ring(0.04, [0, h + 0.04, 0], JUSTICE_STEEL)
}
