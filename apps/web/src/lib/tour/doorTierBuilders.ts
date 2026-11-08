import {
  doorBox,
  TIER_1_PALETTE,
  TIER_2_PALETTE,
  TIER_3_PALETTE,
  TIER_4_PALETTE,
  TIER_5_PALETTE,
  type DoorDressContext,
} from './doorDetailSurface'

interface CasingStyle {
  jambW: number
  jambD: number
  frameCol: number
  trimCol?: number
  sillCol?: number
}

function dressCasing(context: DoorDressContext, style: CasingStyle): void {
  const { into, placement } = context
  const { width, height } = placement
  const { jambW, jambD, frameCol, trimCol, sillCol } = style
  const halfW = width / 2 - jambW / 2

  // Left & right vertical jambs
  for (const sx of [-halfW, halfW]) {
    doorBox({
      into,
      placement,
      size: [jambW, height, jambD],
      offset: [sx, height / 2, 0],
      colour: frameCol,
    })
  }

  // Lintel / head casing
  doorBox({
    into,
    placement,
    size: [width + jambW * 0.4, 0.12, jambD * 1.05],
    offset: [0, height + 0.06, 0],
    colour: frameCol,
  })

  // Optional decorative upper trim / cornice
  if (trimCol !== undefined) {
    doorBox({
      into,
      placement,
      size: [width + jambW * 0.8, 0.04, jambD * 1.15],
      offset: [0, height + 0.14, 0],
      colour: trimCol,
    })
  }

  // Sill / threshold
  if (sillCol !== undefined) {
    doorBox({
      into,
      placement,
      size: [width, 0.02, jambD * 0.9],
      offset: [0, 0.01, 0],
      colour: sillCol,
    })
  }
}

interface OpenLeafOptions {
  leafW: number
  leafD: number
  leafCol: number
  handleCol: number
  hingeSide: 1 | -1
}

function dressSingleLeaf(context: DoorDressContext, options: OpenLeafOptions): void {
  const { into, placement } = context
  const { width, height, openSign } = placement
  const { leafW, leafD, leafCol, handleCol, hingeSide } = options

  // Hinge anchor near the jamb
  const hingeX = hingeSide * (width / 2 - 0.06)
  const openAngle = openSign * hingeSide * 1.4 // ~80 degrees open
  const cos = Math.cos(openAngle)
  const sin = Math.sin(openAngle)

  // Leaf center relative to door center
  const leafCenterX = hingeX + hingeSide * (leafW / 2) * cos
  const leafCenterZ = hingeSide * (leafW / 2) * sin

  doorBox({
    into,
    placement,
    size: [leafW, height - 0.04, leafD],
    offset: [leafCenterX, height / 2, leafCenterZ],
    colour: leafCol,
    extraYaw: openAngle,
  })

  // Door handle near outer edge of leaf
  const handleX = hingeX + hingeSide * (leafW - 0.08) * cos
  const handleZ = hingeSide * (leafW - 0.08) * sin
  doorBox({
    into,
    placement,
    size: [0.06, 0.14, 0.06],
    offset: [handleX, 0.98, handleZ],
    colour: handleCol,
    extraYaw: openAngle,
  })
}

function dressDoubleLeaves(context: DoorDressContext, options: OpenLeafOptions): void {
  const halfLeafW = Math.min(1.2, (context.placement.width - 0.15) / 2)
  dressSingleLeaf(context, { ...options, leafW: halfLeafW, hingeSide: -1 })
  dressSingleLeaf(context, { ...options, leafW: halfLeafW, hingeSide: 1 })
}

/** Tier 1: Royal Neoclassic door with carved mahogany, gold trims and brass handle. */
export function dressTier1Door(context: DoorDressContext): void {
  const isWide = context.placement.width >= 2.2
  dressCasing(context, {
    jambW: 0.14,
    jambD: 0.18,
    frameCol: TIER_1_PALETTE.darkWood,
    trimCol: TIER_1_PALETTE.gold,
    sillCol: TIER_1_PALETTE.brass,
  })

  // Classical pediment / entablature over lintel
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [context.placement.width + 0.22, 0.16, 0.22],
    offset: [0, context.placement.height + 0.22, 0],
    colour: TIER_1_PALETTE.mahogany,
  })
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [context.placement.width + 0.28, 0.03, 0.24],
    offset: [0, context.placement.height + 0.31, 0],
    colour: TIER_1_PALETTE.gold,
  })

  const leafOptions = {
    leafW: Math.min(1.05, context.placement.width - 0.12),
    leafD: 0.06,
    leafCol: TIER_1_PALETTE.mahogany,
    handleCol: TIER_1_PALETTE.brass,
    hingeSide: -1 as const,
  }

  if (isWide) {
    dressDoubleLeaves(context, leafOptions)
  } else {
    dressSingleLeaf(context, leafOptions)
  }
}

