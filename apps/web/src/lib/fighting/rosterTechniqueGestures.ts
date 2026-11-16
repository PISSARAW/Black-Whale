import type { Gesture } from './fightGestures'

/** Body gestures only. The effect scenes still decide which real objects/Nen are visible. */
export const TECHNIQUE_GESTURES = {
  observe: {
    windup: { head: [0.06, 0, 0], chest: [-0.03, 0, 0] },
    contact: { head: [0.12, 0, 0], chest: [-0.05, 0, 0], rearElbow: [-0.15, 0, 0] },
    follow: { head: [0.04, 0, 0] },
  },
  zetsu: {
    windup: { head: [0.1, 0, 0], chest: [-0.04, 0, 0] },
    contact: {
      head: [0.16, 0, 0],
      body: [-0.03, 0, 0],
      leadShoulder: [0.08, 0, 0],
      rearShoulder: [0.08, 0, 0],
    },
    follow: { head: [-0.06, 0, 0] },
  },
  needle: {
    windup: { leadShoulder: [0.1, 0, -0.1], leadElbow: [-0.3, 0, 0], leadWrist: [0.5, 0, 0] },
    contact: {
      chest: [0, -0.25, 0],
      leadShoulder: [-0.9, 0, 0.06],
      leadElbow: [1.6, 0, 0],
      leadWrist: [-0.35, 0.15, 0],
    },
    follow: { leadShoulder: [-0.25, 0, 0], leadElbow: [0.4, 0, 0], leadWrist: [0.15, 0, 0] },
  },
  thread: {
    windup: { leadElbow: [-0.25, 0, 0], rearElbow: [-0.2, 0, 0], leadWrist: [0, 0.4, 0] },
    contact: {
      chest: [0, -0.2, 0],
      leadShoulder: [-0.6, 0, 0.55],
      leadElbow: [1.2, 0, 0],
      rearShoulder: [0.2, 0, -0.45],
      rearWrist: [0, -0.4, 0],
    },
    follow: { leadWrist: [0, 0.25, 0], rearElbow: [-0.2, 0, 0] },
  },
  pull: {
    windup: { leadShoulder: [-0.45, 0, 0.2], leadElbow: [1, 0, 0] },
    contact: {
      body: [-0.1, 0, 0],
      chest: [0, 0.3, 0],
      leadShoulder: [0.25, 0, 0.2],
      leadElbow: [-0.3, 0, 0],
      rearElbow: [-0.25, 0, 0],
    },
    follow: { chest: [0, 0.1, 0], leadElbow: [-0.1, 0, 0] },
  },
  fan: {
    windup: { chest: [0, 0.2, 0], leadShoulder: [-0.4, 0, -0.5], leadWrist: [-0.3, 0, 0] },
    contact: {
      chest: [0, -0.35, 0.05],
      leadShoulder: [-0.7, 0, 0.7],
      leadElbow: [0.8, 0, 0],
      leadWrist: [0.4, -0.25, 0],
      rearShoulder: [0.1, 0, -0.3],
    },
    follow: { leadShoulder: [-0.3, 0, 0.4], leadWrist: [0.25, 0, 0] },
  },
  doll: {
    windup: { leadShoulder: [-0.3, 0, -0.2], rearShoulder: [-0.3, 0, 0.2], head: [0.1, 0, 0] },
    contact: {
      leadShoulder: [-0.55, 0, -0.15],
      rearShoulder: [-0.55, 0, 0.15],
      leadElbow: [0.15, 0, 0],
      rearElbow: [0.15, 0, 0],
      leadWrist: [0, 0.35, 0],
      rearWrist: [0, -0.35, 0],
      head: [0.16, 0, 0],
    },
    follow: { head: [0.1, 0, 0] },
  },
  write: {
    windup: { head: [0.16, 0, 0], leadShoulder: [-0.2, 0, 0.05], rearElbow: [-0.2, 0, 0] },
    contact: {
      head: [0.2, 0, 0],
      chest: [0.06, 0, 0],
      leadShoulder: [-0.45, 0, 0.15],
      leadElbow: [0.25, 0, 0],
      leadWrist: [0.3, -0.4, 0],
      rearShoulder: [-0.35, 0, 0.2],
      rearWrist: [-0.3, 0, 0],
    },
    follow: { head: [0.08, 0, 0], leadWrist: [0.1, 0.2, 0] },
  },
  offer: {
    windup: { leadElbow: [-0.2, 0, 0], head: [0.04, 0, 0] },
    contact: {
      leadShoulder: [-0.55, 0, 0.1],
      leadElbow: [0.7, 0, 0],
      leadWrist: [-0.6, 0, 0],
      rearShoulder: [0.1, 0, 0.1],
      chest: [0, -0.08, 0],
    },
    follow: { leadShoulder: [-0.3, 0, 0], leadElbow: [0.35, 0, 0] },
  },
  touch: {
    windup: { leadElbow: [-0.25, 0, 0], leadWrist: [0.25, 0, 0] },
    contact: {
      body: [0.1, 0, 0],
      leadShoulder: [-0.75, 0, -0.08],
      leadElbow: [1.45, 0, 0],
      leadWrist: [-0.55, 0, 0],
      rearElbow: [-0.15, 0, 0],
    },
    follow: { leadShoulder: [-0.3, 0, 0], leadElbow: [0.5, 0, 0] },
  },
  grow: {
    windup: { head: [0.1, 0, 0], leadElbow: [-0.2, 0, 0] },
    contact: {
      chest: [0.1, 0, 0],
      head: [0.16, 0, 0],
      leadShoulder: [-0.5, 0, 0.2],
      leadElbow: [0.65, 0, 0],
      leadWrist: [-0.7, 0, 0],
      rearShoulder: [-0.25, 0, -0.2],
      rearWrist: [-0.5, 0, 0],
    },
    follow: { leadElbow: [0.25, 0, 0], head: [0.08, 0, 0] },
  },
  bow: {
    windup: { chest: [0, -0.2, 0], leadShoulder: [-0.4, 0, 0], rearShoulder: [-0.4, 0, 0] },
    contact: {
      chest: [0, -0.4, 0],
      leadShoulder: [-0.75, 0, -0.12],
      leadElbow: [1.5, 0, 0],
      leadWrist: [-0.2, 0, 0],
      rearShoulder: [-0.8, 0.65, -0.55],
      rearElbow: [-0.15, 0, 0],
      rearWrist: [0.2, 0, 0],
    },
    follow: { rearShoulder: [0.3, 0.3, -0.4], rearElbow: [-0.2, 0, 0], leadElbow: [0.65, 0, 0] },
  },
  blood: {
    windup: { leadShoulder: [0.15, 0, 0.12], rearElbow: [-0.15, 0, 0] },
    contact: {
      chest: [0, -0.25, 0.06],
      leadShoulder: [-0.5, 0, 0.65],
      leadElbow: [0.8, 0, 0],
      leadWrist: [-0.3, 0.25, 0],
      rearShoulder: [0.1, 0, -0.5],
    },
    follow: { leadWrist: [-0.15, 0.15, 0], leadShoulder: [-0.15, 0, 0.2] },
  },
  snake: {
    windup: { chest: [0, 0.2, 0], leadElbow: [-0.35, 0, 0], leadWrist: [0.3, 0.2, 0] },
    contact: {
      chest: [0, -0.35, 0],
      leadShoulder: [-0.8, 0.2, 0.15],
      leadElbow: [1.4, 0, 0],
      leadWrist: [-0.5, -0.2, 0],
      rearShoulder: [0.1, 0, -0.15],
    },
    follow: { leadShoulder: [-0.2, 0, 0.15], leadWrist: [0.25, 0.2, 0] },
  },
  command: {
    windup: { head: [-0.04, 0, 0], leadElbow: [-0.15, 0, 0] },
    contact: {
      head: [-0.06, 0, 0],
      leadShoulder: [-0.8, 0, 0.2],
      leadElbow: [0.6, 0, 0],
      leadWrist: [-0.25, 0, 0],
      chest: [0, -0.1, 0],
    },
    follow: { leadShoulder: [-0.25, 0, 0.1], leadElbow: [0.2, 0, 0] },
  },
  console: {
    windup: { head: [0.12, 0, 0], leadElbow: [-0.1, 0, 0] },
    contact: {
      head: [0.18, 0, 0],
      leadShoulder: [-0.4, 0, -0.1],
      leadWrist: [-0.25, 0.1, 0],
      rearShoulder: [-0.35, 0, 0.2],
      rearWrist: [0.4, -0.2, 0],
    },
    follow: { head: [0.08, 0, 0] },
  },
  transform: {
    windup: {
      root: [0, -0.025, 0],
      chest: [0.08, 0, 0],
      leadKnee: [0.12, 0, 0],
      rearKnee: [0.12, 0, 0],
    },
    contact: {
      chest: [-0.1, 0, 0],
      head: [-0.08, 0, 0],
      leadShoulder: [0.15, 0, 0.25],
      rearShoulder: [0.15, 0, -0.25],
      leadElbow: [0.2, 0, 0],
      rearElbow: [0.2, 0, 0],
    },
    follow: { chest: [-0.04, 0, 0] },
  },
  door: {
    windup: { leadWrist: [0.4, 0, 0], leadElbow: [-0.15, 0, 0] },
    contact: {
      chest: [0, -0.2, 0],
      leadShoulder: [-0.5, 0, 0.55],
      leadElbow: [0.6, 0, 0],
      leadWrist: [0, 0.55, 0],
      head: [0.04, -0.12, 0],
    },
    follow: { leadShoulder: [-0.15, 0, 0.25], leadWrist: [0.2, 0.2, 0] },
  },
  flute: {
    windup: { head: [0.06, 0, 0] },
    contact: {
      head: [0.09, 0, 0],
      chest: [-0.02, 0, 0],
      leadWrist: [0.08, 0.08, 0],
      rearWrist: [-0.08, -0.08, 0],
    },
    follow: { head: [0.04, 0, 0] },
  },
  dance: {
    windup: { chest: [0, 0.3, -0.12], leadKnee: [0.2, 0, 0] },
    contact: {
      chest: [0, -0.35, 0.12],
      leadShoulder: [-0.5, 0, 0.6],
      rearShoulder: [-0.5, 0, -0.6],
      rearHip: [-0.2, 0, -0.1],
      rearKnee: [0.35, 0, 0],
    },
    follow: { chest: [0, -0.15, 0.06], leadShoulder: [-0.15, 0, 0.2] },
  },
} satisfies Record<string, Gesture>

export type TechniqueGesture = keyof typeof TECHNIQUE_GESTURES
