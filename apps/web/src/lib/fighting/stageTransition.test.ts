import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip } from '../tour/blueprint'
import { finishFight } from './combatVerdict'
import { createFightState } from './fightState'
import { adjacentStageRoom } from './stageTransition'
import { buildShipRoomScenery } from './stageShipRoom'
import { FIGHT_STAGES } from './stages'
import type { FightImpact, FightState } from './types'

const impact = (wallSplat: boolean): FightImpact => ({
  sequence: 1,
  attacker: 'player',
  kind: 'heavy',
  damage: 20,
  blocked: false,
  parried: false,
  critical: true,
  knockdown: true,
  counterHit: false,
  punish: false,
  antiAir: false,
  wallSplat,
  invulnerable: false,
  comboHits: 1,
  damageScale: 1,
  points: 1,
  zone: 'torso',
  concealed: false,
  avoided: false,
  projectileId: null,
  position: { x: 93, y: 1 },
})

function atWall(stageId: FightState['environment']['stageId']): FightState {
  const state = createFightState('kurapika', 'hisoka', {
    mode: 'versus-local',
    formatId: 'knockout',
    environment: { stageId },
  })
  return { ...state, opponent: { ...state.opponent, x: 93, health: 0 }, impact: impact(true) }
}

describe('destructible Clash stage walls', () => {
  it('sends a wall-splat KO into a real neighbouring room and places both bodies there', () => {
    const ended = finishFight(atWall('banquet-hall'), 'player')

    expect(ended.stageTransition).toMatchObject({
      fromSpaceId: 'tier-1-banquet-hall',
      toSpaceId: 'tier-1-royal-approach',
      direction: 'right',
      sequence: 1,
    })
    expect(ended.player.x).toBe(46)
    expect(ended.opponent.x).toBe(62)
  })

  it('does not break scenery without a wall splat or outside a ship room', () => {
    const central = atWall('banquet-hall')
    expect(
      finishFight({ ...central, impact: impact(false) }, 'player').stageTransition,
    ).toBeUndefined()
    expect(finishFight(atWall('heavens-arena'), 'player').stageTransition).toBeUndefined()
  })

  it('can break back into the selected room on a later round', () => {
    const first = finishFight(atWall('cineplex-concourse'), 'player')
    const second = finishFight(
      {
        ...first,
        phase: 'fighting',
        winner: null,
        finishReason: null,
        opponent: { ...first.opponent, x: 7 },
        impact: { ...impact(true), sequence: 2, position: { x: 7, y: 1 } },
      },
      'player',
    )
    expect(second.stageTransition).toMatchObject({
      fromSpaceId: 'tier-3-cineplex-concession',
      toSpaceId: 'tier-3-cineplex-entrance-concourse',
      direction: 'left',
      sequence: 2,
    })
  })

  it('keeps every configured destination adjacent in the reconstructed ship', () => {
    const ship = theShip()
    for (const stage of FIGHT_STAGES.filter((candidate) => candidate.spaceId)) {
      const neighbour = adjacentStageRoom(atWall(stage.id))
      if (!neighbour) continue
      expect(ship.adjacency.get(stage.spaceId!) ?? [], stage.id).toContain(neighbour!.spaceId)
    }
  })

  it('can raise every destination as a Clash stage', async () => {
    const ship = theShip()
    const failures: { stage: string; configured: string; renderable: string[] }[] = []
    const kit = {
      THREE,
      glow: (colour: number, opacity: number) =>
        new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
      geometry: <T extends THREE.BufferGeometry>(geometry: T): T => geometry,
    }
    for (const stage of FIGHT_STAGES.filter((candidate) => candidate.spaceId)) {
      const configured = adjacentStageRoom(atWall(stage.id))?.spaceId
      if (!configured) continue
      const renderable: string[] = []
      for (const spaceId of ship.adjacency.get(stage.spaceId!) ?? []) {
        try {
          const scenery = await buildShipRoomScenery(kit, spaceId)
          renderable.push(spaceId)
          scenery.dispose()
        } catch {
          // A real neighbour may still be too narrow or obstructed for the shared fight lane.
        }
      }
      if (!renderable.includes(configured))
        failures.push({ stage: stage.id, configured, renderable })
    }
    expect(failures).toEqual([])
  })
})
