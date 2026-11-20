import { scenarioDevices } from './physicalDevices'
import { hinrighKitFor, type HinrighKitItem } from './hinrighKit'
import type { PhysicalDeviceKind } from './deviceTypes'
import type { FightPreparation, PreparedEntity } from './preparationTypes'

const DEVICE_KINDS: Record<HinrighKitItem, readonly PhysicalDeviceKind[]> = {
  handcuffs: [],
  camera: ['camera'],
  firearm: ['firearm'],
  transmitter: ['transmitter', 'receiver'],
}

/** The packed devices replace the generic scenario devices of that side. */
export function installHinrighKits(
  entities: PreparedEntity[],
  preparation: FightPreparation,
): PreparedEntity[] {
  let installed = entities
  for (const side of ['player', 'opponent'] as const) {
    const kit = hinrighKitFor(preparation, side)
    if (!kit) continue
    const kinds = new Set(kit.flatMap((item) => DEVICE_KINDS[item]))
    installed = [
      ...installed.filter((entry) => !(entry.kind === 'device' && entry.owner === side)),
      ...scenarioDevices(side).filter((entry) => kinds.has(entry.device!.kind)),
    ]
  }
  return installed
}
