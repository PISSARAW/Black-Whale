import { PerspectiveCamera, Vector3 } from 'three'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface CinematicFrame {
  x: number
  lookY: number
  z: number
  intensity: number
  inset?: boolean
  yaw?: number
  focus?: FightSide
}

/** Fit the authored film pose to the live inset's actual aspect ratio. */
export function fitCinematicView(frame: CinematicFrame, state: FightState, aspect: number) {
  probe.aspect = aspect
  probe.updateProjectionMatrix()
  const result = fit({ ...frame, inset: false }, boundsAt([state], 0, frame.focus))
  probe.aspect = ASPECT
  probe.updateProjectionMatrix()
  return { x: result.x, y: result.lookY + 0.55, z: result.z, lookY: result.lookY }
}

interface CameraCue {
  frame: number
  kind: 'combo' | 'hatsu' | 'critical' | 'finish' | 'on' | 'guard'
  side: FightSide
  strength: number
}

const BASE_DISTANCE = 5.9
const ASPECT = 1920 / 858
const probe = new PerspectiveCamera(34, ASPECT, 0.1, 100)
const point = new Vector3()

const transitions: Array<{
  read: (fighter?: ArcadeFighter) => unknown
  kind: CameraCue['kind']
  strength: number
}> = [
  { read: (f) => f?.biscuitTrueForm, kind: 'hatsu', strength: 1.2 },
  { read: (f) => f?.crossGameCardFrames, kind: 'hatsu', strength: 0.9 },
  { read: (f) => f?.kurapika?.emperorTime, kind: 'hatsu', strength: 1.2 },
  { read: (f) => f?.kurapika?.held?.loaded, kind: 'hatsu', strength: 1 },
]
function fighterCues({
  state,
  previous,
  side,
  index,
}: {
  state: FightState
  previous?: FightState
  side: FightSide
  index: number
}) {
  const fighter = state[side]
  const before = previous?.[side]
  const cues: CameraCue[] = []
  for (const { read, kind, strength } of transitions)
    if (read(fighter) && !read(before)) cues.push({ frame: index, side, kind, strength })
  cues.push(...judgmentCue(fighter, before, index))
  if (fighter.nen.on && !before?.nen.on)
    cues.push({ frame: index, side, kind: 'on', strength: 1.2 })
  return [...cues, ...attackCues({ fighter, before, side, index })]
}
function judgmentCue(
  fighter: ArcadeFighter,
  before: ArcadeFighter | undefined,
  index: number,
): CameraCue[] {
  if (!fighter.judgmentChain || before?.judgmentChain) return []
  return [{ frame: index, side: fighter.judgmentChain.owner, kind: 'hatsu', strength: 1.15 }]
}
function attackCues({
  fighter,
  before,
  side,
  index,
}: {
  fighter: ArcadeFighter
  before?: ArcadeFighter
  side: FightSide
  index: number
}): CameraCue[] {
  const attack = fighter.attack
  const old = before?.attack
  if (attack?.kind !== 'special') return []
  if (old && attack.frame >= old.frame && attack.moveId === old.moveId) return []
  return [
    {
      frame: index,
      kind: 'hatsu',
      side,
      strength: attack.moveId?.endsWith(':finisher') ? 1.15 : 0.9,
    },
  ]
}
function worldCues(state: FightState, previous: FightState | undefined, index: number) {
  const cues: CameraCue[] = []
  if (state.catsName && state.catsName.frame % 24 === 0)
    cues.push({ frame: index, kind: 'hatsu', side: state.catsName.victimSide, strength: 1.2 })
  if (state.parallelFuture?.phase !== previous?.parallelFuture?.phase && state.parallelFuture)
    cues.push({ frame: index, kind: 'hatsu', side: state.parallelFuture.owner, strength: 1.05 })
  if (sunIgnited(state, previous))
    cues.push({ frame: index, kind: 'hatsu', side: 'player', strength: 1.2 })
  return cues
}
function sunIgnited(state: FightState, previous?: FightState) {
  return state.player.hatsuEffects.painPacker?.sun && !previous?.player.hatsuEffects.painPacker?.sun
}
function impactCues(state: FightState, previous: FightState | undefined, index: number) {
  const cues: CameraCue[] = []
  const impact = state.impact
  if (!impact || impact.sequence === previous?.impact?.sequence) return cues
  if (impact.blocked && impact.kind === 'heavy')
    cues.push({ frame: index, kind: 'guard', side: impact.attacker, strength: 0.5 })
  if (impact.blocked) return cues
  if (impact.critical)
    cues.push({ frame: index, kind: 'critical', side: impact.attacker, strength: 1.1 })
  else if (impact.comboHits >= 2)
    cues.push({
      frame: index,
      kind: 'combo',
      side: impact.attacker,
      strength: 0.65 + Math.min(3, impact.comboHits) * 0.1,
    })
  return cues
}
function cuesAt(states: FightState[], index: number): CameraCue[] {
  const state = states[index]
  const previous = states[index - 1]
  const cues = worldCues(state, previous, index)
  for (const side of ['player', 'opponent'] as const)
    cues.push(...fighterCues({ state, previous, side, index }))
  cues.push(...impactCues(state, previous, index))
  if (state.phase === 'finished' && previous?.phase === 'fighting')
    cues.push({
      frame: index,
      kind: 'finish',
      side: state.winner === 'opponent' ? 'opponent' : 'player',
      strength: 1.2,
    })
  return cues
}

function cueEnvelope(cue: CameraCue, index: number) {
  const age = index - cue.frame
  const hold = cue.kind === 'combo' ? 10 : 22
  const release = cue.kind === 'combo' ? 34 : 44
  if (age < 0 || age > hold + release) return 0
  if (age <= hold) return cue.strength
  const t = (age - hold) / release
  return cue.strength * (1 - t * t * (3 - 2 * t))
}

