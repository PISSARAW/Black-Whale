import type { CombatRoute } from './combatRoutes'

export const SEVENTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'tserriednich:economy',
    fighter: 'tserriednich',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'tserriednich:carry',
    fighter: 'tserriednich',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération. Après avant + J, attends la récupération avant K.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery. After forward + J, wait for recovery before K.',
    ],
  },
  {
    id: 'tserriednich:precision',
    fighter: 'tserriednich',
    kind: 'confirm',
    title: ['Précision · liaison puis balayage', 'Precision · link then sweep'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération d’avant + J pour lier K, puis confirme le balayage. Aucun coût d’aura ; Laplace Devil ne sert pas de cancel offensif.',
      'Wait for forward + J to recover before linking K, then confirm the sweep. No aura cost; Laplace Devil is never an offensive cancel.',
    ],
  },
  {
    id: 'tserriednich:five-strikes',
    fighter: 'tserriednich',
    kind: 'low',
    title: ['Précision · deux liaisons physiques', 'Precision · two physical links'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'Après le départ bas, lie K après la récupération d’avant + J, puis le revers après celle de K. Aucune dépense d’aura, vision imposée au mannequin ou esquive automatique.',
      'After the low opening, link K after forward + J recovers, then the backfist after K recovers. No aura cost, forced dummy vision or automatic dodge.',
    ],
  },
  {
    id: 'basho:economy',
    fighter: 'basho',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'basho:carry',
    fighter: 'basho',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'basho:precision',
    fighter: 'basho',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'basho:poem',
    fighter: 'basho',
    kind: 'low',
    title: ['Poème écrit · deux poings enflammants', 'Written poem · two igniting fists'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice écrit réellement le poème reconnu (25 aura, 60 frames vulnérables). Le coup bas et l’épaule ne l’activent pas ; seuls les deux poings intermédiaires enflamment la cible. Aucun bonus général ni impact de combo ajouté par la brûlure.',
      'The exercise actually writes the recognized poem (25 aura, 60 vulnerable frames). The low kick and shoulder never trigger it; only the two intermediate fists ignite the target. No general boost or extra combo impact from burning.',
    ],
    setup: 'poem',
  },
  {
    id: 'camilla:economy',
    fighter: 'camilla',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'camilla:carry',
    fighter: 'camilla',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'camilla:precision',
    fighter: 'camilla',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'camilla:five-strikes',
    fighter: 'camilla',
    kind: 'low',
    title: ['Maîtrise · cinq frappes sans Cat’s Name', 'Control · five strikes without Cat’s Name'],
    moves: ['lowLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Lie le revers après la récupération de K, puis prolonge et repousse sans aura. Cat’s Name ne se déclenche pas avec un combo, un bouton ou un seuil de PV : il exige une mort réellement attribuée.',
      'Link the backfist after K recovers, then extend and carry without aura. A combo, button or HP threshold never triggers Cat’s Name: an actual attributed death is required.',
    ],
  },
  {
    id: 'longhi:economy',
    fighter: 'longhi',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'longhi:carry',
    fighter: 'longhi',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'longhi:precision',
    fighter: 'longhi',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'longhi:offer',
    fighter: 'longhi',
    kind: 'low',
    title: ['Offre non signée · conversion physique', 'Unsigned offer · physical conversion'],
    moves: ['lowLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'L’exercice propose réellement Moonlight Act sans faire signer la cible. Tant que celle-ci n’accepte pas, les frappes ne valent ni consentement ni rupture de contrat, et n’imposent aucun Zetsu.',
      'The exercise actually offers Moonlight Act without signing for the target. Until the target accepts, strikes imply neither consent nor breach and impose no Zetsu.',
    ],
    setup: 'offer',
  },
]
