import type { CombatRoute } from './combatRoutes'

export const NINTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'rihan:economy',
    fighter: 'rihan',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'rihan:carry',
    fighter: 'rihan',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération. Attends la récupération d’avant + J avant K.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery. Wait for forward + J to recover before K.',
    ],
  },
  {
    id: 'rihan:precision',
    fighter: 'rihan',
    kind: 'confirm',
    title: ['Précision · liaison du garde', 'Precision · guard link'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération d’avant + J pour lier K, puis confirme le balayage. Aucune dépense d’aura ni adaptation défensive automatique de Predator.',
      'Wait for forward + J to recover before linking K, then confirm the sweep. No aura cost or automatic defensive adaptation from Predator.',
    ],
  },
  {
    id: 'rihan:observation',
    fighter: 'rihan',
    kind: 'low',
    title: ['Observation ouverte · cinq frappes', 'Open observation · five strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'L ouvre réellement l’observation de Predator, sans coût d’aura. Aucune manifestation n’est fournie : aucune analyse validée, chasse ou privation de Nen ne vient aider le combo. Lie K après avant + J, puis le revers après K.',
      'L actually opens Predator observation without spending aura. No manifestation is supplied: no completed analysis, hunt or Nen deprivation assists the combo. Link K after forward + J, then the backfist after K.',
    ],
    setup: 'observation',
  },
  {
    id: 'melody:economy',
    fighter: 'melody',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'melody:carry',
    fighter: 'melody',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'standingHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'melody:precision',
    fighter: 'melody',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'melody:listening',
    fighter: 'melody',
    kind: 'low',
    title: ['Écoute réelle · cinq frappes physiques', 'Actual listening · five physical strikes'],
    moves: ['lowLight', 'standingHeavy', 'backHeavy', 'forwardLight', 'forwardHeavy'],
    requirement: [
      'Le laboratoire laisse passer les 12 frames d’écoute corporelle, sans jouer de flûte, sans aura ni apaisement du mannequin. Lie le revers après K ; la tolérance de parade reste manuelle et ne renforce pas les dégâts.',
      'The lab lets 12 frames of bodily listening pass without flute music, aura cost or dummy pacification. Link the backfist after K; parry tolerance remains manual and never increases damage.',
    ],
    setup: 'listening',
  },
  {
    id: 'terebellum:economy',
    fighter: 'terebellum',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'terebellum:carry',
    fighter: 'terebellum',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'terebellum:precision',
    fighter: 'terebellum',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'terebellum:left-hand',
    fighter: 'terebellum',
    kind: 'low',
    title: ['Engagement · frappe de la main gauche', 'Commitment · left-hand strike'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme puis dépense 40 aura dans la frappe physique adaptée au duel. Sweet Home exige toujours une nouvelle blessure et le contact de main pendant ses frames actives ; la route ne soigne pas les blessures anciennes et ne les renvoie pas automatiquement.',
      'Confirm, then spend 40 aura on the duel’s physical strike. Sweet Home still requires a new injury and hand contact during active frames; the route never heals old wounds or automatically reflects them.',
    ],
  },
  {
    id: 'voconte:economy',
    fighter: 'voconte',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'voconte:carry',
    fighter: 'voconte',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'voconte:precision',
    fighter: 'voconte',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucune dépense d’aura.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost.',
    ],
  },
  {
    id: 'voconte:doors',
    fighter: 'voconte',
    kind: 'low',
    title: ['Seuils reliés · cinq frappes physiques', 'Connected frames · five physical strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'L relie réellement les deux huisseries (20 aura, 18 frames de préparation puis récupération). L’ouverture se déroule entre elles ; aucun bouton ou coup ne téléporte sans franchissement du seuil dans son sens. Lie le revers après K.',
      'L actually connects the two frames (20 aura, 18 setup frames then recovery). The opening takes place between them; no button or strike teleports without crossing a threshold in its triggering direction. Link the backfist after K.',
    ],
    setup: 'doors',
  },
]