function framedFighters(state: FightState, focus?: FightSide): ArcadeFighter[] {
  return focus ? [state[focus]] : [state.player, state.opponent]
}

function boundsAt(states: FightState[], index: number, focus?: FightSide) {
  const bounds: Vector3[] = []
  // Look ahead through jump takeoff and recoil, so widening begins before a body reaches an edge.
  for (const sample of [index, Math.min(states.length - 1, index + 12)]) {
    const cat = states[sample].catsName
    if (cat) {
      const killer = states[sample][cat.killerSide]
      for (const dx of [-1.55, 1.55])
        for (const height of [0.03, 3.35])
          bounds.push(new Vector3(fightWorldX(killer.x) + dx, height, 0.12))
    }
    for (const fighter of framedFighters(states[sample], focus)) {
      const x = fightWorldX(fighter.x)
      const floor = fightWorldY(fighter.y)
      for (const dx of fighter.biscuitTrueForm ? [-1.05, 1.05] : [-0.72, 0.72])
        for (const height of [0.03, fighter.biscuitTrueForm ? 2.9 : 2.22])
          bounds.push(new Vector3(x + dx, floor + height, 0.12))
    }
  }
  return bounds
}

function setCamera(camera: PerspectiveCamera, frame: CinematicFrame) {
  camera.position.set(
    frame.x + Math.sin(frame.yaw ?? 0) * frame.z,
    frame.lookY + 0.55,
    Math.cos(frame.yaw ?? 0) * frame.z,
  )
  camera.lookAt(frame.x, frame.lookY, 0)
  camera.updateMatrixWorld(true)
}

function visible(bounds: Vector3[], frame: CinematicFrame) {
  setCamera(probe, frame)
  return bounds.every((bound) => {
    point.copy(bound).project(probe)
    return (
      point.x > -0.88 && point.x < (frame.inset ? 0.18 : 0.88) && point.y > -0.88 && point.y < 0.67
    )
  })
}

function fit(frame: CinematicFrame, bounds: Vector3[]) {
  for (let attempt = 0; attempt < 60 && !visible(bounds, frame); attempt++) frame.z *= 1.02
  return frame
}

/** Independent presentation track: it never writes to a fighter, input, clock or resource. */
export function createCinematicTrack(states: FightState[], insets: boolean[] = []) {
  const cues = states.flatMap((_, index) => cuesAt(states, index))
  const frames: CinematicFrame[] = []
  const bounds = states.map((_, index) => boundsAt(states, index))
  let held: CinematicFrame = { x: 0, lookY: 1.24, z: BASE_DISTANCE, intensity: 0 }
  for (let index = 0; index < states.length; index++) {
    const state = states[index]
    let intensity = 0
    let focus: FightSide | null = null
    for (const cue of cues) {
      const strength = cueEnvelope(cue, index)
      if (strength > intensity) {
        intensity = strength
        focus = cue.side
      }
    }
    const centre = (fightWorldX(state.player.x) + fightWorldX(state.opponent.x)) / 2
    const focusOffset = focus ? (fightWorldX(state[focus].x) - centre) * 0.12 : 0
    const height = Math.max(fightWorldY(state.player.y), fightWorldY(state.opponent.y))
    const insetWeight = Math.max(
      0,
      ...Array.from({ length: 49 }, (_, offset) => {
        const delta = offset - 24
        return insets[index + delta] ? 1 - Math.abs(delta) / 25 : 0
      }),
    )
    const halfSpan =
      Math.abs(fightWorldX(state.player.x) - fightWorldX(state.opponent.x)) / 2 + 0.72
    const target = {
      x: centre + focusOffset + halfSpan * 0.72 * insetWeight,
      lookY: (state.catsName ? 1.65 : 1.24) + height * 0.42,
      z: BASE_DISTANCE - intensity * 0.95,
    }
    const zoomRate = target.z < held.z ? 0.16 : 0.055
    held = fit(
      {
        x: held.x + (target.x - held.x) * 0.19,
        lookY: held.lookY + (target.lookY - held.lookY) * 0.12,
        z: held.z + (target.z - held.z) * zoomRate,
        intensity,
        inset: insets[index],
      },
      bounds[index],
    )
    frames.push({ ...held })
  }
  // Dolly out ahead of jumps, then ease back in; no jump cuts or sudden safety corrections.
  for (let index = frames.length - 2; index >= 0; index--)
    frames[index].z = Math.max(frames[index].z, frames[index + 1].z - 0.045)
  for (let index = 1; index < frames.length; index++)
    frames[index].z = Math.max(frames[index].z, frames[index - 1].z - 0.035)
  return {
    frames,
    report: {
      baselineDistance: BASE_DISTANCE,
      minimumDistance: Math.min(...frames.map((frame) => frame.z)),
      maximumDistance: Math.max(...frames.map((frame) => frame.z)),
      cueCount: cues.length,
      cues: cues.map((cue) => ({ second: cue.frame / 60, ...cue })),
      framingViolations: frames.filter((frame, index) => !visible(bounds[index], frame)).length,
      maximumDollyStep: Math.max(
        ...frames.slice(1).map((frame, index) => Math.abs(frame.z - frames[index].z)),
      ),
    },
  }
}

/** The production renderer exposes Scene callbacks; restore its camera after each render pass. */
export function applyCinematicFrame(camera: PerspectiveCamera, frame: CinematicFrame) {
  const position = camera.position.clone()
  const rotation = camera.quaternion.clone()
  setCamera(camera, frame)
  return () => {
    camera.position.copy(position)
    camera.quaternion.copy(rotation)
    camera.updateMatrixWorld(true)
  }
}
