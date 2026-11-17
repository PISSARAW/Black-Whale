import type { ArcadeFighter } from '../types'
import { enProfile } from './profiles'
const copy = {
  fr: {
    catalogue: 'Mention du catalogue sans scène qualifiée · En désactivé dans Clash',
    unknown: 'En non documenté ici · désactivé dans Clash',
    minimum: 'En observé ≥',
    maximum: 'maximum inconnu',
    game: 'jeu',
    units: 'u',
    documented: 'Usage documenté, portée inconnue',
    arcade: 'u arcade',
    unstable: ' · concentration fragile',
  },
  en: {
    catalogue: 'Catalogue mention without qualified scene · En unavailable in Clash',
    unknown: 'En not documented here · unavailable in Clash',
    minimum: 'En observed ≥',
    maximum: 'maximum unknown',
    game: 'game',
    units: 'u',
    documented: 'Documented use, range unknown',
    arcade: 'arcade units',
    unstable: ' · unstable concentration',
  },
}
export function enDescription(fighter: ArcadeFighter, language: 'fr' | 'en'): string {
  const profile = enProfile(fighter),
    text = copy[language]
  if (profile.evidence === 'catalogue-unmeasured') return text.catalogue
  if (profile.radiusUnits === null) return text.unknown
  if (profile.observedMinimumMetres !== undefined)
    return `${text.minimum} ${profile.observedMinimumMetres} m, ${text.maximum} · ${text.game} ${profile.radiusUnits} ${text.units}`
  return `${text.documented} · ${profile.radiusUnits} ${text.arcade}${profile.unstable ? text.unstable : ''}`
}
