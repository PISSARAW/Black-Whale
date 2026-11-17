import type { CombatRoute } from './combatRoutes'

export const TENTH_DUEL_LESSONS: readonly CombatRoute[] = [
  {
    id: 'halkenburg:economy',
    fighter: 'halkenburg',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'halkenburg:carry',
    fighter: 'halkenburg',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery.',
    ],
  },
  {
    id: 'halkenburg:precision',
    fighter: 'halkenburg',
    kind: 'confirm',
    title: ['Précision · liaison après récupération', 'Precision · recovery link'],
    moves: ['standingLight', 'standingHeavy', 'backHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération de K avant arrière + K, puis confirme le balayage. Aucun coût d’aura et aucune flèche automatique.',
      'Wait for K to recover before back + K, then confirm the sweep. No aura cost or automatic arrow.',
    ],
  },
  {
    id: 'halkenburg:cohort',
    fighter: 'halkenburg',
    kind: 'low',
    title: ['Volonté réunie · cinq frappes physiques', 'Gathered will · five physical strikes'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'Le scénario fournit trois partisans réels, déjà marqués et consentants, puis attend réellement 480 frames. Lie le revers après K. La route ne tire aucune flèche, ne consomme aucune vie et ne possède pas le mannequin ; tirer reste une action séparée soumise à ses conditions.',
      'The scenario supplies three real, already marked consenting supporters, then actually waits 480 frames. Link the backfist after K. The route fires no arrow, spends no life and never possesses the dummy; shooting remains a separate conditional action.',
    ],
    setup: 'cohort-ready',
  },
  {
    id: 'yokotani:economy',
    fighter: 'yokotani',
    kind: 'confirm',
    title: ['Économie · balayage proche', 'Economy · nearby sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le balayage termine au sol près de la cible.',
      'No aura cost. The sweep knocks down nearby.',
    ],
  },
  {
    id: 'yokotani:carry',
    fighter: 'yokotani',
    kind: 'confirm',
    title: ['Placement · poussée prolongée', 'Position · extended carry'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge puis repousse avec avant + K, avec davantage de récupération. Attends la récupération d’avant + J avant K.',
      'No aura cost. Extend, then carry with forward + K at the cost of longer recovery. Wait for forward + J to recover before K.',
    ],
  },
  {
    id: 'yokotani:precision',
    fighter: 'yokotani',
    kind: 'confirm',
    title: ['Précision · liaison du juriste', 'Precision · legal counsel link'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération d’avant + J pour lier K, puis balaie. Aucune dépense d’aura ; LSDF ne remplace pas la confirmation de touche.',
      'Wait for forward + J to recover before linking K, then sweep. No aura cost; LSDF never replaces hit confirmation.',
    ],
  },
  {
    id: 'yokotani:five-strikes',
    fighter: 'yokotani',
    kind: 'low',
    title: ['Cadence · cinq frappes sans LSDF', 'Cadence · five strikes without LSDF'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'backHeavy', 'forwardHeavy'],
    requirement: [
      'Lie K après avant + J, puis le revers après K avant la poussée. Ici, ni planque Heil-Ly ni Morena ni intrus qualifié : aucun garde ne vient entraver le mannequin. Les gardes conservent leur expulsion non violente dans le scénario approprié.',
      'Link K after forward + J, then the backfist after K before the carry. This exercise supplies neither the Heil-Ly hideout, Morena nor a qualified intruder: no guard restrains the dummy. Guards retain their nonviolent expulsion in the appropriate scenario.',
    ],
  },
  {
    id: 'kurapika:recovery-sweep',
    fighter: 'kurapika',
    kind: 'punish',
    title: ['Reprise · liaison puis balayage', 'Recovery · link then sweep'],
    moves: ['backHeavy', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération du revers pour avant + J, puis celle d’avant + J pour K. Le balayage termine près sans aura.',
      'Wait for the backfist to recover before forward + J, then for forward + J to recover before K. Sweep nearby without aura.',
    ],
  },
  {
    id: 'kurapika:recovery-carry',
    fighter: 'kurapika',
    kind: 'punish',
    title: ['Reprise · liaison puis poussée', 'Recovery · link then carry'],
    moves: ['backHeavy', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Attends la récupération du revers pour avant + J, puis celle d’avant + J pour K. La fin avant repousse davantage sans aura.',
      'Wait for the backfist to recover before forward + J, then for forward + J to recover before K. The forward finish carries farther without aura.',
    ],
  },
  {
    id: 'kurapika:recovery-power',
    fighter: 'kurapika',
    kind: 'punish',
    title: ['Reprise · liaison puis fouet', 'Recovery · link into whip'],
    moves: ['backHeavy', 'forwardLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Attends la récupération du revers pour avant + J, puis celle d’avant + J pour K. Termine par fouet pour 24 aura, avec ses conditions de Nen.',
      'Wait for the backfist to recover before forward + J, then for forward + J to recover before K. Finish with whip for 24 aura, subject to Nen availability.',
    ],
  },
  {
    id: 'kurapika:extended-recovery',
    fighter: 'kurapika',
    kind: 'confirm',
    title: ['Reprise prolongée · cinq frappes', 'Extended recovery · five strikes'],
    moves: ['standingLight', 'backHeavy', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Confirme J vers le revers. Attends la récupération du revers pour avant + J, puis celle d’avant + J pour K. Termine au sol sans aura ; aucune chaîne de contrôle n’est implantée.',
      'Confirm J into the backfist. Wait for the backfist to recover before forward + J, then for forward + J to recover before K. Knock down without aura; no control chain is implanted.',
    ],
  },
  {
    id: 'benjamin:recovery-sweep',
    fighter: 'benjamin',
    kind: 'punish',
    title: ['Reprise · liaison puis balayage', 'Recovery · link then sweep'],
    moves: ['backHeavy', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Attends la récupération du revers pour avant + J, puis confirme K par cancel. Le balayage termine près sans aura.',
      'Wait for the backfist to recover before forward + J, then confirm K by cancelling. Sweep nearby without aura.',
    ],
  },
  {
    id: 'benjamin:recovery-carry',
    fighter: 'benjamin',
    kind: 'punish',
    title: ['Reprise · liaison puis poussée', 'Recovery · link then carry'],
    moves: ['backHeavy', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Attends la récupération du revers pour avant + J, puis confirme K par cancel. La fin avant repousse davantage sans aura.',
      'Wait for the backfist to recover before forward + J, then confirm K by cancelling. The forward finish carries farther without aura.',
    ],
  },
  {
    id: 'benjamin:recovery-power',
    fighter: 'benjamin',
    kind: 'punish',
    title: ['Reprise · liaison puis Air Blow', 'Recovery · link into Air Blow'],
    moves: ['backHeavy', 'forwardLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Attends la récupération du revers pour avant + J, puis confirme K par cancel. Termine par Air Blow pour 40 aura, avec ses conditions de Nen et d’héritage.',
      'Wait for the backfist to recover before forward + J, then confirm K by cancelling. Finish with Air Blow for 40 aura, subject to Nen and inheritance conditions.',
    ],
  },
  {
    id: 'benjamin:extended-recovery',
    fighter: 'benjamin',
    kind: 'confirm',
    title: ['Reprise prolongée · cinq frappes', 'Extended recovery · five strikes'],
    moves: ['standingLight', 'backHeavy', 'forwardLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme J vers le revers. Attends la récupération du revers pour avant + J, puis confirme K par cancel. Air Blow coûte 40 aura et exige toujours son héritage ; aucune capacité n’est obtenue par ces frappes.',
      'Confirm J into the backfist. Wait for the backfist to recover before forward + J, then confirm K by cancelling. Air Blow costs 40 aura and still requires inheritance; these strikes grant no ability.',
    ],
  },
]
