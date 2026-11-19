import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { createFeitanScene } from '../feitanScene'
import { defaultFightComfort } from '../fightComfort'
import { VICTORY_FIGHTERS, selectVictory } from './catalogue'
import { createVictoryRenderer } from './renderer'
import { drawVictoryFrame } from './draw'
import { billComboTrack } from './billComboTrack'
import { fightBodyMotion, bodyPlan } from '../fightBodyMotion'
import type { FighterId, FightSide, FightState } from '../types'

// The card's canvas printing is covered by the real browser fixture.
vi.mock('./card', () => ({ createVictoryCard: () => new THREE.Group() }))

function snapshot(root: THREE.Object3D) {
  const nodes: unknown[] = []
  root.traverse((node) =>
    nodes.push({
      id: node.uuid,
      p: node.position.toArray(),
      q: node.quaternion.toArray(),
      s: node.scale.toArray(),
      v: node.visible,
      materials:
        node instanceof THREE.Mesh
          ? (Array.isArray(node.material) ? node.material : [node.material]).map((m) => m.uuid)
          : null,
    }),
  )
  return nodes
}
function setup(winner: FighterId, side: FightSide, targetOverride?: FighterId) {
  const target = targetOverride ?? (winner === 'franklin' ? 'biscuit' : 'franklin')
  const state: FightState = {
    ...createFight(side === 'player' ? winner : target, side === 'player' ? target : winner),
    phase: 'finished',
    winner: side,
  }
  const glow = (color: number, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
  const build = (fighter: FightState['player']) => {
    const model = buildFightFigure({ THREE, glow, fighter })
    if (fighter.id === 'leorio')
      model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
    return model.root
  }
  const models = { player: build(state.player), opponent: build(state.opponent) }

  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 100),
    scenery = new THREE.Group()
  scenery.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0xabcdef })),
  )
  scene.add(scenery, models.player, models.opponent)
  camera.position.set(1, 2, 8)
  models.player.position.set(-4, 0, 0)
  models.opponent.position.set(4, 0, 0)
  const armour = createFeitanScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (s) => models[s],
  })
  armour.sync(state, 0)
  const renderer = createVictoryRenderer({ scene, camera, scenery })
  return { renderer, state, models, camera, scene, armour }
}
describe('live victory renderer', () => {
  it.each(['benjamin', 'biscuit', 'hisoka'] as const)(
    'reveals Hisoka’s terrifying face after Gyo and drops %s through native gravity',
    (target) => {
      const fixture = setup('hisoka', 'opponent', target)
      const skin = fixture.models.opponent.getObjectByName('manga-face')!.children[1] as THREE.Mesh
      const originalGeometry = skin.geometry,
        originalPositions = Array.from(skin.geometry.attributes.position.array)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      try {
        for (const age of [
          0, 90, 150, 180, 210, 228, 240, 252, 270, 282, 294, 312, 324, 348, 378, 390, 414, 450,
          504, 570,
        ]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.hisokaFearVictory
          if (age >= 294) expect(audit.jawDrop).toBeGreaterThan(0.03)
          if (age >= 300 && age < 390) {
            expect(audit.retreat).toBeGreaterThan(0.32)
            expect(audit.panic).toBeGreaterThan(0.6)
            audit.handErrors.forEach((error: number) => expect(error).toBeLessThan(0.065))
          }
          expect(audit.death).toBe(age >= 390)
          if (age < 180) expect(audit.reveal).toBe(0)
          if (age >= 240) expect(audit.reveal).toBe(1)
          if (age >= 294) expect(audit.expression).toBe(1)
          if (age === 150) expect(audit.gyo).toBeGreaterThan(0.7)
          if (age >= 450) {
            expect(audit.floor).toBeCloseTo(0.012, 5)
            expect(Math.abs(audit.upY)).toBeLessThan(0.15)
            expect(Math.abs(audit.roll)).toBeLessThan(0.05)
          }
          expect(fixture.models.player.visible).toBe(true)
          if (age >= 294) expect(skin.geometry).not.toBe(originalGeometry)
          restore()
          expect(skin.geometry).toBe(originalGeometry)
          expect(Array.from(originalGeometry.attributes.position.array)).toEqual(originalPositions)
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
    },
  )

  it('keeps Hisoka’s comfort camera fixed through retreat and collapse', () => {
    const fixture = setup('hisoka', 'player', 'benjamin')
    let first: unknown
    try {
      for (const age of [90, 294, 378, 450, 570]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: { ...defaultFightComfort(), camera: 0, flashes: false },
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const camera = {
          p: fixture.camera.position.toArray(),
          q: fixture.camera.quaternion.toArray(),
        }
        first ??= camera
        expect(camera).toEqual(first)
        restore()
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })

  it.each(['benjamin', 'biscuit', 'bill'] as const)(
    'uses Bill’s production combos, body plans and unchanged finale against %s',
    (target) => {
      const fixture = setup('bill', 'opponent', target)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      try {
        for (const age of [
          0, 5, 18, 37, 65, 95, 116, 150, 168, 195, 225, 247, 281, 319, 342, 366, 402, 456, 480,
          510, 570,
        ]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.billVictory
          if (age < 343) {
            const native = billComboTrack(target).states[audit.nativeIndex]
            if (audit.contactFit === 1) expect(audit.horizontalContactError).toBeLessThan(0.025)
            expect(audit.nativeMove).toBe(native.player.attack?.moveId ?? null)
            expect(audit.nativeCombo).toBe(native.opponent.comboHits)
            if (native.opponent.pose === 'down' && native.opponent.y === 0)
              expect(audit.nativeFloor).toBeCloseTo(0.012, 5)
            expect(audit.nativePose).toEqual(
              bodyPlan(native.player, { seconds: native.frame / 60, progress: 0 })!.pose,
            )
          }
          if (age >= 402) {
            expect(audit.floor).toBeCloseTo(0.012, 5)
            expect(Math.abs(audit.upY)).toBeLessThan(0.15)
            expect(Math.abs(audit.roll)).toBeLessThan(0.05)
          }
          if (age >= 456)
            audit.gripErrors.forEach((error: number) => expect(error).toBeLessThan(0.06))
          if (age < 456) expect(audit.growth).toBe(0)
          expect(audit.picked).toBe(false)
          if (age >= 510) expect(audit.bloom).toBe(1)
          restore()
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
    },
  )

  it.each(['benjamin', 'biscuit', 'hanzo'] as const)(
    'keeps Hanzo’s sleeping body fixed, his double at the neck and %s on the native floor',
    (target) => {
      const fixture = setup('hanzo', 'opponent', target)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      let bodyX: number | undefined
      try {
        for (const age of [42, 96, 138, 216, 270, 330, 360, 384, 420, 444, 467, 468, 516, 570]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.hanzoVictory
          bodyX ??= audit.body[0]
          expect(audit.body[0]).toBe(bodyX)
          expect(audit.doubleVisible).toBe(age >= 72 && age < 468)
          if (age >= 216 && age <= 360)
            audit.gripErrors.forEach((error: number) => expect(error).toBeLessThan(0.06))
          if (age === 138) expect(audit.crossing).toBe(true)
          if (age >= 420) {
            expect(audit.floor).toBeCloseTo(0.012, 5)
            expect(Math.abs(audit.upY)).toBeLessThan(0.15)
            expect(Math.abs(audit.roll)).toBeLessThan(0.05)
          }
          if (age === 467) expect(Math.abs(audit.double[0] - audit.body[0])).toBeLessThan(0.01)
          restore()
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
    },
  )

  it.each(['hisoka', 'biscuit', 'benjamin'] as const)(
    'uses only the little-finger Judgment blade and native supine KO against non-Spider %s',
    (target) => {
      const fixture = setup('kurapika', 'opponent', target)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      try {
        expect(selectVictory(fixture.state)?.variant).toBe('kurapika-judgment')
        for (const age of [42, 120, 150, 240, 330, 348, 378, 402, 480, 570]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.kurapikaJudgmentVictory
          expect(audit.chainJail).toBe(false)
          expect(audit.chainFinger).toBe('right-little')
          if (age === 150) expect(audit.tipError).toBeLessThan(1e-6)
          if (age >= 348) expect(audit.floor).toBeCloseTo(0.012, 5)
          if (age >= 402) {
            expect(Math.abs(audit.upY)).toBeLessThan(0.15)
            expect(Math.abs(audit.roll)).toBeLessThan(0.05)
          }
          restore()
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
    },
  )

  it.each(['franklin', 'kalluto', 'biscuit'] as const)(
    'stages Biscuit’s two authored bodies and Cookie’s restorative hand treatment against %s',
    (target) => {
      const fixture = setup('biscuit', 'opponent', target)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      try {
        for (const age of [42, 150, 210, 252, 300, 330, 348, 390, 420, 480, 570]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.biscuitVictory
          expect(audit.large).toBe(age >= 210 && age < 420)
          expect(audit.cookie).toBe(age < 96 || (age >= 420 && age < 522))
          audit.treatmentErrors.forEach((error: number) => expect(error).toBeLessThan(1e-6))
          if (age === 330) expect(audit.contactError).toBeLessThan(0.05)
          if (age >= 330) {
            expect(Math.abs(audit.roll)).toBeLessThan(0.05)
            expect(audit.fallProgress).toBeGreaterThanOrEqual(0)
            expect(audit.fallProgress).toBeLessThanOrEqual(1)
            expect(audit.floor).toBeGreaterThanOrEqual(0.012 - 1e-6)
          }
          if (age >= 390) {
            expect(audit.landing).toBe(true)
            expect(audit.floor).toBeCloseTo(0.012, 5)
            expect(Math.abs(audit.upY)).toBeLessThan(0.15)
          }
          restore()
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
    },
  )

  it.each(['franklin', 'biscuit'] as const)(
    'keeps Illumi’s skull needles attached through the death and corpse salute of %s',
    (target) => {
      const fixture = setup('illumi', 'opponent', target)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      try {
        for (const age of [0, 120, 132, 180, 282, 300, 348, 378, 420, 468, 510, 570]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.illumiVictory
          const contacts = [132, 282, 300]
          expect(audit.embedded).toBe(contacts.filter((frame) => age >= frame).length)
          contacts.forEach((frame, i) => {
            if (age >= frame) expect(audit.errors[i]).toBeLessThan(0.00001)
          })
          expect(audit.dead).toBe(age >= 348)
          if (age === 378) expect(audit.fall).toBeGreaterThan(0.9)
          if (age === 510) {
            expect(audit.fall).toBe(0)
            expect(audit.bow).toBe(1)
            expect(audit.dead).toBe(true)
          }
          audit.gripErrors.forEach((error: number) => expect(error).toBeLessThan(0.2))
          restore()
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
    },
  )

  it.each(['franklin', 'biscuit'] as const)(
    'grounds Bonolenov’s spear and lands the physical Jupiter surface on %s',
    (target) => {
      const fixture = setup('bonolenov', 'player', target)
      const before = snapshot(fixture.scene),
        state = JSON.stringify(fixture.state)
      const shared = new Set<THREE.BufferGeometry>()
      fixture.models.player.traverse((node) => {
        if (node instanceof THREE.Mesh) shared.add(node.geometry)
      })
      const dispose = [...shared].map((geometry) => vi.spyOn(geometry, 'dispose'))
      try {
        for (const age of [72, 132, 168, 288, 324, 396, 420, 540]) {
          const restore = fixture.renderer.apply({
            state: fixture.state,
            models: fixture.models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
          })!
          const audit = fixture.scene.userData.bonolenovVictory
          if (age === 132 || age === 168) expect(audit.spearTip[1]).toBeCloseTo(0.028, 3)
          if (age === 288) expect(fixture.models.player.visible).toBe(false)
          if (age === 396) {
            expect(audit.contactError).toBeLessThan(0.0001)
            expect(audit.pursuit).toBe(1)
            expect(audit.formation).toBe(1)
          }
          if (age >= 420) expect(fixture.models.opponent.visible).toBe(false)
          if (age === 540) expect(fixture.models.player.visible).toBe(true)
          restore()
          expect(snapshot(fixture.scene)).toEqual(before)
          expect(JSON.stringify(fixture.state)).toBe(state)
        }
      } finally {
        fixture.renderer.dispose()
        fixture.armour.dispose()
      }
      dispose.forEach((spy) => {
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
      })
    },
  )

  it('extracts only blood while alive, then cleans the corpse and returns the last ordinary object', () => {
    const fixture = setup('shizuku', 'opponent', 'franklin')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [84, 210, 282, 342, 366, 402, 444, 474, 498, 570]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.shizukuVictory
        if (age < 342) {
          expect(audit.absorption).toBe(0)
          expect(fixture.models.player.scale.toArray()).toEqual([1, 1, 1])
        }
        expect(audit.bloodVisible).toBe(age >= 138 && age < 282)
        if (age >= 402) expect(fixture.models.player.visible).toBe(false)
        if (age === 444) expect(audit.buttonVisible).toBe(false)
        if (age === 498) {
          expect(audit.returned).toBe(true)
          expect(audit.buttonVisible).toBe(true)
        }
        if (age >= 282)
          fixture.models.player.traverse((node) => {
            if (node.name === 'contact-shadow') expect(node.visible).toBe(false)
          })
        audit.gripErrors.forEach((error: number) => expect(error).toBeLessThan(0.05))
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('keeps Machi’s fingers connected while sectioning, suturing and releasing the real target', () => {
    const fixture = setup('machi', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    const geometry = (fixture.models.player.getObjectByName('hand-left') as THREE.Mesh).geometry
    const disposed = vi.spyOn(geometry, 'dispose')
    try {
      for (const age of [42, 144, 270, 306, 378, 402, 420, 486, 570]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.machiVictory
        if (age >= 42 && age < 420)
          expect(
            new THREE.Vector3()
              .fromArray(audit.trackingEnd)
              .distanceTo(new THREE.Vector3().fromArray(audit.marker)),
          ).toBeLessThan(1e-6)
        if (age >= 282) {
          expect(audit.sectionCentres).toHaveLength(4)
          expect(fixture.models.player.visible).toBe(false)
        }
        if (age === 270) expect(audit.controllingLength).toBeLessThan(1)
        if (age === 378) {
          expect(audit.sutured).toBe(true)
          expect(
            Math.max(...audit.sectionCentres.map((p: number[]) => p[0])) -
              Math.min(...audit.sectionCentres.map((p: number[]) => p[0])),
          ).toBeLessThan(1e-6)
        }
        if (age >= 420) expect(audit.released).toBe(true)
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
      expect(disposed).not.toHaveBeenCalled()
      disposed.mockRestore()
    }
  })
  it('attaches Kalluto’s marker before the laugh, tempest and progressive shredding', () => {
    const fixture = setup('kalluto', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [42, 84, 108, 246, 330, 366, 450, 570]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.kallutoVictory
        if (age >= 84)
          expect(
            new THREE.Vector3()
              .fromArray(audit.marker)
              .distanceTo(new THREE.Vector3().fromArray(audit.attachment)),
          ).toBeLessThan(1e-6)
        if (age === 108) expect(audit.laugh).toBeGreaterThan(0.9)
        if (age === 246) expect(audit.paperCount).toBe(8192)
        if (age === 330) expect(audit.paperCount).toBe(12288)
        if (age < 318) expect(audit.shredding).toBe(0)
        if (age === 366) expect(audit.shredding).toBeGreaterThan(0)
        if (age >= 450) expect(fixture.models.player.visible).toBe(false)
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('keeps Camilla’s wide camera still when camera movement is disabled', () => {
    const fixture = setup('camilla', 'player')
    let first: number[] | undefined
    try {
      for (const age of [130, 270, 330, 420, 500]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: { ...defaultFightComfort(), camera: 0 },
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const pose = [...fixture.camera.position.toArray(), ...fixture.camera.quaternion.toArray()]
        first ??= pose
        expect(pose).toEqual(first)
        restore()
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('adapts Camilla’s paws and preserves the fixed portrait across the eye opening', () => {
    const fixture = setup('camilla', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    let portrait: unknown
    try {
      for (const age of [170, 250, 330, 420, 510, 553, 558, 590]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.camillaVictory
        if (age >= 153 && age < 357)
          audit.contacts.forEach((paw: { error: number }) =>
            expect(paw.error).toBeLessThan(0.04 * audit.ratio),
          )
        if (age === 170 || age === 250) expect(audit.energyVisible).toBe(false)
        if (age === 330) expect(audit.energyVisible).toBe(true)
        if (age >= 357) expect(fixture.models.player.visible).toBe(false)
        if (age >= 510) {
          const current = {
            head: audit.head,
            camera: [...fixture.camera.position.toArray(), ...fixture.camera.quaternion.toArray()],
          }
          portrait ??= current
          expect(current).toEqual(portrait)
          expect(
            fixture.scene.getObjectByName('camilla-cats-name-victory')!.children[0].visible,
          ).toBe(false)
        }
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('anchors Grimmel to the real hands and contacts the target on the release timeline', () => {
    const fixture = setup('halkenburg', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [132, 258, 300, 324, 372, 430]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.halkenburgVictory
        expect(audit.supporters).toBe(3)
        expect(new THREE.Vector3(...audit.grip).distanceTo(
          fixture.models.opponent.getObjectByName('hand-left')!.getWorldPosition(new THREE.Vector3()),
        )).toBeLessThan(1e-10)
        expect(new THREE.Vector3(...audit.nock).distanceTo(
          fixture.models.opponent.getObjectByName('hand-right')!.getWorldPosition(new THREE.Vector3()),
        )).toBeLessThan(1e-10)
        if (age === 324) expect(audit.contactError).toBeLessThan(1e-6)
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('plants Leorio’s floor strike and carries the victim into the ceiling with all state restored', () => {
    const fixture = setup('leorio', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [102, 330, 348, 386, 420, 465]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.leorioVictory
        if (age === 330) expect(audit.floorHand[1]).toBeLessThan(0.2)
        if (age === 420) {
          expect(audit.progress).toBe(1)
          expect(Math.abs(audit.head[1] - audit.roofHeight)).toBeLessThan(0.2)
          expect(fixture.scene.getObjectByName('leorio-ceiling-impact')!.visible).toBe(true)
        }
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('converges the two fish brands exactly when the book closes, then removes the victim', () => {
    const fixture = setup('chrollo', 'player', 'hisoka')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [218, 330, 389, 390, 410]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.chrolloFishVictory
        expect(audit.fishCount).toBe(2)
        expect(audit.brands).toEqual(['sun', 'moon'])
        if (age === 390) {
          expect(
            new THREE.Vector3(...audit.brandsWorld[0]).distanceTo(
              new THREE.Vector3(...audit.brandsWorld[1]),
            ),
          ).toBeLessThan(0.00001)
          expect(audit.bookClosed).toBe(true)
          expect(fixture.scene.getObjectByName('indoor-fish-sun')!.visible).toBe(false)
          const leaf = fixture.models.player.getObjectByName('book-leaf:1:combat-joint')!
          expect(leaf.rotation.z).toBeCloseTo(Math.PI / 2)
        }
        if (age === 410) expect(fixture.models.opponent.visible).toBe(false)
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('releases temporal copies without disposing the real fighter geometry or material', () => {
    const fixture = setup('tserriednich', 'player')
    let original: THREE.Mesh | undefined
    fixture.models.player.traverse((node) => {
      if (!original && node instanceof THREE.Mesh) original = node
    })
    const geometry = vi.spyOn(original!.geometry, 'dispose')
    const material = Array.isArray(original!.material) ? original!.material[0] : original!.material
    const disposeMaterial = vi.spyOn(material, 'dispose')
    try {
      const restore = fixture.renderer.apply({
        state: fixture.state,
        models: fixture.models,
        comfort: defaultFightComfort(),
        frame: { ...selectVictory(fixture.state)!, active: true, elapsed: 2.2 },
      })!
      expect(fixture.scene.getObjectByName('tserriednich-two-bodies')).toBeDefined()
      restore()
      fixture.renderer.dispose()
      expect(geometry).not.toHaveBeenCalled()
      expect(disposeMaterial).not.toHaveBeenCalled()
    } finally {
      geometry.mockRestore()
      disposeMaterial.mockRestore()
      fixture.armour.dispose()
    }
  })
  for (const fighter of VICTORY_FIGHTERS)
    for (const side of ['player', 'opponent'] as const) {
      it(`${fighter} uses the actual ${side} winner and restores the native scene after every shot`, () => {
        const fixture = setup(fighter, side)
        const { state, scene, models, camera, renderer } = fixture
        const before = snapshot(scene),
          initialState = JSON.stringify(state)
        const initialCamera = [...camera.position.toArray(), ...camera.quaternion.toArray()]
        try {
          for (const elapsed of [0, 1.6, 2.6, 3.5, 4.5, 5.15, 5.7, 6.95, 8, 9.99]) {
            const restore = renderer.apply({
              state,
              models,
              comfort: defaultFightComfort(),
              frame: { ...selectVictory(state)!, active: true, elapsed },
            })!
            expect(scene.userData.victory.target).toBe(
              state[side === 'player' ? 'opponent' : 'player'].id,
            )
            expect(scene.userData.victory.stage).toBe(state.environment.stageId)
            expect(Number.isFinite(camera.position.length())).toBe(true)
            const insideJupiter = fighter === 'bonolenov' && elapsed >= 4.5 && elapsed < 8
            expect(models[side].visible).toBe(!insideJupiter && fighter !== 'biscuit')
            if (fighter === 'tserriednich') {
              const future = scene.userData.futureVictory
              expect(future.forecastSeconds).toBe(10)
              expect(future.physicalDivergence).toBe(true)
              if (elapsed >= 7.2) expect(future.actual[0]).not.toBe(future.perceived[0])
              if (elapsed === 6.95) {
                const body = scene.getObjectByName('tserriednich-perceived-body')!
                expect(body.visible).toBe(true)
                expect(body.position.distanceTo(models[side].position)).toBeGreaterThan(0.5)
                body.traverse((node) => {
                  if (!(node instanceof THREE.Mesh)) return
                  const materials = Array.isArray(node.material) ? node.material : [node.material]
                  materials.forEach((material) => {
                    expect(material.opacity).toBe(1)
                    expect(material.transparent).toBe(false)
                    expect(material.depthWrite).toBe(true)
                  })
                })
              }
            }
            if (fighter === 'benjamin') {
              const audit = scene.userData.benjaminVictory
              const palm = models[side]
                .getObjectByName('hand-left')!
                .getWorldPosition(new THREE.Vector3())
              expect(audit.anatomicalHand).toBe('left')
              expect(audit.palm).toEqual(palm.toArray())
              const charge = scene.getObjectByName('benjamin-air-blow-pressure')!.children[0]
              expect(charge.position.distanceTo(palm)).toBeLessThan(1e-6)
              if (elapsed >= 8) expect(audit.salute).toBe(1)
              if (elapsed >= 4.5 && elapsed < 5.6) {
                const victimHead = models[side === 'player' ? 'opponent' : 'player']
                  .getObjectByName('manga-head:franklin-bordeau')!
                  .getWorldPosition(new THREE.Vector3())
                  .project(camera)
                expect(Math.abs(victimHead.x)).toBeLessThan(0.95)
                expect(Math.abs(victimHead.y)).toBeLessThan(0.95)
              }
            }
            restore()
            expect(snapshot(scene)).toEqual(before)
            expect([...camera.position.toArray(), ...camera.quaternion.toArray()]).toEqual(
              initialCamera,
            )
            expect(JSON.stringify(state)).toBe(initialState)
          }
          const restore = renderer.apply({
            state,
            models,
            comfort: { ...defaultFightComfort(), camera: 0, flashes: false },
            frame: { ...selectVictory(state)!, active: true, elapsed: 4.7 },
          })!
          scene.traverse((node) => {
            if (!(node instanceof THREE.Mesh) || node.parent === null) return
            const materials = Array.isArray(node.material) ? node.material : [node.material]
            const cinematic = scene.children.find(
              (root) => root === node || root.getObjectById(node.id) === node,
            )
            if (
              !cinematic ||
              [models.player, models.opponent, scene.children[0]].includes(cinematic)
            )
              return
            if (materials.some((material) => material.blending === THREE.AdditiveBlending)) {
              let ancestor: THREE.Object3D | null = node,
                hidden = false
              while (ancestor) {
                hidden ||= !ancestor.visible
                ancestor = ancestor.parent
              }
              expect(hidden).toBe(true)
            }
          })
          restore()
          expect(snapshot(scene)).toEqual(before)
        } finally {
          renderer.dispose()
          fixture.armour.dispose()
        }
      })
    }
  it('restores a partially staged scene when an asset fails, then still draws the result', () => {
    const fixture = setup('franklin', 'player')
    const { scene, renderer, models, state, camera } = fixture
    models.player.getObjectByName('hand-right')!.removeFromParent()
    const before = snapshot(scene),
      failed = vi.fn(),
      draw = vi.fn()
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      drawVictoryFrame({
        victory: renderer,
        input: {
          state,
          models,
          frame: { ...selectVictory(state)!, active: true, elapsed: 3 },
          comfort: defaultFightComfort(),
        },
        draw,
        failed,
      })
      expect(failed).toHaveBeenCalledOnce()
      expect(draw).toHaveBeenCalledOnce()
      expect(snapshot(scene)).toEqual(before)
      expect(camera.position.toArray()).toEqual([1, 2, 8])
    } finally {
      silence.mockRestore()
      renderer.dispose()
      fixture.armour.dispose()
    }
  })
})
