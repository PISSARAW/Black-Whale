import type { FightNenTactic } from './nen'

const COPY = {
  fr: {
    en: {
      benefit: 'Détecte les contacts proches, même sous In ou Zetsu',
      risk: 'Drain élevé · défense dispersée · cesse à l’attaque',
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
      benefit: 'Senses nearby contacts, including In and Zetsu',
      risk: 'Heavy drain · spread defence · ends on attack',
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
