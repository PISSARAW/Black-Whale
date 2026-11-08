import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf, type TierPlan } from './blueprint'
import {
  ARMY_CARPET_BORDER,
  ARMY_CARPET_DARK,
  ARMY_CHROME,
  ARMY_GLOW_LIGHT,
  ARMY_INLAY_BRASS,
  ARMY_LIGHT_STEEL,
  ARMY_STEEL,
  ARMY_TABLE_CHAMFER,
  ARMY_TABLE_WOOD,
} from './royalArmyConferenceDetailSurface'
import {
  dressBriefingScreenDisplay,
  dressTacticalChartBoardDisplay,
} from './royalArmyConferenceScreenDisplay'
import type { Space, Structure } from './types'

export interface ArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function buildCommandFlooring(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const floorY = floor + 0.005

  // Main acoustic carpet field (dark charcoal slate)
  into.box([19.6, 0.008, 14.6], {
    at: [0, floorY, 0],
    colour: ARMY_CARPET_DARK,
  })

  // Perimeter border runner (darker contrast boundary 0.8m from walls)
  into.box([19.6, 0.01, 0.8], {
    at: [0, floorY + 0.001, -7.0],
    colour: ARMY_CARPET_BORDER,
  })
  into.box([19.6, 0.01, 0.8], {
    at: [0, floorY + 0.001, 7.0],
    colour: ARMY_CARPET_BORDER,
  })
  into.box([0.8, 0.01, 14.6], {
    at: [-9.5, floorY + 0.001, 0],
    colour: ARMY_CARPET_BORDER,
  })
  into.box([0.8, 0.01, 14.6], {
    at: [9.5, floorY + 0.001, 0],
    colour: ARMY_CARPET_BORDER,
  })

  // Polished brass inlay expansion border outlining executive seating zone
  const brassY = floorY + 0.003
  into.box([12.5, 0.008, 0.06], {
    at: [0, brassY, -4.0],
    colour: ARMY_INLAY_BRASS,
  })
  into.box([12.5, 0.008, 0.06], {
    at: [0, brassY, 5.0],
    colour: ARMY_INLAY_BRASS,
  })
  into.box([0.06, 0.008, 9.0], {
    at: [-6.25, brassY, 0.5],
    colour: ARMY_INLAY_BRASS,
  })
  into.box([0.06, 0.008, 9.0], {
    at: [6.25, brassY, 0.5],
    colour: ARMY_INLAY_BRASS,
  })
}

function buildPresenterStage(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const stageW = 11.5
  const stageD = 3.4
  const stageH = 0.16
  const stageZ = -5.7

  // Stage foundation sub-floor
  into.box([stageW, stageH, stageD], {
    at: [0, floor + stageH / 2, stageZ],
    colour: ARMY_STEEL,
  })

  // Hardwood parquet platform top deck
  into.box([stageW - 0.04, 0.015, stageD - 0.04], {
    at: [0, floor + stageH + 0.005, stageZ],
    colour: ARMY_TABLE_WOOD,
  })

  // Front beveled aluminum safety nosing
  into.box([stageW + 0.06, 0.025, 0.08], {
    at: [0, floor + stageH, stageZ + stageD / 2],
    colour: ARMY_CHROME,
  })
  // Side nosings
  for (const side of [-1, 1]) {
    into.box([0.08, 0.025, stageD], {
      at: [side * (stageW / 2), floor + stageH, stageZ],
      colour: ARMY_CHROME,
    })
  }

  // Under-lip step LED illumination strip (soft continuous warm white glow)
  into.box([stageW - 0.2, 0.015, 0.03], {
    at: [0, floor + stageH - 0.02, stageZ + stageD / 2 + 0.02],
    colour: ARMY_GLOW_LIGHT,
    glow: true,
  })

  // Access step transition at stage center
  into.box([2.4, 0.08, 0.45], {
    at: [0, floor + 0.04, stageZ + stageD / 2 + 0.22],
    colour: ARMY_TABLE_CHAMFER,
  })
  into.box([2.44, 0.015, 0.06], {
    at: [0, floor + 0.08, stageZ + stageD / 2 + 0.42],
    colour: ARMY_CHROME,
  })
}

