import type { FightSide, FightState } from './types'
import { biohazardDeviceHidden } from './biohazardPrivacy'

/** Optical recordings are accessible at their real camera; intent metadata never leaves the server. */
export function redactPriorityWorld(view: FightState, side: FightSide): void {
  const observer = view[side]
  const other = side === 'player' ? 'opponent' : 'player'
  view[other].biohazardDevices = view[other].biohazardDevices?.filter(
    (item) => !biohazardDeviceHidden(view, item),
  )
  for (const camera of view.battlefield?.entities ?? []) {
    if (camera.kind !== 'camera') continue
    const nearby = Math.hypot(camera.x - observer.x, camera.y - observer.y) <= 6
    camera.statements = nearby
      ? camera.statements?.map((entry) => ({
          ...entry,
          subject: entry.appearance,
          consciousLie: undefined,
        }))
      : undefined
  }
  if (observer.dowsingAcquaintances)
    observer.dowsingAcquaintances = observer.dowsingAcquaintances.map((entry) => ({
      ...entry,
      subject: entry.appearance,
    }))
}
