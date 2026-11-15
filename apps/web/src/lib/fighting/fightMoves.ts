import { variantMotion } from './variantMotion'
import type { AnimatedHuman, HumanMotion } from '$lib/tour/humanAnimation'
import { heavyFightMove, lightFightMove } from './normalFightMoves'
import type { ArcadeFighter, AttackKind, FighterId, FighterPose } from './types'

export const FIGHT_MOVE_TIMING: Record<
  AttackKind,
  { duration: number; impact: number; lunge: number }
> = {
  // These ratios mirror frameData's first active frame / total frames.
  light: { duration: 18 / 60, impact: 5 / 18, lunge: 0.55 },
  heavy: { duration: 34 / 60, impact: 12 / 34, lunge: 0.9 },
  special: { duration: 50 / 60, impact: 16 / 50, lunge: 1.2 },
  ranged: { duration: 28 / 60, impact: 10 / 28, lunge: 0 },
}

export const HIT_DURATION = 0.24
export const KO_DURATION = 0.68

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => {
  const x = clamp01(value)
  return x * x * (3 - 2 * x)
}

/** Three continuous beats: preparation, contact, recovery. */
function beats(
  progress: number,
  impact = 0.55,
): { windup: number; strike: number; return: number } {
  const windupEnd = impact * 0.62
  return {
    windup: smooth(progress / windupEnd),
    strike: smooth((progress - windupEnd) / (impact - windupEnd)),
    return: smooth((progress - impact) / (1 - impact)),
  }
}

interface SpecialMoveOptions {
  rig: AnimatedHuman
  fighter: FighterId
  beat: ReturnType<typeof beats>
}

function extendedSpecial(options: SpecialMoveOptions): boolean {
  const { rig, fighter, beat } = options
  const release = beat.strike * (1 - beat.return)
  const gather = beat.windup * (1 - beat.return)
  switch (fighter) {
    case 'theta':
      rig.figure.rotation.y -= 0.28 * gather
      rig.arms[0].rotation.set(-0.65 * gather, 0, 0.35 * gather)
      rig.arms[1].rotation.set(-0.5 * gather - 1.4 * release, 0, -0.2 * gather)
      rig.head.rotation.y += 0.18 * gather
      return true
    case 'biscuit':
      rig.figure.rotation.x += 0.22 * gather - 0.55 * release
      rig.arms.forEach((arm, index) => {
        arm.rotation.x -= 1.55 * gather + 0.55 * release
        arm.rotation.z += (index === 0 ? 1 : -1) * 0.25 * gather
      })
      rig.knees.forEach((knee) => (knee.rotation.x += 0.3 * gather))
      return true
    case 'marayam':
      rig.figure.rotation.x += 0.08 * gather
      rig.arms[0].rotation.set(-0.55 * gather, 0, 1.15 * gather)
      rig.arms[1].rotation.set(-0.55 * gather, 0, -1.15 * gather)
      rig.head.rotation.x -= 0.2 * gather
      return true
    default:
      return false
  }
}

function special(rig: AnimatedHuman, fighter: FighterId, progress: number): void {
  const beat = beats(progress, FIGHT_MOVE_TIMING.special.impact)
  const release = beat.strike * (1 - beat.return)
  const gather = beat.windup * (1 - beat.return)
  if (extendedSpecial({ rig, fighter, beat })) return

  switch (fighter) {
    case 'kurapika':
      rig.figure.rotation.y -= 0.35 * gather
      rig.arms[0].rotation.set(-1.1 * gather, 0, 0.62 * gather)
      rig.arms[0].children[1].rotation.x -= 1.25 * gather
      rig.arms[1].rotation.set(-0.7 * gather - 0.95 * release, 0, -0.28 * gather)
      rig.arms[1].children[1].rotation.x -= 0.95 * gather * (1 - beat.strike)
      break
    case 'hisoka':
      rig.figure.rotation.y += 0.5 * gather - 0.92 * release
      rig.figure.rotation.z -= 0.16 * gather
      rig.arms[0].rotation.set(-0.75 * gather, 0, 1.2 * gather)
      rig.arms[1].rotation.set(-0.5 * gather - 1.05 * release, 0, -1.05 * gather)
      rig.arms[1].children[1].rotation.x -= 1.4 * gather * (1 - beat.strike)
      break
    case 'chrollo':
      rig.head.rotation.x += 0.18 * gather
      rig.arms[0].rotation.set(-0.86 * gather, 0, 0.42 * gather)
      rig.arms[1].rotation.set(-0.86 * gather - 0.72 * release, 0, -0.42 * gather)
      rig.arms[0].children[1].rotation.x -= 1.32 * gather
      rig.arms[1].children[1].rotation.x -= 1.32 * gather * (1 - beat.strike)
      rig.figure.rotation.y -= 0.5 * release
      break
    case 'morena':
      rig.figure.rotation.x += 0.08 * gather
      rig.head.rotation.z -= 0.18 * gather
      rig.arms[0].rotation.set(-0.3 * gather, 0, 1.35 * gather)
      rig.arms[1].rotation.set(-0.3 * gather, 0, -1.35 * gather)
      rig.arms[1].rotation.x -= 1.05 * release
      rig.knees.forEach((knee) => (knee.rotation.x += 0.24 * gather))
      break
    case 'benjamin':
      rig.figure.rotation.x += 0.18 * gather - 0.48 * release
      rig.arms[0].rotation.set(-1.75 * gather, 0, 0.28 * gather)
      rig.arms[1].rotation.set(-1.75 * gather, 0, -0.28 * gather)
      rig.arms.forEach((arm) => (arm.children[1].rotation.x -= 0.62 * gather))
      rig.knees.forEach((knee) => (knee.rotation.x += 0.34 * gather))
      break
    case 'tserriednich':
      rig.figure.rotation.y += 0.72 * gather - 1.12 * release
      rig.figure.rotation.z += 0.12 * gather
      rig.head.rotation.y -= 0.38 * gather
      rig.arms[0].rotation.set(-1.18 * gather, 0, 0.4 * gather)
      rig.arms[1].rotation.set(-0.42 * gather - 1.2 * release, 0, -0.8 * gather)
      rig.arms[1].children[1].rotation.x -= 1.05 * gather * (1 - beat.strike)
      break
    default:
      extraSpecial(rig, { fighter, gather, release })
  }
}

