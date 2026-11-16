import type { FightState } from './types'
import type { HumanPose } from '../tour/humanAnimation'

export type BackgroundMotif =
  | 'whale'
  | 'hunter'
  | 'crown'
  | 'coins'
  | 'twins'
  | 'reel'
  | 'scales'
  | 'stars'
  | 'spider'
  | 'tea'
  | 'cargo'
  | 'menu'
  | 'cards'
  | 'fish'
  | 'badge'
  | 'bird'
  | 'spring'
  | 'compass'
  | 'lifeboat'
  | 'medal'
  | 'cat'
  | 'eye'
  | 'flask'
  | 'music'
  | 'feather'
  | 'moon'
  | 'flower'
  | 'dragon'
  | 'cradle'

export interface BackgroundSpectator {
  identity: string
  name: string
  pose: HumanPose
  reaction: 'cheer' | 'nod' | 'quiet' | 'cradle'
}
export interface StageBackgroundDefinition {
  spectators: readonly BackgroundSpectator[]
  image: {
    motif: BackgroundMotif
    headline: string
    subline: string
    code: string
    caption: { fr: string; en: string }
  }
  secret: {
    motif:
      'boat' | 'spider' | 'card' | 'cat' | 'reel' | 'spring' | 'toy' | 'feather' | 'coin' | 'cup'
    caption: { fr: string; en: string }
  }
}
export interface StageBackgroundContext {
  /** Read-only presentation context; spectators never become simulation entities. */
  fight?: () => FightState
  reducedMotion?: boolean
}

type SpectatorSeed = readonly [
  identity: string,
  name: string,
  pose?: HumanPose,
  reaction?: BackgroundSpectator['reaction'],
]
interface BackgroundSeed {
  cast: readonly SpectatorSeed[]
  image: readonly [motif: BackgroundMotif, headline: string, subline: string, code: string]
  description: readonly [fr: string, en: string]
  secret: readonly [motif: StageBackgroundDefinition['secret']['motif'], fr: string, en: string]
}
export function background(seed: BackgroundSeed): StageBackgroundDefinition {
  return {
    spectators: seed.cast.map(([identity, name, pose = 'idle', reaction = 'nod']) => ({
      identity,
      name,
      pose,
      reaction,
    })),
    image: {
      motif: seed.image[0],
      headline: seed.image[1],
      subline: seed.image[2],
      code: seed.image[3],
      caption: { fr: seed.description[0], en: seed.description[1] },
    },
    secret: { motif: seed.secret[0], caption: { fr: seed.secret[1], en: seed.secret[2] } },
  }
}
