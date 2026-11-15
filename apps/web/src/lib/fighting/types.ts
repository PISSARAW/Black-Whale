export type FighterId =
  | 'kurapika'
  | 'hisoka'
  | 'chrollo'
  | 'morena'
  | 'benjamin'
  | 'tserriednich'

export type FighterPose =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'guard'
  | 'light'
  | 'heavy'
  | 'special'
  | 'hit'
  | 'ko'

export type AttackKind = 'light' | 'heavy' | 'special'
export type FightSide = 'player' | 'opponent'
export type FightPhase = 'ready' | 'fighting' | 'finished'

export interface FighterDefinition {
  id: FighterId
  /** Catalogue identity consumed by the shared TourScene character rig. */
  modelId: string
  modelRole: 'fighter' | 'hunter' | 'morena'
  name: string
  titleFr: string
  titleEn: string
  specialFr: string
  specialEn: string
  colour: string
  accent: string
  power: number
  speed: number
  reach: number
  specialRange: number
}

export interface ArcadeFighter {
  id: FighterId
  x: number
  y: number
  velocityY: number
  health: number
  aura: number
  facing: -1 | 1
  pose: FighterPose
  poseTime: number
  cooldown: number
  hitStun: number
  blocking: boolean
}

export interface FightInput {
  left: boolean
  right: boolean
  jump: boolean
  block: boolean
}

export interface FightImpact {
  sequence: number
  attacker: FightSide
  kind: AttackKind
  damage: number
  blocked: boolean
}

export interface FightState {
  player: ArcadeFighter
  opponent: ArcadeFighter
  phase: FightPhase
  time: number
  winner: FightSide | 'draw' | null
  impact: FightImpact | null
}

export const EMPTY_INPUT: FightInput = {
  left: false,
  right: false,
  jump: false,
  block: false,
}
