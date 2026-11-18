import { strikeTimeline } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import { isAirPursuit, type DirectionalEnding } from './directionalChain'
import type { ArcadeFighter } from './types'

const KURAPIKA: Record<DirectionalEnding, MoveTimeline> = {
  ground: strikeTimeline(
    {
      root: [0, -0.08, -0.04],
      chest: [0.13, 0.47, 0],
      leadKnee: [0.34, 0, 0],
      rearHip: [-0.3, 0, 0],
    },
    {
      root: [0, -0.12, 0.12],
      body: [0.18, -0.42, 0],
      rearHip: [-0.74, 0.22, 0.56],
      rearKnee: [-0.17, 0, 0],
      leadShoulder: [-0.45, 0, -0.25],
    },
    {
      root: [0, -0.06, 0.08],
      chest: [0.14, -0.27, 0],
      rearHip: [-0.35, 0.15, 0.22],
      rearKnee: [0.32, 0, 0],
    },
  ),
  air: strikeTimeline(
    {
      root: [0, -0.13, -0.05],
      leadKnee: [0.5, 0, 0],
      leadShoulder: [0.35, 0, -0.38],
      leadElbow: [-0.85, 0, 0],
      chest: [0.1, 0.2, 0],
    },
    {
      root: [0, 0.16, 0.09],
      body: [-0.2, -0.36, 0],
      leadShoulder: [-2.32, 0, 0.16],
      leadElbow: [0.88, 0, 0],
      head: [-0.22, 0, 0],
      rearHip: [0.23, 0, 0],
    },
    {
      root: [0, 0.045, 0.07],
      chest: [-0.06, -0.22, 0],
      leadShoulder: [-1.38, 0, 0.12],
      leadElbow: [0.64, 0, 0],
    },
  ),
  close: strikeTimeline(
    {
      chest: [0.03, 0.45, 0],
      rearShoulder: [-0.24, 0, -0.16],
      rearElbow: [0.58, 0, 0],
      root: [0, -0.04, -0.02],
    },
    {
      root: [0, -0.04, 0.13],
      chest: [0.08, -0.48, 0],
      rearShoulder: [-0.91, 0, -0.34],
      rearElbow: [-0.48, 0, 0],
      leadShoulder: [-0.21, 0, 0.31],
      leadKnee: [0.2, 0, 0],
    },
    {
      root: [0, -0.02, 0.06],
      chest: [0, -0.15, 0],
      rearShoulder: [-0.58, 0, -0.27],
      rearElbow: [0.08, 0, 0],
    },
  ),
  carry: strikeTimeline(
    {
      root: [0, -0.045, -0.1],
      chest: [0.02, 0.55, 0],
      leadShoulder: [-0.16, 0, -0.7],
      leadElbow: [-0.45, 0, 0],
      rearKnee: [0.3, 0, 0],
    },
    {
      root: [0, 0.045, 0.2],
      body: [0.19, -0.19, 0],
      chest: [0.1, -0.64, 0],
      leadShoulder: [-1.25, 0, 0.57],
      leadElbow: [1.28, 0, 0],
      rearHip: [0.25, 0, 0],
    },
    {
      root: [0, 0.015, 0.13],
      body: [0.075, -0.2, 0],
      chest: [0.03, -0.4, 0],
      leadShoulder: [-0.8, 0, 0.77],
      leadElbow: [0.57, 0, 0],
    },
  ),
}

const HISOKA: Record<DirectionalEnding, MoveTimeline> = {
  ground: strikeTimeline(
    {
      root: [0, -0.1, -0.06],
      body: [0.2, 0.64, 0],
      leadShoulder: [-0.46, 0, 0.66],
      rearKnee: [0.51, 0, 0],
    },
    {
      root: [0, -0.15, 0.11],
      body: [-0.16, -0.79, 0.12],
      leadHip: [-0.55, 0, 0.77],
      leadKnee: [-0.46, 0, 0],
      rearShoulder: [-0.3, 0, -0.76],
    },
    {
      root: [0, -0.09, 0.09],
      chest: [-0.1, -0.32, 0],
      leadHip: [-0.32, 0, 0.4],
      leadKnee: [0.25, 0, 0],
    },
  ),
  air: strikeTimeline(
    {
      root: [0, -0.05, -0.07],
      body: [-0.18, 0.17, 0],
      leadHip: [-1.21, 0, 0.16],
      leadKnee: [1.36, 0, 0],
      rearShoulder: [0, 0, -0.6],
    },
    {
      root: [0, 0.13, 0.07],
      body: [-0.38, -0.35, 0.11],
      head: [0.24, 0, 0],
      leadHip: [-2.21, 0.12, 0.18],
      leadKnee: [-0.3, 0, 0],
      leadShoulder: [0.12, 0, 0.78],
      rearShoulder: [0.15, 0, -0.91],
    },
    {
      root: [0, 0.06, 0.045],
      body: [-0.13, -0.28, 0],
      leadHip: [-0.99, 0, 0.13],
      leadKnee: [0.91, 0, 0],
    },
  ),
  close: strikeTimeline(
    {
      chest: [0, 0.47, 0.11],
      leadShoulder: [0.03, 0, -0.48],
      leadElbow: [-0.68, 0, 0],
      leadWrist: [-0.45, 0, 0],
    },
    {
      root: [0, 0.03, 0.06],
      chest: [0.08, -0.59, -0.08],
      leadShoulder: [-0.79, 0, 0.34],
      leadElbow: [0.65, 0, 0],
      leadWrist: [0.58, 0, 0],
      rearShoulder: [0.1, 0, -0.37],
    },
    {
      chest: [0.03, -0.24, 0],
      leadShoulder: [-0.62, 0, 0.55],
      leadElbow: [0.08, 0, 0],
      leadWrist: [0.41, 0, 0],
    },
  ),
  carry: strikeTimeline(
    {
      root: [0, -0.12, -0.11],
      body: [-0.16, 0.45, 0],
      chest: [-0.08, 0.27, 0],
      leadShoulder: [-0.55, 0, -0.8],
      rearShoulder: [0, 0, -0.45],
      leadKnee: [0.42, 0, 0],
    },
    {
      root: [0, 0.02, 0.23],
      body: [0.19, -0.58, 0],
      leadShoulder: [-1.57, 0, 0.69],
      leadElbow: [1.06, 0, 0],
      rearShoulder: [-0.24, 0, -0.76],
      rearHip: [0.28, 0, 0],
    },
    {
      root: [0, -0.03, 0.11],
      chest: [0.07, -0.33, 0],
      leadShoulder: [-0.87, 0, 0.94],
      leadElbow: [0.62, 0, 0],
      rearKnee: [0.17, 0, 0],
    },
  ),
}

export function directionalFinishPose(fighter: ArcadeFighter): MoveTimeline | undefined {
  const ending = fighter.attack?.directionalChain
  if (!ending || ending === 'bridge' || isAirPursuit(ending)) return
  // The native chain and tether retain their own prop-aware keys, synchronized to this move.
  if (ending === 'carry' && fighter.attack?.kind === 'special') return
  if (fighter.id === 'kurapika') return KURAPIKA[ending]
  if (fighter.id === 'hisoka') return HISOKA[ending]
}
