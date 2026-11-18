import { introPose as pose, type IntroPerformance } from './introPerformanceTypes'

export const INTRO_PERFORMANCES_ONE = {
  kurapika: {
    intention: 'Resserre son poignet droit, relève les yeux et présente sa garde avec précision.',
    poses: [
      pose([-0.65, -1.3, 0.18], [-0.9, -1.8, -0.05], {
        head: [0.24, 0, 0],
        rearWrist: [0.28, 0, 0],
      }),
      pose([-1.05, -0.65, 0.16], [-0.5, -1.6, -0.2], {
        chest: [0.04, -0.3, 0],
        head: [-0.08, 0.12, 0],
      }),
      pose([-0.8, -1.4, 0.12], [-0.5, -1.8, -0.18], {
        body: [0.06, 0, 0],
        leadWrist: [0.24, 0, 0],
      }),
    ],
    camera: [
      [0.12, 1.15, 4.4, 1.2],
      [0.58, 1.9, 4.1, 1.42],
      [0.8, 1.7, 4.7, 1.3],
    ],
    beats: [0.22, 0.56, 0.82],
  },
  hisoka: {
    intention: 'Incline la tête, fait rouler son poignet et invite son adversaire à approcher.',
    poses: [
      pose([-0.7, -1.5, 0.35], [0.22, -0.2, -0.2], {
        body: [-0.12, 0, 0.04],
        head: [0.12, 0.18, -0.2],
        leadWrist: [0.6, 0.45, 0.2],
      }),
      pose([-1.15, -0.48, 0.3], [0.28, -0.45, -0.38], {
        chest: [-0.1, -0.55, 0.08],
        head: [-0.1, -0.12, -0.16],
        leadWrist: [-0.65, -0.35, 0.1],
      }),
      pose([-0.4, -0.95, 0.32], [-0.15, -0.55, -0.25], {
        body: [-0.08, 0, 0.06],
        head: [0.08, 0, 0.18],
      }),
    ],
    camera: [
      [0.05, 2.65, 4.7, 1.48, -0.045],
      [0.65, 1.25, 4.1, 1.4, 0.035],
      [1.02, 1.75, 4.5, 1.35, 0],
    ],
    beats: [0.18, 0.63, 0.86],
  },
  chrollo: {
    intention:
      'Ajuste lentement son col puis accueille le duel d’une paume ouverte, parfaitement calme.',
    poses: [
      pose([-1.15, -1.85, 0.15], [-0.5, -1.2, -0.12], { head: [0.13, 0, 0], chest: [0, -0.16, 0] }),
      pose([-0.85, -0.55, 0.5], [-0.55, -1.3, -0.18], {
        leadWrist: [-0.35, 0.4, 0.15],
        head: [-0.06, 0.15, -0.04],
      }),
      pose([-0.45, -0.9, 0.18], [-0.6, -1.3, -0.2], { body: [-0.02, 0, 0], chest: [0, -0.24, 0] }),
    ],
    camera: [
      [0.95, 2.1, 4.9, 1.5],
      [0.62, 1.95, 4.3, 1.48],
      [0.38, 1.85, 4.6, 1.4],
    ],
    beats: [0.3, 0.65, 0.88],
  },
  benjamin: {
    intention: 'Se redresse, salue militairement puis abaisse la main comme un ordre de départ.',
    poses: [
      pose([-0.2, -0.3, 0.1], [-0.15, -0.3, -0.1], {
        body: [-0.09, 0, 0],
        chest: [-0.12, 0, 0],
        head: [-0.1, 0, 0],
      }),
      pose([-1.95, -1.9, 0.3], [0.08, -0.18, -0.12], {
        chest: [-0.1, -0.12, 0],
        head: [-0.07, 0, 0],
      }),
      pose([-0.9, -0.45, 0.18], [-0.55, -1.4, -0.22], { body: [0.06, 0, 0], head: [0.02, 0.1, 0] }),
    ],
    camera: [
      [0.75, 0.65, 5.4, 1.4],
      [0.55, 0.95, 4.8, 1.7],
      [0.3, 1.4, 5.2, 1.45],
    ],
    beats: [0.18, 0.46, 0.77],
  },
  tserriednich: {
    intention: 'Jauge son adversaire, joint les mains dans le dos et relève le menton avec dédain.',
    poses: [
      pose([-0.5, -1.1, 0.2], [-0.3, -0.8, -0.16], {
        head: [0.08, 0.32, 0.08],
        body: [-0.05, 0, 0],
      }),
      pose([0.52, -0.8, 0.12], [0.48, -0.85, -0.12], {
        chest: [-0.08, -0.22, 0],
        head: [-0.18, -0.15, 0.1],
      }),
      pose([0.35, -0.6, 0.08], [0.38, -0.65, -0.08], {
        head: [-0.12, 0.08, 0],
        body: [-0.08, 0, 0],
      }),
    ],
    camera: [
      [0.2, 2.6, 4.9, 1.55],
      [0.5, 1.55, 4.3, 1.55],
      [0.85, 1.05, 4.8, 1.5],
    ],
    beats: [0.25, 0.61, 0.89],
  },
  feitan: {
    intention: 'Remonte son col, ferme sa silhouette puis descend sur ses appuis, prêt à bondir.',
    poses: [
      pose([-1.45, -1.9, 0.12], [-0.3, -0.6, -0.1], {
        head: [0.22, 0.15, 0],
        chest: [0.06, -0.16, 0],
      }),
      pose([-0.6, -1.35, 0.08], [0.12, -0.65, -0.13], {
        body: [0.3, 0, 0],
        head: [-0.18, 0, 0],
        leadHip: [-0.55, 0, 0.12],
        leadKnee: [0.8, 0, 0],
        rearHip: [-0.25, 0, -0.08],
        rearKnee: [0.45, 0, 0],
      }),
      pose([-0.75, -1.4, 0.12], [-0.15, -0.85, -0.12], {
        body: [0.2, 0, 0],
        head: [-0.12, 0.08, 0],
      }),
    ],
    camera: [
      [0.9, 1.8, 4.4, 1.1],
      [0.45, 0.62, 3.9, 1.05],
      [0.15, 0.9, 4.5, 1.1],
    ],
    beats: [0.19, 0.48, 0.79],
  },
  saiyu: {
    intention:
      'Détend son cou, roule une épaule puis pose une garde souple de pratiquant expérimenté.',
    poses: [
      pose([-0.35, -0.75, 0.4], [-0.2, -0.7, -0.35], {
        head: [0.1, 0.22, 0.2],
        chest: [0, 0.15, 0],
      }),
      pose([-0.8, -0.95, 0.55], [-1.1, -1.5, -0.12], {
        chest: [0.12, -0.4, 0],
        head: [-0.07, -0.15, -0.1],
      }),
      pose([-1.05, -0.75, 0.2], [-0.65, -1.6, -0.2], {
        leadHip: [-0.28, 0, 0.12],
        leadKnee: [0.4, 0, 0],
      }),
    ],
    camera: [
      [0.15, 1.25, 4.9, 1.3],
      [0.8, 2.15, 4.5, 1.42],
      [0.6, 1.7, 4.8, 1.3],
    ],
    beats: [0.21, 0.58, 0.83],
  },
  theta: {
    intention:
      'Vérifie sa manche, observe la ligne adverse et adopte une garde sobre et méthodique.',
    poses: [
      pose([-0.65, -1.25, 0.16], [-0.8, -1.75, -0.15], {
        head: [0.2, 0, 0],
        rearWrist: [0.3, 0.12, 0],
      }),
      pose([-0.85, -1.1, 0.1], [-0.65, -1.6, -0.15], {
        head: [-0.04, 0.26, 0],
        chest: [0.04, -0.18, 0],
      }),
      pose([-0.8, -1.2, 0.12], [-0.7, -1.55, -0.18], { head: [0, 0, 0], body: [0.05, 0, 0] }),
    ],
    camera: [
      [0.82, 1.6, 4.7, 1.25],
      [0.5, 2.15, 4.2, 1.5],
      [0.22, 1.85, 4.7, 1.35],
    ],
    beats: [0.24, 0.54, 0.8],
  },
  biscuit: {
    intention:
      'Offre une pose gracieuse, renverse ses poignets et fait apparaître une garde de boxe décidée.',
    poses: [
      pose([-0.6, -1.6, 0.65], [-0.65, -1.6, -0.65], {
        head: [0.1, 0.1, 0.2],
        chest: [-0.08, -0.25, 0],
      }),
      pose([-1.05, -1.8, 0.28], [-0.95, -1.95, -0.3], {
        head: [-0.12, 0, -0.12],
        body: [0.12, 0, 0],
        leadWrist: [-0.35, 0, 0],
        rearWrist: [-0.3, 0, 0],
      }),
      pose([-0.95, -1.65, 0.18], [-0.85, -1.85, -0.2], {
        leadHip: [-0.3, 0, 0.1],
        leadKnee: [0.45, 0, 0],
      }),
    ],
    camera: [
      [0.3, 2.8, 4.6, 1.25],
      [0.85, 1.35, 4.1, 1.1],
      [0.55, 1.15, 4.5, 1.12],
    ],
    beats: [0.28, 0.55, 0.81],
  },
  phinks: {
    intention:
      'Dérouille une épaule, croise le bras devant le torse puis prend une garde lourde, sans charger son Hatsu.',
    poses: [
      pose([-0.25, -1.1, 0.8], [-0.4, -1.2, -0.18], {
        chest: [0.08, 0.25, 0],
        head: [0.05, 0.12, 0],
      }),
      pose([-1.2, -1.65, -0.2], [-0.8, -1.7, -0.35], {
        chest: [0.1, -0.42, 0],
        head: [-0.08, 0, -0.1],
      }),
      pose([-0.75, -1.3, 0.35], [-0.65, -1.5, -0.3], {
        body: [0.15, 0, 0],
        leadKnee: [0.35, 0, 0],
      }),
    ],
    camera: [
      [0.08, 0.9, 5.3, 1.25],
      [0.7, 1.65, 4.6, 1.5],
      [0.95, 1.35, 5, 1.4],
    ],
    beats: [0.2, 0.57, 0.84],
  },
} satisfies Record<string, IntroPerformance>
