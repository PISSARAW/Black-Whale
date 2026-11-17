import type { CombatRoute } from './combatRoutes'

export const SIXTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'theta:economy',
    fighter: 'theta',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'theta:carry',
    fighter: 'theta',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'theta:torso-shot',
    fighter: 'theta',
    kind: 'confirm',
    title: ['Pistolet · conversion au torse', 'Handgun · torso conversion'],
    moves: ['standingLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme puis tire une vraie balle au torse avec L. Aucun coût d’aura ; le projectile doit parcourir la distance. Le tir ne force aucun Zetsu et ne constitue pas un Hatsu.',
      'Confirm, then fire a real torso bullet with L. No aura cost; the projectile must travel. The shot never forces Zetsu and is not a Hatsu.',
    ],
  },
  {
    id: 'theta:feet-shot',
    fighter: 'theta',
    kind: 'low',
    title: ['Départ bas · balle aux jambes', 'Low opening · leg shot'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'downSpecial'],
    requirement: [
      'Après confirmation, bas + L vise les jambes sans dépense d’aura. La balle reste gardable en haut comme en bas ; viser les pieds ne transforme pas le tir en attaque basse imparable.',
      'After confirmation, down + L aims at the legs without spending aura. High or low guard can block the bullet; aiming at the feet never makes it an unblockable low.',
    ],
  },
  {
    id: 'musse:economy',
    fighter: 'musse',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'musse:carry',
    fighter: 'musse',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'musse:precision',
    fighter: 'musse',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'musse:owl',
    fighter: 'musse',
    kind: 'low',
    title: ['Hibou posé · ouverture physique', 'Attached owl · physical opening'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice pose réellement Secret Window au contact (16 aura), puis attend la récupération. Le hibou rapporte les gestes ; il n’ajoute ni dégâts, ni stun, ni lecture d’aura ou du futur.',
      'The exercise actually attaches Secret Window by touch (16 aura), then waits for recovery. The owl reports bodily actions; it adds no damage, stun, aura reading or prediction.',
    ],
    setup: 'owl',
  },
  {
    id: 'furykov:economy',
    fighter: 'furykov',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'furykov:carry',
    fighter: 'furykov',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'furykov:precision',
    fighter: 'furykov',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'furykov:console',
    fighter: 'furykov',
    kind: 'low',
    title: ['Console ouverte · cinq frappes', 'Open console · five strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice ouvre réellement Combo Master (40 aura) avant les frappes. Attends la récupération de K pour le revers. La console alerte sans esquive ni renforcement ; déchiffrer ou fabriquer reste hors duel.',
      'The exercise actually opens Combo Master (40 aura) before the strikes. Wait for K to recover before the backfist. The console alerts without evasion or buffs; deciphering or fabrication remains outside the duel.',
    ],
    setup: 'console',
  },
  {
    id: 'beyond:economy',
    fighter: 'beyond',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'beyond:carry',
    fighter: 'beyond',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'beyond:palm',
    fighter: 'beyond',
    kind: 'confirm',
    title: ['Engagement · frappe renforcée', 'Commitment · reinforced strike'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Confirme puis dépense 24 aura dans une frappe physique au Ren. Sa portée et ses dégâts sont des réglages de duel ; aucune malédiction ni riposte automatique n’est déclenchée.',
      'Confirm, then spend 24 aura on a Ren-powered physical strike. Its reach and damage are duel tuning; no curse or automatic retaliation is triggered.',
    ],
  },
  {
    id: 'beyond:low-strike',
    fighter: 'beyond',
    kind: 'low',
    title: ['Engagement · départ bas prolongé', 'Commitment · extended low opening'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'downSpecial'],
    requirement: [
      'Confirme le départ bas puis choisis bas + L (20 aura) pour finir près. La malédiction sacrificielle exige sa préparation propre, absente de ce duel ; elle ne devient jamais un finisher à faible santé.',
      'Confirm the low opening, then choose down + L (20 aura) to finish nearby. The sacrificial curse requires its own preparation, absent from this duel; it never becomes a low-health finisher.',
    ],
  },
]
