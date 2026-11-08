import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { AnimatedDoorLeaf } from './doorAnimator'
import {
  doorBox,
  TIER_1_PALETTE,
  TIER_2_PALETTE,
  TIER_3_PALETTE,
  TIER_4_PALETTE,
  TIER_5_PALETTE,
  type DoorDressContext,
  type DoorPlacement,
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

export interface LeafBuildOptions {
  THREE: typeof Three
  placement: DoorPlacement
  tier: 1 | 2 | 3 | 4 | 5
}

interface SingleLeafSpec {
  THREE: typeof Three
  placement: DoorPlacement
  leafW: number
  leafD: number
  leafCol: number
  handleCol: number
  hingeSide: 1 | -1
  tier: 1 | 2 | 3 | 4 | 5
}

function buildSingleAnimatedLeaf(spec: SingleLeafSpec): AnimatedDoorLeaf {
  const { THREE, placement, leafW, leafD, leafCol, handleCol, hingeSide, tier } = spec
  const { height, openSign, angle, floor, center, width } = placement
  const dir = hingeSide === -1 ? 1 : -1
  const leafBuilder = new BanquetDetailBuilder(THREE)

  // Leaf slab in local hinge coordinates
  leafBuilder.box([leafW, height - 0.04, leafD], {
    at: [dir * (leafW / 2), height / 2, 0],
    colour: leafCol,
  })

  // Door handle
  leafBuilder.box([0.05, 0.16, 0.06], {
    at: [dir * (leafW - 0.08), 1.0, 0],
    colour: handleCol,
  })

  // Tier-specific leaf adornments
  if (tier === 1) {
    leafBuilder.box([leafW - 0.12, (height - 0.4) / 2, leafD + 0.01], {
      at: [dir * (leafW / 2), height * 0.72, 0],
      colour: TIER_1_PALETTE.gold,
    })
  } else if (tier === 3) {
    leafBuilder.box([leafW - 0.04, 0.2, leafD + 0.01], {
      at: [dir * (leafW / 2), 0.12, 0],
      colour: TIER_3_PALETTE.aluminum,
    })
  } else if (tier === 4) {
    leafBuilder.cylinder(
      { radius: 0.14, height: leafD + 0.02, sides: 12 },
      {
        at: [dir * (leafW / 2), height * 0.65, 0],
        colour: TIER_4_PALETTE.portholeGlass,
        rotation: [Math.PI / 2, 0, 0],
      },
    )
  } else if (tier === 5) {
    leafBuilder.box([leafW, 0.08, leafD + 0.02], {
      at: [dir * (leafW / 2), height * 0.35, 0],
      colour: TIER_5_PALETTE.darkIron,
    })
  }

  const leafGroup = leafBuilder.finish('door-leaf')
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const hingeLocalX = hingeSide * (width / 2 - 0.05)
  const hingeWorldX = center[0] + hingeLocalX * cos
  const hingeWorldZ = center[1] + hingeLocalX * sin

  const hingeGroup = new THREE.Group()
  hingeGroup.name = `hinge-${hingeSide < 0 ? 'left' : 'right'}`
  hingeGroup.position.set(hingeWorldX, floor, hingeWorldZ)
  hingeGroup.rotation.y = -angle
  hingeGroup.add(leafGroup)

  const maxSwing = hingeSide * openSign * 1.4

  return {
    hingeGroup,
    baseRotationY: -angle,
    maxSwing,
  }
}

/** Builds moving door leaves (single or double) for a doorway. */
export function buildTierDoorLeaves(options: LeafBuildOptions): AnimatedDoorLeaf[] {
  const { THREE, placement, tier } = options
  const isWide = placement.width >= 2.2

  const palette = {
    1: { col: TIER_1_PALETTE.mahogany, handle: TIER_1_PALETTE.brass, depth: 0.06 },
    2: { col: TIER_2_PALETTE.steel, handle: TIER_2_PALETTE.stainless, depth: 0.055 },
    3: { col: TIER_3_PALETTE.laminate, handle: TIER_3_PALETTE.aluminum, depth: 0.045 },
    4: { col: TIER_4_PALETTE.heavySteel, handle: TIER_4_PALETTE.hazardBlack, depth: 0.06 },
    5: { col: TIER_5_PALETTE.rawSteel, handle: TIER_5_PALETTE.darkIron, depth: 0.07 },
  }[tier]

  if (isWide) {
    const halfLeafW = Math.min(1.2, (placement.width - 0.15) / 2)
    const left = buildSingleAnimatedLeaf({
      THREE,
      placement,
      leafW: halfLeafW,
      leafD: palette.depth,
      leafCol: palette.col,
      handleCol: palette.handle,
      hingeSide: -1,
      tier,
    })
    const right = buildSingleAnimatedLeaf({
      THREE,
      placement,
      leafW: halfLeafW,
      leafD: palette.depth,
      leafCol: palette.col,
      handleCol: palette.handle,
      hingeSide: 1,
      tier,
    })
    return [left, right]
  }

  const singleLeafW = Math.min(1.1, placement.width - 0.12)
  return [
    buildSingleAnimatedLeaf({
      THREE,
      placement,
      leafW: singleLeafW,
      leafD: palette.depth,
      leafCol: palette.col,
      handleCol: palette.handle,
      hingeSide: -1,
      tier,
    }),
  ]
}

/** Tier 1: Royal Neoclassic door casing with mahogany pediment and gold moulding. */
export function dressTier1Door(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.14,
    jambD: 0.18,
    frameCol: TIER_1_PALETTE.darkWood,
    trimCol: TIER_1_PALETTE.gold,
    sillCol: TIER_1_PALETTE.brass,
  })

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
}

