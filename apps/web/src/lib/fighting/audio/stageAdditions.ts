import { SHIP_ROOM_STAGES, type ShipRoomStageId } from '../stageCatalogue'
import type { StageSoundProfile } from './stages'

type SoundFamily =
  'banquet-hall' | 'whale-hold' | 'screening-room' | 'supreme-court' | 'observation-deck'

const FAMILIES: Partial<Record<ShipRoomStageId, SoundFamily>> = {
  'cha-r-warehouse': 'whale-hold',
  'central-dining-hall': 'banquet-hall',
  'cineplex-concourse': 'screening-room',
  'cineplex-screen-corridor': 'screening-room',
  'cha-r-office': 'whale-hold',
  'police-atrium': 'supreme-court',
  'hangar-entrance': 'whale-hold',
  'hull-suspension': 'whale-hold',
  'exterior-main-deck': 'observation-deck',
  'starboard-lifeboats': 'observation-deck',
}

/** Each selected room keeps an acoustic identity; no missing mixer profile on launch. */
export function additionalStageSounds(
  base: Record<SoundFamily, StageSoundProfile>,
): Record<ShipRoomStageId, StageSoundProfile> {
  return Object.fromEntries(
    SHIP_ROOM_STAGES.map((stage) => {
      const family = FAMILIES[stage.id] ?? 'banquet-hall'
      const source = base[family]
      const salon = stage.id.endsWith('-salon') && stage.id !== 'royal-salon'
      return [
        stage.id,
        {
          ...source,
          identity: `${stage.nameFr} · ${source.identity}`,
          room: salon ? 0.8 : source.room,
          wet: salon ? 0.12 : source.wet,
        },
      ]
    }),
  ) as Record<ShipRoomStageId, StageSoundProfile>
}
