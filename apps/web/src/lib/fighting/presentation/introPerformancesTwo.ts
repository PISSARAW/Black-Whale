import { introPose as pose, type IntroPerformance } from './introPerformanceTypes'

export const INTRO_PERFORMANCES_TWO = {
  franklin: {
    intention:
      'Ouvre ses grandes mains, les referme lentement puis laisse son poids imposer le silence.',
    poses: [
      pose([-0.55, -0.9, 0.65], [-0.55, -0.9, -0.65], {
        head: [0.2, 0, 0],
        leadWrist: [-0.3, 0.3, 0],
        rearWrist: [-0.3, -0.3, 0],
      }),
      pose([-0.9, -1.5, 0.4], [-0.8, -1.55, -0.4], {
        chest: [-0.12, -0.12, 0],
        head: [-0.12, 0, 0],
      }),
      pose([-0.5, -1.05, 0.45], [-0.5, -1.05, -0.45], {
        body: [0.12, 0, 0],
        leadKnee: [0.25, 0, 0],
      }),
    ],
    camera: [
      [0.9, 0.7, 5.9, 1.55],
      [0.55, 1.4, 5.2, 1.7],
      [0.2, 1.1, 5.6, 1.5],
    ],
    beats: [0.25, 0.6, 0.86],
  },
  machi: {
    intention:
      'Ajuste son poignet, étire précisément les doigts puis ramène ses mains au plus près du corps.',
    poses: [
      pose([-0.7, -1.5, 0.15], [-0.95, -1.7, -0.1], {
        head: [0.22, 0, 0],
        leadWrist: [0.45, 0, 0],
      }),
      pose([-1.05, -0.7, 0.35], [-0.85, -1.2, -0.4], {
        chest: [0.04, -0.35, 0],
        leadWrist: [-0.55, 0.3, 0.12],
        head: [-0.05, 0.1, 0],
      }),
      pose([-0.65, -1.35, 0.14], [-0.55, -1.45, -0.18], {
        body: [0.08, 0, 0],
        head: [0.02, 0, -0.05],
      }),
    ],
    camera: [
      [0.25, 1.3, 4.5, 1.18],
      [0.78, 2.15, 4.2, 1.45],
      [0.9, 1.85, 4.6, 1.35],
    ],
    beats: [0.23, 0.59, 0.85],
  },
  illumi: {
    intention:
      'Reste presque immobile, penche la tête puis lève deux doigts sans quitter l’adversaire des yeux.',
    poses: [
      pose([0.08, -0.15, 0.08], [0.08, -0.15, -0.08], { head: [0.03, 0, 0.23] }),
      pose([-1.05, -1.7, 0.1], [0.08, -0.2, -0.08], {
        head: [-0.04, 0.12, -0.18],
        leadWrist: [0.15, 0.3, 0.05],
      }),
      pose([-0.6, -1.1, 0.08], [0.02, -0.3, -0.1], { head: [0, 0, 0.08] }),
    ],
    camera: [
      [1, 2.2, 5.1, 1.6],
      [0.72, 2.05, 4.4, 1.6],
      [0.45, 1.95, 4.8, 1.5],
    ],
    beats: [0.35, 0.68, 0.91],
  },
  kalluto: {
    intention:
      'Lisse sa manche, s’incline avec retenue puis ouvre un bras dans une garde de danse.',
    poses: [
      pose([-0.65, -1.25, 0.16], [-0.8, -1.55, -0.14], {
        head: [0.16, 0, 0],
        rearWrist: [0.22, 0, 0],
      }),
      pose([-0.7, -1.1, 0.75], [-0.55, -1.35, -0.3], {
        body: [0.25, 0, 0],
        head: [0.15, -0.15, 0],
        chest: [0, -0.35, 0],
      }),
      pose([-0.9, -0.9, 0.55], [-0.4, -1.3, -0.25], { head: [-0.06, 0.12, 0], body: [0.04, 0, 0] }),
    ],
    camera: [
      [0.15, 2.5, 4.6, 1.15],
      [0.6, 1.7, 4.1, 1.2],
      [0.95, 1.45, 4.7, 1.15],
    ],
    beats: [0.24, 0.58, 0.87],
  },
  bonolenov: {
    intention:
      'Incline les épaules en rythme, ouvre les bras puis ferme un mouvement de danse sur ses appuis.',
    poses: [
      pose([-0.5, -0.75, 0.6], [-0.65, -1, -0.3], {
        body: [0.08, 0.2, 0.12],
        head: [-0.06, 0, -0.12],
        leadKnee: [0.5, 0, 0],
      }),
      pose([-1.1, -0.65, 0.95], [-0.9, -0.7, -0.9], {
        chest: [-0.08, -0.5, -0.08],
        body: [0.04, -0.25, -0.1],
        head: [0.06, 0.15, 0],
      }),
      pose([-0.75, -1, 0.4], [-0.7, -1.15, -0.4], {
        body: [0.12, 0, 0],
        leadKnee: [0.35, 0, 0],
        rearKnee: [0.28, 0, 0],
      }),
    ],
    camera: [
      [0.02, 1.05, 5.3, 1.25],
      [0.58, 2.4, 4.9, 1.5],
      [1.1, 1.65, 5.2, 1.35],
    ],
    beats: [0.17, 0.5, 0.8],
  },
  shizuku: {
    intention:
      'Remonte ses lunettes, jette un regard distrait de côté puis retrouve son adversaire.',
    poses: [
      pose([-1.75, -1.85, 0.15], [-0.3, -0.75, -0.15], {
        head: [0.1, 0, 0.08],
        leadWrist: [0.1, 0, 0],
      }),
      pose([-0.5, -0.8, 0.18], [-0.4, -0.85, -0.18], {
        head: [0.08, -0.4, -0.1],
        chest: [0, 0.12, 0],
      }),
      pose([-0.7, -1.15, 0.2], [-0.65, -1.2, -0.2], { head: [-0.04, 0.08, 0.04] }),
    ],
    camera: [
      [0.65, 2.65, 4.9, 1.4],
      [0.32, 1.95, 4.4, 1.45],
      [0.08, 1.75, 4.8, 1.3],
    ],
    beats: [0.22, 0.66, 0.89],
  },
  hinrigh: {
    intention:
      'Ajuste ses revers, présente une paume de négociateur puis ferme la discussion en se mettant en garde.',
    poses: [
      pose([-0.95, -1.6, 0.22], [-0.9, -1.55, -0.22], { head: [0.1, 0, -0.04] }),
      pose([-1, -0.55, 0.4], [-0.25, -0.6, -0.15], {
        leadWrist: [-0.45, 0.2, 0],
        chest: [-0.03, -0.3, 0],
        head: [-0.08, 0.1, 0],
      }),
      pose([-0.7, -1.3, 0.25], [-0.6, -1.4, -0.25], { body: [0.06, 0, 0], head: [0.02, 0, 0] }),
    ],
    camera: [
      [0.95, 1.25, 5, 1.4],
      [0.65, 1.95, 4.5, 1.45],
      [0.3, 1.7, 4.9, 1.35],
    ],
    beats: [0.26, 0.6, 0.84],
  },
  mizaistom: {
    intention:
      'Rectifie sa cravate, lève la paume pour imposer le calme puis se tient droit face au duel.',
    poses: [
      pose([-1.05, -1.85, 0.1], [-0.2, -0.4, -0.12], { head: [0.14, 0, 0] }),
      pose([-1.3, -0.6, 0.25], [-0.2, -0.5, -0.12], {
        leadWrist: [-0.7, 0, 0],
        chest: [-0.08, -0.15, 0],
        head: [-0.06, 0, 0],
      }),
      pose([-0.7, -1.1, 0.18], [-0.55, -1.3, -0.18], { body: [-0.03, 0, 0], head: [0, 0.08, 0] }),
    ],
    camera: [
      [0.4, 1.1, 5.2, 1.35],
      [0.72, 1.65, 4.7, 1.6],
      [0.9, 1.85, 5, 1.45],
    ],
    beats: [0.23, 0.55, 0.85],
  },
  leorio: {
    intention:
      'Pousse ses lunettes, pointe l’adversaire avec une protestation énergique puis relève ses poings.',
    poses: [
      pose([-1.9, -1.8, 0.2], [-0.2, -0.4, -0.15], { head: [0.1, 0, 0], body: [-0.05, 0, 0] }),
      pose([-1.2, -0.25, 0.22], [-0.8, -1.3, -0.75], {
        body: [0.2, 0, 0],
        head: [-0.15, 0.1, -0.12],
        chest: [0.1, -0.2, 0],
      }),
      pose([-0.95, -1.5, 0.3], [-0.8, -1.6, -0.3], { body: [0.1, 0, 0], head: [-0.04, 0, 0] }),
    ],
    camera: [
      [0.95, 2.75, 5.4, 1.65],
      [0.45, 1.35, 4.7, 1.5],
      [0.1, 1.6, 5.2, 1.4],
    ],
    beats: [0.18, 0.5, 0.82],
  },
  hanzo: {
    intention:
      'Joint les mains, abaisse son centre de gravité puis écarte les bras en garde de ninja.',
    poses: [
      pose([-1, -1.7, 0.05], [-1, -1.7, -0.05], { head: [0.16, 0, 0], chest: [0.05, 0, 0] }),
      pose([-1.1, -0.7, 0.55], [-0.6, -1.25, -0.5], {
        body: [0.22, 0, 0],
        head: [-0.14, 0.12, 0],
        leadHip: [-0.4, 0, 0.12],
        leadKnee: [0.65, 0, 0],
      }),
      pose([-0.95, -0.85, 0.4], [-0.6, -1.25, -0.35], { body: [0.16, 0, 0], head: [-0.1, 0, 0] }),
    ],
    camera: [
      [0.12, 2.7, 4.8, 1.3],
      [0.65, 0.85, 4.4, 1.15],
      [0.98, 1.25, 4.9, 1.2],
    ],
    beats: [0.24, 0.52, 0.8],
  },
} satisfies Record<string, IntroPerformance>
