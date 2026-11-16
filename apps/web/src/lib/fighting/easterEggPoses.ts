import { addPoses, lerpPose, type BodyPlan, type FightPose } from './fightPose'
import type { ArcadeFighter } from './types'
import { authoredEasterEggPose } from './easterEggMotion'

const REST: FightPose = {
  leadShoulder: [0.12, 0, 0.12],
  rearShoulder: [0.12, 0, -0.12],
  leadElbow: [-0.25, 0, 0],
  rearElbow: [-0.25, 0, 0],
}

/** Each gesture has its own silhouette. Time follows simulation frames, including previews. */
export function easterEggBodyPlan(fighter: ArcadeFighter): BodyPlan | null {
  const egg = fighter.easterEgg
  if (!egg) return null
  const t = egg.frame / egg.duration
  const beat = Math.sin(t * Math.PI * 6)
  const pose = authoredEasterEggPose(fighter) ?? gesture(fighter, t, beat)
  const envelope = Math.min(1, t * 10, (1 - t) * 10)
  return {
    key: `egg:${fighter.id}:${egg.slot}:${egg.startedAt}`,
    plant: true,
    blend: 0.08,
    pose: lerpPose(REST, addPoses(REST, pose), envelope),
  }
}

function gesture(fighter: ArcadeFighter, t: number, beat: number): FightPose {
  const slot = fighter.easterEgg!.slot
  if (fighter.id === 'hisoka') return hisokaGesture(slot, t, beat)
  if (fighter.id === 'kurapika') return kurapikaGesture(slot, t, beat)
  if (fighter.id === 'leorio') return leorioGesture(slot, t, beat)
  return rihanGesture(slot, t, beat)
}

function hisokaGesture(slot: number, t: number, beat: number): FightPose {
  if (slot === 1)
    return {
      chest: [0, -0.2, 0],
      head: [0.15, 0.1, -0.12],
      leadShoulder: [-0.65, 0.2, 0.3],
      leadElbow: [-1.5, 0, 0],
      leadWrist: [beat * 0.45, t * Math.PI * 4, 0.2],
    }
  if (slot === 2)
    return {
      body: [-0.08, 0, 0],
      head: [-0.12, 0, -0.15],
      leadShoulder: [-1.1, 0.1, 0.1],
      leadElbow: [-0.5 + beat * 0.18, 0, 0],
      leadWrist: [-0.7 + beat * 0.35, 0, 0],
      rearShoulder: [0.25, 0, -0.4],
    }
  if (slot === 3)
    return {
      body: [0.65, 0, 0],
      head: [0.3, 0, 0],
      leadShoulder: [-0.9, 0, 0.2],
      rearShoulder: [-0.8, 0, -0.2],
      leadElbow: [-0.6 + beat * 0.2, 0, 0],
      rearElbow: [-0.6 - beat * 0.2, 0, 0],
      leadKnee: [0.35, 0, 0],
      rearKnee: [0.35, 0, 0],
    }
  const toppled = t > 0.55
  return {
    body: [toppled ? -0.15 : 0.4, 0, 0],
    head: [0.15, 0, toppled ? -0.2 : 0],
    leadShoulder: [toppled ? -0.4 : -1.2, 0, 0.3],
    leadElbow: [toppled ? -1.3 : -0.4, 0, 0],
    leadWrist: [t > 0.45 ? -0.9 : 0.4, 0, 0],
  }
}

