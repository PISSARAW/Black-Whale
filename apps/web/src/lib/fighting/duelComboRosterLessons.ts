import type { CombatRoute } from './combatRoutes'

export const ROSTER_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'hisoka:economy',
    fighter: 'hisoka',
    kind: 'confirm',
    title: ['Économie · balayage trompeur', 'Economy · deceptive sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine près de la cible pour conserver tes options au relevé.',
      'No aura cost. Finish near the target to keep your wakeup options.',
    ],
  },
  {
    id: 'hisoka:carry',
    fighter: 'hisoka',
    kind: 'confirm',
    title: ['Placement · revers élastique', 'Position · elastic backfist'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy'],
    requirement: [
      'Aucune dépense d’aura. Arrière + K repousse davantage que le balayage et récupère plus lentement.',
      'No aura cost. Back + K carries farther than the sweep and recovers more slowly.',
    ],
  },
  {
    id: 'hisoka:extension',
    fighter: 'hisoka',
    kind: 'confirm',
    title: ['Attache · prolongation du magicien', 'Attach · magician extension'],
    moves: ['standingLight', 'forwardLight', 'forwardHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme les frappes avant de dépenser 40 aura pour attacher Bungee Gum au contact. Rappel et rebond restent des déplacements séparés.',
      'Confirm the strikes before spending 40 aura to attach Bungee Gum on contact. Recall and rebound remain separate movement actions.',
    ],
  },
  {
    id: 'hisoka:tether',
    fighter: 'hisoka',
    kind: 'confirm',
    setup: 'bungee',
    title: ['Liaison existante · exécution élastique', 'Existing tether · elastic execution'],
    moves: ['standingLight', 'standingHeavy', 'finisher'],
    requirement: [
      'L’exercice prépare une vraie attache (40 aura) avant l’ouverture. H coûte ensuite 55 aura et consomme la liaison au contact ; sans attache, choisis une fin physique.',
      'The exercise makes a real attachment (40 aura) before the opening. H then costs 55 aura and consumes the tether on contact; without an attachment, choose a physical finish.',
    ],
  },
  {
    id: 'chrollo:economy',
    fighter: 'chrollo',
    kind: 'confirm',
    title: ['Économie · fauchage silencieux', 'Economy · silent reap'],
    moves: ['standingLight', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Après le contre au livre, termine au sol ; aucune marque ni page volée n’est accordée.',
      'No aura cost. After the book counter, knock down; no mark or stolen page is granted.',
    ],
  },
  {
    id: 'chrollo:carry',
    fighter: 'chrollo',
    kind: 'confirm',
    title: ['Placement · signet brutal', 'Position · bookmark blow'],
    moves: ['standingLight', 'backHeavy', 'forwardLight'],
    requirement: [
      'Aucune dépense d’aura. Avant + J repousse la cible ; cette frappe physique ne place pas le signet Double Face.',
      'No aura cost. Forward + J carries the target; this physical blow does not place the Double Face bookmark.',
    ],
  },
  {
    id: 'chrollo:precision',
    fighter: 'chrollo',
    kind: 'confirm',
    title: ['Précision · liaison et marque', 'Precision · link into mark'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'neutralSpecial'],
    requirement: [
      'Attends la récupération de K avant arrière + K. L pose la marque Soleil avec le livre ouvert sur Sun and Moon : 24 aura, main disponible. La marque prépare un autre échange, sans explosion gratuite.',
      'Wait for K to recover before back + K. L places the Sun mark with Sun and Moon open: 24 aura and a free hand. The mark prepares another exchange, without a free explosion.',
    ],
  },
  {
    id: 'chrollo:low-control',
    fighter: 'chrollo',
    kind: 'low',
    title: ['Contrôle · départ bas et placement', 'Control · low opening and position'],
    moves: ['lowLight', 'standingHeavy', 'forwardLight'],
    requirement: [
      'Aucune dépense d’aura. Choisis le placement après le lourd ; L serait une pose de marque soumise à la page active.',
      'No aura cost. Choose position after the heavy; L would place a mark subject to the active page.',
    ],
  },
  {
    id: 'feitan:economy',
    fighter: 'feitan',
    kind: 'confirm',
    title: ['Économie · fauchage éclair', 'Economy · flash sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine rapidement au sol ; Pain Packer ne se déclenche pas sur une frappe ordinaire.',
      'No aura cost. Finish with a quick knockdown; ordinary strikes do not activate Pain Packer.',
    ],
  },
  {
    id: 'feitan:carry',
    fighter: 'feitan',
    kind: 'confirm',
    title: ['Placement · taille au cou', 'Position · neck cut'],
    moves: ['standingLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. La grande taille gagne du terrain et des dégâts, avec une récupération plus longue.',
      'No aura cost. The large slash gains ground and damage, with longer recovery.',
    ],
  },
  {
    id: 'feitan:speed',
    fighter: 'feitan',
    kind: 'confirm',
    title: ['Vitesse · prolonger vers l’estoc', 'Speed · extend into thrust'],
    moves: ['standingLight', 'forwardLight', 'backHeavy', 'forwardSpecial'],
    requirement: [
      'Confirme le pas puis le revers. L’estoc final est un coup de lame physique sans coût d’aura ; Pain Packer reste conditionné aux blessures reçues.',
      'Confirm the step and backslash. The final thrust is a physical blade strike with no aura cost; Pain Packer still requires actual injuries.',
    ],
  },
  {
    id: 'feitan:speed-economy',
    fighter: 'feitan',
    kind: 'low',
    title: ['Vitesse · cinq frappes sans dépense', 'Speed · five meterless strikes'],
    moves: ['lowLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Enchaîne chaque confirmation tôt : la réduction du hitstun resserre la fin de cette route longue.',
      'No aura cost. Continue each confirmed hit early: hitstun decay tightens the end of this long route.',
    ],
  },
  {
    id: 'phinks:economy',
    fighter: 'phinks',
    kind: 'confirm',
    title: ['Économie · conserver les rotations', 'Economy · preserve rotations'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage conserve les tours déjà chargés ; les rotations ne renforcent pas tes frappes ordinaires.',
      'No aura cost. The sweep preserves previously charged turns; rotations do not strengthen ordinary strikes.',
    ],
  },
  {
    id: 'phinks:carry',
    fighter: 'phinks',
    kind: 'confirm',
    title: ['Placement · prolonger la poussée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge avant la frappe de poussée ; termine loin de la cible en conservant Ripper Cyclotron.',
      'No aura cost. Extend before the carry strike; finish farther away while preserving Ripper Cyclotron.',
    ],
  },
  {
    id: 'phinks:precision',
    fighter: 'phinks',
    kind: 'low',
    title: ['Contrôle · quatre frappes sans dépense', 'Control · four meterless strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Après le lourd, choisis le balayage pour rester plus près que la grande frappe avant.',
      'No aura cost. After the heavy, choose the sweep to stay closer than the large forward strike.',
    ],
  },
  {
    id: 'phinks:charged',
    fighter: 'phinks',
    kind: 'confirm',
    recoveryFinish: true,
    setup: 'cyclotron',
    title: [
      'Charge préparée · relancer après récupération',
      'Prepared charge · strike after recovery',
    ],
    moves: ['standingLight', 'standingHeavy', 'finisher'],
    requirement: [
      'L’exercice effectue une rotation complète avant l’ouverture (2 aura). Après K, attends la récupération avant H : toute la charge est dépensée au départ du poing, même s’il manque.',
      'The exercise completes one rotation before the opening (2 aura). After K, wait for recovery before H: all charge is spent when the punch starts, even on a miss.',
    ],
  },
]
