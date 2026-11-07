import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import {
  ARMY_CHART_GRID,
  ARMY_CHART_PALE,
  ARMY_CHROME,
  ARMY_GLOW_LIGHT,
  ARMY_LIGHT_STEEL,
  ARMY_SCREEN_HOUSING,
  ARMY_SCREEN_WHITE,
  ARMY_STEEL,
  RoyalArmyConferenceSurface,
} from './royalArmyConferenceDetailSurface'
import type { Space, Structure } from './types'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function buildPresenterStage(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  // Low presenter stage at the north wall: 11.5m wide, 3.4m deep, 0.15m height
  const stageW = 11.5
  const stageD = 3.4
  const stageH = 0.15
  const stageZ = -5.7

  // Main stage deck
  into.box([stageW, stageH, stageD], {
    at: [0, floor + stageH / 2, stageZ],
    colour: 0x383a3f,
  })

  // Beveled edge trim / safety nosing
  into.box([stageW + 0.05, 0.02, 0.06], {
    at: [0, floor + stageH - 0.01, stageZ + stageD / 2],
    colour: ARMY_LIGHT_STEEL,
  })

  // Side trims
  for (const side of [-1, 1]) {
    into.box([0.06, 0.02, stageD], {
      at: [side * (stageW / 2), floor + stageH - 0.01, stageZ],
      colour: ARMY_LIGHT_STEEL,
    })
  }
}

function buildWallPerimeter(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    // Military base plinth in dark steel
    into.box([run.length, 0.22, 0.06], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 0.11, inset: 0.03 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_STEEL,
    })

    // Technical dado rail with conduit groove
    into.box([run.length, 0.08, 0.05], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 1.05, inset: 0.025 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_LIGHT_STEEL,
    })

    // Upper perimeter cornice
    into.box([run.length, 0.12, 0.08], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 4.9, inset: 0.04 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_STEEL,
    })

    // Vertical acoustic panel slats
    const count = Math.max(1, Math.floor(run.length / 2.2))
    for (let i = 0; i < count; i++) {
      const along = ((i + 0.5) * run.length) / count
      into.box([0.04, 3.6, 0.02], {
        at: wallPoint(run, { along, y: floor + 2.9, inset: 0.015 }),
        rotation: [0, run.angle, 0],
        colour: ARMY_LIGHT_STEEL,
      })
    }
  }
}

function buildCeilingLighting(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = ceilingOf(space, plan.tier)
  const lightY = ceiling - 0.15

  // 3 Longitudinal fluorescent light banks (North, Centre, South)
  const zPositions = [-4.5, 0.5, 5.0]
  const xPositions = [-6.5, 0, 6.5]

  for (const z of zPositions) {
    for (const x of xPositions) {
      // Light housing
      into.box([2.8, 0.1, 0.4], {
        at: [x, lightY, z],
        colour: ARMY_LIGHT_STEEL,
      })
      // Emissive tube diffuser
      into.box([2.6, 0.03, 0.28], {
        at: [x, lightY - 0.05, z],
        colour: ARMY_GLOW_LIGHT,
        glow: true,
      })
    }
  }
}

function buildFloorConduits(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)

  // Cable raceways from tables to lectern and screen
  into.box([0.16, 0.02, 2.5], {
    at: [-0.75, floor + 0.01, -2.0],
    colour: ARMY_LIGHT_STEEL,
  })
  into.box([0.16, 0.02, 2.0], {
    at: [0, floor + 0.01, -4.5],
    colour: ARMY_LIGHT_STEEL,
  })
}