interface SpecialGesture {
  fighter: FighterId
  gather: number
  release: number
}

function extraSpecial(rig: AnimatedHuman, options: SpecialGesture): void {
  const { fighter, gather, release } = options
  switch (fighter) {
    case 'feitan':
      rig.figure.rotation.x += 0.3 * gather
      rig.figure.rotation.y -= 1.15 * release
      rig.arms.forEach((arm, index) => {
        arm.rotation.x -= 1.2 * gather
        arm.rotation.z += (index === 0 ? 1 : -1) * 0.7 * gather
      })
      break
    case 'saiyu':
      rig.figure.rotation.y += 0.85 * gather - 1.3 * release
      rig.arms[0].rotation.set(-0.7 * gather, 0, 1.1 * gather)
      rig.arms[1].rotation.set(-0.8 * gather - 0.9 * release, 0, -0.9 * gather)
      break
    case 'phinks':
      rig.figure.rotation.x += 0.28 * gather - 0.62 * release
      rig.arms[1].rotation.x -= 1.8 * gather + 1.1 * release
      rig.arms[1].children[1].rotation.x -= 0.9 * gather
      break
    case 'franklin':
      rig.figure.rotation.x += 0.16 * gather
      rig.arms[0].rotation.set(-1.3 * gather - 0.6 * release, 0, 0.35 * gather)
      rig.arms[1].rotation.set(-1.3 * gather - 0.6 * release, 0, -0.35 * gather)
      break
    case 'machi':
      rig.figure.rotation.y -= 0.7 * release
      rig.arms[0].rotation.set(-0.5 * gather, 0, 1.15 * gather)
      rig.arms[1].rotation.set(-0.45 * gather - 1.1 * release, 0, -0.9 * gather)
      break
    case 'illumi':
      rig.figure.rotation.y += 0.45 * gather - 0.8 * release
      rig.arms[0].rotation.z += 0.8 * gather
      rig.arms[1].rotation.x -= 0.65 * gather + 1.3 * release
      break
    case 'kalluto':
      rig.figure.rotation.y += 1.2 * gather - 1.55 * release
      rig.arms[0].rotation.z += 1.25 * gather
      rig.arms[1].rotation.z -= 1.25 * gather
      break
    case 'bonolenov':
      rig.figure.rotation.y -= 0.9 * gather - 1.3 * release
      rig.figure.rotation.z += 0.2 * gather
      rig.arms.forEach((arm) => (arm.rotation.x -= 1.15 * gather + 0.45 * release))
      break
    default:
      secondWaveSpecial(rig, options)
  }
}

