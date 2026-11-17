import type { CombatRoute } from './combatRoutes'

export const FIFTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'gel:economy',
    fighter: 'gel',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'gel:carry',
    fighter: 'gel',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'gel:reach',
    fighter: 'gel',
    kind: 'confirm',
    title: ['Allonge · bras-serpent', 'Reach · snake arm'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Confirme puis dépense 24 aura pour une vraie frappe du bras étendu. Aucune morsure venimeuse, ponction d’aura ou immobilisation automatique.',
      'Confirm, then spend 24 aura on a real extended-arm strike. No venom, aura drain or automatic restraint.',
    ],
  },
  {
    id: 'gel:low-arm',
    fighter: 'gel',
    kind: 'low',
    title: ['Départ bas · vipère rasante', 'Low opening · ground viper'],
    moves: ['lowLight', 'forwardLight', 'downSpecial'],
    requirement: [
      'Bas + L coûte 20 aura et termine au sol plus près que la frappe avant. C’est une variante du même bras-serpent ; la garde et l’interruption restent possibles.',
      'Down + L costs 20 aura and knocks down closer than the forward strike. It is a variant of the same snake arm; guard and interruption still apply.',
    ],
  },
  {
    id: 'lynch:economy',
    fighter: 'lynch',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'lynch:carry',
    fighter: 'lynch',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'lynch:precision',
    fighter: 'lynch',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura sans préparation préalable.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost without prior preparation.',
    ],
  },
  {
    id: 'lynch:question',
    fighter: 'lynch',
    kind: 'low',
    title: ['Question posée · deux réponses privées', 'Asked question · two private replies'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice pose réellement la question d’identité avant l’ouverture. Avant + J et K coûtent chacun 10 aura pour leur réponse sur une cible consciente. Le départ bas et la fin ne produisent aucune réponse ; aucun bonus de dégâts ou de stun.',
      'The exercise actually asks the identity question before the opening. Forward + J and K each cost 10 aura for a reply from a conscious target. The low opener and finish produce no reply; no damage or stun bonus.',
    ],
    setup: 'question',
  },
  {
    id: 'padaille:economy',
    fighter: 'padaille',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'padaille:carry',
    fighter: 'padaille',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'padaille:hammer',
    fighter: 'padaille',
    kind: 'confirm',
    title: ['Marteau · finir avec la main droite', 'Hammer · right-hand finish'],
    moves: ['standingLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme puis dépense 20 aura pour le marteau. Bas + L permet aussi une fin à la hache, plus lente ; la transformation ne donne aucun bonus aux normales.',
      'Confirm, then spend 20 aura on the hammer. Down + L also offers a slower axe finish; the transformation grants no bonus to normals.',
    ],
  },
  {
    id: 'padaille:drill',
    fighter: 'padaille',
    kind: 'low',
    title: ['Foret · prolonger puis balayer', 'Drill · extend then sweep'],
    moves: ['lowLight', 'forwardLight', 'forwardSpecial', 'lowHeavy'],
    requirement: [
      'Confirme le départ bas puis choisis réellement le foret (20 aura). Sa poussée limitée permet le balayage ; il ne traverse pas automatiquement la garde.',
      'Confirm the low opening, then actually select the drill (20 aura). Its limited push allows a sweep; it never automatically bypasses guard.',
    ],
  },
  {
    id: 'zakuro:economy',
    fighter: 'zakuro',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'zakuro:carry',
    fighter: 'zakuro',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'zakuro:precision',
    fighter: 'zakuro',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura sans préparation préalable.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost without prior preparation.',
    ],
  },
  {
    id: 'zakuro:scouts',
    fighter: 'zakuro',
    kind: 'low',
    title: ['Gouttes préparées · conserver son sang', 'Prepared scouts · conserve blood'],
    moves: ['lowLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'L’exercice ouvre une vraie plaie (2 santé, 1 aura), puis déploie trois gouttes-yeux (8 aura et 3 unités de sang). Elles reconnaissent sans frapper ; la route physique ne consomme plus de sang et ne recharge pas les poches.',
      'The exercise opens a real wound (2 health, 1 aura), then deploys three eyed scouts (8 aura and 3 blood units). They scout without striking; the physical route uses no more blood and never refills bags.',
    ],
    setup: 'scouts',
  },
]