/** Detail dressing for the 7.5m blank briefing projection screen (Chap. 380, p. 189). */
export function dressBriefingScreen(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface({ into, structure, floor, angle: 0 })
  const w = structure.size[0]
  const h = structure.height

  // Top motorized roller housing
  surface.cylinder(
    { radius: 0.09, height: w + 0.3, sides: 16 },
    [0, h + 0.09, 0],
    ARMY_SCREEN_HOUSING,
    [0, 0, Math.PI / 2],
  )

  // Side guide rails & tension weights
  for (const side of [-1, 1]) {
    surface.box([0.04, h + 0.1, 0.04], [side * (w / 2 + 0.04), h / 2, 0], ARMY_STEEL)
    // Wall mount bracket
    surface.box([0.06, 0.12, 0.14], [side * (w / 2), h + 0.09, -0.06], ARMY_LIGHT_STEEL)
  }

  // Matte projection canvas (recessed white screen)
  surface.box([w * 0.96, h * 0.94, 0.02], [0, h / 2, 0.02], ARMY_SCREEN_WHITE)

  // Black mask / antireflective border bezel (16:9 inner frame)
  surface.box([w, 0.08, 0.03], [0, h - 0.04, 0.02], ARMY_STEEL)
  surface.box([w, 0.08, 0.03], [0, 0.04, 0.02], ARMY_STEEL)
  surface.box([0.1, h, 0.03], [-w / 2 + 0.05, h / 2, 0.02], ARMY_STEEL)
  surface.box([0.1, h, 0.03], [w / 2 - 0.05, h / 2, 0.02], ARMY_STEEL)

  // Bottom counterweight bar
  surface.cylinder(
    { radius: 0.03, height: w + 0.1, sides: 12 },
    [0, 0.02, 0.03],
    ARMY_LIGHT_STEEL,
    [0, 0, Math.PI / 2],
  )
}

/** Detail dressing for the 5m tactical chart whiteboard (Chap. 380, p. 189). */
export function dressTacticalChartBoard(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  // Chart board is on the west wall (X = -9.88, depth = 5.0 along Z)
  const surface = new RoyalArmyConferenceSurface({
    into,
    structure,
    floor,
    angle: Math.PI / 2,
  })
  const w = structure.size[1] // length along the wall: 5.0m
  const h = structure.height // 2.5m

  // Aluminium frame
  surface.box([w, 0.05, 0.04], [0, h - 0.025, 0.02], ARMY_LIGHT_STEEL)
  surface.box([w, 0.05, 0.04], [0, 0.025, 0.02], ARMY_LIGHT_STEEL)
  surface.box([0.05, h, 0.04], [-w / 2 + 0.025, h / 2, 0.02], ARMY_LIGHT_STEEL)
  surface.box([0.05, h, 0.04], [w / 2 - 0.025, h / 2, 0.02], ARMY_LIGHT_STEEL)

  // Pale whiteboard surface
  surface.box([w - 0.08, h - 0.08, 0.015], [0, h / 2, 0.015], ARMY_CHART_PALE)

  // Tactical grid lines (horizontal and vertical)
  for (let y = 0.4; y < h - 0.3; y += 0.45) {
    surface.box([w - 0.2, 0.008, 0.02], [0, y, 0.02], ARMY_CHART_GRID)
  }
  for (let x = -w / 2 + 0.5; x < w / 2 - 0.3; x += 0.8) {
    surface.box([0.008, h - 0.2, 0.02], [x, h / 2, 0.02], ARMY_CHART_GRID)
  }

  // Bottom marker tray
  surface.box([w - 0.4, 0.03, 0.08], [0, 0.015, 0.05], ARMY_LIGHT_STEEL)
  // Dry-erase pens & magnetic erasers
  surface.box([0.14, 0.025, 0.05], [-0.5, 0.035, 0.05], ARMY_STEEL)
  surface.cylinder(
    { radius: 0.008, height: 0.12, sides: 8 },
    [0.4, 0.035, 0.05],
    0x203060,
    [0, 0, Math.PI / 2],
  )
  surface.cylinder(
    { radius: 0.008, height: 0.12, sides: 8 },
    [0.6, 0.035, 0.05],
    0xa02020,
    [0, 0, Math.PI / 2],
  )
}

/** Complete architectural ensemble of the Royal Army conference briefing room. */
export function dressRoyalArmyConferenceArchitecture(context: ArchitectureContext): void {
  buildPresenterStage(context)
  buildWallPerimeter(context)
  buildCeilingLighting(context)
  buildFloorConduits(context)
}
