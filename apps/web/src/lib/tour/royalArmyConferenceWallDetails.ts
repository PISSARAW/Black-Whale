import { floorOf, type TierPlan } from './blueprint'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARMY_ALERT_RED,
  ARMY_CHROME,
  ARMY_EMERGENCY_GREEN,
  ARMY_GLASS,
  ARMY_GOLD_CREST,
  ARMY_LIGHT_STEEL,
  ARMY_PAPER,
  ARMY_PROJECTOR_LENS,
  ARMY_SCREEN_TACTICAL_BLUE,
  ARMY_SCREEN_TACTICAL_CYAN,
  ARMY_STEEL,
  ARMY_TABLE_WOOD,
} from './royalArmyConferenceDetailSurface'
import type { Space } from './types'

export interface WallContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

function wallRoyalArmyCrest(context: WallContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const crestY = floor + 4.35
  const wallZ = -7.42

  // Heraldic shield backing
  into.box([0.72, 0.82, 0.04], {
    at: [0, crestY, wallZ],
    colour: ARMY_STEEL,
  })
  into.box([0.64, 0.74, 0.05], {
    at: [0, crestY, wallZ],
    colour: ARMY_GOLD_CREST,
  })

  // Crossed ceremonial officer swords behind the shield
  for (const side of [-1, 1]) {
    // Sword blade
    into.box([0.035, 1.1, 0.025], {
      at: [0, crestY, wallZ - 0.01],
      rotation: [0, 0, side * 0.65],
      colour: ARMY_CHROME,
    })
    // Sword hilt crossguard
    into.box([0.22, 0.035, 0.03], {
      at: [side * 0.32, crestY - 0.38, wallZ - 0.01],
      rotation: [0, 0, side * 0.65],
      colour: ARMY_GOLD_CREST,
    })
    // Pommel sphere
    into.sphere([0.03, 0.03, 0.03], {
      at: [side * 0.42, crestY - 0.5, wallZ - 0.01],
      colour: ARMY_GOLD_CREST,
    })
  }

  // Central embossed Kakin eagle emblem
  into.sphere([0.18, 0.22, 0.04], {
    at: [0, crestY + 0.08, wallZ + 0.03],
    colour: ARMY_GOLD_CREST,
  })
  // Spread wings
  for (const side of [-1, 1]) {
    into.box([0.26, 0.12, 0.03], {
      at: [side * 0.22, crestY + 0.14, wallZ + 0.03],
      rotation: [0, 0, side * 0.35],
      colour: ARMY_GOLD_CREST,
    })
  }

  // Lower ribbon motto banner
  into.box([0.84, 0.09, 0.035], {
    at: [0, crestY - 0.38, wallZ + 0.03],
    colour: ARMY_GOLD_CREST,
  })
  into.box([0.74, 0.04, 0.04], {
    at: [0, crestY - 0.38, wallZ + 0.035],
    colour: ARMY_STEEL,
  })
}

function wallDoubleDoors(context: WallContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const doorZ = 7.42
  const doorH = 2.8
  const doorW = 2.4

  // Outer heavy steel frame architrave
  into.box([doorW + 0.2, doorH + 0.1, 0.14], {
    at: [0, floor + doorH / 2, doorZ],
    colour: ARMY_STEEL,
  })

  // Left & right door leaves
  for (const side of [-1, 1]) {
    const leafX = side * (doorW / 4)
    into.box([doorW / 2 - 0.03, doorH - 0.04, 0.08], {
      at: [leafX, floor + doorH / 2, doorZ],
      colour: 0x24282c,
    })
    // Narrow vertical armored vision panel
    into.box([0.16, 0.95, 0.09], {
      at: [leafX, floor + 1.65, doorZ],
      colour: ARMY_STEEL,
    })
    into.box([0.11, 0.9, 0.095], {
      at: [leafX, floor + 1.65, doorZ],
      colour: ARMY_GLASS,
    })
    // Horizontal stainless steel crash / panic bar
    into.box([doorW / 2 - 0.18, 0.045, 0.07], {
      at: [leafX, floor + 1.05, doorZ - 0.04],
      colour: ARMY_CHROME,
    })
    // Heavy stainless steel kick plate
    into.box([doorW / 2 - 0.08, 0.26, 0.085], {
      at: [leafX, floor + 0.16, doorZ],
      colour: ARMY_LIGHT_STEEL,
    })
  }

  // Security card reader terminal on right wall jamb
  into.box([0.12, 0.22, 0.05], {
    at: [1.4, floor + 1.35, doorZ - 0.03],
    colour: ARMY_STEEL,
  })
  into.box([0.08, 0.08, 0.055], {
    at: [1.4, floor + 1.4, doorZ - 0.03],
    colour: 0x181a1d,
  })
  into.sphere([0.008, 0.008, 0.008], {
    at: [1.4 - 0.03, floor + 1.48, doorZ - 0.03],
    colour: ARMY_EMERGENCY_GREEN,
    glow: true,
  })
  into.sphere([0.008, 0.008, 0.008], {
    at: [1.4 + 0.03, floor + 1.48, doorZ - 0.03],
    colour: ARMY_ALERT_RED,
  })

  // "RESTRICTED AREA" warning plaque over the lintel
  into.box([1.1, 0.14, 0.03], {
    at: [0, floor + doorH + 0.18, doorZ - 0.03],
    colour: ARMY_ALERT_RED,
  })
  into.box([0.98, 0.08, 0.035], {
    at: [0, floor + doorH + 0.18, doorZ - 0.03],
    colour: ARMY_PAPER,
  })
}

