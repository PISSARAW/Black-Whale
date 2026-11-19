import type { FortuneIdentity, FortuneMonth } from './ghostwriterTypes'

/** A wholly fictional participant, explicitly outside manga biographies. */
export const FORTUNE_PARTICIPANT: FortuneIdentity = {
  subject: { kind: 'person', id: 'scenario:fortune-participant' },
  name: 'Naël Deren',
  dateOfBirth: '1986-04-12',
  bloodType: 'A',
}

/** Authored monthly itinerary for this scenario, not a prediction of arbitrary duel outcomes. */
export const FORTUNE_SCENARIO_MONTH: FortuneMonth = {
  id: 'scenario:four-week-month',
  identity: FORTUNE_PARTICIPANT,
  subject: FORTUNE_PARTICIPANT.subject,
  weeks: [
    {
      week: 1,
      eventId: 'register-at-the-dock',
      quatrain: [
        'Au seuil du quai, le sceau attend.',
        'Un nom rejoint la pierre claire.',
        'Le vent emporte un vieux ruban.',
        'La porte garde sa lumière.',
      ].join('\n'),
    },
    {
      week: 2,
      eventId: 'collect-a-letter',
      quatrain: [
        'Une lettre attend dans une salle.',
        'Le pas s’arrête avant le soir.',
        'Un pli quitte la main loyale.',
        'La rive ouvre un autre espoir.',
      ].join('\n'),
    },
    {
      week: 3,
      eventId: 'meet-the-courier',
      quatrain: [
        'Le messager revient sans bruit.',
        'Deux voix se croisent à la fenêtre.',
        'Un rendez-vous traverse la nuit.',
        'Le jour leur permet de se connaître.',
      ].join('\n'),
    },
    {
      week: 4,
      eventId: 'leave-by-the-east-gate',
      quatrain: [
        'À l’est s’allume une dernière porte.',
        'Un sac accompagne le départ.',
        'Le quai retient ce que l’on emporte.',
        'Le mois s’achève au premier regard.',
      ].join('\n'),
    },
  ],
}
