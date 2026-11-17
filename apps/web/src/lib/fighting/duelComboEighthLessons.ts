import type { CombatRoute } from './combatRoutes'

export const EIGHTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'bill:economy',
    fighter: 'bill',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'bill:carry',
    fighter: 'bill',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération. Attends la récupération d’avant + J avant K.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery. Wait for forward + J to recover before K.',
    ],
  },
  {
    id: 'bill:precision',
    fighter: 'bill',
    kind: 'confirm',
    title: ['Précision · liaison du garde', 'Precision · guard link'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération d’avant + J pour lier K, puis confirme le balayage. Erigeron ne procure ni soin personnel ni renforcement du combo.',
      'Wait for forward + J to recover before linking K, then confirm the sweep. Erigeron grants neither self-healing nor a combo buff.',
    ],
  },
  {
    id: 'bill:growth',
    fighter: 'bill',
    kind: 'low',
    title: ['Graine germée · cinq frappes physiques', 'Germinated seed · five physical strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'Le scénario fournit une vraie graine vivante à portée. L utilise réellement Erigeron (20 aura, 18 frames de récupération), puis le laboratoire place l’ouverture près de la cible. Lie K après avant + J et le revers après K ; aucune racine offensive ni guérison.',
      'The scenario supplies a real living seed in range. L actually uses Erigeron (20 aura, 18 recovery frames), then the lab positions the close opening. Link K after forward + J and the backfist after K; no attacking roots or healing.',
    ],
    setup: 'growth',
  },
  {
    id: 'cluck:economy',
    fighter: 'cluck',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'cluck:carry',
    fighter: 'cluck',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'cluck:precision',
    fighter: 'cluck',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'cluck:courier',
    fighter: 'cluck',
    kind: 'low',
    title: ['Pigeon envoyé · cinq frappes physiques', 'Dispatched pigeon · five physical strikes'],
    moves: ['lowLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Le scénario fournit un vrai pigeon et un point de livraison. L envoie réellement le courrier (5 aura, 18 frames de récupération) avant l’ouverture rapprochée. Lie le revers après K ; le pigeon livre sans attaquer ni renforcer les frappes.',
      'The scenario supplies a real pigeon and delivery point. L actually dispatches the courier (5 aura, 18 recovery frames) before the close opening. Link the backfist after K; the pigeon delivers without attacking or buffing strikes.',
    ],
    setup: 'courier',
  },
  {
    id: 'sayird:economy',
    fighter: 'sayird',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'sayird:carry',
    fighter: 'sayird',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'sayird:precision',
    fighter: 'sayird',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'sayird:little-eye',
    fighter: 'sayird',
    kind: 'low',
    title: ['Little Eye préparé · cinq frappes', 'Prepared Little Eye · five strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'Le scénario fournit un vrai petit animal à portée. L active réellement Little Eye (2 aura, 18 frames de récupération), puis le laboratoire rapproche l’ouverture. Lie le revers après K ; voir et entendre par l’animal n’ajoute aucun dégât, stun ou contrôle adverse.',
      'The scenario supplies a real small animal in range. L actually activates Little Eye (2 aura, 18 recovery frames), then the lab positions the close opening. Link the backfist after K; seeing and hearing through the animal adds no damage, stun or enemy control.',
    ],
    setup: 'little-eye',
  },
  {
    id: 'luini:economy',
    fighter: 'luini',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'luini:carry',
    fighter: 'luini',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'luini:precision',
    fighter: 'luini',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'luini:anchor',
    fighter: 'luini',
    kind: 'low',
    title: ['Pièce ancrée · cinq frappes physiques', 'Anchored room · five physical strikes'],
    moves: ['lowLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Le scénario fournit une pièce fermée à porte unique et un lieu visité. L ancre réellement depuis l’intérieur (20 aura, 18 frames de récupération) sans téléporter ; le laboratoire replace ensuite l’ouverture. Lie le revers après K. Ouvrir la porte condamne toujours l’ancrage.',
      'The scenario supplies a sealed single-door room and a visited place. L actually anchors from inside (20 aura, 18 recovery frames) without teleporting; the lab then repositions the opening. Link the backfist after K. Opening the door still permanently invalidates the anchor.',
    ],
    setup: 'anchor',
  },
]
