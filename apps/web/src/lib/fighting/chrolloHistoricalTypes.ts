import type { FightSide, FighterId } from './types'

export interface ChrolloHistoricalState {
  galleryFocus?: import('./gallerySense').GalleryFocus
  galleryReading?: import('./gallerySense').GalleryReading
  aiPlan?: { page: string; startedAt: number }
  aiLastUse?: number
  touch?: {
    command: import('./retrospectiveTypes').ArsenalCommand
    frames: number
    health: number
    page: import('./chrolloBook').ChrolloPage
  }
  fish?: { roomId: string; target: FightSide; wounds: number; frames: number }
  cloth?: { target: string }
  phone?: {
    target: FightSide | null
    calls: number
    dayFrame: number
    number: string
    criterion?: string
    guidance?: { kind: 'absent' | 'nearby' | 'located'; x?: number; y?: number }
  }
  appearance?: { owner: FightSide; model: FighterId }
}
export interface HistoricalCopy {
  /** Physical likeness only; a copied non-fighter never inherits her aura nodes or Dolphin. */
  appearanceModel?: 'queen-oito'
  originalMember?: number
  originalKind?: import('./preparationTypes').PreparedEntityKind
  inertDeviceForm?: import('./deviceTypes').BiohazardDeviceForm
  owner: FightSide
  originalId: string
  createdAt: number
  appearance?: FighterId
  headAttached: boolean
  headHealth?: number
  order?: 'attack' | 'wait'
  target?: FightSide
  cooldown?: number
}
