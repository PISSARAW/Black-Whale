import type { FightBattlefield } from './preparationTypes'

/** A real camera is not a remote monitor. Media is disclosed only by an actual playback command. */
export function concealDeviceMedia(field?: FightBattlefield): void {
  for (const entry of field?.entities ?? []) {
    if (entry.device?.kind !== 'camera') continue
    entry.device = { ...entry.device, pictures: undefined, words: undefined }
  }
}