/** Tier 2: Institutional / security door casing with card reader and hydraulic closer. */
export function dressTier2Door(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.1,
    jambD: 0.14,
    frameCol: TIER_2_PALETTE.steel,
    sillCol: TIER_2_PALETTE.stainless,
  })

  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.32, 0.08, 0.1],
    offset: [0, context.placement.height - 0.06, 0.05],
    colour: TIER_2_PALETTE.darkMetal,
  })

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
}

/** Tier 3: Standard passenger cabin door casing with status indicator and keycard plate. */
export function dressTier3Door(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.08,
    jambD: 0.12,
    frameCol: TIER_3_PALETTE.frame,
    sillCol: TIER_3_PALETTE.aluminum,
  })

  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.1, 0.04, 0.08],
    offset: [0, context.placement.height + 0.08, 0.04],
    colour: TIER_3_PALETTE.ledGreen,
  })

  doorBox({
    into: context.into,
    placement: context.placement,
    size: [0.08, 0.18, 0.03],
    offset: [context.placement.width / 2 - 0.04, 1.15, 0.02],
    colour: TIER_3_PALETTE.basePlate,
  })
}

/** Tier 4: Watertight marine bulkhead casing with hazard stripes. */
export function dressTier4Door(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.12,
    jambD: 0.16,
    frameCol: TIER_4_PALETTE.heavySteel,
    trimCol: TIER_4_PALETTE.darkSteel,
  })

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
}

/** Tier 5: Massive cargo hold casing with corner gusset plates. */
export function dressTier5Door(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.16,
    jambD: 0.22,
    frameCol: TIER_5_PALETTE.rawSteel,
    trimCol: TIER_5_PALETTE.darkIron,
    sillCol: TIER_5_PALETTE.castPlate,
  })

  for (const sx of [-context.placement.width / 2 + 0.12, context.placement.width / 2 - 0.12]) {
    doorBox({
      into: context.into,
      placement: context.placement,
      size: [0.18, 0.18, 0.18],
      offset: [sx, context.placement.height - 0.02, 0],
      colour: TIER_5_PALETTE.darkIron,
    })
  }
}

/** Builds static frame casing for any tier. */
export function dressTierDoorCasing(context: DoorDressContext, tier: 1 | 2 | 3 | 4 | 5): void {
  switch (tier) {
    case 1:
      dressTier1Door(context)
      break
    case 2:
      dressTier2Door(context)
      break
    case 3:
      dressTier3Door(context)
      break
    case 4:
      dressTier4Door(context)
      break
    case 5:
      dressTier5Door(context)
      break
  }
}
