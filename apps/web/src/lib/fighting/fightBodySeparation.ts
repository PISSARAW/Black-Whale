import { Box3, type Mesh, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fighterAnchored } from './fighterAnchors'
import { createSeparationSupport } from './fightSeparationSupport'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import type { ArcadeFighter, FightSide, FightState } from './types'

const GAP = 0.025

/** The material core has volume even when the animation leans outside its gameplay pushbox. */
export function createFightBodySeparation(figureOf: (side: FightSide) => Object3D) {
  let supports = makeSupports()
  let identity = '',
    previous = -1,
    clearance = 0,
    order = 1
  return (state: FightState) => {
    const key = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
    if (identity !== key || state.frame < previous) {
      clearance = 0
      supports = makeSupports()
    }
    identity = key
    const dt = state.hitstop > 0 ? 0 : Math.max(0, state.frame - previous)
    previous = state.frame
    const roots = { player: figureOf('player').parent!, opponent: figureOf('opponent').parent! }
    if (!roots.player || !roots.opponent) return
    const direction =
      Math.sign(roots.opponent.position.x - roots.player.position.x) || state.player.facing
    if (direction !== order) clearance = 0
    order = direction
    const needed = coreOverlap(figureOf('player'), figureOf('opponent'), direction)
    clearance = Math.max(needed, clearance * Math.exp(-dt / 6))
    if (projectionBody(state.player) || projectionBody(state.opponent)) {
      clearance = 0
      return
    }
    displaceCores(roots, state, clearance * direction)
    for (const side of ['player', 'opponent'] as const)
      supports[side](figureOf(side), state[side], { frame: state.frame, frozen: state.hitstop > 0 })
  }
}

/** Only an actually projected vessel is immaterial; Ren, In, armour and ordinary invulnerability are not. */
export function projectionBody(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.hanzoProjection && fighter.hanzoProjection.startupFrames <= 0)
}

function coreOverlap(a: Object3D, b: Object3D, direction: number): number {
  const left = coreBoxes(direction === 1 ? a : b),
    right = coreBoxes(direction === 1 ? b : a)
  let overlap = 0
  for (const x of left)
    for (const y of right) {
      const vertical = Math.min(x.max.y, y.max.y) - Math.max(x.min.y, y.min.y)
      if (vertical > 0.01) overlap = Math.max(overlap, x.max.x - y.min.x + GAP)
    }
  return Math.max(0, overlap)
}

export function coreBoxes(figure: Object3D): Box3[] {
  const human = humanAnimationRig(figure)
  if (!human) return []
  return [human.torso, human.pelvis, human.head.children[0]].map(bodySurfaceBox)
}

/** Ignore aura, clothes attachments and held props when measuring an anatomical surface. */
export function bodySurfaceBox(part: Object3D): Box3 {
  const mesh = part as Mesh
  mesh.updateWorldMatrix(true, false)
  if (!mesh.geometry) return new Box3().setFromObject(part)
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  return mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld)
}

function displaceCores(roots: Record<FightSide, Object3D>, state: FightState, distance: number) {
  const share = separationShare(state)
  roots.player.position.x -= distance * share
  roots.opponent.position.x += distance * (1 - share)
}

function separationShare(state: FightState): number {
  const playerFixed = fixedBody(state.player),
    opponentFixed = fixedBody(state.opponent)
  if (playerFixed && !opponentFixed) return 0
  if (opponentFixed && !playerFixed) return 1
  if (state.player.attack && state.opponent.pose === 'hit') return 0.15
  if (state.opponent.attack && state.player.pose === 'hit') return 0.85
  const a = fightPhysicalProfile(state.player).resistance
  const b = fightPhysicalProfile(state.opponent).resistance
  return a / (a + b)
}

function makeSupports() {
  return { player: createSeparationSupport(), opponent: createSeparationSupport() }
}

function fixedBody(fighter: ArcadeFighter): boolean {
  return fighterAnchored(fighter) || fighter.x <= 7 || fighter.x >= 93
}
