import type { CombatRoute } from './combatRoutes'

export const SECOND_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'machi:economy',
    fighter: 'machi',
    kind: 'confirm',
    title: ['Économie · balayage cousu', 'Economy · stitched sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine au sol près de la cible ; aucune ligature n’est créée par ces frappes.',
      'No aura cost. Knock down nearby; these strikes create no binding thread.',
    ],
  },
  {
    id: 'machi:carry',
    fighter: 'machi',
    kind: 'confirm',
    title: ['Placement · lacet cervical', 'Position · neck lacing'],
    moves: ['standingLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. La frappe avant pousse davantage que le balayage, avec une récupération plus longue.',
      'No aura cost. The forward strike carries farther than the sweep, with longer recovery.',
    ],
  },
  {
    id: 'machi:precision',
    fighter: 'machi',
    kind: 'confirm',
    title: ['Précision · liaison du revers', 'Precision · backfist link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la fin de K avant arrière + K, puis confirme le revers vers le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the backfist into the sweep. No aura cost.',
    ],
  },
  {
    id: 'machi:tracking',
    fighter: 'machi',
    kind: 'confirm',
    setup: 'tracking',
    title: ['Pistage acquis · prolongation physique', 'Existing tracking · physical extension'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'L’exercice pose une vraie aiguille de pistage avant l’ouverture (18 aura). Le pistage reste un repère, sans immobilisation ; la route physique ne le transforme pas en ligature.',
      'The exercise lands a real tracking needle before the opening (18 aura). Tracking remains a marker, without restraint; the physical route never turns it into a bind.',
    ],
  },
  {
    id: 'biscuit:economy',
    fighter: 'biscuit',
    kind: 'confirm',
    title: ['Économie · balayage de pierre', 'Economy · stone sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine près de la cible dans la forme actuelle ; aucune transformation n’est forcée.',
      'No aura cost. Finish nearby in the current form; no transformation is forced.',
    ],
  },
  {
    id: 'biscuit:carry',
    fighter: 'biscuit',
    kind: 'confirm',
    title: ['Placement · prolonger vers l’épaule', 'Position · extend into shoulder'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge avec le pas du maître avant de gagner du terrain avec l’épaule.',
      'No aura cost. Extend with the master step before gaining ground with the shoulder.',
    ],
  },
  {
    id: 'biscuit:mastery',
    fighter: 'biscuit',
    kind: 'low',
    title: ['Maîtrise · direct du maître', 'Mastery · master straight'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Confirme le départ bas puis dépense 24 aura dans le direct final. Ce coup martial n’active ni Cookie ni la vraie forme.',
      'Confirm the low opening, then spend 24 aura on the final straight. This martial strike activates neither Cookie nor the true form.',
    ],
  },
  {
    id: 'biscuit:true-form',
    fighter: 'biscuit',
    kind: 'confirm',
    setup: 'true-form',
    title: ['Vraie forme · impact total', 'True form · full impact'],
    moves: ['standingLight', 'standingHeavy', 'finisher'],
    requirement: [
      'L’exercice révèle réellement le corps naturel avant l’ouverture, sans coût d’aura ni soin. H coûte 55 aura et exige cette forme ; elle reste active après le combo.',
      'The exercise reveals the natural body before the opening, without aura cost or healing. H costs 55 aura and requires that form; it stays active after the combo.',
    ],
  },
  {
    id: 'franklin:economy',
    fighter: 'franklin',
    kind: 'confirm',
    title: ['Économie · fauchage massif', 'Economy · massive sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Termine au sol sans exposer tes mains pendant une rafale.',
      'No aura cost. Knock down without exposing your hands during a barrage.',
    ],
  },
  {
    id: 'franklin:carry',
    fighter: 'franklin',
    kind: 'confirm',
    title: ['Placement · double bélier prolongé', 'Position · extended double ram'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. La prolongation physique prépare le terrain ; la grande frappe avant termine le combo.',
      'No aura cost. The physical extension gains ground; the large forward strike ends the combo.',
    ],
  },
  {
    id: 'franklin:short-burst',
    fighter: 'franklin',
    kind: 'confirm',
    hits: [1, 1, 10],
    title: ['Rafale courte · dix impacts', 'Short barrage · ten impacts'],
    moves: ['standingLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Après K, saisis avant + L une seule fois : 24 aura pour dix balles réelles. Chaque balle doit toucher avant que la cible puisse garder ; recevoir un coup interrompt les tirs suivants.',
      'After K, input forward + L once: 24 aura for ten real bullets. Each bullet must hit before the target can guard; getting hit interrupts the remaining shots.',
    ],
  },
  {
    id: 'franklin:long-burst',
    fighter: 'franklin',
    kind: 'low',
    hits: [1, 1, 1, 20],
    title: ['Rafale longue · vingt impacts', 'Long barrage · twenty impacts'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Après les trois frappes, saisis L une seule fois : 40 aura pour vingt balles, avec une exposition plus longue. Le compteur exige les impacts des projectiles, sans hitbox invisible.',
      'After the three strikes, input L once: 40 aura for twenty bullets, with longer exposure. The counter requires projectile impacts, without an invisible hitbox.',
    ],
  },
  {
    id: 'hanzo:economy',
    fighter: 'hanzo',
    kind: 'confirm',
    title: ['Économie · fauchage furtif', 'Economy · stealth sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage reste proche ; le double astral ne se crée pas pendant la route.',
      'No aura cost. The sweep stays close; the astral double is not created during the route.',
    ],
  },
  {
    id: 'hanzo:carry',
    fighter: 'hanzo',
    kind: 'confirm',
    title: ['Placement · pas sans trace', 'Position · traceless step'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge vers la paume avant pour repousser ; préparer ensuite le double reste une décision exposée.',
      'No aura cost. Extend into the forward palm to carry; preparing the double afterward remains a vulnerable decision.',
    ],
  },
  {
    id: 'hanzo:precision',
    fighter: 'hanzo',
    kind: 'confirm',
    title: ['Précision · liaison du ninja', 'Precision · ninja link'],
    moves: ['standingLight', 'forwardLight', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Après avant + J, attends la récupération avant arrière + K, puis balaie sur confirmation. Aucun coût d’aura ni état de projection requis.',
      'After forward + J, wait for recovery before back + K, then sweep on confirmation. No aura cost or projection state required.',
    ],
  },
  {
    id: 'hanzo:low-precision',
    fighter: 'hanzo',
    kind: 'low',
    title: ['Précision · départ bas et poussée', 'Precision · low opening and carry'],
    moves: ['lowLight', 'forwardLight', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Temporise le revers après le pas, puis choisis la poussée pour le placement. Le corps réel ne reçoit aucune invulnérabilité.',
      'No aura cost. Time the backhand after the step, then choose carry for position. The real body receives no invulnerability.',
    ],
  },
]
