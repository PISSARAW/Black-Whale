import type { ChrolloPage } from './chrolloBook'
import { fighterDefinition } from './roster'
import { HISTORICAL_CHROLLO_PAGES, historicalChrolloPage } from './chrolloHistoricalPages'
import { moveById } from './movesets'
import type { FighterId } from './types'

export function chrolloPageName(page: ChrolloPage | null, language: 'fr' | 'en'): string {
  if (!page) return language === 'fr' ? 'aucune' : 'none'
  if (historicalChrolloPage(page)) return HISTORICAL_CHROLLO_PAGES[page]
  const move = moveById(page)
  if (move) return language === 'fr' ? move.nameFr : move.nameEn
  if (page === 'biscuit:cookie') return 'Magical Esthetician · Cookie'
  const fighter = fighterDefinition(page.split(':')[0] as FighterId)
  return `${fighter.name} · ${language === 'fr' ? fighter.specialFr : fighter.specialEn}`
}
