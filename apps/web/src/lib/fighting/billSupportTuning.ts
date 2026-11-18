/** Inert authored support data; move catalogue initialization never imports combat runtime. */
export const ERIGERON_MOVE = 'bill:neutralSpecial'

/** Erigeron develops another living target; preparation supplies seeds in scenario mode. */
export const ERIGERON_SUPPORT = {
  mechanicFr:
    'Erigeron accélère la croissance d’un être vivant et peut favoriser le développement du Nen d’autrui. Aucun soin personnel ni bonus de combat. Le combat scénarisé peut fournir une graine vivante à faire germer ; sans cible adaptée, le Hatsu reste indisponible.',
  mechanicEn:
    'Erigeron accelerates a living target’s growth and can support another person’s Nen development. No self-healing or combat bonus. Scenario combat may supply a living seed to germinate; the Hatsu stays unavailable without a suitable target.',
  hintFr: 'Erigeron · soutien à autrui · aucune cible de soutien dans ce duel',
  hintEn: 'Erigeron · support for others · no support target in this duel',
} as const
