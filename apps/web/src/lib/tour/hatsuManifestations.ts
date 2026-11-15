import type { Apparition, ApparitionKind, Footing } from './apparitions'
import { ceilingOf, floorOf, type Ship } from './blueprint'
import type { TourWorld } from './hatsu'
import { solidNow, wanderOffset } from './hatsu'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { Structure } from './types'

type Model = {
  id: string
  kind: ApparitionKind
  size: number
  height: number
  carried?: boolean
  stage?: number
}
const HELD_MODELS: Partial<Record<HatsuInteractionKind, Model>> = {
  restoration: { id: 'cookie', kind: 'cookie', size: 1, height: 0 },
  future: { id: 'tserriednich-second', kind: 'tserriednich-second', size: 0.75, height: 0 },
  puppet: { id: 'black-voice-phone', kind: 'phone', size: 0.18, height: 1, carried: true },
  divination: { id: 'love-dial', kind: 'phone', size: 0.18, height: 1, carried: true, stage: 1 },
  staff: { id: 'priest-staff', kind: 'staff', size: 0.7, height: 1.1, carried: true },
  pocket: { id: 'fun-fun-cloth', kind: 'cloth', size: 0.5, height: 1, carried: true },
}

function hasDolphin(world: TourWorld): boolean {
  return (
    world.holding === 'ability-loan' &&
    Boolean(world.book.loan || world.book.stolenFrom || world.book.pages.length)
  )
}
function hasShownPredator(world: TourWorld): boolean {
  return world.holding === 'predator' && world.body.deduced.some((id) => id.startsWith('smoke:'))
}
function visitorModels(world: TourWorld): Model[] {
  const held = world.holding ? HELD_MODELS[world.holding] : null
  return [
    ...(held ? [held] : []),
    ...(hasDolphin(world)
      ? [{ id: 'dolphin', kind: 'dolphin' as const, size: 0.45, height: 1.3, carried: true }]
      : []),
    ...(world.body.packed !== null
      ? [{ id: 'pain-packer', kind: 'pain-armour' as const, size: 1, height: 1.6, carried: true }]
      : []),
    // Predator varies with its target. Only its shown Salé-salé counter is known.
    ...(hasShownPredator(world)
      ? [{ id: 'predator-salesale', kind: 'predator-salesale' as const, size: 0.8, height: 1.4 }]
      : []),
  ]
}
function visitorManifestations(ship: Ship, world: TourWorld, visitor?: Footing): Apparition[] {
  const roomId = visitor?.spaceId ?? world.cameFrom
  const room = roomId ? ship.spaces.get(roomId) : null
  const plan = room ? ship.plans.get(room.tierId) : null
  if (!visitor || !room || !plan) return []
  return visitorModels(world).map(({ height, ...model }) => ({
    ...model,
    stage: model.stage ?? 0,
    spaceId: room.id,
    tierId: visitor.tierId,
    at: [visitor.at[0] + 1.2, visitor.at[1] + 1.2],
    y: floorOf(room, plan.tier) + height,
    colour: 0xd4cec6,
    hidden: false,
  }))
}
function hanzoBody(ship: Ship, world: TourWorld): Apparition[] {
  if (!world.body.projected) return []
  const origin = ship.spaces.get(world.body.projected.spaceId)
  const plan = origin ? ship.plans.get(origin.tierId) : null
  if (!origin || !plan) return []
  return [
    {
      id: 'hanzo-sleeping-body',
      kind: 'avatar',
      spaceId: origin.id,
      tierId: origin.tierId,
      at: world.body.projected.at,
      y: floorOf(origin, plan.tier),
      size: 0.42,
      stage: 0,
      colour: 0x222222,
      hidden: false,
      human: { role: 'hunter', identity: 'hanzo', pose: 'fallen', aura: 'none' },
    },
  ]
}
function bloodSnakes(ship: Ship, world: TourWorld): Apparition[] {
  const found: Apparition[] = []
  for (const spaceId of world.snakes?.rooms ?? []) {
    const space = ship.spaces.get(spaceId),
      plan = space ? ship.plans.get(space.tierId) : null
    if (!space || !plan) continue
    const at = world.landed[spaceId] ?? space.footprint[0]
    for (let i = 0; i < 4; i++)
      found.push({
        id: `blood-snake:${spaceId}:${i}`,
        kind: 'blood-snake',
        spaceId,
        tierId: space.tierId,
        at: [at[0] + Math.cos((i * Math.PI) / 2) * 0.3, at[1] + Math.sin((i * Math.PI) / 2) * 0.3],
        y: floorOf(space, plan.tier),
        size: 0.45,
        stage: i,
        colour: 0xeee9dd,
        hidden: false,
      })
  }
  return found
}
function isAttestedHybrid(structure: Structure, world: TourWorld): boolean {
  const hold = world.solids[structure.id]
  return Boolean(
    hold?.alive && !hold.gone && !hold.pocketed && ['camera', 'manacle'].includes(structure.kind),
  )
}
function biohazard(ship: Ship, world: TourWorld, seconds: number): Apparition[] {
  const found: Apparition[] = []
  for (const structure of [...ship.structures, ...world.copies].filter((one) =>
    isAttestedHybrid(one, world),
  )) {
    const hold = world.solids[structure.id]
    const space = ship.spaces.get(hold.spaceId ?? structure.spaceId),
      plan = space ? ship.plans.get(space.tierId) : null
    if (!space || !plan || world.emptied.includes(space.id)) continue
    const now = solidNow(structure, hold),
      drift = wanderOffset(structure.id, seconds)
    found.push({
      id: `biohazard:${structure.id}`,
      kind: 'animal-object',
      spaceId: space.id,
      tierId: space.tierId,
      at: [now.at[0] + drift[0], now.at[1] + drift[1]],
      y: floorOf(space, plan.tier) + Math.min(now.base, ceilingOf(space, plan.tier) - 0.5),
      size: 0.45,
      stage: structure.kind === 'camera' ? 0 : 1,
      colour: 0xd4cec6,
      hidden: false,
      objectShape: { size: now.size, height: now.height, kind: structure.kind },
    })
  }
  return found
}

/** Presentation only: no cast, state transition or invented counter-creature. */
export function hatsuManifestations(
  ship: Ship,
  world: TourWorld,
  { visitor, seconds = 0 }: { visitor?: Footing; seconds?: number } = {},
): Apparition[] {
  return [
    ...visitorManifestations(ship, world, visitor),
    ...hanzoBody(ship, world),
    ...bloodSnakes(ship, world),
    ...biohazard(ship, world, seconds),
  ]
}
