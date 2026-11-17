import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { createMachiThreadScene } from './machiThreadScene'
import { createKallutoPaperScene } from './kallutoScene'
import { createBloodyMaryScene } from './bloodyMaryScene'
import { createProjectileScene } from './projectileScene'
import { buildFightFigure } from './fighterFigure'
import { controlHand } from './fineControlAnchors'
import { commandMary } from './bloodyMaryAction'
import { defaultFightComfort } from './fightComfort'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(id: FighterId): FightState {
  const s = beginFight(createFight(id, 'hisoka', { mode: 'versus-local', formatId: 'knockout' }))
  return {
    ...s,
    player: { ...s.player, x: 30, aura: 100 },
    opponent: { ...s.opponent, x: 48, aura: 100 },
  }
}
const step = (s: FightState) =>
  tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
function cast(state: FightState, id: string, slot: string) {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: `${id}:${slot}`,
    auraCharged: false,
  })
}
const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })

describe('fine-control material rendering', () => {
  it('anchors Machi’s real link to the posed hand and uses the selected viewer’s actual Gyo', () => {
    const s = beginFight(createFight('hisoka', 'machi', { mode: 'versus-local' }))
    const state = {
      ...s,
      opponent: { ...s.opponent, nen: { ...s.opponent.nen, in: true } },
      player: {
        ...s.player,
        machiThread: { owner: 'opponent' as const, kind: 'bind' as const, x: s.player.x, y: 0 },
      },
    }
    const models = {
      player: buildFightFigure({ THREE, fighter: state.player, glow }),
      opponent: buildFightFigure({ THREE, fighter: state.opponent, glow }),
    }
    models.opponent.root.position.x = 3
    const scene = new THREE.Scene()
    scene.add(models.player.root, models.opponent.root)
    let viewer: FightSide = 'player'
    const options = {
      THREE,
      scene,
      worldX: (x: number) => x,
      worldY: (y: number) => y,
      figureOf: (side: FightSide) => models[side].turns,
      viewer: () => viewer,
    }
    const effect = createMachiThreadScene(options)
    effect.sync(state, 0)
    const line = scene.getObjectByName('machi-thread:player') as THREE.Line
    expect(line.visible).toBe(false)
    viewer = 'opponent'
    effect.sync(state, 0)
    expect(line.visible).toBe(true)
    const point = controlHand(options, state, 'opponent'),
      positions = line.geometry.getAttribute('position')
    expect(positions.getX(0)).toBeCloseTo(point.x)
    viewer = 'player'
    effect.sync(
      { ...state, player: { ...state.player, nen: { ...state.player.nen, gyo: true } } },
      0,
    )
    expect(line.visible).toBe(true)
    effect.sync({ ...state, player: { ...state.player, machiThread: undefined } }, 0)
    expect(line.visible).toBe(false)
    effect.dispose()
  })
  it('renders only live physical paper clusters, freezes in a paused state, and retains matter when Nen is lost', () => {
    let state = duel('kalluto')
    const model = buildFightFigure({ THREE, fighter: state.player, glow })
    const scene = new THREE.Scene()
    scene.add(model.root)
    const material = (
      model.root
        .getObjectByName('torso')!
        .children.find((n) => n instanceof THREE.Mesh) as THREE.Mesh
    ).material as THREE.Material
    const dispose = vi.spyOn(material, 'dispose')
    let comfort = defaultFightComfort()
    const options = {
      THREE,
      scene,
      worldX: (x: number) => x,
      worldY: (y: number) => y,
      comfort: () => comfort,
    }
    const projectiles = createProjectileScene({ ...options, glow, geometry: (made) => made })
    const effect = createKallutoPaperScene(options)
    effect.sync(state, 0)
    state = cast(state, 'kalluto', 'neutralSpecial')
    for (let i = 0; i < 50 && !state.projectiles.some((p) => p.kallutoPaper); i++)
      state = step(state)
    expect(state.projectiles[0].matter).toBe('object')
    projectiles.sync(state.projectiles, 0)
    const frozen = JSON.stringify(state)
    effect.sync(state, 0)
    const paper = scene.getObjectByName('kalluto-paper')!
    expect(paper.children).toHaveLength(6)
    expect(scene.getObjectByName(`fight-projectile:${state.projectiles[0].id}`)!.visible).toBe(
      false,
    )
    const pose = paper.children.map((n) => [
      n.position.toArray(),
      n.rotation.toArray(),
      n.scale.toArray(),
    ])
    effect.sync(state, 100)
    expect(
      paper.children.map((n) => [n.position.toArray(), n.rotation.toArray(), n.scale.toArray()]),
    ).toEqual(pose)
    expect(JSON.stringify(state)).toBe(frozen)
    state = step({
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } },
    })
    comfort = { ...comfort, camera: 0, flashes: false }
    effect.sync(state, 101)
    expect(paper.children).toHaveLength(6)
    effect.sync({ ...state, projectiles: [] }, 102)
    expect(paper.children).toHaveLength(0)
    effect.dispose()
    projectiles.dispose()
    expect(dispose).not.toHaveBeenCalled()
  })
  it('uses only actual blood drops, keeps them physical under In, and never advances bobbing on wall time', () => {
    let state = duel('zakuro')
    const scene = new THREE.Scene()
    let comfort = defaultFightComfort()
    const effect = createBloodyMaryScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      comfort: () => comfort,
      viewer: () => 'opponent',
    })
    effect.sync(state, 0)
    state = commandMary({ state, side: 'player', command: 'bleed' }, performAuraAttack)
    state = commandMary({ state, side: 'player', command: 'scout' }, performAuraAttack)
    state = { ...state, player: { ...state.player, nen: { ...state.player.nen, in: true } } }
    effect.sync(state, 0)
    const drop = scene.getObjectByName('bloody-mary-scout:player:0')!
    expect(drop.visible).toBe(true)
    const position = drop.position.toArray()
    effect.sync(state, 600)
    expect(drop.position.toArray()).toEqual(position)
    expect(state.player.bloodyMary!.drops).toHaveLength(3)
    comfort = { ...comfort, camera: 0, flashes: false }
    effect.sync(state, 601)
    expect(drop.visible).toBe(true)
    expect(drop.position.y).toBe(state.player.bloodyMary!.drops[0].y)
    state = step({
      ...state,
      player: {
        ...state.player,
        hatsuEffects: { ...state.player.hatsuEffects, forcedZetsuFrames: 60 },
      },
    })
    effect.sync(state, 602)
    expect(drop.visible).toBe(false)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
