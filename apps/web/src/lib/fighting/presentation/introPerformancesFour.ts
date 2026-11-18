import { introPose as pose, type IntroPerformance } from './introPerformanceTypes'

export const INTRO_PERFORMANCES_FOUR = {
  furykov: {
    intention:
      'Examine la silhouette adverse de haut en bas puis referme sa garde avec la confiance d’un spécialiste.',
    poses: [
      pose([-1, -1.9, 0.16], [-0.5, -1.1, -0.2], { head: [0.2, 0.2, -0.06] }),
      pose([-0.7, -1.2, 0.2], [-0.6, -1.3, -0.2], {
        head: [-0.16, -0.15, 0.08],
        chest: [-0.04, -0.3, 0],
      }),
      pose([-0.8, -1.3, 0.16], [-0.7, -1.5, -0.22], { body: [0.06, 0, 0], head: [-0.04, 0.1, 0] }),
    ],
    camera: [
      [0.2, 2.85, 5.2, 1.6],
      [0.62, 1.65, 4.6, 1.5],
      [0.92, 1.25, 5, 1.35],
    ],
    beats: [0.29, 0.62, 0.88],
  },
  cluck: {
    intention:
      'Assure son chapeau d’une main, pivote les épaules puis libère un geste vif du poignet.',
    poses: [
      pose([-2, -1.5, 0.45], [-0.2, -0.6, -0.2], { head: [0.12, 0.1, 0.08] }),
      pose([-1.1, -0.7, 0.65], [-0.7, -1.4, -0.35], {
        leadWrist: [-0.55, 0.35, 0],
        chest: [0.02, -0.45, 0],
        head: [-0.06, 0.15, -0.06],
      }),
      pose([-0.85, -1.05, 0.35], [-0.6, -1.35, -0.3], { body: [0.06, 0, 0], head: [0.02, 0, 0] }),
    ],
    camera: [
      [0.85, 2.95, 5.2, 1.65],
      [0.5, 2, 4.5, 1.5],
      [0.12, 1.45, 5, 1.35],
    ],
    beats: [0.21, 0.55, 0.83],
  },
  beyond: {
    intention:
      'Passe la main dans sa barbe, ouvre largement le torse puis invite le danger avec assurance.',
    poses: [
      pose([-1.15, -1.9, 0.25], [-0.3, -0.7, -0.25], { head: [0.1, 0.15, 0.06] }),
      pose([-0.65, -0.6, 0.85], [-0.6, -0.65, -0.8], {
        chest: [-0.18, -0.2, 0],
        head: [-0.18, 0, -0.08],
        body: [-0.08, 0, 0],
      }),
      pose([-0.95, -0.8, 0.45], [-0.6, -1.25, -0.4], { body: [0.08, 0, 0], head: [-0.1, 0.12, 0] }),
    ],
    camera: [
      [0.12, 0.6, 6, 1.65],
      [0.65, 1.15, 5.3, 1.8],
      [1.05, 1.8, 5.7, 1.6],
    ],
    beats: [0.25, 0.58, 0.86],
  },
  longhi: {
    intention:
      'Replace sa manche, propose une poignée de main mesurée puis la retire pour prendre position.',
    poses: [
      pose([-0.6, -1.3, 0.12], [-0.8, -1.6, -0.08], {
        head: [0.18, 0, 0],
        rearWrist: [0.25, 0.1, 0],
      }),
      pose([-0.85, -0.45, 0.2], [-0.35, -0.8, -0.18], {
        leadWrist: [0, 0.4, 0.1],
        head: [-0.06, 0.12, 0],
        chest: [0.03, -0.22, 0],
      }),
      pose([-0.75, -1.25, 0.18], [-0.6, -1.35, -0.18], { body: [0.04, 0, 0], head: [0, 0.08, 0] }),
    ],
    camera: [
      [0.95, 1.65, 4.9, 1.3],
      [0.6, 1.45, 4.3, 1.3],
      [0.25, 2.1, 4.8, 1.45],
    ],
    beats: [0.24, 0.6, 0.87],
  },
  musse: {
    intention:
      'Contrôle son poignet, balaie discrètement les abords du regard puis revient à une garde de service.',
    poses: [
      pose([-0.55, -1.2, 0.15], [-0.85, -1.7, -0.1], { head: [0.2, 0.08, 0] }),
      pose([-0.7, -1.25, 0.16], [-0.65, -1.35, -0.18], {
        head: [0.03, -0.35, 0],
        chest: [0.04, 0.15, 0],
      }),
      pose([-0.85, -1.4, 0.18], [-0.7, -1.5, -0.18], {
        head: [-0.05, 0.15, 0],
        body: [0.07, 0, 0],
      }),
    ],
    camera: [
      [0.25, 2.7, 5.1, 1.55],
      [0.85, 2.15, 4.5, 1.5],
      [0.62, 1.7, 4.9, 1.35],
    ],
    beats: [0.2, 0.58, 0.85],
  },
  padaille: {
    intention:
      'Examine sa main naturelle, étire ses articulations puis serre le poing sans transformer son corps.',
    poses: [
      pose([-0.65, -1.2, 0.35], [-0.3, -0.7, -0.25], {
        head: [0.23, 0.12, 0],
        leadWrist: [-0.45, 0.35, 0.1],
      }),
      pose([-0.95, -1.5, 0.45], [-0.65, -1.35, -0.3], {
        leadWrist: [0.5, -0.25, -0.1],
        head: [-0.08, 0, -0.1],
        chest: [0.08, -0.3, 0],
      }),
      pose([-0.85, -1.35, 0.3], [-0.75, -1.5, -0.28], {
        body: [0.15, 0, 0],
        leadKnee: [0.3, 0, 0],
      }),
    ],
    camera: [
      [0.1, 1.1, 5, 1.2],
      [0.55, 1.9, 4.4, 1.45],
      [0.9, 1.25, 4.9, 1.3],
    ],
    beats: [0.28, 0.57, 0.84],
  },
  sayird: {
    intention: 'Rectifie son uniforme, salue brièvement puis rejoint une garde disciplinée.',
    poses: [
      pose([-0.9, -1.65, 0.18], [-0.85, -1.6, -0.18], { head: [0.13, 0, 0] }),
      pose([-1.85, -1.85, 0.25], [-0.15, -0.35, -0.1], {
        chest: [-0.05, -0.1, 0],
        head: [-0.05, 0.08, 0],
      }),
      pose([-0.75, -1.25, 0.15], [-0.65, -1.4, -0.18], { body: [0.04, 0, 0], head: [0.02, 0, 0] }),
    ],
    camera: [
      [0.75, 2.35, 5, 1.5],
      [0.45, 1.7, 4.4, 1.5],
      [0.15, 1.4, 4.8, 1.3],
    ],
    beats: [0.18, 0.48, 0.81],
  },
  terebellum: {
    intention:
      'Observe ses deux paumes, les oppose avec précision puis stabilise une garde aux mains ouvertes.',
    poses: [
      pose([-0.75, -1.2, 0.4], [-0.75, -1.2, -0.4], {
        head: [0.22, 0, 0],
        leadWrist: [-0.5, 0.2, 0],
        rearWrist: [-0.5, -0.2, 0],
      }),
      pose([-1.05, -0.9, 0.2], [-0.9, -1.1, -0.2], {
        leadWrist: [-0.65, 0, 0],
        rearWrist: [-0.55, 0, 0],
        chest: [0.05, -0.25, 0],
        head: [-0.06, 0.1, 0],
      }),
      pose([-0.9, -1.1, 0.25], [-0.7, -1.3, -0.25], { body: [0.1, 0, 0], head: [0.01, 0, 0] }),
    ],
    camera: [
      [0.1, 2.4, 5.1, 1.35],
      [0.52, 1.45, 4.4, 1.3],
      [0.98, 1.95, 4.9, 1.45],
    ],
    beats: [0.27, 0.6, 0.86],
  },
  voconte: {
    intention:
      'Arrange ses revers, indique la voie d’un geste de guide puis cède poliment la première initiative.',
    poses: [
      pose([-0.95, -1.5, 0.22], [-0.95, -1.5, -0.22], { head: [0.1, 0, 0.04] }),
      pose([-0.85, -0.45, 0.75], [0.15, -0.55, -0.2], {
        leadWrist: [-0.3, 0.45, 0.12],
        body: [0.1, 0, 0],
        head: [-0.07, 0.2, -0.08],
      }),
      pose([-0.65, -1.1, 0.3], [-0.5, -1.25, -0.2], { chest: [0.02, -0.3, 0], head: [0, 0.1, 0] }),
    ],
    camera: [
      [1.05, 1.95, 5.1, 1.45],
      [0.55, 1.25, 4.5, 1.25],
      [0.08, 2, 5, 1.4],
    ],
    beats: [0.25, 0.62, 0.87],
  },
  yokotani: {
    intention:
      'Redresse sa cravate, lève un doigt pour rappeler la règle puis attend, impeccablement droit.',
    poses: [
      pose([-1.05, -1.85, 0.12], [-0.25, -0.6, -0.15], { head: [0.12, 0, 0] }),
      pose([-1.3, -1.5, 0.18], [-0.3, -0.7, -0.16], {
        leadWrist: [-0.15, 0.2, 0],
        head: [-0.1, 0.15, -0.04],
        chest: [-0.05, -0.18, 0],
      }),
      pose([-0.55, -1, 0.15], [-0.5, -1.15, -0.18], { body: [-0.04, 0, 0], head: [-0.04, 0, 0] }),
    ],
    camera: [
      [0.3, 1.05, 5.2, 1.4],
      [0.65, 1.85, 4.5, 1.6],
      [0.95, 2.2, 5, 1.45],
    ],
    beats: [0.26, 0.64, 0.9],
  },
} satisfies Record<string, IntroPerformance>
