import type { DowsingReading } from './dowsingTypes'
export function dowsingIndication(reading: DowsingReading, language: 'fr' | 'en'): string {
  if (reading.inconclusive)
    return language === 'fr'
      ? 'Résultat indéterminé : cette parole libre n’a pas d’intention représentée dans la simulation.'
      : 'Inconclusive: this free statement has no represented intent in the simulation.'
  if (reading.swings)
    return language === 'fr'
      ? 'Le pendule oscille : mensonge conscient.'
      : 'The pendulum swings: a knowing lie.'
  return language === 'fr'
    ? 'Pas d’oscillation : aucun mensonge conscient détecté.'
    : 'No swing: no knowing lie detected.'
}
