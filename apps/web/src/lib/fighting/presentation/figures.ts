import type { buildFightFigure, fightFigureKey } from '../fighterFigure'
import type { ArcadeFighter, FightState, FightSide } from '../types'
import type { PresentationPreferences } from './collection'
import { wardrobePalette } from './wardrobe'
type Build = typeof buildFightFigure
/** Builders arrive from FightScene's dynamic import; this helper does not eagerly load rigs. */
export function presentedFigures(options: {
  build: Build
  key: typeof fightFigureKey
  resources: Pick<Parameters<Build>[0], 'THREE' | 'glow'>
  read: () => { state: FightState; viewer: FightSide; preferences: PresentationPreferences }
}) {
  function seat(fighter: ArcadeFighter): FightSide {
    return fighter === options.read().state.opponent ? 'opponent' : 'player'
  }
  const factory = {
    buildReference(fighter: ArcadeFighter) {
      return options.build({
        ...options.resources,
        fighter,
        observer: options.read().state[options.read().viewer],
      })
    },
    buildFighter(fighter: ArcadeFighter) {
      const { state, viewer, preferences } = options.read()
      return options.build({
        ...options.resources,
        fighter,
        observer: fighter === state[viewer] ? undefined : state[viewer],
        palette: wardrobePalette(fighter, preferences[seat(fighter)]),
      })
    },
    nenKey(fighter: ArcadeFighter) {
      const { state, viewer, preferences } = options.read()
      return (
        options.key(fighter) +
        String(state[viewer].nen.gyo) +
        wardrobePalette(fighter, preferences[seat(fighter)])
      )
    },
  }
  const { state } = options.read()
  const mounted = (fighter: ArcadeFighter) => ({
    model: factory.buildFighter(fighter),
    nen: factory.nenKey(fighter),
  })
  return {
    ...factory,
    models: { player: mounted(state.player), opponent: mounted(state.opponent) },
  }
}
