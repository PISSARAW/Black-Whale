import { addPoses, scalePose, type FightPose } from './fightPose'
import { isBiscuitTrueForm } from './biscuitForm'
import { THIRD_FIVE_NORMAL_STYLES } from './thirdFiveNormals'
import type { KeyPose, MoveTimeline } from './keyPoseTimeline'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

export const COMBAT_NORMALS = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
] as const satisfies readonly MoveSlot[]

type Normal = (typeof COMBAT_NORMALS)[number]

export interface NormalStyle {
  prepareAt: number
  recoverAt: number
  load: FightPose
  recover: FightPose
  impact: Record<Normal, FightPose>
  contact?: Partial<Record<Normal, FightPose>>
}

const NORMAL_STYLES: Partial<Record<FighterId, NormalStyle>> = {
  ...THIRD_FIVE_NORMAL_STYLES,
  feitan: {
    prepareAt: 0.22,
    recoverAt: 0.28,
    load: { body: [0.13, 0, 0], head: [-0.15, 0, 0], rearKnee: [0.18, 0, 0] },
    recover: { head: [-0.1, 0, 0], rearKnee: [0.16, 0, 0], rearElbow: [-0.17, 0, 0] },
    impact: {
      standingLight: { body: [0.08, 0, 0], head: [-0.11, 0, 0], leadPalm: [-0.12, 0, 0] },
      standingHeavy: {
        pelvis: [0, -0.18, 0],
        leadKnee: [0.14, 0, 0],
        rearShoulder: [0.14, 0, -0.21],
      },
      lowLight: { chest: [0.08, 0, 0.07], rearHip: [-0.17, 0, 0], head: [-0.11, 0, 0] },
      lowHeavy: { pelvis: [0, -0.22, 0], leadKnee: [0.16, 0, 0], head: [-0.12, 0, 0] },
      airLight: { leadHip: [-0.29, 0, 0], leadKnee: [0.39, 0, 0], rearKnee: [0.19, 0, 0] },
      airHeavy: { body: [0.19, 0, 0], leadKnee: [0.24, 0, 0], rearHip: [0.22, 0, 0] },
      forwardLight: { body: [0.1, 0, 0], rearHip: [0.13, 0, 0], head: [-0.13, 0, 0] },
      forwardHeavy: {
        chest: [0.06, -0.2, 0.09],
        rearKnee: [0.17, 0, 0],
        leadPalm: [0.08, 0, 0.11],
      },
      backHeavy: { body: [-0.14, 0, 0], rearKnee: [0.27, 0, 0], rearShoulder: [0.18, 0, -0.1] },
    },
  },
  saiyu: {
    prepareAt: 0.18,
    recoverAt: 0.45,
    load: { body: [-0.08, 0, 0], pelvis: [0, 0.22, 0], rearElbow: [-0.31, 0, 0] },
    recover: { chest: [-0.09, -0.12, 0], leadWrist: [0.16, 0.06, 0], rearElbow: [-0.19, 0, 0] },
    impact: {
      standingLight: {
        chest: [-0.06, -0.13, 0],
        leadWrist: [-0.26, 0.17, 0],
        rearElbow: [-0.22, 0, 0],
      },
      standingHeavy: {
        body: [0.1, 0, 0],
        pelvis: [0, -0.27, 0],
        leadWrist: [0.33, 0.09, 0.15],
        rearElbow: [-0.38, 0, 0],
      },
      lowLight: { chest: [0.16, 0.09, 0], leadWrist: [0.29, -0.06, 0], rearKnee: [0.14, 0, 0] },
      lowHeavy: {
        chest: [0.1, -0.23, 0],
        leadWrist: [0.19, -0.25, 0],
        rearShoulder: [0.29, 0, -0.22],
      },
      airLight: { leadHip: [-0.31, 0, 0.12], leadKnee: [0.36, 0, 0], leadWrist: [-0.25, 0, 0] },
      airHeavy: {
        body: [-0.21, 0, 0.12],
        leadHip: [-0.26, 0, 0],
        rearHip: [0.24, 0, -0.1],
        leadWrist: [0.24, 0.16, 0],
      },
      forwardLight: {
        leadShoulder: [-0.2, 0, 0.17],
        leadWrist: [-0.19, 0, 0],
        chest: [-0.09, -0.12, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.34, 0],
        leadWrist: [0.25, -0.21, 0.14],
        rearShoulder: [0.2, 0, -0.21],
      },
      backHeavy: { body: [-0.19, 0, 0], leadWrist: [0.17, 0.26, 0], rearKnee: [0.2, 0, 0] },
    },
  },
  theta: {
    prepareAt: 0.19,
    recoverAt: 0.24,
    load: { chest: [0.07, -0.1, 0], head: [0.06, 0.09, 0], rearElbow: [-0.23, 0, 0] },
    recover: { chest: [0.05, -0.1, 0], rearShoulder: [-0.14, 0, -0.11], rearElbow: [-0.29, 0, 0] },
    impact: {
      standingLight: {
        chest: [0.08, -0.1, 0],
        leadWrist: [0.14, 0, 0.08],
        rearElbow: [-0.29, 0, 0],
      },
      standingHeavy: {
        body: [0.12, 0, 0],
        rearShoulder: [-0.22, 0, -0.14],
        rearWrist: [-0.19, 0, 0],
      },
      lowLight: { chest: [0.09, -0.12, 0], rearElbow: [-0.26, 0, 0], leadWrist: [0.18, 0, 0] },
      lowHeavy: { pelvis: [0, -0.22, 0], rearElbow: [-0.29, 0, 0], head: [-0.12, 0, 0] },
      airLight: { chest: [0.13, -0.1, 0], rearElbow: [-0.31, 0, 0], rearHip: [-0.21, 0, -0.09] },
      airHeavy: {
        chest: [-0.11, -0.12, 0],
        rearShoulder: [-0.23, 0, -0.16],
        leadKnee: [0.19, 0, 0],
      },
      forwardLight: { head: [0.04, 0.1, 0], chest: [0.08, -0.17, 0], rearElbow: [-0.26, 0, 0] },
      forwardHeavy: {
        pelvis: [0, -0.19, 0],
        rearShoulder: [-0.23, 0, -0.16],
        rearWrist: [0.19, 0, 0],
      },
      backHeavy: { body: [-0.18, 0, 0], rearKnee: [0.22, 0, 0], rearElbow: [-0.28, 0, 0] },
    },
  },
  biscuit: {
    prepareAt: 0.16,
    recoverAt: 0.32,
    load: { leadPalm: [-0.17, 0.16, 0], rearElbow: [-0.23, 0, 0], pelvis: [0, 0.1, 0] },
    recover: { chest: [-0.09, -0.1, 0], leadPalm: [-0.2, 0.15, 0], rearElbow: [-0.17, 0, 0] },
    impact: {
      standingLight: {
        leadPalm: [-0.37, 0.22, 0.05],
        leadElbow: [-0.14, 0, 0],
        pelvis: [0, -0.11, 0],
      },
      standingHeavy: {
        body: [-0.12, 0, 0],
        leadKnee: [0.21, 0, 0],
        rearShoulder: [-0.18, 0, -0.17],
      },
      lowLight: { leadPalm: [-0.19, 0.17, 0], chest: [0.12, -0.1, 0], rearElbow: [-0.2, 0, 0] },
      lowHeavy: { pelvis: [0, -0.21, 0], chest: [-0.11, 0, 0], leadPalm: [-0.17, 0.21, 0] },
      airLight: { leadPalm: [-0.28, 0.17, 0], rearKnee: [0.29, 0, 0], leadHip: [-0.16, 0, 0] },
      airHeavy: { body: [-0.14, 0, 0], leadPalm: [-0.2, 0.15, 0], rearHip: [-0.22, 0, -0.12] },
      forwardLight: {
        leadPalm: [-0.27, 0.26, 0],
        rearShoulder: [0.19, 0, -0.08],
        leadKnee: [0.13, 0, 0],
      },
      forwardHeavy: { pelvis: [0, -0.26, 0], leadPalm: [-0.2, 0.15, 0], rearHip: [0.16, 0, 0] },
      backHeavy: { body: [-0.16, 0, 0], leadPalm: [-0.22, 0.22, 0], rearKnee: [0.27, 0, 0] },
    },
  },
  phinks: {
    prepareAt: 0.27,
    recoverAt: 0.62,
    load: { chest: [0, 0.27, 0.08], rearShoulder: [0.28, 0.18, -0.14], rearKnee: [0.23, 0, 0] },
    recover: { chest: [0.12, -0.19, 0], rearShoulder: [0.25, 0.12, -0.13], rearKnee: [0.21, 0, 0] },
    impact: {
      standingLight: { pelvis: [0, -0.14, 0], chest: [0.11, 0.14, 0], rearElbow: [-0.29, 0, 0] },
      standingHeavy: {
        pelvis: [0, -0.3, 0],
        chest: [0.12, -0.32, 0],
        rearShoulder: [-0.22, 0, -0.18],
      },
      lowLight: { body: [0.17, 0, 0], chest: [0, -0.15, 0], rearKnee: [0.2, 0, 0] },
      lowHeavy: { pelvis: [0, -0.3, 0], leadShoulder: [0.26, 0, 0.15], rearKnee: [0.21, 0, 0] },
      airLight: { chest: [0.15, -0.25, 0], rearHip: [-0.25, 0, 0], rearKnee: [0.24, 0, 0] },
      airHeavy: { chest: [0.14, -0.36, 0.13], leadKnee: [0.32, 0, 0], rearHip: [0.21, 0, -0.14] },
      forwardLight: {
        chest: [0.09, 0.18, 0],
        rearShoulder: [0.21, 0, -0.13],
        rearHip: [0.14, 0, 0],
      },
      forwardHeavy: { body: [0.21, 0, 0], chest: [0.1, -0.31, 0], rearHip: [0.26, 0, 0] },
      backHeavy: { body: [-0.13, 0, 0], chest: [0, -0.22, 0], rearKnee: [0.29, 0, 0] },
    },
  },
}

