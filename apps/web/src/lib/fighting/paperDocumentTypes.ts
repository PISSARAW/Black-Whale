import type { GumSource } from './bungeeSource'
import type { DeviceHand } from './deviceHands'
import type { FightSide } from './types'

export const DOCUMENT_TEXT_LENGTH = 240
export interface PaperBodyRef {
  owner: FightSide
  member: number
}
export interface PaperTexture extends GumSource {
  id: string
  owner: PaperBodyRef
  text: string
}
export interface PaperDocument {
  /** Actual ink; an appearance never rewrites it or any Nen contract. */
  text: string
  holder?: PaperBodyRef & { hand: DeviceHand }
  outward?: boolean
  sheetCopyId?: string
  textures?: readonly PaperTexture[]
  /** Rendered text in a private view, without disclosing covered ink or foreign layers. */
  appearanceText?: string
  velocityY?: number
}
declare module './preparationTypes' {
  interface PreparedEntity {
    document?: PaperDocument
  }
}
declare module './types' {
  interface ArcadeFighter {
    texturePaperId?: string
    texturePaperDraft?: string
    paperTextureGeneration?: number
    documentReading?: {
      id: string
      text: string
      frame: number
      round: number
      arenaMap?: import('./arenaMap').ArenaMap
    }
  }
}
