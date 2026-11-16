import type { ChrolloPage } from './chrolloBook'
import { fighterDefinition } from './roster'

export function chrolloPageName(page: ChrolloPage | null, language: 'fr' | 'en'): string {
  if (!page) return language === 'fr' ? 'aucune' : 'none'
  if (page === 'sun-and-moon') return 'Sun and Moon'
  if (page === 'black-voice') return 'Black Voice'
  const fighter = fighterDefinition(page)
  return `${fighter.name} · ${language === 'fr' ? fighter.specialFr : fighter.specialEn}`
}
