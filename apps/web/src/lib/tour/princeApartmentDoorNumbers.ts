import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { AnimatedDoorLeaf } from './doorAnimator'
import { TIER_1_PALETTE, type DoorPlacement } from './doorDetailSurface'
import type { Doorway } from './types'

const FRONT_CORRIDOR = /^tier-1-princes-front-corridor-(port|starboard)$/
const APPROACH = /^tier-1-royal-residential-approach-10(0[1-9]|1[0-4])$/

const SEGMENTS: Readonly<Record<string, readonly number[]>> = {
  '0': [0, 1, 2, 3, 4, 5],
  '1': [1, 2],
  '2': [0, 1, 3, 4, 6],
  '3': [0, 1, 2, 3, 6],
  '4': [1, 2, 5, 6],
  '5': [0, 2, 3, 5, 6],
  '6': [0, 2, 3, 4, 5, 6],
  '7': [0, 1, 2],
  '8': [0, 1, 2, 3, 4, 5, 6],
  '9': [0, 1, 2, 3, 5, 6],
}

const SEGMENT_BOXES = [
  [0, 0.11, 0.11, 0.024],
  [0.055, 0.055, 0.024, 0.09],
  [0.055, -0.055, 0.024, 0.09],
  [0, -0.11, 0.11, 0.024],
  [-0.055, -0.055, 0.024, 0.09],
  [-0.055, 0.055, 0.024, 0.09],
  [0, 0, 0.11, 0.024],
] as const

export function princeApartmentDoorNumber(door: Doorway): number | null {
  const approach = APPROACH.test(door.a) ? door.a : APPROACH.test(door.b) ? door.b : null
  const corridor = approach === door.a ? door.b : door.a
  if (!approach || !FRONT_CORRIDOR.test(corridor)) return null
  const match = approach.match(APPROACH)
  return match ? Number(match[1]) : null
}

interface BadgeOptions {
  THREE: typeof Three
  leaf: AnimatedDoorLeaf
  placement: DoorPlacement
  number: number
}

function digitOffset(index: number, count: number): number {
  return (index - (count - 1) / 2) * 0.17
}

/** Adds a two-sided embossed brass number that follows the animated door leaf. */
export function dressPrinceApartmentDoorNumber(options: BadgeOptions): void {
  const { THREE, leaf, placement, number } = options
  const digits = String(number).split('')
  const leafWidth = Math.min(1.1, placement.width - 0.12)
  const centerX = leafWidth / 2
  const centerY = Math.min(placement.height - 0.4, placement.height * 0.72)
  const badgeWidth = digits.length === 1 ? 0.34 : 0.48
  const into = new BanquetDetailBuilder(THREE)

  into.box([badgeWidth, 0.38, 0.045], {
    at: [centerX, centerY, 0],
    colour: TIER_1_PALETTE.darkWood,
  })
  into.box([badgeWidth - 0.035, 0.345, 0.052], {
    at: [centerX, centerY, 0],
    colour: TIER_1_PALETTE.brass,
  })

  for (const face of [-1, 1]) {
    for (let digitIndex = 0; digitIndex < digits.length; digitIndex++) {
      const offset = digitOffset(digitIndex, digits.length)
      for (const segment of SEGMENTS[digits[digitIndex]]) {
        const [x, y, width, height] = SEGMENT_BOXES[segment]
        into.box([width, height, 0.018], {
          at: [centerX + (offset + x) * face, centerY + y, face * 0.034],
          colour: TIER_1_PALETTE.ivory,
        })
      }
    }
  }

  leaf.hingeGroup.add(into.finish(`prince-apartment-door-number-${number}`))
}
