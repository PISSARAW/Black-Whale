import type { FighterId } from '../../src/lib/fighting/types'
import type { Segment } from './reel'

export type BuiltSegment = Segment & { id: string }

/** Everything that changes from one character presentation to the next. */
export interface HeroConfig {
  id: FighterId
  first: string
  last: string
  kicker: string
  build: () => BuiltSegment[]
}
