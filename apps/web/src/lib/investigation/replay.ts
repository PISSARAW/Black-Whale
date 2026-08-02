export type ReplayStage = 'warning' | 'diversion' | 'attack' | 'draining' | 'death'

export interface ReplayFrame {
  second: number
  stage: ReplayStage
  title: string
  description: string
  activeSubjectIds: string[]
  snakes: number
  bloodLevel: number
}

export function frameAt(second: number): ReplayFrame {
  const time = Math.max(0, Math.min(11, Math.round(second)))
  if (time === 0) {
    return {
      second: time,
      stage: 'warning',
      title: 'La poupée apparaît',
      description: 'Loberry seule voit la figure masquée derrière Furykov.',
      activeSubjectIds: ['loberry', 'furykov'],
      snakes: 0,
      bloodLevel: 100,
    }
  }
  if (time === 1) {
    return {
      second: time,
      stage: 'diversion',
      title: 'Tous les regards dévient',
      description: 'Loberry crie et désigne une présence que personne d’autre ne peut trouver.',
      activeSubjectIds: ['loberry'],
      snakes: 0,
      bloodLevel: 100,
    }
  }
  if (time === 2) {
    return {
      second: time,
      stage: 'attack',
      title: 'Quatre créatures frappent',
      description: 'Les tsuchibokko matérialisés se fixent au cou de Barrigen.',
      activeSubjectIds: ['body'],
      snakes: 4,
      bloodLevel: 92,
    }
  }
  if (time < 11) {
    return {
      second: time,
      stage: 'draining',
      title: 'Drainage simultané',
      description: 'Les gardes voient les créatures et tentent de les arracher; le temps manque.',
      activeSubjectIds: ['body', 'bill', 'sakata'],
      snakes: 4,
      bloodLevel: Math.max(8, 100 - time * 9),
    }
  }
  return {
    second: time,
    stage: 'death',
    title: 'Barrigen est mort',
    description: 'Les quatre créatures ont réduit quarante-quatre secondes à environ onze.',
    activeSubjectIds: ['body'],
    snakes: 0,
    bloodLevel: 0,
  }
}