function buildWallPerimeter(context: ArchitectureContext): void {
  const { into, plan, space } = context
  const floor = floorOf(space, plan.tier)

  for (const run of banquetWallRuns(plan, space)) {
    // Heavy military base plinth with cable channel
    into.box([run.length, 0.24, 0.08], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 0.12, inset: 0.04 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_STEEL,
    })

    // Acoustic wood slat wainscoting up to 1.15m
    const slatCount = Math.max(1, Math.floor(run.length / 0.18))
    for (let i = 0; i < slatCount; i++) {
      const along = ((i + 0.5) * run.length) / slatCount
      into.box([0.14, 0.88, 0.025], {
        at: wallPoint(run, { along, y: floor + 0.68, inset: 0.02 }),
        rotation: [0, run.angle, 0],
        colour: ARMY_TABLE_WOOD,
      })
    }

    // Brushed aluminum architectural dado rail with conduit groove
    into.box([run.length, 0.09, 0.06], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 1.18, inset: 0.03 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_LIGHT_STEEL,
    })

    // Upper perimeter cornice moulding at ceiling junction
    into.box([run.length, 0.14, 0.09], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 4.92, inset: 0.045 }),
      rotation: [0, run.angle, 0],
      colour: ARMY_STEEL,
    })

    // Vertical acoustic fabric absorbing panels along the upper wall
    const panelCount = Math.max(1, Math.floor(run.length / 2.2))
    for (let i = 0; i < panelCount; i++) {
      const along = ((i + 0.5) * run.length) / panelCount
      into.box([0.06, 3.4, 0.02], {
        at: wallPoint(run, { along, y: floor + 3.0, inset: 0.015 }),
        rotation: [0, run.angle, 0],
        colour: ARMY_LIGHT_STEEL,
      })
    }
  }
}

function buildFloorConduits(context: ArchitectureContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)

  // Surface-mounted beveled aluminum cable raceways
  into.box([0.18, 0.025, 2.5], {
    at: [-0.75, floor + 0.012, -2.0],
    colour: ARMY_LIGHT_STEEL,
  })
  into.box([0.18, 0.025, 2.0], {
    at: [0, floor + 0.012, -4.5],
    colour: ARMY_LIGHT_STEEL,
  })

  // Flush-mounted under-desk electrical and AV pop-up floor boxes
  const boxPositions: [number, number][] = [
    [-2.5, 0],
    [2.5, 0],
    [-2.5, 3.6],
    [2.5, 3.6],
    [0, -0.65],
  ]
  for (const [bx, bz] of boxPositions) {
    into.box([0.3, 0.015, 0.3], {
      at: [bx, floor + 0.008, bz],
      colour: ARMY_LIGHT_STEEL,
    })
    into.box([0.22, 0.018, 0.22], {
      at: [bx, floor + 0.009, bz],
      colour: ARMY_STEEL,
    })
  }
}

/** Detail dressing for the 7.5m blank briefing projection screen (Chap. 380, p. 189). */
export function dressBriefingScreen(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  dressBriefingScreenDisplay(into, structure, floor)
}

/** Detail dressing for the 5m tactical chart whiteboard (Chap. 380, p. 189). */
export function dressTacticalChartBoard(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  dressTacticalChartBoardDisplay(into, structure, floor)
}

/** Complete architectural ensemble of the Royal Army conference briefing room. */
export function dressRoyalArmyConferenceArchitecture(context: ArchitectureContext): void {
  buildCommandFlooring(context)
  buildPresenterStage(context)
  buildWallPerimeter(context)
  buildFloorConduits(context)
}
