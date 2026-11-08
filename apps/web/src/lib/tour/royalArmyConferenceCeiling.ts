import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARMY_ALERT_RED,
  ARMY_CEILING_GRID,
  ARMY_CEILING_TILE,
  ARMY_CHROME,
  ARMY_EMERGENCY_GREEN,
  ARMY_GLOW_LIGHT,
  ARMY_HVAC_SLAT,
  ARMY_LIGHT_STEEL,
  ARMY_PROJECTOR_LENS,
  ARMY_STEEL,
} from './royalArmyConferenceDetailSurface'
import type { Space } from './types'

export interface CeilingContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function ceilingSuspendedGrid(context: CeilingContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const gridY = ceiling - 0.015

  // Longitudinal main T-runners along X (span 20m from X: -9.9 to 9.9)
  for (let z = -7.0; z <= 7.0; z += 1.2) {
    into.box([19.8, 0.025, 0.025], {
      at: [0, gridY, z],
      colour: ARMY_CEILING_GRID,
    })
  }

  // Transverse cross-runners along Z (span 15m from Z: -7.4 to 7.4)
  for (let x = -9.6; x <= 9.6; x += 1.2) {
    into.box([0.025, 0.025, 14.8], {
      at: [x, gridY, 0],
      colour: ARMY_CEILING_GRID,
    })
  }

  // Inset acoustic panels texture blocks (subtle bevel relief)
  for (let x = -8.4; x <= 8.4; x += 3.6) {
    for (let z = -6.0; z <= 6.0; z += 3.6) {
      into.box([3.4, 0.01, 3.4], {
        at: [x, gridY + 0.005, z],
        colour: ARMY_CEILING_TILE,
      })
    }
  }
}

function ceilingTrofferLights(context: CeilingContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const lightY = ceiling - 0.08

  // 9 recessed parabolic lighting troffers (North, Centre, South lines)
  const zPositions = [-4.5, 0.5, 5.0]
  const xPositions = [-6.5, 0, 6.5]

  for (const z of zPositions) {
    for (const x of xPositions) {
      // Recessed outer metal rim
      into.box([2.8, 0.08, 0.6], {
        at: [x, lightY + 0.04, z],
        colour: ARMY_LIGHT_STEEL,
      })
      // Parabolic louver blades (longitudinal baffles)
      for (const dz of [-0.18, 0, 0.18]) {
        into.box([2.6, 0.04, 0.02], {
          at: [x, lightY + 0.02, z + dz],
          colour: ARMY_STEEL,
        })
      }
      // Dual high-output fluorescent tubes with warm diffuse glow
      for (const dz of [-0.09, 0.09]) {
        into.box([2.55, 0.025, 0.05], {
          at: [x, lightY - 0.01, z + dz],
          colour: ARMY_GLOW_LIGHT,
          glow: true,
        })
      }
    }
  }
}

function ceilingHvacDiffusers(context: CeilingContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const hvacY = ceiling - 0.02

  // 4 Square 4-way directional air supply/return diffusers
  const positions: [number, number][] = [
    [-3.8, -2.5],
    [3.8, -2.5],
    [-3.8, 2.8],
    [3.8, 2.8],
  ]

  for (const [x, z] of positions) {
    // Outer square frame
    into.box([0.7, 0.02, 0.7], {
      at: [x, hvacY, z],
      colour: ARMY_LIGHT_STEEL,
    })
    // Stepped inner louvers
    into.box([0.52, 0.015, 0.52], {
      at: [x, hvacY - 0.005, z],
      colour: ARMY_HVAC_SLAT,
    })
    into.box([0.34, 0.015, 0.34], {
      at: [x, hvacY - 0.01, z],
      colour: ARMY_LIGHT_STEEL,
    })
    into.box([0.16, 0.015, 0.16], {
      at: [x, hvacY - 0.015, z],
      colour: ARMY_HVAC_SLAT,
    })
  }
}