function kurapikaGesture(slot: number, t: number, beat: number): FightPose {
  if (slot === 1)
    return {
      head: [0.25, 0.1, 0],
      leadShoulder: [-0.6, 0, 0.25],
      leadElbow: [-1.4, 0, 0],
      rearShoulder: [-0.8, 0.5, -0.2],
      rearElbow: [-1.7, 0, 0],
      rearWrist: [beat * 0.12, 0, 0],
    }
  if (slot === 2)
    return {
      chest: [0, -0.15, 0],
      head: [-0.1, 0, 0],
      leadShoulder: [-1.15, 0, 0.1],
      leadElbow: [-0.35, 0, 0],
      leadWrist: [0.2, 0, 0],
      rearShoulder: [0.15, 0, -0.15],
    }
  if (slot === 3)
    return {
      head: [0.15, Math.sin(t * Math.PI * 4) * 0.12, 0],
      leadShoulder: [-0.8, 0, 0.1],
      leadElbow: [-1.2, 0, 0],
      leadWrist: [0, 0, Math.sin(t * Math.PI * 4) * 0.08],
    }
  return {
    chest: [0.12, -0.15, 0],
    head: [-0.12, 0, 0],
    leadShoulder: [-0.7, 0, 0.28],
    rearShoulder: [-0.35, 0, -0.28],
    leadElbow: [-1.2, 0, 0],
    rearElbow: [-0.8, 0, 0],
    leadWrist: [0.45, 0, 0],
  }
}

function leorioGesture(slot: number, t: number, beat: number): FightPose {
  if (slot === 1)
    return {
      head: [-0.08, 0, 0],
      leadShoulder: [-1.9, 0, 0.2],
      leadElbow: [-1.8, 0, 0],
      leadWrist: [beat * 0.1, 0, 0],
    }
  if (slot === 2)
    return {
      body: [0.08 + beat * 0.05, 0, 0],
      head: [-0.1, beat * 0.1, 0],
      leadShoulder: [-0.9 + beat * 0.35, 0, 0.8],
      rearShoulder: [-0.9 - beat * 0.35, 0, -0.8],
      leadElbow: [-0.7, 0, 0],
      rearElbow: [-0.7, 0, 0],
    }
  if (slot === 3)
    return {
      body: [0.55, 0, 0],
      head: [0.35, beat * 0.08, 0],
      leadShoulder: [-0.65 + beat * 0.1, 0, 0.25],
      rearShoulder: [-0.65 - beat * 0.1, 0, -0.25],
      leadElbow: [-0.5, 0, 0],
      rearElbow: [-0.5, 0, 0],
    }
  return leorioSecret(t)
}

function leorioSecret(t: number): FightPose {
  return {
    body: [t < 0.35 ? 0.4 : -0.08, 0, 0],
    head: [t < 0.6 ? -0.2 : 0.05, t > 0.6 ? -0.35 : 0, t > 0.6 ? 0.15 : 0],
    leadShoulder: [t < 0.35 ? -0.6 : -1.6, 0, 0.2],
    leadElbow: [-1, 0, 0],
    rearShoulder: [-0.4, 0, -0.2],
    rearElbow: [-0.8, 0, 0],
  }
}

function rihanGesture(slot: number, t: number, beat: number): FightPose {
  if (slot === 1)
    return {
      head: [0.12, 0, 0.08],
      chest: [0, -0.12, 0],
      leadShoulder: [-1, 0, 0.15],
      leadElbow: [-2.1, 0, 0],
      rearShoulder: [-0.45, 0.4, -0.1],
      rearElbow: [-1.5, 0, 0],
    }
  if (slot === 2)
    return {
      head: [Math.sin(t * Math.PI * 2) * 0.28, beat * 0.18, 0],
      body: [0.12, Math.sin(t * Math.PI * 2) * 0.18, 0],
      leadShoulder: [-0.4, 0, 0.15],
      leadElbow: [-0.8, 0, 0],
    }
  if (slot === 3)
    return {
      head: [0.2, 0, 0],
      body: [0.08, 0, 0],
      leadShoulder: [-1.15, 0, 0.15],
      leadElbow: [-1.9, 0, 0],
      leadWrist: [0.2, 0, 0],
      rearShoulder: [-0.5, 0.5, -0.1],
      rearElbow: [-1.7, 0, 0],
    }
  return {
    head: [t < 0.55 ? 0.2 : 0.4, 0, 0],
    body: [t > 0.55 ? 0.15 : 0.04, 0, 0],
    leadShoulder: [-0.55, 0, t > 0.55 ? 0.6 : 0.2],
    rearShoulder: [-0.55, 0, t > 0.55 ? -0.6 : -0.2],
    leadElbow: [-1.25, 0, 0],
    rearElbow: [-1.25, 0, 0],
  }
}
