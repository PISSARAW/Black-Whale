import type { DeviceHand } from './deviceHands'
import type { FightSide } from './types'

/** These are Shalnark's original, paired objects, not objects conjured by an acquired page. */
export interface BlackVoicePiece {
  id: string
  pairId: string
  part: 'phone' | 'antenna'
  hand?: DeviceHand
}
export interface BlackVoiceGear {
  phone?: BlackVoicePiece
  antennas: readonly BlackVoicePiece[]
  armed?: BlackVoicePiece
}
export type BlackVoiceOrder = 'stay' | 'retreat' | 'approach' | 'attack'
export interface BlackVoiceControl {
  owner: FightSide
  ownerMember: number
  antenna: BlackVoicePiece
  order: BlackVoiceOrder
  active: boolean
}
declare module './types' {
  interface ArcadeFighter {
    blackVoiceGear?: BlackVoiceGear
    blackVoiceControl?: BlackVoiceControl
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    blackVoiceProp?: BlackVoicePiece['part']
    blackVoicePiece?: BlackVoicePiece
    blackVoiceControl?: BlackVoiceControl
  }
}

export function createBlackVoiceGear(side: FightSide): BlackVoiceGear {
  const pairId = `${side}:black-voice:phone`
  return {
    phone: { id: pairId, pairId, part: 'phone' },
    antennas: [0, 1].map((index) => ({
      id: `${side}:black-voice:antenna:${index}`,
      pairId,
      part: 'antenna',
    })),
  }
}

export function restingBlackVoiceGear(gear?: BlackVoiceGear): BlackVoiceGear | undefined {
  if (!gear) return undefined
  return {
    phone: gear.phone ? { ...gear.phone, hand: undefined } : undefined,
    antennas: [...gear.antennas, ...(gear.armed ? [gear.armed] : [])].map((piece) => ({
      ...piece,
      hand: undefined,
    })),
  }
}