/** Tier 2: Institutional / security door with access reader and closer. */
export function dressTier2Door(context: DoorDressContext): void {
  const isWide = context.placement.width >= 2.2
  dressCasing(context, {
    jambW: 0.1,
    jambD: 0.14,
    frameCol: TIER_2_PALETTE.steel,
    sillCol: TIER_2_PALETTE.stainless,
  })

  // Overhead hydraulic door closer
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.32, 0.08, 0.1],
    offset: [0, context.placement.height - 0.06, 0.05],
    colour: TIER_2_PALETTE.darkMetal,
  })

  // Wall-mounted access badge reader with status LEDs
  const keypadX = context.placement.width / 2 + 0.18
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.12, 0.24, 0.05],
    offset: [keypadX, 1.4, 0.02],
    colour: TIER_2_PALETTE.darkMetal,
  })
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.03, 0.03, 0.06],
    offset: [keypadX, 1.48, 0.025],
    colour: TIER_2_PALETTE.ledGreen,
  })

  const leafOptions = {
    leafW: Math.min(1.05, context.placement.width - 0.1),
    leafD: 0.055,
    leafCol: TIER_2_PALETTE.steel,
    handleCol: TIER_2_PALETTE.stainless,
    hingeSide: -1 as const,
  }

  if (isWide) {
    dressDoubleLeaves(context, leafOptions)
  } else {
    dressSingleLeaf(context, leafOptions)
  }
}

/** Tier 3: Standard passenger cabin door with room plate and indicator. */
export function dressTier3Door(context: DoorDressContext): void {
  const isWide = context.placement.width >= 2.2
  dressCasing(context, {
    jambW: 0.08,
    jambD: 0.12,
    frameCol: TIER_3_PALETTE.frame,
    sillCol: TIER_3_PALETTE.aluminum,
  })

  // Lintel service status indicator lamp
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.1, 0.04, 0.08],
    offset: [0, context.placement.height + 0.08, 0.04],
    colour: TIER_3_PALETTE.ledGreen,
  })

  // Keycard lock plate on the strike jamb
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.08, 0.18, 0.03],
    offset: [context.placement.width / 2 - 0.04, 1.15, 0.02],
    colour: TIER_3_PALETTE.basePlate,
  })

  const leafOptions = {
    leafW: Math.min(1.0, context.placement.width - 0.08),
    leafD: 0.045,
    leafCol: TIER_3_PALETTE.laminate,
    handleCol: TIER_3_PALETTE.aluminum,
    hingeSide: -1 as const,
  }

  if (isWide) {
    dressDoubleLeaves(context, leafOptions)
  } else {
    dressSingleLeaf(context, leafOptions)
  }
}

/** Tier 4: Watertight marine bulkhead door with hazard threshold & dogging levers. */
export function dressTier4Door(context: DoorDressContext): void {
  const isWide = context.placement.width >= 2.2
  dressCasing(context, {
    jambW: 0.12,
    jambD: 0.16,
    frameCol: TIER_4_PALETTE.heavySteel,
    trimCol: TIER_4_PALETTE.darkSteel,
  })

  // Raised watertight coaming sill with hazard stripes
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [context.placement.width, 0.12, 0.16],
    offset: [0, 0.06, 0],
    colour: TIER_4_PALETTE.hazardYellow,
  })
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [context.placement.width * 0.85, 0.04, 0.17],
    offset: [0, 0.08, 0],
    colour: TIER_4_PALETTE.hazardBlack,
  })

  const leafOptions = {
    leafW: Math.min(1.05, context.placement.width - 0.1),
    leafD: 0.06,
    leafCol: TIER_4_PALETTE.heavySteel,
    handleCol: TIER_4_PALETTE.hazardBlack,
    hingeSide: -1 as const,
  }

  if (isWide) {
    dressDoubleLeaves(context, leafOptions)
  } else {
    dressSingleLeaf(context, leafOptions)
  }
}

/** Tier 5: Massive cargo hold / freight door with steel ribs & cast plate. */
export function dressTier5Door(context: DoorDressContext): void {
  const isWide = context.placement.width >= 2.2
  dressCasing(context, {
    jambW: 0.16,
    jambD: 0.22,
    frameCol: TIER_5_PALETTE.rawSteel,
    trimCol: TIER_5_PALETTE.darkIron,
    sillCol: TIER_5_PALETTE.castPlate,
  })

  // Corner reinforcement gussets on the head jamb
  for (const sx of [-context.placement.width / 2 + 0.12, context.placement.width / 2 - 0.12]) {
    doorBox({
      into: context.into,
      placement: context.placement,
      size: [0.18, 0.18, 0.18],
      offset: [sx, context.placement.height - 0.02, 0],
      colour: TIER_5_PALETTE.darkIron,
    })
  }

  const leafOptions = {
    leafW: Math.min(1.3, context.placement.width - 0.12),
    leafD: 0.07,
    leafCol: TIER_5_PALETTE.rawSteel,
    handleCol: TIER_5_PALETTE.darkIron,
    hingeSide: -1 as const,
  }

  if (isWide) {
    dressDoubleLeaves(context, leafOptions)
  } else {
    dressSingleLeaf(context, leafOptions)
  }
}
