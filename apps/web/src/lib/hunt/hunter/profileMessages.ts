import type { HunterProfileId } from './profiles'

const messages = {
  en: {
    choose: 'Choose the hunter',
    role: {
      methodical: 'Balanced patrol',
      aggressive: 'Frequent sweeps, costly searches',
      cautious: 'Patient and aura-efficient',
    },
  },
  fr: {
    choose: 'Choisissez le chasseur',
    role: {
      methodical: 'Patrouille équilibrée',
      aggressive: 'En fréquents, recherches coûteuses',
      cautious: 'Patient et économe en aura',
    },
  },
} satisfies Record<string, { choose: string; role: Record<HunterProfileId, string> }>

export function hunterProfileMessages(locale: string) {
  return locale === 'fr' ? messages.fr : messages.en
}
