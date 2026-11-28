import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import catalogue from '../../../../../data/characters/appearance.json'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { humanProfile } from './humanProfiles'
import { FIGHTING_ROSTER } from '../fighting/roster'
import { projectHanzo } from '../fighting/hanzoProjection'
import { fightFigureKey } from '../fighting/fighterFigure'
import { buildFightFigure } from '../fighting/fighterFigure'
import { combatFaceGeometry } from '../fighting/fightFaceReadability'
import { combatBodyGeometry } from '../fighting/fightBodyReadability'
import { createFightState } from '../fighting/fightState'
import { addBonolenovBattleArmor } from './bonolenovBattleArmor'
import { emptyBattleCantabile } from '../fighting/battleCantabileTypes'
import { fightBodyMotion } from '../fighting/fightBodyMotion'
import { mangaLikeness } from './mangaLikeness'
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
  it('draws Saquelle tall and long-faced with small eyes, thick lips, stubble and temple veins', () => {
    const appearance = seen('saquelle')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'saquelle',
      build: 'average',
      height: 1.08,
      shoulders: 1.08,
      face: 'narrow',
      hairStyle: 'short',
      clothing: 'uniform',
      hair: 0xc7b586,
    })
    expect(look).toMatchObject({
      eyes: 'round',
      cheek: 0.135,
      jaw: 0.09,
      chin: 0.245,
      mouth: 0.095,
      neck: 0.085,
    })
    const eyes: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'saquelle-small-round-eye') eyes.push(node)
    })
    expect(eyes).toHaveLength(2)
    expect(model.root.getObjectByName('saquelle-prominent-cheekbone-lines')).toBeTruthy()
    expect(model.root.getObjectByName('saquelle-thick-lips')).toBeTruthy()
    expect(model.root.getObjectByName('saquelle-chin-stubble')).toBeTruthy()
    expect(model.root.getObjectByName('saquelle-visible-temple-veins')).toBeTruthy()
    expect(model.root.getObjectByName('saquelle-puffer-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('saquelle-puffer-seams')).toBeTruthy()
    expect(model.root.getObjectByName('saquelle-puffer-collar')).toBeTruthy()
  })
  it('draws Orau balding and broad with a left earpiece and full Kakin field uniform', () => {
    const appearance = seen('orau')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'orau',
      build: 'broad',
      height: 1.04,
      shoulders: 1.12,
      face: 'square',
      hairStyle: 'bald-crown',
      clothing: 'uniform',
      hair: 0x252429,
    })
    expect(look).toMatchObject({
      eyes: 'heavy',
      cheek: 0.17,
      jaw: 0.15,
      chin: 0.235,
      nose: 1.65,
      neck: 0.09,
    })
    expect(model.root.getObjectByName('orau-left-earpiece')).toBeTruthy()
    expect(model.root.getObjectByName('orau-heavy-profile-folds')).toBeTruthy()
    expect(model.root.getObjectByName('orau-bald-crown-shine')).toBeTruthy()
    expect(model.root.getObjectByName('orau-puffer-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('orau-puffer-seams')).toBeTruthy()
    expect(model.root.getObjectByName('orau-puffer-collar')).toBeTruthy()
    const boots: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'orau-combat-boot-shaft') boots.push(node)
    })
    expect(boots).toHaveLength(2)
  })
  it('draws Kanjidol round-faced with small eyes, circular brows, moustache and chin beard', () => {
    const appearance = seen('kanjidol')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'kanjidol',
      build: 'broad',
      height: 1.01,
      shoulders: 1.14,
      face: 'round',
      hairStyle: 'short',
      clothing: 'uniform',
      hair: 0x202126,
    })
    expect(look).toMatchObject({
      eyes: 'round',
      cheek: 0.198,
      jaw: 0.15,
      chin: 0.18,
      mouth: 0.072,
      neck: 0.095,
    })
    const eyes: THREE.Object3D[] = []
    const brows: THREE.Object3D[] = []
    const boots: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'kanjidol-small-eye') eyes.push(node)
      if (node.name === 'kanjidol-round-dark-brow') brows.push(node)
      if (node.name === 'kanjidol-combat-boot-shaft') boots.push(node)
    })
    expect(eyes).toHaveLength(2)
    expect(brows).toHaveLength(2)
    expect(boots).toHaveLength(2)
    expect(model.root.getObjectByName('kanjidol-dark-moustache-and-chin-beard')).toBeTruthy()
    expect(model.root.getObjectByName('kanjidol-round-cheek-contours')).toBeTruthy()
    expect(model.root.getObjectByName('kanjidol-puffer-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('kanjidol-puffer-seams')).toBeTruthy()
    expect(model.root.getObjectByName('kanjidol-puffer-collar')).toBeTruthy()
  })
  it('draws the Kakin announcer with cat features and matching patterned dress and shoes', () => {
    const appearance = seen('kakin-announcer')
    const profile = humanProfile(appearance)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'kakin-announcer',
      build: 'slim',
      height: 1.02,
      shoulders: 0.92,
      face: 'narrow',
      hairStyle: 'long',
      clothing: 'civilian',
      hair: 0x24242b,
    })
    const eyes: THREE.Object3D[] = []
    const ears: THREE.Object3D[] = []
    const bracelets: THREE.Object3D[] = []
    const shoes: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'kakin-announcer-cat-eye') eyes.push(node)
      if (node.name === 'kakin-announcer-cat-ear') ears.push(node)
      if (node.name === 'kakin-announcer-wrist-bracelet') bracelets.push(node)
      if (node.name === 'kakin-announcer-patterned-shoe') shoes.push(node)
    })
    expect(eyes).toHaveLength(2)
    expect(ears).toHaveLength(2)
    expect(bracelets).toHaveLength(2)
    expect(shoes).toHaveLength(2)
    expect(model.root.getObjectByName('kakin-announcer-long-patterned-dress')).toBeTruthy()
    expect(model.root.getObjectByName('kakin-announcer-fitted-bodice')).toBeTruthy()
    expect(model.root.getObjectByName('kakin-announcer-dress-swirl-pattern')).toBeTruthy()
  })
  it('draws Cleapatro lean with an Egyptian headdress and a light high-collared striped uniform', () => {
    const appearance = seen('cleapatro')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'cleapatro',
      build: 'slim',
      height: 1.05,
      shoulders: 0.94,
      face: 'narrow',
      hairStyle: 'hime',
      clothing: 'uniform',
      jacket: 0xe4dfd4,
    })
    expect(look).toMatchObject({
      eyes: 'narrow',
      cheek: 0.145,
      jaw: 0.062,
      chin: 0.225,
      brow: 0.45,
      nose: 1.25,
    })
    const brows: THREE.Object3D[] = []
    const sidePanels: THREE.Object3D[] = []
    const sleeveStripes: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'cleapatro-thin-long-brow') brows.push(node)
      if (node.name === 'cleapatro-egyptian-side-panel') sidePanels.push(node)
      if (node.name === 'cleapatro-black-sleeve-stripe') sleeveStripes.push(node)
    })
    expect(brows).toHaveLength(2)
    expect(sidePanels).toHaveLength(2)
    expect(sleeveStripes).toHaveLength(2)
    expect(model.root.getObjectByName('cleapatro-straight-headdress-band')).toBeTruthy()
    expect(model.root.getObjectByName('cleapatro-headdress-striations')).toBeTruthy()
    expect(model.root.getObjectByName('cleapatro-light-high-collar')).toBeTruthy()
    expect(model.root.getObjectByName('cleapatro-black-chest-stripe--1')).toBeTruthy()
    expect(model.root.getObjectByName('cleapatro-black-chest-stripe-1')).toBeTruthy()
  })
  it('draws Peuckert stout and freckled with beady eyes, thick lips and a left-parted duty suit', () => {
    const appearance = seen('peuckert')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'peuckert',
      build: 'broad',
      height: 0.98,
      shoulders: 1.1,
      face: 'round',
      hairStyle: 'swept',
      clothing: 'suit',
      expression: 'tired',
    })
    expect(look).toMatchObject({
      eyes: 'heavy',
      cheek: 0.192,
      jaw: 0.142,
      nose: 1.35,
      mouth: 0.09,
      neck: 0.078,
    })
    const eyes: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'peuckert-beady-eye') eyes.push(node)
    })
    expect(eyes).toHaveLength(2)
    expect(model.root.getObjectByName('peuckert-rumpole-nose')).toBeTruthy()
    expect(model.root.getObjectByName('peuckert-thick-lips')).toBeTruthy()
    expect(model.root.getObjectByName('peuckert-nose-and-cheek-freckles')).toBeTruthy()
    expect(model.root.getObjectByName('peuckert-neatly-combed-left-part')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
  })
  it('draws Steiner tall and bespectacled with light-brown side-parted hair and hazel eyes', () => {
    const appearance = seen('steiner')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'steiner',
      build: 'slim',
      height: 1.12,
      shoulders: 0.98,
      face: 'narrow',
      hairStyle: 'swept',
      clothing: 'suit',
      hair: 0xa9825e,
      signatures: ['glasses-rectangular'],
    })
    expect(look).toMatchObject({
      eyes: 'round',
      cheek: 0.148,
      jaw: 0.074,
      chin: 0.23,
      nose: 1.55,
    })
    const glasses: THREE.Object3D[] = []
    const hazelPupils: THREE.Mesh[] = []
    model.root.traverse((node) => {
      if (node.name === 'signature-glasses-rectangular') glasses.push(node)
      if (node.name === 'eye-pupil') hazelPupils.push(node as THREE.Mesh)
    })
    expect(glasses).toHaveLength(2)
    expect(hazelPupils).toHaveLength(2)
    for (const pupil of hazelPupils)
      expect((pupil.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0x8a6a3d)
    expect(model.root.getObjectByName('steiner-clean-side-part')).toBeTruthy()
    expect(model.root.getObjectByName('steiner-light-brown-combed-hair-lines')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
  })
  it('draws Worio Bay broad and square-jawed with prominent brows, a large nose and right-parted hair', () => {
    const appearance = seen('worio-bay')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'worio-bay',
      build: 'broad',
      height: 1.04,
      shoulders: 1.14,
      face: 'square',
      hairStyle: 'swept',
      clothing: 'suit',
      expression: 'severe',
    })
    expect(look).toMatchObject({
      eyes: 'almond',
      cheek: 0.178,
      jaw: 0.17,
      chin: 0.245,
      brow: 1.8,
      nose: 1.75,
    })
    const brows: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'worio-prominent-eyebrow') brows.push(node)
    })
    expect(brows).toHaveLength(2)
    expect(model.root.getObjectByName('worio-large-angular-nose')).toBeTruthy()
    expect(model.root.getObjectByName('worio-large-square-jaw-lines')).toBeTruthy()
    expect(model.root.getObjectByName('worio-thick-side-parted-hair')).toBeTruthy()
    expect(model.root.getObjectByName('worio-neatly-combed-right-part')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
  })
  it('draws Vincent broad and shaven with a left earpiece and Kakin combat uniform', () => {
    const appearance = seen('vincent')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'vincent',
      build: 'broad',
      height: 1.04,
      shoulders: 1.15,
      face: 'square',
      hairStyle: 'shaved',
      clothing: 'uniform',
      expression: 'hostile',
    })
    expect(look).toMatchObject({ eyes: 'narrow', jaw: 0.15, nose: 1.75, brow: 1.35 })
    expect(model.root.getObjectByName('vincent-shaven-scalp-shadow')).toBeTruthy()
    expect(model.root.getObjectByName('vincent-long-nose-and-grin')).toBeTruthy()
    expect(model.root.getObjectByName('vincent-left-earpiece')).toBeTruthy()
    expect(model.root.getObjectByName('vincent-uniform-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('vincent-padded-jacket-seams')).toBeTruthy()
    expect(model.root.getObjectByName('vincent-standing-collar')).toBeTruthy()
    const boots: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'vincent-combat-boot-shaft') boots.push(node)
    })
    expect(boots).toHaveLength(2)
  })
  it('draws Vergei with a high forehead, groomed dark hair, gaunt cheekbones and black suit', () => {
    const appearance = seen('vergei')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'vergei',
      build: 'slim',
      height: 1.02,
      shoulders: 0.98,
      face: 'narrow',
      hairStyle: 'short',
      clothing: 'suit',
      expression: 'severe',
      hair: 0x29282b,
    })
    expect(look).toMatchObject({
      eyes: 'almond',
      cheek: 0.13,
      jaw: 0.07,
      chin: 0.24,
      nose: 1.45,
    })
    expect(model.root.getObjectByName('vergei-prominent-cheekbone-lines')).toBeTruthy()
    expect(model.root.getObjectByName('vergei-groomed-short-hairline')).toBeTruthy()
    expect(model.root.getObjectByName('vergei-combed-hair-lines')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    expect(model.root.getObjectByName('vergei-sharp-lapel-seam--1')).toBeTruthy()
    expect(model.root.getObjectByName('vergei-sharp-lapel-seam-1')).toBeTruthy()
  })
  it('draws Babimyna with a fair curly fade, left earpiece and Kakin field uniform', () => {
    const appearance = seen('babimyna')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'babimyna',
      build: 'average',
      height: 1.03,
      shoulders: 1.04,
      face: 'narrow',
      hairStyle: 'military',
      clothing: 'uniform',
      expression: 'severe',
      hair: 0xd7c28f,
    })
    expect(look).toMatchObject({ eyes: 'almond', jaw: 0.095, nose: 1.35, brow: 1.15 })
    expect(model.root.getObjectByName('babimyna-fair-curly-fade-top')).toBeTruthy()
    expect(model.root.getObjectByName('babimyna-faded-hair-sides')).toBeTruthy()
    expect(model.root.getObjectByName('babimyna-left-earpiece')).toBeTruthy()
    expect(model.root.getObjectByName('babimyna-uniform-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('babimyna-padded-jacket-seams')).toBeTruthy()
    expect(model.root.getObjectByName('babimyna-standing-collar')).toBeTruthy()
    const boots: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'babimyna-combat-boot-shaft') boots.push(node)
    })
    expect(boots).toHaveLength(2)
  })
  it('draws Balsamilco bald and stocky with a left facial scar and Benjamin soldier gear', () => {
    const appearance = seen('balsamilco-might')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'balsamilco-might',
      build: 'broad',
      height: 0.98,
      shoulders: 1.18,
      face: 'square',
      hairStyle: 'shaved',
      clothing: 'uniform',
      expression: 'severe',
      skin: 0x76503e,
    })
    expect(look).toMatchObject({ eyes: 'heavy', cheek: 0.185, jaw: 0.155, nose: 1.65 })
    expect(model.root.getObjectByName('balsamilco-left-temple-scar')).toBeTruthy()
    expect(model.root.getObjectByName('balsamilco-forehead-and-eye-folds')).toBeTruthy()
    expect(model.root.getObjectByName('balsamilco-might-puffer-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('balsamilco-might-puffer-seams')).toBeTruthy()
    expect(model.root.getObjectByName('balsamilco-might-puffer-collar')).toBeTruthy()
    expect(model.root.getObjectByName('balsamilco-tactical-pocket')).toBeTruthy()
    expect(model.root.getObjectByName('balsamilco-combat-boot')).toBeTruthy()
  })
  it('draws Longhi with a centre-parted fair ponytail, gaunt cheeks and a royal bodyguard suit', () => {
    const appearance = seen('longhi')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'longhi',
      build: 'slim',
      height: 1.02,
      shoulders: 0.96,
      face: 'narrow',
      hairStyle: 'ponytail',
      clothing: 'suit',
      expression: 'severe',
    })
    expect(look).toMatchObject({
      eyes: 'narrow',
      cheek: 0.135,
      jaw: 0.072,
      chin: 0.235,
      nose: 1.35,
      hair: 'tied-part',
    })
    expect(model.root.getObjectByName('longhi-gaunt-cheek-lines')).toBeTruthy()
    expect(model.root.getObjectByName('longhi-centre-part-hair-flow')).toBeTruthy()
    expect(model.root.getObjectByName('longhi-ponytail-tie')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    expect(model.root.getObjectByName('longhi-shoulder-seam--1')).toBeTruthy()
    expect(model.root.getObjectByName('longhi-shoulder-seam-1')).toBeTruthy()
    expect(model.root.getObjectByName('longhi-tie-bar')).toBeTruthy()
  })
  it('draws Kurton with short spikes, heavy angular brows and a royal bodyguard suit', () => {
    const appearance = seen('kurton')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'kurton',
      build: 'average',
      height: 1.01,
      shoulders: 1.04,
      face: 'narrow',
      hairStyle: 'military',
      clothing: 'suit',
      expression: 'neutral',
    })
    expect(look).toMatchObject({ eyes: 'narrow', nose: 1.65, brow: 1.6 })
    expect(model.root.getObjectByName('kurton-thick-brows-and-long-nose')).toBeTruthy()
    expect(model.root.getObjectByName('kurton-short-spiky-hair')).toBeTruthy()
    expect(model.root.getObjectByName('manga-layered-hair')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    expect(model.root.getObjectByName('kurton-hunter-badge')).toBeTruthy()
  })
  it('draws Momoze with black eyes, elaborate fair ponytail, ringlets and royal banquet dress', () => {
    const appearance = seen('prince-momoze')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'prince-momoze',
      build: 'slim',
      height: 0.88,
      shoulders: 0.9,
      face: 'round',
      hairStyle: 'ponytail',
      clothing: 'gown',
      expression: 'neutral',
      signatures: ['tiara'],
    })
    expect(look).toMatchObject({ eyes: 'doll' })
    expect(model.root.getObjectByName('momoze-voluminous-ponytail')).toBeTruthy()
    expect(model.root.getObjectByName('momoze-front-ringlets')).toBeTruthy()
    expect(model.root.getObjectByName('momoze-lustrous-hair-shine')).toBeTruthy()
    expect(model.root.getObjectByName('momoze-dark-blouse')).toBeTruthy()
    expect(model.root.getObjectByName('momoze-juliet-sleeve')).toBeTruthy()
    expect(model.root.getObjectByName('momoze-refined-necklace')).toBeTruthy()
    expect(model.root.getObjectByName('signature-tiara')).toBeTruthy()
    expect(model.root.getObjectByName('court-gown')).toBeTruthy()
  })
  it('draws Tang Zhao Li from her finalized portrait with dark skin, large eyes and blonde curls', () => {
    const appearance = seen('tang-zhao-li-hui-guo-rou')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'tang-zhao-li-hui-guo-rou',
      build: 'slim',
      height: 0.98,
      face: 'narrow',
      hairStyle: 'curly',
      clothing: 'gown',
      expression: 'neutral',
      skin: 0x7a4c38,
      hair: 0xe2c879,
    })
    expect(look).toMatchObject({ eyes: 'doll', nose: 0.8, brow: 0.7 })
    expect(model.root.getObjectByName('tang-zhao-li-thin-nose')).toBeTruthy()
    expect(model.root.getObjectByName('tang-zhao-li-blonde-curl-highlights')).toBeTruthy()
    expect(model.root.getObjectByName('court-gown')).toBeTruthy()
  })
  it('draws Duazul with fair side waves, a gentle face and formal high-collared dress', () => {
    const appearance = seen('duazul-hui-guo-rou')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'duazul-hui-guo-rou',
      build: 'average',
      height: 1,
      face: 'narrow',
      hairStyle: 'bun',
      clothing: 'gown',
      expression: 'neutral',
    })
    expect(look).toMatchObject({ eyes: 'almond', hair: 'loose-bun', brow: 0.75 })
    expect(model.root.getObjectByName('duazul-fair-wavy-updo')).toBeTruthy()
    expect(model.root.getObjectByName('duazul-swept-forehead')).toBeTruthy()
    expect(model.root.getObjectByName('duazul-wave-highlights')).toBeTruthy()
    expect(model.root.getObjectByName('duazul-standing-collar')).toBeTruthy()
    expect(model.root.getObjectByName('duazul-collar-seam')).toBeTruthy()
    expect(model.root.getObjectByName('court-gown')).toBeTruthy()
  })
  it('draws Unma from her finalized portrait with a combed blonde bob, flat nose and frilly dress', () => {
    const appearance = seen('unma-hui-guo-rou')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'unma-hui-guo-rou',
      build: 'broad',
      height: 1.01,
      shoulders: 1.08,
      face: 'square',
      hairStyle: 'bob',
      clothing: 'gown',
      expression: 'neutral',
    })
    expect(look).toMatchObject({ eyes: 'almond', hair: 'catalogue' })
    expect(model.root.getObjectByName('unma-wide-flat-nose')).toBeTruthy()
    expect(model.root.getObjectByName('unma-swept-forehead')).toBeTruthy()
    expect(model.root.getObjectByName('unma-combed-back-hair-lines')).toBeTruthy()
    expect(model.root.getObjectByName('unma-layered-neck-ruffles')).toBeTruthy()
    expect(model.root.getObjectByName('unma-frill-cuff')).toBeTruthy()
    expect(model.root.getObjectByName('court-gown')).toBeTruthy()
  })
  it('draws Nasubi as an obese jeweled king with narrow eyes, curled facial hair and a topknot', () => {
    const appearance = seen('nasubi-hui-guo-rou')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'nasubi-hui-guo-rou',
      build: 'broad',
      height: 1.02,
      shoulders: 1.22,
      face: 'round',
      hairStyle: 'chonmage',
      clothing: 'kakin-robe',
      signatures: ['crown'],
    })
    expect(look).toMatchObject({ eyes: 'narrow', brow: 1.4 })
    expect(model.root.getObjectByName('nasubi-topknot')).toBeTruthy()
    expect(model.root.getObjectByName('nasubi-curled-brows-lashes-moustache')).toBeTruthy()
    expect(model.root.getObjectByName('nasubi-cheek-curls')).toBeTruthy()
    expect(model.root.getObjectByName('nasubi-pectoral-feathers')).toBeTruthy()
    expect(model.root.getObjectByName('nasubi-necklace-jewel')).toBeTruthy()
    expect(model.root.getObjectByName('nasubi-coat-gem')).toBeTruthy()
    expect(model.root.getObjectByName('nasubi-baggy-trouser')).toBeTruthy()
    expect(model.root.getObjectByName('signature-crown')).toBeTruthy()
    expect(model.root.getObjectByName('kakin-double-chin')).toBeTruthy()
  })
  it('draws Borksen from the supplied manga reference', () => {
    const appearance = seen('borksen')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'borksen',
      hairStyle: 'bob',
      clothing: 'uniform',
    })
    expect(look).toMatchObject({ eyes: 'doll', hair: 'borksen-flip' })
    expect(mesh(model.root, 'borksen-uniform-zipper')).toBeTruthy()
    expect(mesh(model.root, 'borksen-standing-collar')).toBeTruthy()
    const hair = model.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    hair.geometry.computeBoundingBox()
    expect(hair.geometry.boundingBox!.min.y).toBeLessThan(-0.1)
    expect(hair.geometry.boundingBox!.max.x).toBeGreaterThan(0.19)
  })
  it('draws Kaiser from the supplied Justice Bureau references', () => {
    const appearance = seen('kaiser')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'kaiser',
      build: 'average',
      height: 1.05,
      hairStyle: 'slicked-back',
      clothing: 'suit',
      expression: 'neutral',
      signatures: ['glasses-rectangular'],
    })
    expect(look).toMatchObject({ eyes: 'narrow', hair: 'luini-slick' })
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    const glasses: THREE.Object3D[] = []
    const brows: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'signature-glasses-rectangular') glasses.push(node)
      if (node.name.startsWith('kaiser-arched-brow-')) brows.push(node)
    })
    expect(glasses).toHaveLength(2)
    expect(brows).toHaveLength(4)
    expect(model.root.getObjectByName('kaiser-combed-hair-lines')).toBeTruthy()
  })
  it('draws Sarahell’s imposing guardian persona from the supplied references', () => {
    const appearance = seen('sarahell')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'sarahell',
      build: 'broad',
      height: 1.08,
      shoulders: 1.15,
      face: 'square',
      hairStyle: 'spiked',
      clothing: 'uniform',
      expression: 'hostile',
    })
    expect(look).toMatchObject({ eyes: 'round', hair: 'sarahell-spikes' })
    const eyeliner: THREE.Object3D[] = []
    const folds: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'sarahell-outer-eyeliner') eyeliner.push(node)
      if (node.name === 'sarahell-nasolabial-fold') folds.push(node)
    })
    expect(eyeliner).toHaveLength(2)
    expect(folds).toHaveLength(2)
    const hair = model.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    hair.geometry.computeBoundingBox()
    expect(hair.geometry.boundingBox!.max.x).toBeGreaterThan(0.23)
  })
  it('draws Maor as the tall elderly Royal Bodyguard in the supplied references', () => {
    const appearance = seen('maor')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'maor',
      build: 'slim',
      height: 1.12,
      shoulders: 0.95,
      face: 'square',
      hairStyle: 'bowl',
      clothing: 'suit',
      expression: 'severe',
    })
    expect(look).toMatchObject({ eyes: 'heavy', hair: 'maor-parted-bowl' })
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    expect(model.root.getObjectByName('maor-age-lines')).toBeTruthy()
    const hair = model.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    hair.geometry.computeBoundingBox()
    expect(hair.geometry.boundingBox!.min.y).toBeLessThan(-0.03)
  })
  it('draws Dogman’s muscular build, dog mask and street clothes from the references', () => {
    const appearance = seen('dogman')
    const profile = humanProfile(appearance)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'dogman',
      build: 'broad',
      height: 1.15,
      shoulders: 1.28,
      hairStyle: 'long',
      clothing: 'civilian',
    })
    expect(model.root.getObjectByName('dogman-dog-mask')).toBeTruthy()
    expect(model.root.getObjectByName('dogman-kanji-dog')).toBeTruthy()
    expect(model.root.getObjectByName('dogman-shirt-neckline')).toBeTruthy()
    const ears: THREE.Object3D[] = []
    const wristbands: THREE.Object3D[] = []
    const laces: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'dogman-mask-ear') ears.push(node)
      if (node.name === 'dogman-black-wristband') wristbands.push(node)
      if (node.name === 'dogman-sneaker-laces') laces.push(node)
    })
    expect(ears).toHaveLength(2)
    expect(wristbands).toHaveLength(2)
    expect(laces).toHaveLength(2)
  })
  it('draws Shimanu’s tied-back hair, oval face and standard maid robe', () => {
    const appearance = seen('shimanu')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'shimanu',
      build: 'average',
      height: 0.96,
      face: 'round',
      hairStyle: 'ponytail',
      clothing: 'gown',
      expression: 'tired',
    })
    expect(look).toMatchObject({ eyes: 'heavy', hair: 'shimanu-ponytail' })
    expect(model.root.getObjectByName('shimanu-hair-tie')).toBeTruthy()
    expect(model.root.getObjectByName('shimanu-combed-hair-lines')).toBeTruthy()
    expect(model.root.getObjectByName('shimanu-maid-skirt')).toBeTruthy()
    expect(model.root.getObjectByName('shimanu-white-apron')).toBeTruthy()
    expect(model.root.getObjectByName('shimanu-maid-bib')).toBeTruthy()
    expect(model.root.getObjectByName('shimanu-maid-collar')).toBeTruthy()
  })
  it('draws Ken’i Wang’s sharp face, rectangular glasses and striped first suit', () => {
    const appearance = seen('keni-wang')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'keni-wang',
      build: 'slim',
      height: 1.11,
      face: 'narrow',
      hairStyle: 'slicked-back',
      clothing: 'suit',
      signatures: ['glasses-rectangular'],
    })
    expect(look).toMatchObject({ eyes: 'narrow', hair: 'keni-side-comb' })
    expect(model.root.getObjectByName('keni-pinstripe-suit')).toBeTruthy()
    expect(model.root.getObjectByName('keni-polka-dot-tie')).toBeTruthy()
    const glasses: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'signature-glasses-rectangular') glasses.push(node)
    })
    expect(glasses).toHaveLength(2)
  })
  it('draws Sakata’s square eyes, mashed nose, voluminous hair and black suit', () => {
    const appearance = seen('sakata')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'sakata',
      build: 'average',
      height: 1,
      face: 'square',
      hairStyle: 'swept',
      clothing: 'suit',
      expression: 'tired',
    })
    expect(look).toMatchObject({ eyes: 'heavy', hair: 'sakata-volume' })
    expect(model.root.getObjectByName('sakata-mashed-nose')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    const eyes: THREE.Object3D[] = []
    const brows: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'sakata-square-eye') eyes.push(node)
      if (node.name === 'sakata-short-thick-brow') brows.push(node)
    })
    expect(eyes).toHaveLength(2)
    expect(brows).toHaveLength(2)
  })
  it('draws Keeney at Melody’s height with a receding hairline, age lines and pencil moustache', () => {
    const appearance = seen('keeney')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'keeney',
      build: 'average',
      height: 0.72,
      shoulders: 0.94,
      face: 'round',
      hairStyle: 'bald-crown',
      clothing: 'suit',
      expression: 'tired',
      signatures: ['moustache'],
    })
    expect(look).toMatchObject({ eyes: 'heavy', hair: 'keeney-receding' })
    expect(model.root.getObjectByName('keeney-age-lines')).toBeTruthy()
    expect(model.root.getObjectByName('keeney-pencil-moustache')).toBeTruthy()
    expect(model.root.getObjectByName('manga-tie')).toBeTruthy()
    const ears: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'keeney-protruding-ear') ears.push(node)
    })
    expect(ears).toHaveLength(2)
  })
  it('draws Shikaku’s square military build, single forelock, earpiece and zipped uniform', () => {
    const appearance = seen('shikaku')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'shikaku',
      build: 'broad',
      height: 1.06,
      shoulders: 1.13,
      face: 'square',
      hairStyle: 'military',
      clothing: 'uniform',
      expression: 'severe',
    })
    expect(look).toMatchObject({ eyes: 'narrow', hair: 'shikaku-brush' })
    expect(model.root.getObjectByName('shikaku-left-earpiece')).toBeTruthy()
    expect(model.root.getObjectByName('shikaku-long-angular-nose')).toBeTruthy()
    expect(model.root.getObjectByName('shikaku-severe-mouth')).toBeTruthy()
    expect(model.root.getObjectByName('shikaku-uniform-zipper')).toBeTruthy()
    expect(model.root.getObjectByName('shikaku-standing-collar')).toBeTruthy()
    const boots: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'shikaku-combat-boot-shaft') boots.push(node)
    })
    expect(boots).toHaveLength(2)
  })
  it('conceals short Sanbica behind her medical gown, gloves, cap and surgical mask', () => {
    const appearance = seen('sanbica-norton')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'sanbica-norton',
      build: 'slim',
      height: 0.8,
      shoulders: 0.9,
      face: 'round',
      hairStyle: 'bob',
      clothing: 'gown',
    })
    expect(look).toMatchObject({ eyes: 'doll', hair: 'catalogue' })
    expect(model.root.getObjectByName('sanbica-surgical-mask')).toBeTruthy()
    expect(model.root.getObjectByName('sanbica-medical-cap')).toBeTruthy()
    expect(model.root.getObjectByName('sanbica-medical-cross')).toBeTruthy()
    expect(model.root.getObjectByName('sanbica-concealing-gown')).toBeTruthy()
    const gloves: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'sanbica-medical-glove') gloves.push(node)
    })
    expect(gloves).toHaveLength(2)
  })
  it('draws Tokarine’s round build, beady face, two-tone bob, piercings and striped top', () => {
    const appearance = seen('tokarine')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'tokarine',
      build: 'broad',
      height: 0.93,
      shoulders: 1.16,
      face: 'round',
      hairStyle: 'bob',
      clothing: 'civilian',
      signatures: ['earrings'],
    })
    expect(look).toMatchObject({ eyes: 'round', hair: 'catalogue' })
    expect(model.root.getObjectByName('tokarine-beady-eye')).toBeTruthy()
    expect(model.root.getObjectByName('tokarine-snub-nose')).toBeTruthy()
    expect(model.root.getObjectByName('tokarine-full-lips')).toBeTruthy()
    expect(model.root.getObjectByName('tokarine-full-cheek')).toBeTruthy()
    expect(model.root.getObjectByName('tokarine-chin-fold')).toBeTruthy()
    expect(model.root.getObjectByName('tokarine-light-hair-crown')).toBeTruthy()
    expect(model.root.getObjectByName('tokarine-striped-top')).toBeTruthy()
    const piercings: THREE.Object3D[] = []
    model.root.traverse((node) => {
      if (node.name === 'tokarine-ear-piercing') piercings.push(node)
    })
    expect(piercings).toHaveLength(4)
  })
  it('draws Oito’s nephew as the short-haired, round-eyed infant publicly presented as Woble', () => {
    const appearance = seen('oito-nephew-fake-woble')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'oito-nephew-fake-woble',
      build: 'broad',
      height: 0.44,
      frame: 'infant',
      face: 'round',
      hairStyle: 'military',
      clothing: 'civilian',
    })
    expect(look).toMatchObject({ eyes: 'doll', hair: 'catalogue' })
    expect(model.root.getObjectByName('fake-woble-round-eye')).toBeTruthy()
    expect(model.root.getObjectByName('fake-woble-full-cheek')).toBeTruthy()
    expect(model.root.getObjectByName('fake-woble-button-nose')).toBeTruthy()
    expect(model.root.getObjectByName('fake-woble-baby-romper')).toBeTruthy()
    expect(model.root.getObjectByName('fake-woble-round-collar')).toBeTruthy()
  })
  it('draws Oito tall and slim with oval eyes, swept waves and a light patterned kimono', () => {
    const appearance = seen('queen-oito')
    const profile = humanProfile(appearance)
    const look = mangaLikeness(profile)
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    expect(profile).toMatchObject({
      likeness: 'queen-oito',
      build: 'slim',
      height: 1.07,
      shoulders: 0.92,
      face: 'narrow',
      hairStyle: 'slicked-back',
      clothing: 'kimono',
      expression: 'anxious',
    })
    expect(look).toMatchObject({ eyes: 'almond' })
    const eye = model.root.getObjectByName('face-eye-left') as THREE.Mesh
    expect(eye.userData.referenceFeature).toBe('oito-oval-eye')
    expect(eye.getObjectByName('eye-sclera')).toBeTruthy()
    expect(eye.getObjectByName('eye-pupil')).toBeTruthy()
    expect(model.root.getObjectByName('oito-swept-wave-lines')).toBeTruthy()
    expect(model.root.getObjectByName('oito-low-ponytail')).toBeTruthy()
    expect(model.root.getObjectByName('attire-kimono')).toBeTruthy()
    expect(model.root.getObjectByName('attire-obi')).toBeTruthy()
    expect(model.root.getObjectByName('oito-kimono-pattern')).toBeTruthy()
  })
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
    const fighting = buildFightFigure({ THREE, glow, fighter, readability: false })
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
      expect(fightHair.geometry).toBe(combatBodyGeometry(commonHair.geometry))
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
          fighting.root.getObjectByName('knee-left')!.getObjectByName('terebellum-trouser-trim'),
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
    const hair = model.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    expect(hair.geometry).toBe(
      combatBodyGeometry(
        (common.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh).geometry,
      ),
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
    // Combat expressions resume after the flute: the concentration face is close to rest.
    expect(model.root.getObjectByName('face-eye-left')!.scale.y).toBeCloseTo(1, 1)
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
      'saiyu-curled-tail',
      'saiyu-knee-scroll',
      'saiyu-abdominal-lines',
      'saiyu-gold-emblem-top',
    ])
      expect(mesh(fighting.root, name).geometry).toBe(mesh(common.root, name).geometry)
    for (const name of ['saiyu-large-ears', 'saiyu-shaved-heart']) {
      expect(mesh(fighting.root, name).geometry).toBe(
        combatFaceGeometry(mesh(common.root, name).geometry),
      )
      expect(mesh(common.root, name).geometry.getAttribute('color')).toBeUndefined()
    }
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
      expect(hair(fighting.root)).toBe(combatBodyGeometry(hair(common.root)))
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
    expect(compact.root.getObjectByName('biscuit-laced-bun')).toBeTruthy()
    expect(compact.root.getObjectByName('biscuit-bodyguard-cuff')).toBeTruthy()
    expect(compact.root.getObjectByName('biscuit-royal-bodyguard-suit')).toBeTruthy()
    expect(compact.root.getObjectByName('manga-tie')).toBeTruthy()
    expect(compact.root.getObjectByName('biscuit-petal-skirt')).toBeUndefined()
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
