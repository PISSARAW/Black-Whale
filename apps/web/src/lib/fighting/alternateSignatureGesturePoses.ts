import { scalePose, type FightPose } from './fightPose'
import { strikeTimeline } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { SignatureGesture } from './alternateSignatureChoreography'

function strike(load: FightPose, contact: FightPose) {
  return strikeTimeline(load, contact, scalePose(contact, 0.4))
}

export const GESTURE_POSES = {
  stepJab: strike(
    { root: [0, -0.04, -0.04], rearKnee: [0.3, 0, 0], leadElbow: [-1.25, 0, 0] },
    {
      root: [0, -0.02, 0.16],
      chest: [0.07, -0.24, 0],
      leadShoulder: [-1.43, 0, 0.06],
      leadElbow: [-0.12, 0, 0],
      leadHip: [-0.23, 0, 0],
    },
  ),
  slipPalm: strike(
    { root: [-0.08, -0.09, -0.06], chest: [-0.03, 0.22, 0.24], rearElbow: [-1.62, 0, 0] },
    {
      root: [-0.06, -0.05, 0.06],
      chest: [0.12, -0.38, 0.13],
      rearShoulder: [-1.32, 0, -0.23],
      rearElbow: [-0.31, 0, 0],
      rearPalm: [-0.45, 0, 0],
    },
  ),
  toeTap: strike(
    {
      root: [0, -0.06, -0.03],
      body: [0.22, 0.21, 0],
      leadHip: [-0.52, 0, 0],
      leadKnee: [0.75, 0, 0],
    },
    {
      root: [0, -0.05, 0.03],
      body: [0.14, -0.13, 0],
      leadHip: [-0.42, 0, 0.08],
      leadKnee: [0.16, 0, 0],
      leadFoot: [-0.32, 0, 0],
    },
  ),
  drawCut: strike(
    { body: [0.05, 0.29, -0.09], rearShoulder: [-0.61, 0, -0.3], rearElbow: [-1.44, 0, 0] },
    {
      body: [0.18, -0.51, 0.09],
      rearShoulder: [-1.34, -0.16, 0.62],
      rearElbow: [-0.21, 0, 0],
      rearWrist: [0, -0.32, 0.24],
    },
  ),
  outsideKick: strike(
    {
      root: [0.08, -0.1, -0.05],
      body: [0.25, -0.21, 0.18],
      rearHip: [-0.39, 0.29, 0],
      rearKnee: [0.55, 0, 0],
    },
    {
      root: [0.1, -0.12, 0.04],
      body: [0.16, 0.33, 0.19],
      rearHip: [-0.5, -0.37, -0.32],
      rearKnee: [0.28, 0, 0],
      rearFoot: [0.24, 0, -0.18],
    },
  ),
  brace: strike(
    {
      root: [0, -0.09, 0.01],
      rearHip: [0.12, 0, 0],
      leadKnee: [0.37, 0, 0],
      leadElbow: [-1.26, 0, 0],
    },
    {
      root: [0, -0.1, 0.15],
      body: [0.22, -0.24, 0],
      leadShoulder: [-0.96, 0, 0.17],
      leadElbow: [-1.08, 0, 0],
      rearShoulder: [-0.67, 0, -0.2],
    },
  ),
  pivotElbow: strike(
    { pelvis: [0, 0.39, 0], chest: [0.06, 0.57, 0], rearElbow: [-1.74, 0, 0] },
    {
      root: [0, -0.02, 0.07],
      pelvis: [0, -0.34, 0],
      chest: [0.19, -0.61, 0.08],
      rearShoulder: [-1.26, 0, -0.52],
      rearElbow: [-1.56, 0, 0],
    },
  ),
  risingPalm: strike(
    {
      root: [0, -0.13, -0.02],
      body: [0.27, 0.18, 0],
      rearKnee: [0.56, 0, 0],
      leadElbow: [-1.64, 0, 0],
    },
    {
      root: [0, 0.04, 0.09],
      body: [-0.09, -0.24, 0],
      leadShoulder: [-1.83, 0, 0.12],
      leadElbow: [-0.4, 0, 0],
      leadPalm: [-0.57, 0, 0],
    },
  ),
  checkKnee: strike(
    { root: [0, -0.04, -0.07], body: [-0.22, 0.23, 0], rearKnee: [1.08, 0, 0] },
    {
      root: [0, 0.02, 0.12],
      body: [0.08, -0.14, 0.05],
      rearHip: [-1.4, 0.08, 0.12],
      rearKnee: [1.58, 0, 0],
      leadElbow: [-0.91, 0, 0],
    },
  ),
  heelHook: strike(
    { root: [0.08, -0.12, -0.07], pelvis: [0, 0.42, 0], leadKnee: [0.63, 0, 0] },
    {
      root: [0.07, -0.17, -0.03],
      body: [0.25, -0.45, 0.16],
      leadHip: [-0.52, 0.32, 0.34],
      leadKnee: [0.78, 0, 0],
      leadFoot: [0.53, 0, 0],
    },
  ),
  insideCut: strike(
    { root: [0, -0.03, -0.04], chest: [0.08, -0.35, 0], leadElbow: [-1.48, 0, 0] },
    {
      root: [0, -0.06, 0.12],
      chest: [0.25, 0.43, -0.07],
      leadShoulder: [-1.24, 0.25, -0.37],
      leadElbow: [-0.51, 0, 0],
      leadWrist: [0.27, 0, -0.18],
    },
  ),
  shoulderTurn: strike(
    { root: [0, -0.07, -0.08], pelvis: [0, -0.28, 0], chest: [-0.08, -0.39, 0] },
    {
      root: [0, -0.08, 0.18],
      pelvis: [0, 0.36, 0],
      body: [0.26, 0.4, 0.06],
      rearShoulder: [-0.62, 0, -0.21],
      rearElbow: [-1.37, 0, 0],
    },
  ),
  crossPalm: strike(
    { root: [0.04, -0.05, -0.01], chest: [-0.03, 0.42, 0.16], rearElbow: [-1.56, 0, 0] },
    {
      root: [-0.03, -0.02, 0.1],
      chest: [0.13, -0.48, -0.12],
      rearShoulder: [-1.59, 0.11, 0.21],
      rearElbow: [-0.36, 0, 0],
      rearPalm: [-0.51, 0, 0],
    },
  ),
  reverseSweep: strike(
    { root: [-0.04, -0.15, 0.02], body: [0.29, -0.43, 0], rearKnee: [0.62, 0, 0] },
    {
      root: [-0.06, -0.2, 0.12],
      body: [0.34, 0.53, -0.1],
      rearHip: [-0.46, 0.4, -0.34],
      rearKnee: [0.18, 0, 0],
      rearFoot: [0.27, 0, -0.26],
    },
  ),
} satisfies Record<SignatureGesture, MoveTimeline>
