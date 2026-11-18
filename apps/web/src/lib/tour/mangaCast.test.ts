import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import catalogue from '../../../../../data/characters/appearance.json'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { humanProfile } from './humanProfiles'
import { FIGHTING_ROSTER } from '../fighting/roster'
import { projectHanzo } from '../fighting/hanzoProjection'
import { fightFigureKey } from '../fighting/fighterFigure'
import { buildFightFigure } from '../fighting/fighterFigure'
import { createFightState } from '../fighting/fightState'
import { addBonolenovBattleArmor } from './bonolenovBattleArmor'
import { emptyBattleCantabile } from '../fighting/battleCantabileTypes'
import { fightBodyMotion } from '../fighting/fightBodyMotion'
const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
function seen(id: string): HumanLook {
  return {
    id,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: 'witness', identity: id, pose: 'idle', aura: 'none' },
  }
}
function mesh(root: THREE.Object3D, name: string) {
  const node = root.getObjectByName(name)
  expect(node, name).toBeInstanceOf(THREE.Mesh)
  return node as THREE.Mesh
}
describe('manga cast shared by the visit and Fighting', () => {
  it('shares Salé-salé’s round face, smile, right-ear rings and light robe with Clash', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('prince-salesale') })
    const fighter = createFightState('salesale', 'hisoka').player
    const fighting = buildFightFigure({ THREE, glow, fighter })
    for (const name of [
      'salesale-cheek-and-chin-folds',
      'salesale-dark-ear-ring',
      'salesale-long-light-robe',
      'salesale-belt-knot',
      'salesale-boot-shaft',
    ])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    expect(common.root.getObjectByName('signature-lips')).toBeUndefined()
    const mouth = mesh(common.root, 'face-mouth')
    expect(mouth.getObjectByName('salesale-smile-teeth')).toBeTruthy()
    const teeth = mesh(common.root, 'salesale-smile-teeth').geometry
    const animatedTeeth = mesh(fighting.root, 'salesale-smile-teeth').geometry
    expect([...animatedTeeth.getAttribute('position').array]).toEqual([
      ...teeth.getAttribute('position').array,
    ])
    expect([...animatedTeeth.index!.array]).toEqual([...teeth.index!.array])
    const head = common.root.getObjectByName('manga-head:prince-salesale')!
    const rings = head.getObjectByName('salesale-right-ear-piercings')!
    expect(rings.children).toHaveLength(3)
    expect(rings.children.every((node) => node.position.x < 0)).toBe(true)
    common.root.updateMatrixWorld(true)
    const origin = head.localToWorld(new THREE.Vector3(-0.067, 0.012, 1))
    const ray = new THREE.Raycaster(
      origin,
      new THREE.Vector3(0, 0, -1).transformDirection(head.matrixWorld),
    )
    const eye = ray.intersectObject(head.getObjectByName('face-eye-left')!, true)
    const skin = ray.intersectObject(head.getObjectByName('manga-face')!.children[1])[0]
    expect(eye.length).toBeGreaterThan(0)
    expect(eye[0].distance).toBeLessThan(skin.distance)
    fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    expect(
      fighting.root.getObjectByName('fight-chest')!.getObjectByName('salesale-wrapped-lapel'),
    ).toBeTruthy()
    expect(
      fighting.root.getObjectByName('fight-chest')!.getObjectByName('salesale-cloth-belt'),
    ).toBeTruthy()
    for (const side of ['left', 'right']) {
      expect(
        fighting.root.getObjectByName(`elbow-${side}`)!.getObjectByName('salesale-robe-cuff'),
      ).toBeTruthy()
      expect(
        fighting.root.getObjectByName(`knee-${side}`)!.getObjectByName('salesale-boot-shaft'),
      ).toBeTruthy()
    }
  })
  it('shares Luzurus’s swept puffs, face and articulated reference outfit with Clash', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('prince-luzurus') })
    const fighter = createFightState('luzurus', 'hisoka').player
    const fighting = buildFightFigure({ THREE, glow, fighter })
    for (const name of [
      'face-relief',
      'luzurus-light-stubble',
      'luzurus-puff-tie',
      'luzurus-vest-fringe',
      'luzurus-wrapped-sash',
      'luzurus-slipper-pattern',
    ])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    const head = common.root.getObjectByName('manga-head:prince-luzurus')!
    expect(head.children.filter((node) => node.name === 'luzurus-puff-tie')).toHaveLength(2)
    const hair = head.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    hair.geometry.computeBoundingBox()
    expect(hair.geometry.boundingBox!.max.x).toBeGreaterThan(0.44)
    expect(hair.geometry.boundingBox!.min.x).toBeLessThan(-0.44)
    common.root.updateMatrixWorld(true)
    const face = head.getObjectByName('manga-face')!.children[1]
    for (const [x, y] of [
      [0, 0.19],
      [-0.06, 0.17],
      [0.06, 0.17],
    ]) {
      const ray = new THREE.Raycaster(
        head.localToWorld(new THREE.Vector3(x, y, 1)),
        new THREE.Vector3(0, 0, -1).transformDirection(head.matrixWorld),
      )
      const scalpHit = ray.intersectObject(hair)[0],
        skinHit = ray.intersectObject(face)[0]
      expect(scalpHit).toBeTruthy()
      expect(skinHit).toBeTruthy()
      expect(scalpHit.distance).toBeLessThan(skinHit.distance)
    }
    fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    expect(
      fighting.root.getObjectByName('fight-chest')!.getObjectByName('luzurus-vest-fringe'),
    ).toBeTruthy()
    for (const side of ['left', 'right']) {
      expect(
        fighting.root.getObjectByName(`knee-${side}`)!.getObjectByName('luzurus-trouser-folds'),
      ).toBeTruthy()
      expect(
        fighting.root
          .getObjectByName(`elbow-${side}`)!
          .getObjectByName('luzurus-loose-sleeve-cuff'),
      ).toBeTruthy()
    }
  })
  it('shares Morena’s reference details with Clash and keeps her dress on its joints', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('morena-prudo') })
    const fighter = createFightState('morena', 'hisoka').player
    const fighting = buildFightFigure({ THREE, glow, fighter })
    for (const name of [
      'morena-thorn-crown',
      'morena-scar',
      'morena-fitted-bodice',
      'morena-black-boot',
    ])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    const head = common.root.getObjectByName('manga-head:morena-prudo')!
    expect(head.children.filter((node) => node.name === 'morena-scar')).toHaveLength(2)
    const piercings = head.getObjectByName('morena-left-ear-piercings')!
    expect(piercings.children).toHaveLength(16)
    expect(piercings.children.every((node) => node.position.x > 0)).toBe(true)
    expect(common.root.getObjectByName('morena-stitch-crown')).toBeUndefined()
    expect(common.root.getObjectByName('face-eye-base-left')).toBeUndefined()
    const pupil = mesh(common.root, 'eye-pupil')
    expect((pupil.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0x795137)
    fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    const chest = fighting.root.getObjectByName('fight-chest')!
    expect(chest.getObjectByName('morena-fitted-bodice')).toBeTruthy()
    expect(chest.getObjectByName('morena-thorn-crown')).toBeTruthy()
    expect(
      fighting.root.getObjectByName('knee-left')!.getObjectByName('morena-black-boot'),
    ).toBeTruthy()
    expect(
      fighting.root
        .getObjectByName('shoulder-left')!
        .getObjectByName('morena-off-shoulder-sleeve-edge'),
    ).toBeTruthy()
  })
  it.each(catalogue.declared.map((entry) => entry.id))(
    'builds and articulates %s without losing facial identity',
    (id) => {
      const model = buildHumanFigure({ THREE, glow, seen: seen(id) })
      expect(model.root.getObjectByName('face-eye-left')).toBeTruthy()
      expect(model.root.getObjectByName('face-mouth')).toBeTruthy()
      for (const pose of ['idle', 'walk', 'guard', 'fallen'] as const) {
        model.animate(0.3, pose)
        model.root.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(model.lod.near)
        expect(Number.isFinite(box.min.x + box.min.y + box.max.z)).toBe(true)
        expect(box.max.y - box.min.y).toBeGreaterThan(0.1)
      }
      expect(model.lod.far.children).toHaveLength(3)
      expect(model.lod.far.getObjectByName('manga-layered-hair')).toBeUndefined()
    },
  )
  it.each(FIGHTING_ROSTER)('uses the declared shared face for $name', (definition) => {
    const appearance = seen(definition.modelId)
    expect(humanProfile(appearance).likeness).toBe(definition.modelId)
    const common = buildHumanFigure({ THREE, glow, seen: appearance })
    const fighter = createFightState(definition.id, 'hisoka').player
    const fighting = buildFightFigure({ THREE, glow, fighter })
    expect(mesh(fighting.root, 'eye-pupil').geometry).toBe(mesh(common.root, 'eye-pupil').geometry)
    fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    expect(fighting.root.getObjectByName('fight-chest')).toBeTruthy()
    expect(fighting.root.getObjectByName('face-mouth')).toBeTruthy()
  })
  it('keeps the supplied reference outfits on the same rig in both modes', () => {
    const cases = [
      ['leorio', 'manga-tie'],
      ['shizuku', 'shizuku-cross-pendant'],
      ['machi', 'machi-sash-cord'],
      ['feitan', 'feitan-scarf-emblem'],
      ['hisoka', 'hisoka-waistcoat-trim'],
      ['tserriednich', 'tserriednich-shoulder-bag'],
      ['padaille', 'padaille-crew-neck'],
      ['luini', 'luini-horizontal-fasteners'],
      ['mizaistom', 'mizaistom-high-collar'],
      ['gel', 'gel-scalloped-neckline'],
      ['cluck', 'cluck-black-choker'],
      ['saiyu', 'saiyu-cropped-vest'],
      ['bill', 'bill-hunter-badge'],
      ['basho', 'basho-hunter-badge'],
    ] as const
    for (const [id, detail] of cases) {
      const definition = FIGHTING_ROSTER.find((entry) => entry.id === id)!
      const common = buildHumanFigure({ THREE, glow, seen: seen(definition.modelId) })
      const fighter = createFightState(id, 'hisoka').player
      const fighting = buildFightFigure({ THREE, glow, fighter })
      expect(mesh(fighting.root, detail).geometry).toBe(mesh(common.root, detail).geometry)
      fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      expect(fighting.root.getObjectByName('fight-chest')!.getObjectByName(detail)).toBeTruthy()
    }
    expect(humanProfile(seen('shizuku-murasaki')).clothing).toBe('civilian')
    expect(humanProfile(seen('hisoka')).hair).toBe(0x74429a)
  })
  it('shares the latest royal and military reference details with Fighting', () => {
    for (const [modelId, detail] of [
      ['prince-halkenburg', 'halkenburg-pinstripe-suit'],
      ['beyond-netero', 'beyond-loose-robe'],
      ['longhi', 'manga-tie'],
      ['furykov', 'furykov-tall-boot'],
      ['prince-benjamin', 'benjamin-temple-tufts'],
    ]) {
      const definition = FIGHTING_ROSTER.find((entry) => entry.modelId === modelId)!
      const common = buildHumanFigure({ THREE, glow, seen: seen(modelId) })
      const fighter = createFightState(definition.id, 'hisoka').player
      const fighting = buildFightFigure({ THREE, glow, fighter })
      expect(mesh(fighting.root, detail).geometry).toBe(mesh(common.root, detail).geometry)
    }
    const beyond = buildHumanFigure({ THREE, glow, seen: seen('beyond-netero') })
    const beard = mesh(beyond.root, 'signature-beard').geometry
    beard.computeBoundingBox()
    expect(beard.boundingBox!.min.y).toBeLessThan(-0.8)
    for (const id of ['prince-halkenburg', 'furykov'])
      expect(humanProfile(seen(id)).signatures).not.toContain('glasses-round')
  })
  it('shares the feathered Battle Cantabile form and its spear with Fighting', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('bonolenov-ndongo') })
    addBonolenovBattleArmor({ THREE, glow, model: common })
    const fighter = createFightState('bonolenov', 'hisoka').player
    fighter.battleCantabile = { ...emptyBattleCantabile(), prologue: true }
    const fighting = buildFightFigure({ THREE, glow, fighter })
    for (const name of ['bonolenov-prologue-feather-crown', 'bonolenov-prologue-feather-skirt'])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    expect(
      fighting.root.getObjectByName('hand-right')!.getObjectByName('bonolenov-prologue-spear'),
    ).toBeTruthy()
    fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    expect(fighting.root.getObjectByName('bonolenov-prologue-attire')!.parent!.name).toBe(
      'fight-chest',
    )
  })
  it('shares the supplied Rihan, Hinrigh, Zakuro and Terebellum references across modes', () => {
    const cases = [
      ['rihan', 'rihan-puffer-zipper'],
      ['hinrigh-biganduffno', 'hinrigh-wide-jacket-stripes'],
      ['zakuro-custard', 'zakuro-high-collar'],
      ['terebellum', 'terebellum-jacket-zipper'],
    ] as const
    for (const [id, detail] of cases) {
      const definition = FIGHTING_ROSTER.find((entry) => entry.modelId === id)!
      const common = buildHumanFigure({ THREE, glow, seen: seen(id) })
      const fighter = createFightState(definition.id, 'hisoka').player
      const fighting = buildFightFigure({ THREE, glow, fighter })
      expect(mesh(fighting.root, detail).geometry).toBe(mesh(common.root, detail).geometry)
      const commonHair = common.root.getObjectByName('manga-layered-hair')!
        .children[1] as THREE.Mesh
      const fightHair = fighting.root.getObjectByName('manga-layered-hair')!
        .children[1] as THREE.Mesh
      expect(fightHair.geometry).toBe(commonHair.geometry)
      for (const action of ['guard', 'light', 'heavy'] as const) {
        fighter.pose = action
        fighter.attack =
          action === 'guard'
            ? null
            : {
                kind: action,
                variant: 'standing',
                frame: 4,
                impacted: false,
                auraCharged: false,
                concealed: false,
                hatsuSource: null,
                projectileSpawned: false,
                reversal: false,
              }
        fighting.animate(1, 'idle', {
          motion: fightBodyMotion({ fighter, seconds: 1, progress: 0.4 }),
        })
        expect(fighting.root.getObjectByName('fight-chest')!.getObjectByName(detail)).toBeTruthy()
      }
      if (id === 'rihan') {
        commonHair.geometry.computeBoundingBox()
        expect(commonHair.geometry.boundingBox!.min.y).toBeLessThan(-0.5)
      }
      if (id === 'terebellum') {
        expect(
          fighting.root.getObjectByName('hip-left')!.getObjectByName('terebellum-sport-shorts'),
        ).toBeTruthy()
        expect(
          fighting.root.getObjectByName('elbow-left')!.getObjectByName('sport-sleeve-piping'),
        ).toBeTruthy()
      }
      expect(mesh(fighting.root, 'manga-underworld-face-details').geometry).toBe(
        mesh(common.root, 'manga-underworld-face-details').geometry,
      )
    }
    expect(humanProfile(seen('rihan')).clothing).toBe('civilian')
    expect(humanProfile(seen('zakuro-custard')).expression).toBe('anxious')
  })
  it('reserves Hanzo’s tapered silhouette for the transition into Skill 4', () => {
    const ordinary = createFightState('hanzo', 'biscuit').player
    const entering = projectHanzo(ordinary)
    const active = {
      ...entering,
      hanzoProjection: { ...entering.hanzoProjection!, startupFrames: 0 },
    }
    const start = buildFightFigure({ THREE, glow, fighter: entering })
    const astral = buildFightFigure({ THREE, glow, fighter: active })
    expect(start.root.getObjectByName('hanzo-skill-four-mantle')).toBeTruthy()
    expect(start.root.getObjectByName('manga-head:hanzo')!.visible).toBe(true)
    expect(astral.root.getObjectByName('hanzo-skill-four-mantle')).toBeUndefined()
    expect(astral.root.getObjectByName('hip-left')!.visible).toBe(true)
    expect(astral.root.getObjectByName('shoulder-left')!.visible).toBe(true)
    expect(mesh(astral.root, 'eye-pupil').geometry).toBe(mesh(start.root, 'eye-pupil').geometry)
    expect(fightFigureKey(entering)).not.toBe(fightFigureKey(active))
    expect(
      fightFigureKey({
        ...entering,
        hanzoProjection: { ...entering.hanzoProjection!, startupFrames: 1 },
      }),
    ).toBe(fightFigureKey(entering))
  })
  it('shares Melody’s long hair and keeps both hands on her flute while playing', () => {
    const fighter = createFightState('melody', 'hanzo').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const common = buildHumanFigure({ THREE, glow, seen: seen('melody') })
    model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
    const openEyeScale = model.root.getObjectByName('face-eye-left')!.scale.y
    const hair = model.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    expect(hair.geometry).toBe(
      (common.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh).geometry,
    )
    hair.geometry.computeBoundingBox()
    expect(hair.geometry.boundingBox!.min.y).toBeLessThan(-0.6)
    const flute = mesh(model.root, 'signature-flute')
    const rest = {
      parent: flute.parent,
      position: flute.position.clone(),
      scale: flute.scale.clone(),
    }
    fighter.melodyPerformance = {
      originX: fighter.x,
      startupFrames: 0,
      playingFrames: 30,
      moveId: 'melody:neutralSpecial',
    }
    model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    expect(flute.parent!.name).toBe('fight-chest')
    model.root.updateMatrixWorld(true)
    const tube = new THREE.Box3().setFromObject(flute)
    for (const side of ['left', 'right']) {
      const hand = model.root.getObjectByName(`hand-${side}`)!
      expect(tube.distanceToPoint(hand.getWorldPosition(new THREE.Vector3()))).toBeLessThan(0.09)
      expect(model.root.getObjectByName(`face-eye-${side}`)!.scale.y).toBeLessThan(0.2)
    }
    fighter.melodyPerformance = undefined
    model.animate(2, 'idle', { motion: fightBodyMotion({ fighter, seconds: 2, progress: 0 }) })
    expect(flute.parent).toBe(rest.parent)
    expect(flute.position.toArray()).toEqual(rest.position.toArray())
    expect(flute.scale.toArray()).toEqual(rest.scale.toArray())
    expect(model.root.getObjectByName('face-eye-left')!.scale.y).toBe(openEyeScale)
  })
  it('shares Yokotani’s smiling face, bob and carried law book with Fighting', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('yokotani') })
    const fighter = createFightState('yokotani', 'luini').player
    const model = buildFightFigure({ THREE, glow, fighter })
    expect(mesh(model.root, 'yokotani-wide-smile').geometry).toBe(
      mesh(common.root, 'yokotani-wide-smile').geometry,
    )
    expect(model.root.getObjectsByProperty('name', 'yokotani-smiling-eyelid')).toHaveLength(2)
    const book = model.root.getObjectByName('yokotani-code-book')!
    expect((book.children[0] as THREE.Mesh).geometry).toBe(
      (common.root.getObjectByName('yokotani-code-book')!.children[0] as THREE.Mesh).geometry,
    )
    for (const facing of [-1, 1] as const) {
      fighter.facing = facing
      model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      expect(book.parent!.name).toBe('hand-left')
      model.root.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(book)
      expect(Number.isFinite(box.min.x + box.max.y)).toBe(true)
    }
    expect(humanProfile(seen('luini')).hairStyle).toBe('slicked-back')
  })
  it('shares Mizaistom’s cow hat, horns and eye marking with Fighting', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('mizaistom-nana') })
    const fighter = createFightState('mizaistom', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    for (const name of [
      'mizaistom-cow-hat',
      'mizaistom-gold-horns',
      'mizaistom-dark-eye-patch',
      'mizaistom-cow-spot-0',
    ])
      expect(mesh(model.root, name).geometry).toBe(mesh(common.root, name).geometry)
    model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    expect(
      model.root.getObjectByName('fight-chest')!.getObjectByName('mizaistom-cow-hat'),
    ).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeUndefined()
    expect(humanProfile(seen('mizaistom-nana')).trousers).toBe(0xeeeae0)
  })
  it('shares Gel’s turquoise slit eyes and lipstick across both modes', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('gel') })
    const fighter = createFightState('gel', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    for (const name of ['gel-slit-pupil', 'gel-lipstick', 'gel-scalloped-neckline'])
      expect(mesh(model.root, name).geometry).toBe(mesh(common.root, name).geometry)
    const iris = mesh(model.root, 'eye-pupil')
    expect((iris.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0x66bfc4)
    const slit = mesh(model.root, 'gel-slit-pupil').geometry
    slit.computeBoundingBox()
    expect(slit.boundingBox!.max.y - slit.boundingBox!.min.y).toBeGreaterThan(
      (slit.boundingBox!.max.x - slit.boundingBox!.min.x) * 3,
    )
  })
  it('keeps Cluck’s crown, train, cuffs and boots on their moving anchors', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('cluck') })
    const fighter = createFightState('cluck', 'hisoka').player
    const fighting = buildFightFigure({ THREE, glow, fighter })
    for (const name of [
      'cluck-feather-crown-white',
      'cluck-feather-train-teal',
      'cluck-bodice-feathers-white',
      'cluck-cuff-feathers-white',
      'cluck-boot-laces',
      'cluck-turquoise-ribbons',
    ])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    const train = fighting.root.getObjectByName('cluck-feather-train')!
    const anchor = train.parent
    for (const facing of [-1, 1] as const) {
      fighter.facing = facing
      fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      const chest = fighting.root.getObjectByName('fight-chest')!
      expect(chest.getObjectByName('cluck-feather-crown')).toBeTruthy()
      expect(chest.getObjectByName('cluck-bodice-feathers')).toBeTruthy()
      expect(chest.getObjectByName('cluck-feather-train')).toBeUndefined()
      expect(train.parent).toBe(anchor)
      for (const side of ['left', 'right']) {
        expect(
          fighting.root.getObjectByName(`elbow-${side}`)!.getObjectByName('cluck-cuff-feathers'),
        ).toBeTruthy()
        expect(
          fighting.root.getObjectByName(`knee-${side}`)!.getObjectByName('cluck-boot-laces'),
        ).toBeTruthy()
      }
      fighting.root.updateMatrixWorld(true)
      expect(new THREE.Box3().setFromObject(train).isEmpty()).toBe(false)
    }
  })
  it('shares Saiyu’s monkey likeness and keeps his tail on the hips in combat', () => {
    const common = buildHumanFigure({ THREE, glow, seen: seen('saiyu') })
    const fighter = createFightState('saiyu', 'hisoka').player
    const fighting = buildFightFigure({ THREE, glow, fighter })
    for (const name of [
      'saiyu-gold-circlet',
      'saiyu-large-ears',
      'saiyu-shaved-heart',
      'saiyu-curled-tail',
      'saiyu-knee-scroll',
      'saiyu-abdominal-lines',
      'saiyu-gold-emblem-top',
    ])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    const tail = mesh(fighting.root, 'saiyu-curled-tail')
    const rest = tail.position.clone()
    for (const facing of [-1, 1] as const) {
      fighter.facing = facing
      fighting.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      const chest = fighting.root.getObjectByName('fight-chest')!
      expect(chest.getObjectByName('saiyu-gold-circlet')).toBeTruthy()
      expect(chest.getObjectByName('saiyu-curled-tail')).toBeUndefined()
      expect(tail.position.toArray()).toEqual(rest.toArray())
      for (const side of ['left', 'right']) {
        expect(
          fighting.root.getObjectByName(`elbow-${side}`)!.getObjectByName('saiyu-gold-bracer'),
        ).toBeTruthy()
        expect(
          fighting.root.getObjectByName(`knee-${side}`)!.getObjectByName('saiyu-knee-scroll'),
        ).toBeTruthy()
      }
      fighting.root.updateMatrixWorld(true)
      expect(new THREE.Box3().setFromObject(tail).isEmpty()).toBe(false)
    }
    expect(humanProfile(seen('saiyu')).hairStyle).toBe('short')
    expect(humanProfile(seen('saiyu')).hair).toBe(0xb9b65b)
  })
  it('keeps Bill and Basho’s reference faces, suits and badges shared with Fighting', () => {
    for (const [id, detail] of [
      ['bill', 'bill-tired-eye-folds'],
      ['basho', 'basho-connected-mutton-chops'],
    ] as const) {
      const common = buildHumanFigure({ THREE, glow, seen: seen(id) })
      const fighter = createFightState(id, 'hisoka').player
      const fighting = buildFightFigure({ THREE, glow, fighter })
      expect(mesh(fighting.root, detail).geometry).toBe(mesh(common.root, detail).geometry)
      const hair = (root: THREE.Object3D) =>
        (root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh).geometry
      expect(hair(fighting.root)).toBe(hair(common.root))
      expect(humanProfile(seen(id)).clothing).toBe('suit')
      for (const facing of [-1, 1] as const) {
        fighter.facing = facing
        fighting.animate(1, 'idle', {
          motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }),
        })
        const chest = fighting.root.getObjectByName('fight-chest')!
        expect(chest.getObjectByName(detail)).toBeTruthy()
        expect(chest.getObjectByName(`${id}-hunter-badge`)).toBeTruthy()
      }
      if (id === 'basho') {
        expect(fighting.root.getObjectByName('manga-facial-hair')).toBeUndefined()
        expect(mesh(fighting.root, 'basho-jaw-stubble').geometry).toBe(
          mesh(common.root, 'basho-jaw-stubble').geometry,
        )
      }
    }
  })
  it('keeps the adult transformation and physical disguise compatible with named faces', () => {
    const base = createFightState('biscuit', 'illumi')
    const adult = buildFightFigure({
      THREE,
      glow,
      fighter: { ...base.player, biscuitTrueForm: true },
    })
    expect(adult.root.name).toBe('biscuit-true-form')
    expect(adult.root.getObjectByName('manga-head:biscuit-krueger')).toBeTruthy()
    expect(adult.root.getObjectByName('biscuit-true-form-crop-top')).toBeTruthy()
    expect(adult.root.getObjectByName('biscuit-petal-skirt')).toBeUndefined()
    const compact = buildFightFigure({ THREE, glow, fighter: base.player })
    expect(compact.root.getObjectByName('biscuit-hair-ribbons')).toBeTruthy()
    expect(compact.root.getObjectByName('biscuit-sleeve-frill')).toBeTruthy()
    expect(compact.root.getObjectByName('biscuit-petal-skirt')).toBeTruthy()
    expect(compact.root.getObjectByName('biscuit-true-form-crop-top')).toBeUndefined()
    const disguised = buildFightFigure({
      THREE,
      glow,
      fighter: { ...base.opponent, illumi: { ...base.opponent.illumi!, disguised: true } },
    })
    expect(disguised.root.getObjectByName('manga-head:illumi')).toBeTruthy()
    expect(mesh(disguised.root, 'eye-pupil').geometry).not.toBe(
      mesh(buildFightFigure({ THREE, glow, fighter: base.opponent }).root, 'eye-pupil').geometry,
    )
  })
})
