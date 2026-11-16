import { easterEggDefinition } from './easterEggCatalogue'
import type { ArcadeFighter } from './types'

/** These lines are authored for Clash; none is presented as a manga quotation. */
export function easterEggCaption(fighter: ArcadeFighter, language: 'fr' | 'en'): string {
  const egg = fighter.easterEgg
  if (!egg) return ''
  const t = egg.frame / egg.duration
  if (fighter.id === 'rihan' && egg.slot >= 3) return rihanCaption(egg, language)
  if (fighter.id === 'leorio' && egg.slot === 4 && t > 0.6)
    return language === 'fr' ? 'Tu attendais depuis longtemps ?' : 'Have you been waiting long?'
  return authoredCaption(fighter, language)
}

function authoredCaption(fighter: ArcadeFighter, language: 'fr' | 'en'): string {
  const egg = fighter.easterEgg!
  const definition = easterEggDefinition(fighter.id, egg.slot)
  if (!definition) return ''
  if (definition.ending && egg.frame / egg.duration > 0.55) return definition.ending[language]
  return definition.name[language]
}

function rihanCaption(egg: NonNullable<ArcadeFighter['easterEgg']>, language: 'fr' | 'en'): string {
  const t = egg.frame / egg.duration
  if (egg.slot === 4 && t > 0.55)
    return language === 'fr' ? 'Informations insuffisantes.' : 'Insufficient information.'
  const lines =
    language === 'fr'
      ? [
          'La posture…',
          'La posture… La distance…',
          'La posture… La distance… Mais si cette hésitation était volontaire ?',
        ]
      : [
          'The stance…',
          'The stance… The distance…',
          'The stance… The distance… But what if that hesitation was intentional?',
        ]
  return lines[Math.min(2, Math.floor(t * (egg.slot === 4 ? 6 : 3)))]
}
