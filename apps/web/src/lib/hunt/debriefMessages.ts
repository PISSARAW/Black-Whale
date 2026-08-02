const messages = {
  en: { title: 'Pursuit map', entered: 'entered' },
  fr: { title: 'Carte de la traque', entered: 'entre dans' },
}

export function debriefMessages(locale: string) {
  return locale === 'fr' ? messages.fr : messages.en
}
