import { addPoses, type FightPose } from './fightPose'
import {
  ARMS_BEHIND,
  ARMS_CROSSED,
  ARMS_GUARD,
  ARMS_LOOSE,
  ARMS_ON_HIPS,
  LEGS_DEEP,
  LEGS_SOFT,
  LEGS_UPRIGHT,
  LEGS_WIDE,
} from './fightStanceParts'
import type { FightStance } from './fightStance'
import type { FighterId } from './types'

/**
 * How every fighter past the vertical slice stands between moves, each after
 * the way the manga draws them at rest: Chrollo with his book open, Feitan
 * hunched into his collar, Franklin's fingers already aimed, Melody's flute at
 * her lips. A stance is a way to stand, a way to hold the arms, and what is the
 * fighter's own; bounce and tempo give each its breathing.
 *
 * Kurapika and Hisoka are authored in `fightStance.ts`, which reads this table
 * for everyone else.
 */
function stance(parts: FightPose[], bounce: number, tempo: number): FightStance {
  return { pose: addPoses(...parts), bounce, tempo }
}

export const ROSTER_STANCES: Partial<Record<FighterId, FightStance>> = {
  // Upright and unhurried, Bandit's Secret open in the lead hand at the chest.
  chrollo: stance(
    [
      LEGS_UPRIGHT,
      { chest: [0, -0.3, 0], head: [0.12, 0, 0] },
      { leadShoulder: [-0.55, 0, -0.1], leadElbow: [-1.55, 0, 0], leadWrist: [-0.3, 0, 0] },
      { rearShoulder: [-0.05, 0, -0.05], rearElbow: [-0.2, 0, 0] },
    ],
    0.02,
    0.6,
  ),
  // A soldier-prince squared up: chest out, fists clenched away from the body.
  benjamin: stance(
    [
      LEGS_WIDE,
      { chest: [-0.06, -0.12, 0], head: [-0.06, 0, 0] },
      { leadShoulder: [-0.2, 0, 0.3], leadElbow: [-0.5, 0, 0] },
      { rearShoulder: [-0.1, 0, -0.3], rearElbow: [-0.5, 0, 0] },
    ],
    0.02,
    0.7,
  ),
  // Hands behind the back, chin raised, leaning away: he does not fight, he is served.
  tserriednich: stance(
    [
      LEGS_UPRIGHT,
      ARMS_BEHIND,
      { body: [-0.06, 0, 0], chest: [-0.08, -0.2, 0], head: [-0.15, 0, 0] },
    ],
    0,
    0.5,
  ),
  // Hunched low into his collar, hands lost in the sleeves, blade arm hanging.
  feitan: stance(
    [
      LEGS_DEEP,
      { chest: [0.3, -0.25, 0], head: [-0.25, 0, 0] },
      { leadShoulder: [-0.35, 0, 0.05], leadElbow: [-0.4, 0, 0], leadWrist: [0.4, 0, 0] },
      { rearShoulder: [-0.7, 0, 0.3], rearElbow: [-1.3, 0, 0] },
    ],
    0.06,
    2.2,
  ),
  // Monkey-crouch on wide knees, priest's staff upright, free hand over the mouth.
  saiyu: stance(
    [
      LEGS_WIDE,
      { leadHip: [-0.2, 0, 0], leadKnee: [0.3, 0, 0], rearKnee: [0.2, 0, 0], body: [0.12, 0, 0] },
      { leadShoulder: [-0.6, 0, 0.2], leadElbow: [-1.2, 0, 0], leadWrist: [-0.6, 0, 0] },
      { rearShoulder: [-1.2, 0, 0.35], rearElbow: [-2.1, 0, 0] },
    ],
    0.12,
    2.4,
  ),
  // Controlled guard; the rear hand holds a physical handgun, not an aura projectile.
  theta: stance(
    [
      LEGS_SOFT,
      { chest: [0.04, -0.4, 0] },
      { leadShoulder: [-1.15, 0, 0.1], leadElbow: [-0.45, 0, 0], leadWrist: [-0.7, 0, 0] },
      { rearShoulder: [0.15, 0, -0.2], rearElbow: [-1.4, 0, 0] },
    ],
    0.05,
    1.4,
  ),
  // Shingen-ryu: low lead fist, rear fist chambered at the hip, knees bent.
  biscuit: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [-0.2, 0, 0],
        leadKnee: [0.25, 0, 0],
        body: [0.06, 0, 0],
        chest: [0.05, -0.35, 0],
      },
      { leadShoulder: [-0.7, 0, 0.1], leadElbow: [-0.9, 0, 0] },
      { rearShoulder: [0.3, 0, -0.15], rearElbow: [-1.7, 0, 0] },
    ],
    0.06,
    1.8,
  ),
  // Slouched, lead arm cocked above the shoulder for the cyclotron.
  phinks: stance(
    [
      LEGS_SOFT,
      { chest: [0.1, -0.2, 0.06], head: [0.1, 0, 0] },
      { leadShoulder: [-2.4, 0, 0.35], leadElbow: [-1.2, 0, 0] },
      { rearShoulder: [0.05, 0, -0.08], rearElbow: [-0.3, 0, 0] },
    ],
    0.04,
    1.1,
  ),
  // Planted like a turret, both arms forward with the fingers already aimed.
  franklin: stance(
    [
      LEGS_WIDE,
      { chest: [0.04, -0.1, 0] },
      { leadShoulder: [-1.3, 0, 0.12], leadElbow: [-0.25, 0, 0] },
      { rearShoulder: [-1.2, 0, -0.12], rearElbow: [-0.3, 0, 0] },
    ],
    0.01,
    0.5,
  ),
  // Still, both hands at the chest, fingers spread on the threads.
  machi: stance(
    [
      LEGS_SOFT,
      { chest: [0, -0.35, 0] },
      { leadShoulder: [-0.85, 0, 0.25], leadElbow: [-1.2, 0, 0], leadWrist: [-0.4, 0, 0] },
      { rearShoulder: [-0.75, 0, -0.1], rearElbow: [-1.5, 0, 0], rearWrist: [-0.4, 0, 0] },
    ],
    0.03,
    1,
  ),
  // Perfectly straight and empty, head tilted, needles low in the lead hand.
  illumi: stance(
    [
      LEGS_UPRIGHT,
      { head: [0, 0, 0.14] },
      { leadShoulder: [-0.2, 0, 0.08], leadElbow: [-0.35, 0, 0], leadWrist: [-0.5, 0, 0] },
      { rearShoulder: [0, 0, -0.03] },
    ],
    0,
    0.4,
  ),
  // Paper fan raised before the face in the rear hand, feet close, kimono demure.
  kalluto: stance(
    [
      LEGS_UPRIGHT,
      { chest: [0, -0.25, 0], head: [0.06, 0, 0] },
      { leadShoulder: [-0.1, 0, 0.05], leadElbow: [-0.5, 0, 0] },
      { rearShoulder: [-1.35, 0, 0.3], rearElbow: [-1.75, 0, 0], rearWrist: [-0.5, 0, 0] },
    ],
    0.03,
    0.9,
  ),
  // A war dancer: low and wide, arms open to the sides.
  bonolenov: stance(
    [
      LEGS_WIDE,
      { leadHip: [-0.25, 0, 0], leadKnee: [0.3, 0, 0], rearKnee: [0.2, 0, 0], body: [0.08, 0, 0] },
      { leadShoulder: [-0.3, 0, 1.05], leadElbow: [-0.6, 0, 0] },
      { rearShoulder: [-0.3, 0, -1.05], rearElbow: [-0.6, 0, 0] },
    ],
    0.08,
    1.3,
  ),
  // Absent-minded, Blinky held low in both hands, head to one side.
  shizuku: stance(
    [
      LEGS_UPRIGHT,
      { head: [0.08, 0, -0.12] },
      { leadShoulder: [-0.55, 0, -0.15], leadElbow: [-0.6, 0, 0] },
      { rearShoulder: [-0.5, 0, 0.15], rearElbow: [-0.7, 0, 0] },
    ],
    0.02,
    0.6,
  ),
  // A mafia brawler's heavy guard, shoulders rolled forward.
  hinrigh: stance([LEGS_WIDE, ARMS_GUARD, { chest: [0.14, -0.2, 0], head: [-0.1, 0, 0] }], 0.04, 1),
  // The lawyer of the Zodiacs waits with his arms folded.
  mizaistom: stance([LEGS_UPRIGHT, ARMS_CROSSED, { chest: [0, -0.2, 0] }], 0.01, 0.6),
  // Untrained but game: fists up, too wide, bouncing on his toes.
  leorio: stance(
    [
      LEGS_SOFT,
      ARMS_GUARD,
      { leadShoulder: [0, 0, 0.2], rearShoulder: [0.2, 0, -0.2], chest: [0, -0.25, 0] },
    ],
    0.12,
    2.2,
  ),
  // Ninja crouch: lead knife-hand low and forward, rear hand back.
  hanzo: stance(
    [
      LEGS_DEEP,
      { chest: [0.15, -0.45, 0] },
      { leadShoulder: [-1, 0, 0.1], leadElbow: [-0.5, 0, 0], leadWrist: [0.2, 0, 0] },
      { rearShoulder: [0.55, 0, -0.2], rearElbow: [-0.4, 0, 0] },
    ],
    0.08,
    2.6,
  ),
  // A predator stooped forward, arms hanging long, head pushed out.
  rihan: stance(
    [
      LEGS_SOFT,
      { body: [0.1, 0, 0], chest: [0.35, -0.15, 0], head: [-0.35, 0, 0] },
      { leadShoulder: [-0.4, 0, 0.12], leadElbow: [-0.25, 0, 0] },
      { rearShoulder: [-0.3, 0, -0.12], rearElbow: [-0.2, 0, 0] },
    ],
    0.05,
    1.2,
  ),
  // The hound: leaning in, lead hand raised by the face as if on the scent.
  zakuro: stance(
    [
      LEGS_SOFT,
      { chest: [0.2, -0.3, 0], head: [-0.15, 0, 0] },
      { leadShoulder: [-1.1, 0, 0.1], leadElbow: [-1.9, 0, 0] },
      { rearShoulder: [-0.2, 0, -0.1], rearElbow: [-0.4, 0, 0] },
    ],
    0.05,
    1.6,
  ),
  // Flute held across the lips, the lead arm reaching along it.
  melody: stance(
    [
      LEGS_UPRIGHT,
      { chest: [0, -0.35, 0], head: [0.08, 0, 0.08] },
      { leadShoulder: [-1.05, 0, 0.75], leadElbow: [-1.2, 0, 0] },
      { rearShoulder: [-1.2, 0, 0.1], rearElbow: [-2.05, 0, 0] },
    ],
    0.03,
    0.8,
  ),
  // The poet: brush raised in the lead hand, a sheet held low in the other.
  basho: stance(
    [
      LEGS_SOFT,
      { chest: [-0.03, -0.3, 0] },
      { leadShoulder: [-1.25, 0, 0.15], leadElbow: [-1.35, 0, 0], leadWrist: [0.4, 0, 0] },
      { rearShoulder: [-0.45, 0, -0.1], rearElbow: [-0.9, 0, 0] },
    ],
    0.04,
    1,
  ),
  // Hands on her hips, chest out, chin up: the second princess looks down on you.
  camilla: stance(
    [LEGS_UPRIGHT, ARMS_ON_HIPS, { chest: [-0.1, -0.15, 0], head: [-0.12, 0, 0] }],
    0.01,
    0.6,
  ),
  // The bow grown from his lead arm aimed straight ahead, the other hand steadying it.
  halkenburg: stance(
    [
      LEGS_SOFT,
      { chest: [0, -0.5, 0] },
      { leadShoulder: [-1.5, 0, 0.05], leadElbow: [-0.1, 0, 0] },
      { rearShoulder: [-1.2, 0, 0.35], rearElbow: [-1.3, 0, 0] },
    ],
    0.02,
    0.8,
  ),
  // Sinuous: hips swayed, the serpent arm extended low and forward.
  gel: stance(
    [
      LEGS_SOFT,
      { body: [0, 0, 0.08], chest: [0.05, -0.35, -0.1] },
      { leadShoulder: [-0.95, 0, 0.2], leadElbow: [-0.35, 0, 0], leadWrist: [0.5, 0, 0] },
      { rearShoulder: [0.1, 0, -0.25], rearElbow: [-1.2, 0, 0] },
    ],
    0.05,
    1.1,
  ),
  // The interrogator reaches out, lead palm open, the other hand on her hip.
  lynch: stance(
    [
      LEGS_SOFT,
      { chest: [0.06, -0.3, 0] },
      { leadShoulder: [-1.25, 0, 0.1], leadElbow: [-0.3, 0, 0], leadWrist: [-0.5, 0, 0] },
      { rearShoulder: [0.1, 0, -0.55], rearElbow: [-1.5, 0, 0] },
    ],
    0.03,
    0.9,
  ),
  // Casual teleporter: crouched slightly, hands framing a square before him.
  luini: stance(
    [
      LEGS_SOFT,
      { leadHip: [-0.2, 0, 0], leadKnee: [0.25, 0, 0], body: [0.06, 0, 0], chest: [0.08, -0.2, 0] },
      { leadShoulder: [-1, 0, 0.3], leadElbow: [-1, 0, 0], leadWrist: [-0.8, 0, 0] },
      { rearShoulder: [-0.9, 0, -0.3], rearElbow: [-1.1, 0, 0], rearWrist: [-0.8, 0, 0] },
    ],
    0.05,
    1.5,
  ),
  // Woble's bodyguard: quiet low hands, feet steady for a protective Ken.
  bill: stance(
    [
      LEGS_UPRIGHT,
      { chest: [0.06, -0.15, 0], head: [0.1, 0, 0] },
      { leadShoulder: [-0.6, 0, -0.1], leadElbow: [-1, 0, 0], leadWrist: [-0.4, 0, 0] },
      { rearShoulder: [-0.55, 0, 0.1], rearElbow: [-1.05, 0, 0], rearWrist: [-0.4, 0, 0] },
    ],
    0.02,
    0.8,
  ),
  // At attention: legs together, arms rigid along the seams.
  furykov: stance(
    [
      LEGS_UPRIGHT,
      { leadHip: [0, 0, -0.04], rearHip: [0, 0, 0.04], chest: [-0.04, 0, 0] },
      { leadShoulder: [0.05, 0, 0.04], rearShoulder: [0.05, 0, -0.04] },
    ],
    0,
    0.5,
  ),
  // Fussy and proud: one hand on the hip, the other raised by the face.
  cluck: stance(
    [
      LEGS_UPRIGHT,
      { body: [0, 0, 0.05], chest: [-0.04, -0.25, 0] },
      { leadShoulder: [-1.4, 0, 0.3], leadElbow: [-1.8, 0, 0], leadWrist: [0.4, 0, 0] },
      { rearShoulder: [0.1, 0, -0.55], rearElbow: [-1.5, 0, 0] },
    ],
    0.04,
    1.6,
  ),
  // The explorer: arms flung open, leaning back, all confidence.
  beyond: stance(
    [
      LEGS_WIDE,
      { body: [-0.05, 0, 0], chest: [-0.12, -0.1, 0], head: [-0.1, 0, 0] },
      { leadShoulder: [-0.5, 0, 0.9], leadElbow: [-0.35, 0, 0] },
      { rearShoulder: [-0.5, 0, -0.9], rearElbow: [-0.35, 0, 0] },
    ],
    0.02,
    0.6,
  ),
  // Moonlight Act: lead palm turned up toward the sky.
  longhi: stance(
    [
      LEGS_SOFT,
      { chest: [-0.06, -0.3, 0], head: [-0.15, 0, 0] },
      { leadShoulder: [-2, 0, 0.3], leadElbow: [-0.6, 0, 0], leadWrist: [0.6, 0, 0] },
      { rearShoulder: [0, 0, -0.1], rearElbow: [-0.3, 0, 0] },
    ],
    0.03,
    0.8,
  ),
  // Military training: a tight high guard, quick on the feet.
  musse: stance(
    [
      LEGS_SOFT,
      ARMS_GUARD,
      { leadShoulder: [-0.15, 0, -0.1], rearShoulder: [-0.15, 0, 0.1], chest: [0.08, -0.3, 0] },
    ],
    0.1,
    2.4,
  ),
  // The weapon arm leveled forward like a blade, the other tucked in.
  padaille: stance(
    [
      LEGS_SOFT,
      { chest: [0.06, -0.45, 0] },
      { leadShoulder: [-1.45, 0, 0], leadElbow: [-0.05, 0, 0], leadWrist: [0.15, 0, 0] },
      { rearShoulder: [-0.5, 0, 0.2], rearElbow: [-1.8, 0, 0] },
    ],
    0.05,
    1.4,
  ),
  // Close protection: square stance, lead hand open low, rear arm across the chest.
  sayird: stance(
    [
      LEGS_WIDE,
      { chest: [0.05, -0.1, 0] },
      { leadShoulder: [-0.7, 0, 0.1], leadElbow: [-0.6, 0, 0], leadWrist: [-0.5, 0, 0] },
      { rearShoulder: [-0.8, 0, 0.45], rearElbow: [-1.8, 0, 0] },
    ],
    0.03,
    1.2,
  ),
  // Sweet Home: knees bent behind arms crossed like a shield.
  terebellum: stance(
    [
      LEGS_SOFT,
      ARMS_CROSSED,
      {
        leadHip: [-0.2, 0, 0],
        leadKnee: [0.22, 0, 0],
        body: [0.06, 0, 0],
        chest: [0.12, -0.15, 0],
      },
    ],
    0.04,
    1,
  ),
  // Hideout Doors: the lead hand out to the side as if on a handle.
  voconte: stance(
    [
      LEGS_SOFT,
      { chest: [0, -0.2, 0] },
      { leadShoulder: [-0.6, 0, 0.95], leadElbow: [-0.9, 0, 0], leadWrist: [0.5, 0, 0] },
      { rearShoulder: [-0.7, 0, 0.2], rearElbow: [-1.7, 0, 0] },
    ],
    0.04,
    1.1,
  ),
  // The judge of LSDF: upright, a raised index calling the next point.
  yokotani: stance(
    [
      LEGS_UPRIGHT,
      { chest: [-0.03, -0.25, 0] },
      { leadShoulder: [-1.9, 0, 0.2], leadElbow: [-1.5, 0, 0], leadWrist: [-0.3, 0, 0] },
      ARMS_LOOSE,
    ],
    0.01,
    0.6,
  ),
}
