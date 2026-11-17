import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FighterId } from './types'

export interface LittleEyeControl {
  facing: -1 | 1
  destinationX?: number
}
export interface LittleEyeShot {
  id: string
  owner: FightSide
  member: number
  x: number
  y: number
  velocityX: number
  velocityY: number
  age: number
}
export interface LittleEyeScreen {
  animal: string
  frame: number
  x: number
  y: number
  pictures: readonly {
    appearance: FighterId
    x: number
    y: number
    auraVisible: boolean
    projection?: boolean
  }[]
  words: readonly { frame: number; text: string }[]
}
declare module './preparationTypes' {
  interface PreparedEntity {
    /** Explicit physical size; neither a copied object nor a Nen animal is eligible. */
    animalSize?: 'insect' | 'mouse' | 'hamster' | 'larger'
    littleEye?: LittleEyeControl
  }
  interface FightBattlefield {
    littleEyeShots?: readonly LittleEyeShot[]
  }
}
declare module './types' {
  interface ArcadeFighter {
    littleEyeScreen?: LittleEyeScreen
  }
}
export function littleEyeTarget(entry: PreparedEntity): boolean {
  return Boolean(
    (entry.kind === 'animal' || entry.kind === 'bird') &&
    entry.present &&
    entry.health > 0 &&
    !entry.controller &&
    !entry.copy &&
    entry.material === 'real' &&
    entry.animalSize &&
    entry.animalSize !== 'larger',
  )
}
