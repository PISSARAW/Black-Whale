const messages = {
  en: {
    title: 'Pursuit map',
    entered: 'entered',
    summary: {
      title: 'What shaped the outcome',
      metrics: 'Reading',
      rooms: 'Rooms',
      zetsu: 'Zetsu',
      hatsu: 'Hatsu',
      falseTrails: 'False trails',
      insight: {
        prepared: 'Placed aura carried preparation into the encounter.',
        informed: 'En and Hatsu reduced uncertainty before contact.',
        misdirected: 'The hunter lost time following a false trail.',
        conserved: 'You entered the ending with a relative aura advantage.',
        unprepared: 'Contact happened without a Hatsu reading or placed aura.',
      },
    },
  },
  fr: {
    title: 'Carte de la traque',
    entered: 'entre dans',
    summary: {
      title: "Ce qui a façonné l'issue",
      metrics: 'Lecture',
      rooms: 'Pièces',
      zetsu: 'Zetsu',
      hatsu: 'Hatsu',
      falseTrails: 'Fausses pistes',
      insight: {
        prepared: "L'aura placée a prolongé la préparation jusque dans la rencontre.",
        informed: "En et le Hatsu ont réduit l'incertitude avant le contact.",
        misdirected: 'Le chasseur a perdu du temps sur une fausse piste.',
        conserved: "Vous avez atteint l'issue avec un avantage relatif d'aura.",
        unprepared: 'Le contact a eu lieu sans lecture Hatsu ni aura placée.',
      },
    },
  },
}

export function debriefMessages(locale: string) {
  return locale === 'fr' ? messages.fr : messages.en
}
