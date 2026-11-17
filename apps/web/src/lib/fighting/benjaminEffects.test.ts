import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { createBenjaminEffectScene } from './benjaminEffectScene'
import { benjaminHand } from './benjaminAccentScene'
import { buildFightFigure } from './fighterFigure'
import { defaultFightComfort } from './fightComfort'
import { EMPTY_INPUT, type FightProjectile, type FightSide, type FightState } from './types'

function setup(facing: 1 | -1 = 1) {
  let state = beginFight(createFight('benjamin', 'franklin', { mode: 'versus-local' }))
  state = {
    ...state,
    player: { ...state.player, x: 42, aura: 100, facing },
    opponent: { ...state.opponent, x: facing === 1 ? 48 : 36 },
  }
  const model = buildFightFigure({
    THREE,
    fighter: state.player,
    glow: (color) => new THREE.MeshBasicMaterial({ color }),
  })
  model.root.position.set(2, 1, 0)
  const scene = new THREE.Scene()
  scene.add(model.root)
  let comfort = defaultFightComfort(),
    viewer: FightSide = 'player'
  const options = {
    THREE,
    scene,
    worldX: (x: number) => x,
    worldY: (y: number) => y,
    figureOf: (side: FightSide) => (side === 'player' ? model.root : undefined),
    comfort: () => comfort,
    viewer: () => viewer,
  }
  const effect = createBenjaminEffectScene(options)
  const sync = () => effect.sync(state, 0)
  sync()
  return {
    options,
    model,
    scene,
    effect,
    sync,
    state: () => state,
    set(s: FightState) {
      state = s
      sync()
    },
    settings(value: typeof comfort) {
      comfort = value
      sync()
    },
    view(side: FightSide) {
      viewer = side
      sync()
    },
    cast(slot: string) {
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: `benjamin:${slot}`,
        auraCharged: false,
      })
      sync()
    },
    advance(n: number) {
      for (let i = 0; i < n; i++) {
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
        sync()
      }
    },
  }
}
function capture(f: ReturnType<typeof setup>) {
  f.cast('downSpecial')
  const startup = attackData('special', f.state().player).startup
  f.advance(startup)
  const fighter = f.state().player
  const shot: FightProjectile = {
    id: 8,
    owner: 'opponent',
    fighterId: 'franklin',
    x: fighter.x + fighter.facing * 2,
    y: 6.1,
    velocityX: -fighter.facing * 70,
    width: 0.6,
    height: 0.24,
    damage: 11,
    hitstun: 13,
    blockstun: 9,
    hitstop: 5,
    knockback: 2.2,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#ffffff',
    age: 0,
    lifetime: 120,
    matter: 'nen',
  }
  f.set(
    resolveFightImpacts(f.state(), [
      { projectile: shot, defenderSide: 'player', position: { x: fighter.x, y: 6.1 } },
    ]),
  )
  expect(f.state().player.hatsuEffects.baton?.card?.id).toBe(8)
}
describe('Benjamin live type 1 effects', () => {
  it.each([1, -1] as const)(
    'anchors Air Blow to the physical left hand when facing %s',
    (facing) => {
      const f = setup(facing)
      f.cast('neutralSpecial')
      f.advance(attackData('special', f.state().player).startup + 3)
      const root = f.scene.getObjectByName('benjamin-accents:player')!
      expect(root.visible).toBe(true)
      expect(
        root.position.distanceTo(
          benjaminHand(f.options, f.state(), { side: 'player', hand: 'left' }),
        ),
      ).toBeLessThan(1e-6)
      const frozen = JSON.stringify(f.state())
      f.effect.sync(f.state(), 500)
      expect(JSON.stringify(f.state())).toBe(frozen)
      f.settings({ ...defaultFightComfort(), camera: 0, flashes: false })
      expect(root.visible).toBe(false)
      f.effect.dispose()
    },
  )
  it('collapses the real rectangle into the held card, respects In/Gyo and leaves the rig resources intact', () => {
    const f = setup()
    const mesh = f.model.root
      .getObjectByName('torso')!
      .children.find((n) => n instanceof THREE.Mesh) as THREE.Mesh
    const release = vi.spyOn(mesh.geometry, 'dispose')
    capture(f)
    const rectangle = f.scene.getObjectByName('benjamin-culdcept-rectangle')!,
      card = f.scene.getObjectByName('benjamin-culdcept-card')!
    f.advance(9)
    expect(rectangle.visible).toBe(true)
    expect(rectangle.scale.x).toBeLessThan(0.6)
    expect(card.visible).toBe(true)
    f.advance(9)
    expect(rectangle.visible).toBe(false)
    expect(card.scale.x).toBe(1)
    expect(
      card.position.distanceTo(
        benjaminHand(f.options, f.state(), { side: 'player', hand: 'right' }),
      ),
    ).toBeCloseTo(0.035)
    f.view('opponent')
    f.set({
      ...f.state(),
      player: { ...f.state().player, nen: { ...f.state().player.nen, in: true } },
    })
    expect(card.visible).toBe(false)
    f.set({
      ...f.state(),
      opponent: { ...f.state().opponent, nen: { ...f.state().opponent.nen, gyo: true } },
    })
    expect(card.visible).toBe(true)
    f.effect.dispose()
    expect(release).not.toHaveBeenCalled()
    expect(f.scene.children).toEqual([f.model.root])
  })
  it('removes the card echo after the actual restitution instead of leaving a second playable card', () => {
    const f = setup()
    capture(f)
    f.advance(50)
    f.cast('finisher')
    for (let i = 0; i < 50 && f.state().player.hatsuEffects.baton?.card; i++) f.advance(1)
    expect(f.state().player.hatsuEffects.baton?.card).toBeNull()
    const card = f.scene.getObjectByName('benjamin-culdcept-card')!
    expect(card.visible).toBe(true)
    f.advance(18)
    expect(card.visible).toBe(false)
    f.effect.dispose()
  })
})
