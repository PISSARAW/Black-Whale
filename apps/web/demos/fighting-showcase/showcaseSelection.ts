import { createCatsShowcase } from './catsChoreography'
import { createShowcase } from './choreography'
import { createContinuousShowcase } from './continuousChoreography'
import { createMangaShowcase } from './mangaChoreography'
import { createBallroomShowcase } from './ballroomChoreography'
import { createLongBallroomShowcase } from './longBallroomChoreography'
import { createSolarShowcase } from './solarChoreography'
import { createJudgmentShowcase } from './judgmentChoreography'

export function selectShowcase(search: string) {
  const query = new URLSearchParams(search)
  const flags = {
    continuous: query.has('continuous'),
    cinematic: query.has('cinematic'),
    solar: query.has('solar'),
    ballroom: query.has('ballroom'),
    longForm: query.has('long'),
    judgment: query.has('judgment'),
    cats: query.has('cats'),
  }
  const film = flags.cats
    ? createCatsShowcase()
    : flags.judgment
      ? createJudgmentShowcase()
      : flags.solar
        ? createSolarShowcase()
        : flags.longForm
          ? createLongBallroomShowcase()
          : flags.ballroom
            ? createBallroomShowcase()
            : query.has('manga')
              ? createMangaShowcase()
              : flags.continuous
                ? createContinuousShowcase()
                : createShowcase()
  return { ...flags, film }
}
