import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { AnimatedDoorLeaf } from './doorAnimator'
import type { DoorDressContext } from './doorDetailSurface'
import type { LeafBuildOptions } from './doorTierBuilders'
import type { TourDetailTag } from './detailTag'
import { ROYAL_ARMY_LOCAL_SECTION, SOLDIERS_QUARTERS } from './royalArmyRoomsStyle'

export const isRoyalArmyRoom = (spaceId: string): boolean =>
  spaceId.startsWith(SOLDIERS_QUARTERS) || spaceId === ROYAL_ARMY_LOCAL_SECTION

const tagFor = (spaceId: string): TourDetailTag => ({
  id: `${spaceId}-plain-door`,
  spaceId,
  name: 'Reconstructed plain doorway',
  nameFr: 'Porte simple reconstituée',
  provenance: 'inferred',
  reconstructionRole: 'functional-reconstruction',
  source:
    'Plain door, frame and handle reconstructed for access; no room interior panel establishes their profile or finish.',
  sourceFr:
    'Porte, cadre et poignée simples reconstitués pour l’accès ; aucune case intérieure ne fixe leur profil ni leur finition.',
})

export function dressRoyalArmyDoorCasing({ into, door, placement }: DoorDressContext): void {
  const { width, height, center, floor, angle } = placement
  const tag = tagFor(door.a)
  for (const offset of [-width / 2, width / 2]) {
    into.box([0.1, height, 0.14], {
      at: [
        center[0] + offset * Math.cos(angle),
        floor + height / 2,
        center[1] + offset * Math.sin(angle),
      ],
      rotation: [0, -angle, 0],
      colour: 0x92978f,
      tag,
    })
  }
  into.box([width + 0.1, 0.1, 0.14], {
    at: [center[0], floor + height + 0.05, center[1]],
    rotation: [0, -angle, 0],
    colour: 0x92978f,
    tag,
  })
}

export function buildRoyalArmyDoorLeaves(
  options: Omit<LeafBuildOptions, 'tier'> & { spaceId: string },
): AnimatedDoorLeaf[] {
  const { THREE, placement, spaceId } = options
  const { width, height, center, floor, angle, openSign } = placement
  const sides = width >= 2.2 ? ([-1, 1] as const) : ([-1] as const)
  return sides.map((side) => {
    const leafWidth = width / sides.length - 0.08
    const direction = -side
    const into = new BanquetDetailBuilder(THREE)
    const tag = tagFor(spaceId)
    into.box([leafWidth, height - 0.04, 0.06], {
      at: [(direction * leafWidth) / 2, height / 2, 0],
      colour: 0xaeb2a7,
      tag,
    })
    into.box([0.05, 0.16, 0.09], {
      at: [direction * (leafWidth - 0.08), 1, 0],
      colour: 0x727972,
      tag,
    })
    const hingeGroup = new THREE.Group()
    const offset = side * (width / 2 - 0.04)
    hingeGroup.position.set(
      center[0] + offset * Math.cos(angle),
      floor,
      center[1] + offset * Math.sin(angle),
    )
    hingeGroup.rotation.y = -angle
    hingeGroup.add(into.finish('royal-army-plain-door'))
    return { hingeGroup, baseRotationY: -angle, maxSwing: side * openSign * 1.4 }
  })
}
