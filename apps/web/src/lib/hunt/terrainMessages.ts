const messages = {
  en: { choose: 'Choose the terrain' },
  fr: { choose: 'Choisissez le terrain' },
}

export function terrainMessages(locale: string) {
  return locale === 'fr' ? messages.fr : messages.en
}