function secondWaveSpecial(rig: AnimatedHuman, options: SpecialGesture): void {
  const { fighter, gather, release } = options
  switch (fighter) {
    case 'shizuku':
      rig.figure.rotation.y -= 0.7 * release
      rig.arms[1].rotation.x -= 1.4 * gather
      break
    case 'hinrigh':
      rig.figure.rotation.y += 0.6 * gather - 1.1 * release
      rig.arms[0].rotation.z += 1.1 * gather
      break
    case 'mizaistom':
      rig.arms[1].rotation.x -= 1.3 * release
      rig.arms[0].rotation.z += 0.7 * gather
      break
    case 'leorio':
      rig.figure.rotation.x += 0.3 * gather - 0.65 * release
      rig.arms[1].rotation.x -= 1.7 * release
      break
    case 'hanzo':
      rig.figure.rotation.y += 1.2 * gather - 1.6 * release
      rig.knees.forEach((knee) => (knee.rotation.x += 0.4 * gather))
      break
    case 'rihan':
      rig.head.rotation.y -= 0.35 * gather
      rig.arms[1].rotation.x -= 1.15 * release
      break
    case 'zakuro':
      rig.arms[0].rotation.z += 1.2 * gather
      rig.arms[1].rotation.z -= 1.2 * gather
      break
    case 'melody':
      rig.head.rotation.x += 0.2 * gather
      rig.arms.forEach((arm) => (arm.rotation.z += 0.5 * gather))
      break
  }
}

function ranged(rig: AnimatedHuman, progress: number): void {
  const beat = beats(progress, FIGHT_MOVE_TIMING.ranged.impact)
  const release = beat.strike * (1 - beat.return)
  const gather = beat.windup * (1 - beat.return)
  rig.figure.rotation.y -= 0.32 * gather - 0.55 * release
  rig.arms[0].rotation.set(-0.72 * gather, 0, 0.48 * gather)
  rig.arms[1].rotation.set(-0.45 * gather - 1.35 * release, 0, -0.34 * gather)
  rig.arms[1].children[1].rotation.x -= 1.05 * gather * (1 - beat.strike)
}

function jump(rig: AnimatedHuman, progress: number): void {
  const launch = smooth(progress / 0.22)
  const land = smooth((progress - 0.72) / 0.28)
  const tuck = Math.sin(clamp01(progress) * Math.PI)
  rig.figure.rotation.x -= 0.1 * launch * (1 - land)
  rig.legs.forEach((leg, index) => {
    leg.rotation.x += (index === 0 ? 0.35 : -0.15) * tuck
  })
  rig.knees.forEach((knee) => (knee.rotation.x += 0.72 * tuck + 0.34 * land))
  rig.arms.forEach((arm, index) => {
    arm.rotation.x -= 0.7 * launch * (1 - land)
    arm.rotation.z += (index === 0 ? 1 : -1) * 0.22 * launch
  })
}

function recoil(rig: AnimatedHuman, progress: number): void {
  const snap = smooth(progress / 0.28)
  const recover = smooth((progress - 0.28) / 0.72)
  const amount = snap * (1 - recover)
  rig.figure.rotation.z -= 0.34 * amount
  rig.figure.rotation.x += 0.2 * amount
  rig.figure.position.x += 0.12 * amount
  rig.head.rotation.x -= 0.25 * amount
  rig.arms[0].rotation.z += 0.55 * amount
  rig.arms[1].rotation.z -= 0.42 * amount
}

function fall(rig: AnimatedHuman, progress: number): void {
  const drop = smooth(progress)
  rig.figure.rotation.z += 1.42 * drop
  rig.figure.rotation.x += 0.16 * Math.sin(drop * Math.PI)
  rig.figure.position.y += 0.24 * drop
  rig.figure.position.x += 0.18 * drop
  rig.arms[0].rotation.z += 0.72 * drop
  rig.arms[1].rotation.z -= 0.88 * drop
  rig.knees[1].rotation.x += 0.7 * drop
}

export function fightMove(
  fighter: Pick<ArcadeFighter, 'id' | 'pose'> &
    Partial<Pick<ArcadeFighter, 'attack' | 'crouching'>>,
  progress: number,
): HumanMotion | undefined {
  const value = clamp01(progress)
  const variant = variantMotion(fighter, value)
  if (variant) return variant
  if (fighter.pose === 'light') return (rig) => lightFightMove(rig, fighter.id, value)
  if (fighter.pose === 'heavy') return (rig) => heavyFightMove(rig, fighter.id, value)
  if (fighter.pose === 'special') return (rig) => special(rig, fighter.id, value)
  if (fighter.pose === 'ranged') return (rig) => ranged(rig, value)
  if (fighter.pose === 'jump') return (rig) => jump(rig, value)
  if (fighter.pose === 'hit') return (rig) => recoil(rig, value)
  if (fighter.pose === 'ko') return (rig) => fall(rig, value)
  return undefined
}

export function fightMoveDuration(pose: FighterPose): number {
  if (pose === 'light' || pose === 'heavy' || pose === 'special' || pose === 'ranged')
    return FIGHT_MOVE_TIMING[pose].duration
  if (pose === 'hit') return HIT_DURATION
  if (pose === 'ko') return KO_DURATION
  return 0
}