function ceilingTacticalProjector(context: CeilingContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const atX = 0
  const atZ = -1.8
  const mountTopY = ceiling - 0.01

  // Drop-rod suspension column & ceiling flange plate
  into.cylinder(
    { radius: 0.14, height: 0.03, sides: 12 },
    {
      at: [atX, mountTopY - 0.015, atZ],
      colour: ARMY_STEEL,
    },
  )
  into.cylinder(
    { radius: 0.028, height: 0.55, sides: 12 },
    {
      at: [atX, mountTopY - 0.3, atZ],
      colour: ARMY_CHROME,
    },
  )

  // Heavy 4K laser projector chassis
  const bodyY = mountTopY - 0.6
  into.box([0.62, 0.18, 0.52], {
    at: [atX, bodyY, atZ],
    colour: ARMY_STEEL,
  })
  // Top bevel trim and brand badge
  into.box([0.58, 0.02, 0.48], {
    at: [atX, bodyY + 0.09, atZ],
    colour: ARMY_LIGHT_STEEL,
  })

  // Side ventilation heat sink fins
  for (const side of [-1, 1]) {
    into.box([0.02, 0.12, 0.4], {
      at: [atX + side * 0.32, bodyY, atZ],
      colour: ARMY_HVAC_SLAT,
    })
  }

  // Front optical lens barrel (facing north towards 7.5m screen)
  into.cylinder(
    { radius: 0.065, height: 0.06, sides: 16 },
    {
      at: [atX + 0.12, bodyY, atZ - 0.28],
      colour: ARMY_CHROME,
      rotation: [Math.PI / 2, 0, 0],
    },
  )
  // Glowing blue laser projection lens element
  into.sphere([0.045, 0.045, 0.015], {
    at: [atX + 0.12, bodyY, atZ - 0.31],
    colour: ARMY_PROJECTOR_LENS,
    glow: true,
  })

  // Status indicator LEDs (Power: Green, Signal: Blue)
  into.sphere([0.008, 0.008, 0.008], {
    at: [atX - 0.22, bodyY + 0.06, atZ - 0.25],
    colour: ARMY_EMERGENCY_GREEN,
    glow: true,
  })
  into.sphere([0.008, 0.008, 0.008], {
    at: [atX - 0.19, bodyY + 0.06, atZ - 0.25],
    colour: ARMY_PROJECTOR_LENS,
    glow: true,
  })

  // Cable conduit running to ceiling
  into.box([0.03, 0.52, 0.03], {
    at: [atX - 0.06, mountTopY - 0.28, atZ + 0.15],
    colour: ARMY_STEEL,
  })
}

function ceilingSecurityCameras(context: CeilingContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  const camY = ceiling - 0.02

  // 4 Corner dome security cameras
  const corners: [number, number][] = [
    [-9.2, -6.8],
    [9.2, -6.8],
    [-9.2, 6.8],
    [9.2, 6.8],
  ]

  for (const [x, z] of corners) {
    // Mounting base plate
    into.cylinder(
      { radius: 0.12, height: 0.025, sides: 12 },
      {
        at: [x, camY, z],
        colour: ARMY_LIGHT_STEEL,
      },
    )
    // Smoked acrylic dome half-sphere
    into.sphere([0.08, 0.06, 0.08], {
      at: [x, camY - 0.04, z],
      colour: 0x111316,
    })
    // Tiny red recording tally LED
    into.sphere([0.006, 0.006, 0.006], {
      at: [x, camY - 0.07, z],
      colour: ARMY_ALERT_RED,
      glow: true,
    })
  }
}

function ceilingEmergencyExitSigns(context: CeilingContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const ceiling = floor + ceilingOf(space, plan.tier)
  // Emergency exit sign box mounted above the south exit double doors
  const signY = ceiling - 0.35
  const signZ = 7.3

  // Suspension rod
  into.cylinder(
    { radius: 0.015, height: 0.32, sides: 8 },
    {
      at: [0, ceiling - 0.16, signZ],
      colour: ARMY_LIGHT_STEEL,
    },
  )

  // Double-sided illuminated green exit sign
  into.box([0.54, 0.24, 0.08], {
    at: [0, signY, signZ],
    colour: ARMY_LIGHT_STEEL,
  })
  // Glowing green indicator face
  into.box([0.48, 0.18, 0.09], {
    at: [0, signY, signZ],
    colour: ARMY_EMERGENCY_GREEN,
    glow: true,
  })
}

/** Complete technical suspended ceiling ensemble for the Royal Army conference briefing room. */
export function dressRoyalArmyConferenceCeiling(context: CeilingContext): void {
  ceilingSuspendedGrid(context)
  ceilingTrofferLights(context)
  ceilingHvacDiffusers(context)
  ceilingTacticalProjector(context)
  ceilingSecurityCameras(context)
  ceilingEmergencyExitSigns(context)
}
