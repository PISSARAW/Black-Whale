import { introPose as pose, type IntroPerformance } from './introPerformanceTypes'

export const INTRO_PERFORMANCES_THREE = {
  rihan: {
    intention:
      'Porte une main au menton, change son angle d’observation puis arrête son analyse en une garde compacte.',
    poses: [
      pose([-1.2, -2, 0.15], [-0.55, -1.35, -0.16], { head: [0.16, 0.18, -0.06] }),
      pose([-0.85, -1.4, 0.15], [-0.65, -1.35, -0.18], {
        chest: [0.08, -0.4, 0],
        head: [-0.04, -0.22, 0],
      }),
      pose([-0.75, -1.45, 0.16], [-0.7, -1.45, -0.18], {
        body: [0.08, 0, 0],
        head: [0.03, 0.1, 0],
      }),
    ],
    camera: [
      [0.1, 2.4, 5, 1.5],
      [0.55, 2.05, 4.4, 1.5],
      [1.05, 1.6, 4.8, 1.4],
    ],
    beats: [0.31, 0.63, 0.88],
  },
  zakuro: {
    intention:
      'Examine son poignet, replie ses doigts avec soin puis relève une main assurée, sans produire de sang.',
    poses: [
      pose([-0.6, -1.2, 0.18], [-0.85, -1.75, -0.1], {
        head: [0.25, 0.08, 0],
        leadWrist: [0.5, 0.15, 0],
      }),
      pose([-1.1, -1.3, 0.35], [-0.5, -1.1, -0.25], {
        head: [-0.07, 0.16, -0.08],
        leadWrist: [-0.4, -0.25, 0.2],
        chest: [0, -0.3, 0],
      }),
      pose([-0.8, -1.2, 0.2], [-0.6, -1.3, -0.22], { body: [0.04, 0, 0], head: [0.03, 0, 0] }),
    ],
    camera: [
      [0.85, 1.15, 4.8, 1.15],
      [0.45, 1.85, 4.2, 1.45],
      [0.18, 2.05, 4.7, 1.35],
    ],
    beats: [0.26, 0.57, 0.85],
  },
  melody: {
    intention:
      'Se pose à l’écoute, incline la tête puis accompagne une expiration d’une paume apaisante.',
    poses: [
      pose([-0.7, -1.5, 0.16], [-0.65, -1.45, -0.15], {
        head: [0.12, 0.25, 0.15],
        chest: [-0.06, 0, 0],
      }),
      pose([-0.95, -0.7, 0.4], [-0.5, -1.1, -0.25], {
        head: [-0.03, -0.1, 0.08],
        leadWrist: [-0.45, 0.12, 0],
        body: [-0.03, 0, 0],
      }),
      pose([-0.65, -1.2, 0.25], [-0.6, -1.2, -0.25], {
        chest: [0.02, -0.12, 0],
        head: [0.02, 0, 0.04],
      }),
    ],
    camera: [
      [0.9, 2.1, 4.6, 1.1],
      [0.65, 1.65, 4.2, 1.15],
      [0.4, 1.45, 4.7, 1.05],
    ],
    beats: [0.3, 0.64, 0.9],
  },
  basho: {
    intention:
      'Marque une réflexion de poète, dessine une ligne du bout des doigts puis ouvre une garde solide.',
    poses: [
      pose([-1.1, -1.9, 0.2], [-0.5, -1, -0.22], { head: [0.18, 0, -0.08] }),
      pose([-0.85, -0.6, 0.6], [-0.6, -1.3, -0.2], {
        leadWrist: [0.1, 0.35, -0.2],
        chest: [0.04, -0.35, 0],
        head: [-0.07, 0.15, 0],
      }),
      pose([-0.8, -1.25, 0.35], [-0.7, -1.35, -0.35], {
        body: [0.12, 0, 0],
        leadKnee: [0.3, 0, 0],
      }),
    ],
    camera: [
      [0.35, 2.55, 5.1, 1.55],
      [0.8, 1.8, 4.6, 1.4],
      [1, 1.3, 5.2, 1.35],
    ],
    beats: [0.28, 0.6, 0.86],
  },
  camilla: {
    intention:
      'Inspecte ses ongles, rejette la main avec impatience puis attend que l’adversaire ose avancer.',
    poses: [
      pose([-1.25, -1.4, 0.4], [0.18, -0.5, -0.35], {
        head: [0.15, 0.18, -0.1],
        leadWrist: [-0.65, 0.3, 0.15],
      }),
      pose([-0.65, -0.75, 0.85], [0.25, -0.6, -0.3], {
        head: [-0.2, -0.12, 0.15],
        chest: [-0.1, -0.4, 0],
        leadWrist: [0.65, -0.2, 0.1],
      }),
      pose([-0.5, -0.8, 0.45], [0.15, -0.65, -0.3], {
        body: [-0.1, 0, 0],
        head: [-0.13, 0.08, 0.1],
      }),
    ],
    camera: [
      [0.15, 2.9, 5.1, 1.55],
      [0.55, 1.4, 4.4, 1.5],
      [0.95, 1.1, 4.9, 1.45],
    ],
    beats: [0.32, 0.56, 0.89],
  },
  halkenburg: {
    intention:
      'Pose la main sur le cœur, s’incline légèrement puis se redresse avec une détermination calme.',
    poses: [
      pose([-0.8, -1.9, 0.02], [-0.1, -0.3, -0.1], { head: [0.08, 0, 0] }),
      pose([-0.75, -1.85, 0.04], [-0.15, -0.35, -0.1], { body: [0.18, 0, 0], head: [0.15, 0, 0] }),
      pose([-0.65, -1.2, 0.18], [-0.55, -1.35, -0.2], {
        chest: [-0.08, -0.18, 0],
        head: [-0.08, 0.1, 0],
      }),
    ],
    camera: [
      [0.85, 2.65, 5.3, 1.55],
      [0.5, 1.85, 4.7, 1.45],
      [0.2, 1.15, 5.1, 1.5],
    ],
    beats: [0.22, 0.59, 0.87],
  },
  gel: {
    intention:
      'Détend son poignet, conduit un mouvement sinueux de l’avant-bras puis suspend sa garde.',
    poses: [
      pose([-0.75, -1.4, 0.4], [-0.4, -1, -0.3], {
        leadWrist: [0.65, 0.25, 0.2],
        head: [0.06, 0, 0.12],
      }),
      pose([-1.15, -0.85, 0.65], [-0.7, -1.4, -0.4], {
        chest: [0.04, -0.45, 0.06],
        leadWrist: [-0.6, -0.3, -0.15],
        head: [-0.05, 0.18, -0.08],
      }),
      pose([-0.85, -1.15, 0.4], [-0.55, -1.4, -0.3], {
        body: [0.03, 0, 0.04],
        leadWrist: [0.22, 0, 0],
      }),
    ],
    camera: [
      [0.05, 1.65, 4.8, 1.3],
      [0.6, 2.35, 4.3, 1.5],
      [1.05, 1.45, 4.9, 1.3],
    ],
    beats: [0.25, 0.6, 0.85],
  },
  lynch: {
    intention:
      'Serre le poing, le frappe dans sa paume puis avance le menton comme une question provocante.',
    poses: [
      pose([-0.7, -1.45, 0.2], [-0.8, -1.55, -0.15], {
        head: [0.12, 0.1, -0.1],
        leadWrist: [0.3, 0, 0],
      }),
      pose([-1, -1.7, 0.02], [-0.95, -1.6, -0.05], {
        body: [0.15, 0, 0],
        head: [-0.15, 0.12, 0],
        chest: [0.1, -0.2, 0],
      }),
      pose([-1.05, -1.4, 0.3], [-0.8, -1.65, -0.25], { body: [0.14, 0, 0], head: [-0.08, 0, 0] }),
    ],
    camera: [
      [0.9, 2.2, 4.8, 1.4],
      [0.45, 0.95, 4.2, 1.3],
      [0.1, 1.35, 4.7, 1.25],
    ],
    beats: [0.18, 0.47, 0.8],
  },
  luini: {
    intention:
      'Jette un regard par-dessus l’épaule, désigne un passage imaginaire puis se retourne vers le duel.',
    poses: [
      pose([-0.35, -0.8, 0.2], [-0.2, -0.6, -0.2], {
        chest: [0.04, 0.28, 0],
        head: [0.02, -0.45, 0],
      }),
      pose([-1.05, -0.55, 0.55], [0.15, -0.5, -0.25], {
        leadWrist: [-0.25, 0.35, 0],
        chest: [0.04, -0.5, 0],
        head: [-0.08, 0.2, 0.08],
      }),
      pose([-0.75, -1.1, 0.22], [-0.55, -1.2, -0.2], { body: [0.08, 0, 0], head: [0, 0.1, 0] }),
    ],
    camera: [
      [0.02, 2.3, 5, 1.45],
      [0.65, 1.3, 4.4, 1.3],
      [1.12, 1.85, 4.9, 1.4],
    ],
    beats: [0.26, 0.58, 0.86],
  },
  bill: {
    intention:
      'Ajuste sa veste, montre une paume rassurante puis s’ancre pour protéger sa position.',
    poses: [
      pose([-0.85, -1.5, 0.2], [-0.8, -1.5, -0.2], { head: [0.12, 0, 0] }),
      pose([-0.95, -0.7, 0.3], [-0.5, -1.2, -0.2], {
        leadWrist: [-0.55, 0, 0],
        head: [-0.05, 0.12, 0],
        chest: [-0.03, -0.15, 0],
      }),
      pose([-0.8, -1.2, 0.3], [-0.65, -1.35, -0.25], {
        body: [0.13, 0, 0],
        leadHip: [-0.3, 0, 0.08],
        leadKnee: [0.45, 0, 0],
      }),
    ],
    camera: [
      [0.8, 1.8, 5, 1.4],
      [0.48, 1.55, 4.5, 1.3],
      [0.15, 1.05, 4.9, 1.25],
    ],
    beats: [0.23, 0.61, 0.84],
  },
} satisfies Record<string, IntroPerformance>