export function hasPersonalNormal(id: FighterId, slot: MoveSlot): slot is Normal {
  return Boolean(NORMAL_STYLES[id] && COMBAT_NORMALS.some((normal) => normal === slot))
}

const CACHE = new Map<string, MoveTimeline>()

/** The four non-blade heavy air attacks lead with the weapon, palm or fist. */
const AIR_HEAVY_CONTACT: Partial<Record<FighterId, FightPose>> = {
  saiyu: {
    leadHip: [-0.38, 0, 0.12],
    leadKnee: [0.34, 0, 0],
    rearHip: [0.28, 0, -0.09],
    rearKnee: [-0.16, 0, 0],
    leadShoulder: [-0.62, 0.15, 0.12],
    leadElbow: [-0.2, 0, 0],
    rearElbow: [-0.35, 0, 0],
  },
  theta: {
    leadHip: [0.12, 0, 0.07],
    leadKnee: [0.04, 0, 0],
    rearHip: [-0.18, 0, -0.1],
    rearKnee: [0.28, 0, 0],
    leadShoulder: [-0.94, 0.12, 0.14],
    leadElbow: [-0.31, 0, 0],
    leadWrist: [0.28, 0, 0.09],
    rearElbow: [-0.33, 0, 0],
  },
  biscuit: {
    leadHip: [0.14, 0, 0.15],
    leadKnee: [0.12, 0, 0],
    rearHip: [-0.21, 0, -0.16],
    rearKnee: [0.22, 0, 0],
    leadShoulder: [-0.85, 0, 0.16],
    leadElbow: [0.16, 0, 0],
    leadPalm: [-0.47, 0.22, 0],
    rearElbow: [-0.21, 0, 0],
  },
  phinks: {
    leadHip: [-0.24, 0, 0.15],
    leadKnee: [0.27, 0, 0],
    rearHip: [0.44, 0, -0.21],
    rearKnee: [-0.2, 0, 0],
    leadShoulder: [0.28, 0.08, 0.28],
    rearShoulder: [-1.29, -0.14, -0.16],
    rearElbow: [-0.34, 0, 0],
  },
}

