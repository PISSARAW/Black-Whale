import type { CombatRoute } from './combatRoutes'

export const FOURTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'saiyu:economy',
    fighter: 'saiyu',
    kind: 'confirm',
    title: ['Économie · finir près', 'Economy · nearby finish'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'saiyu:carry',
    fighter: 'saiyu',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse plus loin avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry farther with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'saiyu:hearing',
    fighter: 'saiyu',
    kind: 'confirm',
    title: ['Kikazaru · retirer l’ouïe', 'Kikazaru · remove hearing'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Confirme puis dépense 24 aura. Kikazaru retire seulement l’ouïe ; Mizaru (L, 40 aura) et Iwazaru (bas + L, 20 aura) restent deux autres choix de fin. Aucun Zetsu automatique.',
      'Confirm, then spend 24 aura. Kikazaru removes hearing only; Mizaru (L, 40 aura) and Iwazaru (down + L, 20 aura) are two other finish choices. No automatic Zetsu.',
    ],
  },
  {
    id: 'saiyu:speech',
    fighter: 'saiyu',
    kind: 'low',
    title: ['Iwazaru · retirer la parole', 'Iwazaru · remove speech'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'downSpecial'],
    requirement: [
      'Confirme le départ bas puis dépense 20 aura pour retirer seulement la parole. Répéter le même singe ne retire aucun autre sens.',
      'Confirm the low opening, then spend 20 aura to remove speech only. Repeating the same monkey never removes another sense.',
    ],
  },
  {
    id: 'bonolenov:economy',
    fighter: 'bonolenov',
    kind: 'confirm',
    title: ['Économie · finir près', 'Economy · nearby finish'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'bonolenov:carry',
    fighter: 'bonolenov',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse plus loin avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry farther with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'bonolenov:precision',
    fighter: 'bonolenov',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'bonolenov:spear',
    fighter: 'bonolenov',
    kind: 'confirm',
    title: ['Prologue préparé · liaison de la lance', 'Prepared Prologue · spear link'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Prépare réellement Prologue : 40 aura et 60 frames exposées. Attends ensuite la récupération de K avant la lance (12 aura). Aucun raccourci vers Jupiter ni bonus global de dégâts.',
      'Actually prepare Prologue: 40 aura and 60 vulnerable frames. Then wait for K to recover before the spear (12 aura). No shortcut to Jupiter or global damage bonus.',
    ],
    setup: 'prologue',
  },
  {
    id: 'hinrigh:economy',
    fighter: 'hinrigh',
    kind: 'confirm',
    title: ['Économie · finir près', 'Economy · nearby finish'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'hinrigh:carry',
    fighter: 'hinrigh',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse plus loin avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry farther with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'hinrigh:precision',
    fighter: 'hinrigh',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'hinrigh:capture',
    fighter: 'hinrigh',
    kind: 'low',
    title: ['Menottes préparées · convertir la capture', 'Prepared cuffs · capture conversion'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice lance réellement un pigeon-menottes (20 aura) et attend sa capture d’une cible libre. Le premier dégât libère la cible ; les frappes suivantes doivent s’enchaîner normalement.',
      'The exercise actually launches a cuff pigeon (20 aura) and waits for capture of a free target. The first damage frees the target; subsequent strikes must combo normally.',
    ],
    setup: 'pigeon',
  },
  {
    id: 'mizaistom:economy',
    fighter: 'mizaistom',
    kind: 'confirm',
    title: ['Économie · finir près', 'Economy · nearby finish'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'mizaistom:carry',
    fighter: 'mizaistom',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse plus loin avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry farther with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'mizaistom:precision',
    fighter: 'mizaistom',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'mizaistom:warning',
    fighter: 'mizaistom',
    kind: 'low',
    title: ['Carton montré · ouverture physique', 'Displayed card · physical opening'],
    moves: ['lowLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Montre réellement le carton (40 aura, 18 frames). La cible avertie peut garder : ces frappes ne la confinent pas. Seule une nouvelle action interdite après le préavis déclenche la règle.',
      'Actually show the card (40 aura, 18 frames). The warned target may guard: these strikes never confine it. Only a new forbidden action after notice triggers the rule.',
    ],
    setup: 'warning',
  },
]
