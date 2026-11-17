import type { FightNenTactic } from './nen'

const COPY = {
  fr: {
    en: {
      benefit: 'Localise les contacts proches, sans analyser le Hatsu',
      risk: 'Drain élevé · défense dispersée · concentration requise',
    },
    shu: {
      benefit: 'Renforce l’objet porté ou lancé',
      risk: 'Aura engagée sur l’objet · corps moins protégé',
    },
    in: {
      benefit: 'Cache l’aura et les constructions de Nen',
      risk: 'Gyo révèle · En détecte · ne cache pas le corps',
    },
  },
  en: {
    en: {
      benefit: 'Locates nearby contacts without identifying the Hatsu',
      risk: 'Heavy drain · spread defence · requires concentration',
    },
    shu: {
      benefit: 'Reinforces a held or thrown object',
      risk: 'Aura committed to the object · thinner body defence',
    },
    in: {
      benefit: 'Conceals aura and Nen constructs',
      risk: 'Gyo reveals · En senses · body remains visible',
    },
  },
}

export function advancedNenCopy(technique: FightNenTactic, language: 'fr' | 'en') {
  return technique === 'en' || technique === 'shu' || technique === 'in'
    ? COPY[language][technique]
    : null
}
