import { bodyGyoZone } from './bodyGyo'
import { ZONE_NAMES } from './reading'
import type { ArcadeFighter } from '../types'
export function bodyGyoCopy(fighter: ArcadeFighter, language: 'fr' | 'en') {
  if (fighter.gyoLow && fighter.nen.gyo)
    return language === 'fr'
      ? {
          benefit: 'Gyo faible · observe les couches d’aura apparentes',
          risk: 'Ne révèle pas In · aucune lecture fine des zones adverses',
        }
      : {
          benefit: 'Low-output Gyo · observes visible aura layers',
          risk: 'Does not reveal In · no fine opponent zone reading',
        }
  const zone = bodyGyoZone(fighter)
  if (!zone) return null
  return language === 'fr'
    ? {
        benefit: `Gyo ciblé · ${ZONE_NAMES.fr[zone]} renforcé à 70 %`,
        risk: 'Autres zones à 10 % · lecture oculaire de In perdue',
      }
    : {
        benefit: `Focused Gyo · ${ZONE_NAMES.en[zone]} reinforced to 70%`,
        risk: 'Other zones at 10% · ocular reading of In lost',
      }
}