export function personalNormalTimeline(
  id: FighterId,
  slot: MoveSlot,
  native: MoveTimeline,
): MoveTimeline {
  if (!hasPersonalNormal(id, slot)) return native
  const key = `${id}:${slot}`
  const cached = CACHE.get(key)
  if (cached) return cached
  const style = NORMAL_STYLES[id]!
  const impact = style.impact[slot]
  const weight = slot.endsWith('Light') ? 0.67 : 1
  const preparation = native.filter((key) => key.phase === 'startup')
  const accents = {
    startup: addPoses(scalePose(style.load, weight), scalePose(impact, 0.22)),
    active: impact,
    recovery: scalePose(style.recover, weight),
  }
  const strike = style.contact?.[slot] ?? (slot === 'airHeavy' ? AIR_HEAVY_CONTACT[id] : undefined)
  const timeline = native.map((key) => accentKey(key, accents, strike))
  if (preparation.length === 1 && style.prepareAt < preparation[0].at) {
    const first = preparation[0]
    timeline.unshift({
      phase: 'startup',
      at: style.prepareAt,
      pose: addPoses(scalePose(first.pose, 0.28), scalePose(accents.startup, 0.58)),
      ease: 'out',
    })
  }
  holdActiveEnd(timeline)
  addRecoveryBeat(timeline, style)
  CACHE.set(key, timeline)
  return timeline
}

