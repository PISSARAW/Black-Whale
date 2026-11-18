import { performMapDowsing } from './dowsingMap'
import { ownsDowsing } from './dowsingRules'
import { fighterDefinition } from './roster'
import { knownMapSubjects } from './dowsingMapBody'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function dowsingMapOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsDowsing(state[side])) return []
  const choices: ArsenalOption[] = knownMapSubjects(state[side]).map((known) => ({
    command: { action: 'dowsing-locate', target: known.bodyKey },
    labelFr: `Dowsing · Rechercher ${fighterDefinition(known.appearance).name} sur le plan`,
    labelEn: `Dowsing · Find ${fighterDefinition(known.appearance).name} on the map`,
    ready: performMapDowsing(state, side, known.bodyKey) !== state,
    conditionFr:
      'Plan physique lisible et accessible, main droite libre, sujet identifié et concentration. Lecture ponctuelle du corps recherché ; aucun accès à ses pensées. Emperor Time n’est pas requis pour cette recherche.',
    conditionEn:
      'A readable accessible physical map, free right hand, identified subject and focus. A single reading of the sought body; no access to thoughts. This search does not require Emperor Time.',
  }))
  if (state[side].dowsingMapSearch)
    choices.push({
      command: { action: 'dowsing-stop' },
      labelFr: 'Dowsing · Interrompre la recherche sur le plan',
      labelEn: 'Dowsing · Stop searching the map',
      ready: true,
      conditionFr: 'Interrompt la concentration ; la dernière lecture reste un souvenir daté.',
      conditionEn: 'Ends concentration; the last reading remains a dated memory.',
    })
  return choices
}
