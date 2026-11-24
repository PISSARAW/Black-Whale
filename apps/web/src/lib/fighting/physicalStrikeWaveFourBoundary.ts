import type { PhysicalStrikeDirections } from './physicalStrikeDirections'
import { strike } from './physicalStrikeWaveTwo'

export const YOKOTANI_STRIKES = {
  standingLight: { shape: 'hook', contactJoint: 'leadElbow' },
  standingHeavy: 'palm',
  lowLight: strike('lowKick', [
    { root: [-0.07, -0.045, -0.06], pelvis: [0, 0.39, 0], rearKnee: [0.54, 0, 0] },
    {
      root: [0.08, -0.07, 0.045],
      chest: [0.16, -0.41, -0.11],
      leadHip: [-0.38, -0.17, 0.48],
      leadKnee: [-0.9, 0, 0],
      leadFoot: [0.41, 0, 0],
      rearKnee: [0.7, 0, 0],
      leadShoulder: [-0.55, -0.52, 0.38],
    },
  ]),
  lowHeavy: strike('sweep', [
    {
      root: [-0.1, -0.09, -0.12],
      pelvis: [0, -0.57, 0],
      chest: [0.21, -0.3, -0.2],
      rearKnee: [0.63, 0, 0],
    },
    {
      root: [0.16, -0.16, 0.1],
      pelvis: [0, 0.69, 0],
      chest: [0.31, 0.38, 0.3],
      leadHip: [-0.56, 0.31, 0.7],
      leadKnee: [-0.7, 0, 0],
      rearKnee: [0.86, 0, 0],
      leadShoulder: [-0.57, -0.64, 0.57],
      rearElbow: [-0.61, 0, 0],
    },
  ]),
  airLight: strike(
    'kick',
    [
      {
        root: [-0.06, 0.02, -0.08],
        chest: [0.11, -0.35, -0.12],
        rearHip: [-0.52, 0.19, -0.26],
        rearKnee: [0.85, 0, 0],
      },
      {
        root: [0.06, -0.055, 0.085],
        chest: [0.19, 0.55, 0.16],
        rearHip: [-1.51, 0.31, -0.39],
        rearKnee: [1.22, 0, 0],
        leadHip: [0.46, 0.21, 0.3],
        leadElbow: [-0.69, 0, 0],
        rearShoulder: [-0.64, -0.45, -0.54],
      },
    ],
    'rearKnee',
  ),
  airHeavy: strike('kick', [
    {
      root: [0.08, 0.04, -0.08],
      pelvis: [0, 0.42, 0],
      leadHip: [-0.78, 0.44, 0.42],
      leadKnee: [1.32, 0, 0],
      rearElbow: [-0.61, 0, 0],
    },
    {
      root: [0.16, -0.07, 0.11],
      pelvis: [0, -0.61, 0],
      chest: [-0.13, -0.43, 0.25],
      leadHip: [-1.12, 0.33, 0.42],
      leadKnee: [-0.71, 0, 0],
      leadFoot: [-0.55, 0, 0],
      rearHip: [-0.49, 0.16, -0.34],
      rearKnee: [0.84, 0, 0],
    },
  ]),
  forwardLight: strike(
    'hook',
    [
      {
        root: [-0.08, -0.065, -0.075],
        chest: [0.14, 0.43, 0.15],
        leadShoulder: [-0.51, 0.52, 0.58],
        leadElbow: [-0.69, 0, 0],
      },
      {
        root: [0.08, -0.09, 0.13],
        chest: [0.21, -0.52, -0.22],
        leadShoulder: [-0.83, -0.81, 0.51],
        leadElbow: [-0.82, 0, 0],
        rearShoulder: [-0.53, -0.38, -0.51],
        leadKnee: [0.61, 0, 0],
      },
    ],
    'leadElbow',
  ),
  forwardHeavy: strike(
    'charge',
    [
      {
        root: [-0.145, -0.09, -0.115],
        pelvis: [0, 0.57, 0],
        chest: [0.24, 0.41, 0.19],
        leadShoulder: [0.26, 0.43, 0.67],
        rearElbow: [-0.71, 0, 0],
      },
      {
        root: [0.18, -0.1, 0.17],
        pelvis: [0, -0.66, 0],
        chest: [0.4, -0.69, -0.25],
        leadShoulder: [-0.46, -0.74, 0.41],
        leadElbow: [-0.83, 0, 0],
        rearShoulder: [-0.5, -0.39, -0.59],
        leadKnee: [0.88, 0, 0],
        rearHip: [0.43, 0.28, -0.26],
      },
    ],
    'leadShoulder',
  ),
  backHeavy: strike('palm', [
    {
      root: [-0.105, -0.075, -0.175],
      chest: [0.12, -0.56, -0.19],
      rearShoulder: [-0.54, -0.54, -0.55],
      rearElbow: [-0.7, 0, 0],
    },
    {
      root: [-0.14, -0.08, -0.09],
      chest: [0.24, 0.62, -0.25],
      rearShoulder: [-1.19, -0.48, -0.65],
      rearElbow: [0.98, 0, 0],
      rearPalm: [0.7, 0, -0.24],
      leadShoulder: [-0.65, -0.63, 0.54],
      rearKnee: [0.65, 0, 0],
    },
  ]),
  throw: strike('palm', [
    { root: [-0.12, -0.06, -0.085], chest: [0.21, -0.53, -0.22], leadElbow: [-0.68, 0, 0] },
    {
      root: [0.12, -0.085, 0.11],
      chest: [0.23, 0.64, 0.23],
      rearShoulder: [-1.25, -0.55, -0.48],
      rearElbow: [1.01, 0, 0],
      leadShoulder: [-0.64, -0.6, 0.54],
      leadKnee: [0.62, 0, 0],
    },
  ]),
} satisfies PhysicalStrikeDirections
