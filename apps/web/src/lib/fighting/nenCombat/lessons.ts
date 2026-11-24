import type { FightLesson } from '../fightLessons'
export type NenCombatLessonId =
  'en-intercept' | 'in-ambush' | 'gyo-body' | 'ko-defense' | 'shu-ko' | 'ryu-switch'
export const NEN_COMBAT_LESSONS: readonly FightLesson[] = [
  {
    id: 'en-intercept',
    fighter: 'hinrigh',
    opponent: 'franklin',
    title: ['En : intercepter sans la vue', 'En: intercept without sight'],
    steps: [
      [
        'La vue est scellée dans cet exercice. Maintiens En (V + J, ou View + croix haut) et observe le contour d’un projectile entrant.',
        'Sight is sealed in this exercise. Hold En (V + J, or View + D-pad up) and observe an incoming projectile contour.',
      ],
      [
        'Maintiens En et commence ta garde ({guard}) juste avant le contact pour parer manuellement le projectile.',
        'Keep En held and start guarding ({guard}) just before contact to manually parry the projectile.',
      ],
    ],
    takeaway: [
      'En permet de sentir et de préparer une réponse ; la garde et son timing restent les tiens. Le projectile utilisé ici n’est pas dissimulé par In.',
      'En lets you sense and prepare a response; guarding and timing remain yours. This exercise’s projectile is not concealed with In.',
    ],
  },
  {
    id: 'in-ambush',
    fighter: 'franklin',
    opponent: 'hinrigh',
    title: ['In : dissimuler un tir de Nen', 'In: conceal a Nen shot'],
    steps: [
      [
        'Maintiens In (V + K, ou View + croix bas). Ton corps reste visible ; seule l’aura dissimulable est cachée.',
        'Hold In (V + K, or View + D-pad down). Your body remains visible; only concealable aura is hidden.',
      ],
      [
        'En gardant In, tire ({ranged}) et touche le mannequin avec un projectile effectivement dissimulé.',
        'Keep In held, fire ({ranged}) and hit the dummy with an actually concealed projectile.',
      ],
    ],
    takeaway: [
      'Un projectile émis conserve son In après le départ. En seul ne le révèle pas ; Gyo oculaire le voit. Le tir conserve ses coûts, son trajet et ses collisions.',
      'A released projectile retains its In. En alone does not reveal it; ocular Gyo sees it. The shot keeps its costs, trajectory and collisions.',
    ],
  },
  {
    id: 'gyo-body',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Gyo : choisir entre voir et renforcer', 'Gyo: choose sight or reinforcement'],
    steps: [
      [
        'Cible les mains sans Aura ni Garde (V + M, ou R3 + croix gauche). Observe les autres zones moins protégées.',
        'Target the hands without Aura or Guard (V + M, or R3 + D-pad left). Observe the more exposed other zones.',
      ],
      [
        'Garde cette concentration et touche avec un léger ({light}). Un geste sans collision ne valide pas l’exercice.',
        'Keep this focus and land a light ({light}). A move without an actual collision does not complete the exercise.',
      ],
    ],
    takeaway: [
      'Le Gyo des mains renforce leur aura mais retire la lecture oculaire de In. Relâche la zone en gardant Gyo pour revenir aux yeux. 70/10 % sont les réglages de Clash.',
      'Hand-focused Gyo reinforces their aura but removes ocular reading of In. Release the zone while holding Gyo to return to the eyes. 70/10% are Clash tuning.',
    ],
  },
  {
    id: 'ko-defense',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Ko : défendre une seule zone', 'Ko: defend one zone'],
    steps: [
      [
        'Engage Ko à la tête : Aura + Garde + Gyo + Tête. Vingt unités d’aura sont payées à l’engagement, sans coût répété à chaque frame.',
        'Commit head Ko: Aura + Guard + Gyo + Head. Twenty aura is paid on commitment, not every frame.',
      ],
      [
        'Garde cette zone pendant une attaque légère réelle du mannequin. Les autres zones ont perdu toute protection d’aura.',
        'Keep this zone during a real light attack from the dummy. Other zones have lost all aura protection.',
      ],
    ],
    takeaway: [
      'Une bonne lecture concentre la défense ; se tromper de zone expose tout le reste. Ko ne déclenche ni garde ni parade à ta place.',
      'A correct read concentrates defense; choosing the wrong zone exposes everything else. Ko never guards or parries for you.',
    ],
  },
  {
    id: 'shu-ko',
    fighter: 'hisoka',
    opponent: 'phinks',
    title: ['Shu + Ko : engager son arme', 'Shu + Ko: commit your weapon'],
    steps: [
      [
        'Maintiens Shu (V + L ou View + croix gauche) sur les cartes réelles d’Hisoka.',
        'Hold Shu (V + L or View + D-pad left) on Hisoka’s real cards.',
      ],
      [
        'En gardant Shu, engage Ko dans les mains : Aura + Garde + Gyo + Mains.',
        'Keep Shu held and commit hand Ko: Aura + Guard + Gyo + Hands.',
      ],
      [
        'Garde Shu et Ko engagés, ajoute un léger ({light}), puis relâche Aura/Garde après le départ du geste.',
        'Keep Shu and Ko committed, add a light ({light}), then release Aura/Guard after the move starts.',
      ],
    ],
    takeaway: [
      'Shu étend l’aura à l’arme ; Ko concentre l’engagement. Le corps reste exposé ailleurs. Aucun outil ni nouveau pouvoir n’est fourni.',
      'Shu extends aura to the weapon; Ko concentrates the commitment. The rest of the body stays exposed. No tool or new ability is supplied.',
    ],
  },
  {
    id: 'ryu-switch',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Ryu : passer de l’attaque à la défense', 'Ryu: switch offense to defense'],
    steps: [
      [
        'Maintiens Aura puis cible les mains (V + M, ou R3 + croix gauche sur Xbox) pour concentrer Ryu.',
        'Hold Aura and target the hands (V + M, or R3 + D-pad left on Xbox) to focus Ryu.',
      ],
      [
        'Déplace la répartition vers la tête sous Aura (V + U, ou R3 + croix haut), puis garde cette zone.',
        'Shift Aura allocation to the head (V + U, or R3 + D-pad up), then guard that zone.',
      ],
      [
        'Bloque effectivement un léger du mannequin avec la tête renforcée. Un changement de pourcentage seul ne suffit pas.',
        'Actually block a dummy light with reinforced head aura. Changing percentages alone is insufficient.',
      ],
    ],
    takeaway: [
      'Ryu ajuste l’attaque et la défense en temps réel. La zone renforcée protège davantage, les autres moins ; Gyo peut révéler ce déplacement.',
      'Ryu adjusts offense and defense in real time. The reinforced zone protects more, the others less; Gyo can reveal that movement.',
    ],
  },
]