function wallSynchronisedClocks(context: WallContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const wallX = 9.88
  const clockY = floor + 3.8

  // 3 Operational clocks on the east wall (Z: -2.0, 0, 2.0)
  const zPositions = [-2.0, 0, 2.0]
  for (const z of zPositions) {
    // Outer chrome bezel ring
    into.cylinder({ radius: 0.28, height: 0.04, sides: 16 }, {
      at: [wallX, clockY, z],
      colour: ARMY_CHROME,
      rotation: [0, 0, Math.PI / 2],
    })
    // White dial face
    into.cylinder({ radius: 0.25, height: 0.045, sides: 16 }, {
      at: [wallX - 0.005, clockY, z],
      colour: ARMY_PAPER,
      rotation: [0, 0, Math.PI / 2],
    })
    // Clock hands
    into.box([0.01, 0.14, 0.015], {
      at: [wallX - 0.015, clockY + 0.06, z],
      colour: ARMY_STEEL,
    })
    into.box([0.01, 0.015, 0.1], {
      at: [wallX - 0.015, clockY, z + 0.04],
      colour: ARMY_STEEL,
    })
    // Center cap
    into.sphere([0.015, 0.015, 0.015], {
      at: [wallX - 0.015, clockY, z],
      colour: ARMY_ALERT_RED,
    })
    // Label plate underneath (KST, UTC, OPS)
    into.box([0.02, 0.06, 0.26], {
      at: [wallX - 0.005, clockY - 0.36, z],
      colour: ARMY_TABLE_WOOD,
    })
  }
}

function wallAvServerRack(context: WallContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const rackX = -9.88
  const rackZ = 3.6
  const rackH = 1.6
  const rackW = 0.65
  const rackD = 0.55

  // Wall-recessed black steel 19" rack enclosure
  into.box([rackD, rackH, rackW], {
    at: [rackX + rackD / 2, floor + rackH / 2 + 0.4, rackZ],
    colour: ARMY_STEEL,
  })

  // Smoked glass door with brushed frame
  into.box([0.02, rackH - 0.08, rackW - 0.06], {
    at: [rackX + rackD + 0.01, floor + rackH / 2 + 0.4, rackZ],
    colour: ARMY_GLASS,
  })

  // Stacked 1U/2U server modules & patch bays
  for (let u = 0; u < 7; u++) {
    const uy = floor + 0.65 + u * 0.16
    into.box([rackD - 0.08, 0.12, rackW - 0.1], {
      at: [rackX + rackD / 2, uy, rackZ],
      colour: 0x181a1d,
    })
    // Blinking status LEDs (Green / Blue / Amber)
    into.sphere([0.006, 0.006, 0.006], {
      at: [rackX + rackD - 0.02, uy, rackZ - 0.18],
      colour: ARMY_EMERGENCY_GREEN,
      glow: true,
    })
    into.sphere([0.006, 0.006, 0.006], {
      at: [rackX + rackD - 0.02, uy, rackZ - 0.14],
      colour: ARMY_PROJECTOR_LENS,
      glow: true,
    })
    into.sphere([0.006, 0.006, 0.006], {
      at: [rackX + rackD - 0.02, uy, rackZ - 0.1],
      colour: ARMY_GOLD_CREST,
      glow: true,
    })
  }

  // Floor cable duct leading into rack
  into.box([0.16, 0.4, 0.12], {
    at: [rackX + 0.2, floor + 0.2, rackZ],
    colour: ARMY_LIGHT_STEEL,
  })
}

function wallAuxiliaryMonitors(context: WallContext): void {
  const { into, space, plan } = context
  const floor = floorOf(space, plan.tier)
  const monitorY = floor + 2.5
  const monitorW = 1.6
  const monitorH = 0.95

  // East Wall Command Display at [9.88, monitorY, -4.5]
  into.box([0.06, monitorH + 0.06, monitorW + 0.06], {
    at: [9.85, monitorY, -4.5],
    colour: ARMY_STEEL,
  })
  into.box([0.02, monitorH, monitorW], {
    at: [9.81, monitorY, -4.5],
    colour: ARMY_SCREEN_TACTICAL_BLUE,
    glow: true,
  })
  // Screen telemetry bar
  into.box([0.025, 0.04, monitorW * 0.85], {
    at: [9.8, monitorY + 0.35, -4.5],
    colour: ARMY_SCREEN_TACTICAL_CYAN,
    glow: true,
  })

  // West Wall Command Display at [-9.88, monitorY, -6.0]
  into.box([0.06, monitorH + 0.06, monitorW + 0.06], {
    at: [-9.85, monitorY, -6.0],
    colour: ARMY_STEEL,
  })
  into.box([0.02, monitorH, monitorW], {
    at: [-9.81, monitorY, -6.0],
    colour: ARMY_SCREEN_TACTICAL_BLUE,
    glow: true,
  })
  into.box([0.025, 0.04, monitorW * 0.85], {
    at: [-9.8, monitorY + 0.35, -6.0],
    colour: ARMY_SCREEN_TACTICAL_CYAN,
    glow: true,
  })
}

/** Complete ensemble of wall fixtures: crest, double doors, clocks, AV rack, and auxiliary monitors. */
export function dressRoyalArmyConferenceWallDetails(context: WallContext): void {
  wallRoyalArmyCrest(context)
  wallDoubleDoors(context)
  wallSynchronisedClocks(context)
  wallAvServerRack(context)
  wallAuxiliaryMonitors(context)
}
