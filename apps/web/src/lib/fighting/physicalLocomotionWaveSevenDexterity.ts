import { kurapikaDashPoses } from './kurapikaLocomotion'
import type { PhysicalLocomotion } from './physicalLocomotion'

export const WAVE_SEVEN_DEXTERITY_MOVEMENT = {
  kurapika: {
    stride: 0.91,
    walk: {
      advance: {
        body: [0.09, -0.19, 0.03],
        leadShoulder: [-0.41, -0.14, 0.25],
        leadElbow: [-0.65, 0, 0],
        leadWrist: [0.27, 0.16, 0.1],
        rearElbow: [-0.88, 0, 0],
      },
      retreat: {
        body: [0.04, 0.29, -0.05],
        leadShoulder: [-0.29, 0.22, 0.44],
        leadElbow: [-1.12, 0, 0],
        leadWrist: [-0.26, 0.2, 0.13],
      },
      rhythm: { chest: [0.045, 0.14, -0.025], leadWrist: [0.17, -0.12, 0.18] },
    },
    forward: kurapikaDashPoses(true),
    backward: kurapikaDashPoses(false),
    guard: {
      body: [0.1, 0.28, 0.03],
      leadShoulder: [-0.71, 0.12, 0.4],
      leadElbow: [-1.14, 0, 0],
      leadWrist: [0.46, -0.19, 0.11],
      rearElbow: [-1.05, 0, 0],
    },
    crouch: {
      body: [0.25, 0.22, 0.03],
      leadHip: [-0.86, 0, 0.2],
      leadKnee: [1.55, 0, 0],
      rearHip: [-0.9, 0, -0.2],
      rearKnee: [1.7, 0, 0],
    },
    takeoff: {
      body: [0.08, 0.19, 0.055],
      leadHip: [-0.43, 0, 0.15],
      leadKnee: [0.68, 0, 0],
      leadElbow: [-0.88, 0, 0],
    },
    air: {
      body: [0.1, -0.24, -0.055],
      leadHip: [-0.59, 0, 0.22],
      leadKnee: [0.92, 0, 0],
      rearHip: [-0.45, 0, -0.18],
      rearKnee: [0.98, 0, 0],
      leadShoulder: [-0.6, -0.22, 0.37],
    },
    landing: {
      body: [0.19, 0.23, 0.025],
      leadHip: [-0.49, 0, 0.15],
      leadKnee: [0.81, 0, 0],
      rearKnee: [0.63, 0, 0],
      leadElbow: [-1.0, 0, 0],
    },
  },
  hisoka: {
    stride: 1.04,
    walk: {
      advance: {
        body: [0.07, 0.32, -0.11],
        leadShoulder: [-0.38, -0.23, 0.43],
        leadWrist: [0.35, 0.13, 0.26],
        rearShoulder: [0.23, 0.31, -0.55],
      },
      retreat: {
        body: [0.015, -0.36, 0.18],
        leadShoulder: [-0.6, 0.22, 0.55],
        leadElbow: [-0.85, 0, 0],
        rearShoulder: [-0.22, 0.14, -0.57],
      },
      rhythm: { chest: [0.06, 0.24, 0.13], leadWrist: [0.27, -0.18, 0.26] },
    },
    forward: [
      {
        body: [0.19, 0.39, 0.13],
        leadShoulder: [-0.23, 0.33, 0.64],
        leadElbow: [-1.21, 0, 0],
        rearKnee: [0.83, 0, 0],
      },
      {
        body: [0.24, -0.42, -0.15],
        leadShoulder: [-0.78, -0.25, 0.45],
        rearShoulder: [0.39, 0.35, -0.64],
        leadHip: [-0.87, 0, 0.27],
        leadKnee: [0.77, 0, 0],
      },
      {
        body: [0.055, 0.23, 0.11],
        leadElbow: [-0.94, 0, 0],
        leadKnee: [0.64, 0, 0],
        leadWrist: [0.36, 0.21, 0.3],
      },
    ],
    backward: [
      { body: [0.16, -0.44, -0.12], leadShoulder: [-0.7, -0.23, 0.56], rearKnee: [0.65, 0, 0] },
      {
        body: [0.015, 0.42, 0.17],
        leadShoulder: [-0.27, 0.24, 0.75],
        rearShoulder: [-0.18, 0.22, -0.71],
        rearHip: [-0.92, 0, -0.32],
        rearKnee: [0.87, 0, 0],
      },
      { body: [0.09, 0.19, 0.12], rearKnee: [0.63, 0, 0], leadElbow: [-0.88, 0, 0] },
    ],
    guard: {
      body: [0.06, -0.33, 0.09],
      leadShoulder: [-0.57, 0.31, 0.53],
      leadElbow: [-0.94, 0, 0],
      rearShoulder: [-0.53, 0.28, -0.57],
    },
    crouch: {
      body: [0.29, 0.33, 0.065],
      leadHip: [-1.0, 0, 0.26],
      leadKnee: [1.72, 0, 0],
      rearHip: [-0.89, 0, -0.35],
      rearKnee: [1.8, 0, 0],
      rearShoulder: [0.18, 0.25, -0.61],
    },
    takeoff: {
      body: [0.13, 0.39, -0.11],
      leadHip: [-0.58, 0, 0.24],
      leadKnee: [0.81, 0, 0],
      rearShoulder: [0.25, 0.25, -0.68],
    },
    air: {
      body: [0.14, -0.43, 0.15],
      leadHip: [-0.84, 0, 0.31],
      leadKnee: [1.25, 0, 0],
      rearHip: [-0.22, 0, -0.27],
      rearKnee: [0.77, 0, 0],
      leadShoulder: [-0.48, -0.27, 0.56],
      rearShoulder: [0.37, 0.22, -0.68],
    },
    landing: {
      body: [0.18, 0.34, -0.1],
      leadHip: [-0.47, 0, 0.23],
      leadKnee: [0.77, 0, 0],
      rearKnee: [0.9, 0, 0],
      leadWrist: [0.49, 0.11, 0.22],
    },
  },
} satisfies Record<'kurapika' | 'hisoka', PhysicalLocomotion>
