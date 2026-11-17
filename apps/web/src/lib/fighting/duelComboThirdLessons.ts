import type { CombatRoute } from './combatRoutes'

export const THIRD_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'illumi:economy',
    fighter: 'illumi',
    kind: 'confirm',
    title: ['Économie · fauchage silencieux', 'Economy · silent sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine près de la cible ; aucune aiguille de contrôle n’est implantée par ces frappes.',
      'No aura cost. The sweep finishes nearby; these strikes never implant a control needle.',
    ],
  },
  {
    id: 'illumi:carry',
    fighter: 'illumi',
    kind: 'confirm',
    title: ['Placement · paume cardiaque', 'Position · heart palm'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge avec le pas puis choisis la paume pour repousser davantage, au prix de sa récupération.',
      'No aura cost. Extend with the step, then choose the palm for more carry at the cost of recovery.',
    ],
  },
  {
    id: 'illumi:precision',
    fighter: 'illumi',
    kind: 'confirm',
    title: ['Précision · liaison de l’assassin', 'Precision · assassin link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis balaie sur confirmation. Aucune dépense d’aura ni implantation automatique.',
      'Wait for K to recover before back + K, then sweep on confirmation. No aura cost or automatic implantation.',
    ],
  },
  {
    id: 'illumi:disguise',
    fighter: 'illumi',
    kind: 'low',
    setup: 'disguise',
    title: ['Visage préparé · cinq frappes', 'Prepared disguise · five strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice prépare réellement le visage remodelé avant l’ouverture (20 aura et 30 frames exposées). La route physique ne coûte rien ensuite ; le déguisement ne donne ni armure ni esquive.',
      'The exercise actually prepares the altered face before the opening (20 aura and 30 vulnerable frames). The physical route then costs nothing; the disguise grants neither armor nor evasion.',
    ],
  },
  {
    id: 'kalluto:economy',
    fighter: 'kalluto',
    kind: 'confirm',
    title: ['Économie · fauchage de l’éventail', 'Economy · fan sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine au sol près de la cible ; les frappes ordinaires ne plantent aucun papier.',
      'No aura cost. Knock down nearby; ordinary strikes never plant paper.',
    ],
  },
  {
    id: 'kalluto:carry',
    fighter: 'kalluto',
    kind: 'confirm',
    title: ['Placement · rafale Zoldyck', 'Position · Zoldyck gust'],
    moves: ['standingLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. La frappe avant repousse plus loin que le balayage, avec une récupération plus longue.',
      'No aura cost. The forward strike carries farther than the sweep, with longer recovery.',
    ],
  },
  {
    id: 'kalluto:precision',
    fighter: 'kalluto',
    kind: 'low',
    title: ['Précision · liaison de l’éventail', 'Precision · fan link'],
    moves: ['lowLight', 'forwardLight', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Après avant + J, attends la fin du geste avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'After forward + J, wait for recovery before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'kalluto:serpent',
    fighter: 'kalluto',
    kind: 'confirm',
    setup: 'paper',
    title: ['Papier planté · morsure du serpent', 'Planted paper · serpent bite'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'L’exercice plante d’abord un vrai fragment dans le torse (16 aura). Avant + L coûte ensuite 24 aura et vise cette zone ; sans papier correspondant, choisis une fin physique.',
      'The exercise first lands a real fragment in the torso (16 aura). Forward + L then costs 24 aura and targets that zone; without matching paper, choose a physical finish.',
    ],
  },
  {
    id: 'shizuku:economy',
    fighter: 'shizuku',
    kind: 'confirm',
    title: ['Économie · balayage ménager', 'Economy · cleaning sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine près de la cible ; aspirer du sang reste une action distincte avec ses conditions de plaies.',
      'No aura cost. Finish nearby; drawing blood remains a separate action subject to wound conditions.',
    ],
  },
  {
    id: 'shizuku:carry',
    fighter: 'shizuku',
    kind: 'confirm',
    title: ['Placement · coup de réservoir prolongé', 'Position · extended tank strike'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge le nettoyage puis repousse avec le réservoir, avec davantage de récupération.',
      'No aura cost. Extend the cleaning step, then carry with the tank at the cost of longer recovery.',
    ],
  },
  {
    id: 'shizuku:strike',
    fighter: 'shizuku',
    kind: 'confirm',
    title: ['Puissance · frappe de Blinky', 'Power · Blinky strike'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Confirme puis dépense 24 aura dans une vraie frappe de Blinky. Elle ne soigne pas, ne vole pas d’aura et ne déclenche pas automatiquement l’aspiration du sang.',
      'Confirm, then spend 24 aura on an actual Blinky strike. It never heals, drains aura or automatically starts blood suction.',
    ],
  },
  {
    id: 'shizuku:low-strike',
    fighter: 'shizuku',
    kind: 'low',
    title: ['Puissance · départ bas et Blinky', 'Power · low opening into Blinky'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Après le départ bas, confirme les frappes avant de dépenser 24 aura. Les plaies créées restent réelles, mais la cible pourra en couvrir deux avec les mains après cet échange.',
      'After the low opening, confirm the strikes before spending 24 aura. Wounds remain real, but the target can cover two with its hands after this exchange.',
    ],
  },
  {
    id: 'leorio:economy',
    fighter: 'leorio',
    kind: 'confirm',
    title: ['Économie · balayage rapproché', 'Economy · close sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine au sol près de la cible sans préparer le poing transmis dans la surface.',
      'No aura cost. Knock down nearby without preparing the surface-transmitted punch.',
    ],
  },
  {
    id: 'leorio:carry',
    fighter: 'leorio',
    kind: 'confirm',
    title: ['Placement · coup d’épaule prolongé', 'Position · extended shoulder strike'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis choisis le coup d’épaule pour gagner du terrain, avec une récupération plus longue.',
      'No aura cost. Extend, then choose the shoulder to gain ground at the cost of longer recovery.',
    ],
  },
  {
    id: 'leorio:remote',
    fighter: 'leorio',
    kind: 'confirm',
    title: ['Ouverture engagée · poing à distance', 'Committed opening · remote punch'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'neutralSpecial'],
    requirement: [
      'Le revers ouvre assez longtemps pour le trajet réel du poing. L coûte 40 aura et exige le sol ; le point visé est fixé à la frappe du sol, sans poursuite ni impact instantané.',
      'The backfist opens enough time for the fist’s actual travel. L costs 40 aura and requires the ground; its aim is fixed on floor contact, without tracking or instant damage.',
    ],
  },
  {
    id: 'leorio:low-remote',
    fighter: 'leorio',
    kind: 'low',
    title: ['Ouverture engagée · départ bas', 'Committed opening · low route'],
    moves: ['lowLight', 'forwardLight', 'backHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme le départ bas et le revers avant L : 40 aura. Une technique scellée, un manque d’aura ou un corps en l’air interdit toujours le poing à distance.',
      'Confirm the low opening and backfist before L: 40 aura. A sealed technique, insufficient aura or an airborne body still prevents the remote punch.',
    ],
  },
]