function holdActiveEnd(timeline: KeyPose[]): void {
  const contact = timeline.filter((key) => key.phase === 'active').at(-1)
  if (!contact || contact.at === 1) return
  timeline.splice(timeline.indexOf(contact) + 1, 0, { ...contact, at: 1 })
}

function accentKey(
  key: KeyPose,
  accents: Record<KeyPose['phase'], FightPose>,
  contact?: FightPose,
): KeyPose {
  const amount = key.phase === 'recovery' ? 1 - key.at : 1
  const pose = addPoses(key.pose, scalePose(accents[key.phase], amount))
  return { ...key, pose: key.phase === 'active' && contact ? { ...pose, ...contact } : pose }
}

function addRecoveryBeat(timeline: KeyPose[], style: NormalStyle): void {
  const recovery = timeline.filter((key) => key.phase === 'recovery')
  if (recovery.length !== 1) return
  const [existing] = recovery
  const contact = timeline.filter((key) => key.phase === 'active').at(-1)
  if (!contact || existing.at === style.recoverAt) return
  const before = style.recoverAt < existing.at
  const pose = before ? contact.pose : existing.pose
  timeline.splice(timeline.indexOf(existing) + Number(!before), 0, {
    phase: 'recovery',
    at: style.recoverAt,
    pose: addPoses(scalePose(pose, 0.42), style.recover),
    ease: 'out',
  })
}

const NATURAL: Record<KeyPose['phase'], FightPose> = {
  startup: {
    root: [0, -0.035, 0],
    pelvis: [0, 0.23, 0],
    rearKnee: [0.23, 0, 0],
    rearElbow: [-0.25, 0, 0],
  },
  active: {
    body: [0.08, 0, 0],
    pelvis: [0, -0.26, 0],
    rearHip: [0.12, 0, 0],
    leadPalm: [0.24, -0.16, 0],
  },
  recovery: { root: [0, -0.025, 0], leadKnee: [0.17, 0, 0], rearKnee: [0.21, 0, 0] },
}

const NATURAL_CACHE = new WeakMap<MoveTimeline, MoveTimeline>()

export function biscuitNaturalNormal(
  fighter: ArcadeFighter,
  slot: MoveSlot,
  timeline: MoveTimeline,
): MoveTimeline {
  if (!isBiscuitTrueForm(fighter) || !hasPersonalNormal(fighter.id, slot)) return timeline
  const cached = NATURAL_CACHE.get(timeline)
  if (cached) return cached
  const heavier = timeline.map((key) => accentKey(key, NATURAL))
  NATURAL_CACHE.set(timeline, heavier)
  return heavier
}
