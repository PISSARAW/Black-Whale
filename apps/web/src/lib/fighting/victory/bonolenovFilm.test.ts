import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { defaultFightComfort } from '../fightComfort'
import { emptyBattleCantabile } from '../battleCantabileTypes'
import type { FightState } from '../types'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createBonolenovFatalityFilm } from '../../../../demos/fighting-showcase/bonolenovFatalityFilm'
it('earns a native Jupiter knockout after Prologue, spear and a full dance', () => {
  const film = createBonolenovFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.prologue).toBe(true)
  expect(film.report.spear).toBe(true)
  expect(film.report.prepared).toBeGreaterThanOrEqual(89)
  expect(film.report.jupiterDeath).toBe(true)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})

it.each(['franklin', 'biscuit'] as const)(
  'stops %s at the rendered surface, then sinks the floor before the dust',
  (target) => {
    const state: FightState = {
      ...createFight('bonolenov', target),
      phase: 'finished',
      winner: 'player',
    }
    state.player.nen.shu = target === 'biscuit' ? ['bonolenov-prologue-spear'] : ['stone']
    if (target === 'biscuit') {
      state.player.battleCantabile = { ...emptyBattleCantabile(), prologue: true, unwrapped: true }
    }
    const glow = (color: number, opacity = 1) =>
      new THREE.MeshBasicMaterial({
        color,
        opacity,
        transparent: opacity < 1,
      })
    const models = {
      player: buildFightFigure({ THREE, glow, fighter: state.player }).root,
      opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }).root,
    }
    const scene = new THREE.Scene()
    const scenery = new THREE.Group()
    scene.add(scenery, models.player, models.opponent)
    const camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 100)
    const renderer = createVictoryRenderer({ scene, scenery, camera })
    const original = JSON.stringify(state)
    const shared = new Set<THREE.BufferGeometry>()
    models.player.traverse((node) => {
      if (node instanceof THREE.Mesh) shared.add(node.geometry)
    })
    const dispose = [...shared].map((geometry) => vi.spyOn(geometry, 'dispose'))
    let impactX = 0
    try {
      for (const age of [0, 27, 66, 148, 204, 288, 374, 395, 396, 404, 412, 425, 456, 540]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.bonolenovVictory
        const costume = scene.getObjectByName('bonolenov-victory-prologue')!
        const spear = costume.getObjectByName('bonolenov-prologue-spear')!
        const dust = scene
          .getObjectByName('bonolenov-last-movement')!
          .children.at(-1) as THREE.InstancedMesh
        const imprint = scene.getObjectByName('bonolenov-sunken-slabs')!
        const bandages = models.player.getObjectByName('signature-bandages')!
        const nativeSpear = models.player.getObjectByName('bonolenov-prologue-spear')
        expect(bandages.visible).toBe(age < 12 || age >= 241)
        if (nativeSpear) expect(nativeSpear.visible).toBe(false)
        if (age >= 12 && age < 204) {
          expect(audit.grip[0]).toBeCloseTo(audit.spearTip[0], 5)
          expect(audit.grip[2]).toBeCloseTo(audit.spearTip[2], 5)
          expect(spear.getObjectByName('bonolenov-prologue-shu')?.visible).toBe(
            target === 'biscuit' && age < 106,
          )
        }
        if (age === 204) expect(audit.surfaceRadius).toBe(0)
        if (age === 288) expect(models.player.visible).toBe(false)
        if (age === 374) expect(audit.shot).toBe('last-step')
        if (age === 395) expect(audit.separation).toBeGreaterThan(0)
        if (age === 404) {
          expect(audit.shot).toBe('impact')
          expect(models.opponent.position.z).toBeGreaterThan(0.2)
        }
        if (age === 396) {
          expect(audit.shot).toBe('impact')
          const head = models.opponent.getObjectByName('face-mouth')!.parent!
          const look = head.getWorldPosition(new THREE.Vector3())
          const sphere = scene.getObjectByName('bonolenov-victory-jupiter')!
          const contact = new THREE.Vector3().fromArray(audit.contact)
          sphere.updateWorldMatrix(true, false)
          const ray = new THREE.Raycaster(
            contact.clone().add(new THREE.Vector3(1, 0, 0)),
            new THREE.Vector3(-1, 0, 0),
          )
          expect(ray.intersectObject(sphere)[0]?.point.distanceTo(contact)).toBeLessThan(0.003)
          const fromCamera = new THREE.Raycaster(
            camera.position,
            look.clone().sub(camera.position).normalize(),
            0,
            camera.position.distanceTo(look),
          )
          const sightline = fromCamera.intersectObject(sphere)
          expect(
            sightline,
            JSON.stringify({
              look: look.toArray(),
              centre: audit.centre,
              camera: camera.position.toArray(),
              radius: audit.surfaceRadius,
              contact: audit.contact,
            }),
          ).toHaveLength(0)
          expect(audit.crushed).toBe(0)
          impactX = audit.rivalX
        }
        if (age > 396) expect(audit.rivalX).toBe(impactX)
        if (age === 412)
          expect([audit.shot, imprint.visible, dust.count]).toEqual(['floor', true, 0])
        if (age === 425) expect(dust.count).toBeGreaterThan(0)
        if (age === 540)
          expect([models.player.visible, costume.visible, imprint.visible]).toEqual([
            true,
            false,
            true,
          ])
        restore()
        expect(scene.children).toEqual([scenery, models.player, models.opponent])
        expect(scene.userData.bonolenovVictory).toBeUndefined()
        if (nativeSpear) expect(nativeSpear.visible).toBe(true)
        expect(JSON.stringify(state)).toBe(original)
      }
      const fixed = new THREE.Vector3()
      for (const age of [148, 382, 396, 425, 559]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: { ...defaultFightComfort(), camera: 0, shake: 0 },
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        expect(scene.userData.bonolenovVictory.shot).toBe('comfort')
        if (age === 148) fixed.copy(camera.position)
        else expect(camera.position.toArray()).toEqual(fixed.toArray())
        restore()
      }
    } finally {
      renderer.dispose()
      dispose.forEach((spy) => {
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
      })
    }
  },
)
