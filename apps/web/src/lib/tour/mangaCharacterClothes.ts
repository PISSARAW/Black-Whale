import { addFeitanCoat } from './mangaFeitanClothes'
import { addTubeppaSuit } from './mangaTubeppaSuit'
import { addMarayamTuxedo } from './mangaMarayamClothes'
import { addZhangLeiTunic } from './mangaZhangLeiClothes'
import { addMorenaBodice } from './mangaMorenaClothes'
import { addLuzurusVest } from './mangaLuzurusClothes'
import { addSalesaleRobe } from './mangaSalesaleClothes'
import { addBodyguardReferenceSuit } from './mangaBodyguardSuits'
import { addSaiyuCostume } from './mangaSaiyuClothes'
import { addCluckFeatherCostume } from './mangaCluckClothes'
import type { Material, MeshBasicMaterial } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel } from './mangaBody'
import {
  addHalkenburgPinstripeSuit,
  addBeyondRobe,
  addFurykovPuffer,
  addBorksenKakinUniform,
} from './mangaRoyalMilitaryClothes'
import {
  addHinrighStripedJacket,
  addZakuroCroppedJacket,
  addTerebellumSportsJacket,
} from './mangaUnderworldClothes'
import { addGelScallopedTop } from './mangaGel'
import { addMizaistomCowUniform } from './mangaMizaistomClothes'
import { addLuiniPatternedJacket } from './mangaHeillyClothes'
import { addPadailleShirt } from './mangaPadaille'
import { addMelodySuit } from './mangaMelody'
import { addBiscuitReferenceClothes } from './mangaBiscuitClothes'
import { addCamillaCourtDress } from './mangaCamillaDress'
import { addIllumiTravelClothes } from './mangaZoldyckClothes'
import { addFranklinOveralls, addChrolloCrossCoat } from './mangaTroupeClothes'
import { addMangaBodyBandages } from './mangaBandages'
import { addMangaHoodie } from './mangaHood'
import { addMangaWaistcoat } from './mangaWaistcoat'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addDogmanShirt } from './mangaDogman'
import { addShimanuMaidDress } from './mangaShimanu'
import { addKeniStripedSuit } from './mangaKeniWang'
import { addShikakuUniform } from './mangaShikaku'
import { addSanbicaMedicalGown } from './mangaSanbica'
import { addTokarineStripedTop } from './mangaTokarine'
import { addFakeWobleRomper } from './mangaFakeWoble'
import { addOitoKimono } from './mangaOito'
import { addNasubiRoyalOrnaments } from './mangaNasubi'
import { addUnmaFrillyDress } from './mangaUnma'
import { addDuazulFormalDress } from './mangaDuazul'
import { addMomozeRoyalGown } from './mangaMomoze'
import { addLonghiRoyalBodyguardSuit } from './mangaLonghi'
import { addBalsamilcoPrivateSoldierUniform } from './mangaBalsamilco'
import { addBabimynaKakinUniform } from './mangaBabimyna'
import { addVergeiBodyguardSuit } from './mangaVergei'
import { addVincentKakinUniform } from './mangaVincent'

function machi(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  mangaPanel(build, {
    name: 'machi-wrap-left',
    points: [
      [-0.065, 1.47],
      [-0.1, 1.42],
      [0.07, 1.1],
      [0.105, 1.14],
    ],
    material: materials.shirt,
    lift: 0.009,
  })
  mangaPanel(build, {
    name: 'machi-wrap-right',
    points: [
      [0.065, 1.47],
      [0.1, 1.42],
      [-0.005, 1.24],
      [-0.035, 1.28],
    ],
    material: materials.shirt,
    lift: 0.01,
  })
  const sashMaterial = referenceColour(materials.cloth, 0x57213d)
  const sash = new THREE.Mesh(
    geometry(THREE, 'manga:machi-obi', () =>
      new THREE.CylinderGeometry(0.145, 0.15, 0.105, 28).scale(1, 1, 0.78),
    ),
    sashMaterial,
  )
  sash.name = 'machi-obi'
  sash.position.y = 1.015
  figure.add(sash)
  const cord = new THREE.Mesh(
    geometry(THREE, 'manga:machi-cord', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.026, 0.005, 6, 20).scale(1.3, 0.65, 0.7).translate(-0.029, 0, 0),
        new THREE.TorusGeometry(0.026, 0.005, 6, 20).scale(1.3, 0.65, 0.7).translate(0.029, 0, 0),
        new THREE.BoxGeometry(0.012, 0.13, 0.006).rotateZ(-0.15).translate(-0.016, -0.061, 0),
        new THREE.BoxGeometry(0.012, 0.13, 0.006).rotateZ(0.15).translate(0.016, -0.061, 0),
      ]),
    ),
    materials.accent,
  )
  cord.name = 'machi-sash-cord'
  cord.position.set(0, 1.025, 0.13)
  figure.add(cord)
  const tails = new THREE.Mesh(
    geometry(THREE, 'manga:machi-sash-tails', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.045, 0.55, 0.012).rotateZ(0.22).translate(-0.18, -0.26, -0.08),
        new THREE.BoxGeometry(0.045, 0.55, 0.012).rotateZ(-0.22).translate(0.18, -0.26, -0.08),
      ]),
    ),
    sashMaterial,
  )
  tails.position.y = 1.025
  tails.name = 'machi-sash-tails'
  figure.add(tails)
}

function shizuku(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:shizuku-turtleneck',
      () => new THREE.CylinderGeometry(0.052, 0.067, 0.085, 24),
    ),
    materials.cloth,
  )
  collar.position.y = 1.47
  figure.add(collar)
  const necklace = new THREE.Mesh(
    geometry(THREE, 'manga:shizuku-pendant', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.073, 0.0025, 5, 32, Math.PI)
          .rotateZ(Math.PI)
          .scale(1, 0.72, 1)
          .translate(0, 0.047, 0),
        new THREE.BoxGeometry(0.009, 0.079, 0.008).translate(0, -0.035, 0),
        new THREE.BoxGeometry(0.045, 0.009, 0.008).translate(0, -0.02, 0),
      ]),
    ),
    materials.accent,
  )
  necklace.position.set(0, 1.31, 0.134)
  necklace.name = 'shizuku-cross-pendant'
  figure.add(necklace)
}

function tracksuit(build: HumanClothesBuild) {
  const { THREE, figure, geometry, materials, profile } = build
  const phinks = profile.likeness === 'phinks-magcub'
  mangaPanel(build, {
    name: 'tracksuit-zipper',
    points: [
      [-0.004, 1.46],
      [-0.004, 0.83],
      [0.004, 0.83],
      [0.004, 1.46],
    ],
    material: phinks ? materials.dark : materials.accent,
  })
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `tracksuit-shoulder-yoke-${side}`,
      points: [
        [side * 0.055, 1.47],
        [side * 0.2, 1.38],
        [side * 0.185, 1.29],
        [side * 0.046, 1.355],
      ],
      material: materials.shirt,
    })
    if (phinks)
      for (let band = 0; band < 2; band++)
        mangaPanel(build, {
          name: `phinks-chevron-${side}-${band}`,
          points: [
            [side * 0.012, 1.338 - band * 0.032],
            [side * 0.19, 1.275 - band * 0.032],
            [side * 0.189, 1.263 - band * 0.032],
            [side * 0.012, 1.326 - band * 0.032],
          ],
          material: materials.accent,
          lift: 0.009,
        })
  }
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:tracksuit-collar',
      () => new THREE.CylinderGeometry(0.065, 0.08, 0.073, 24, 1, true),
    ),
    materials.cloth,
  )
  collar.position.y = 1.465
  collar.name = 'tracksuit-standing-collar'
  figure.add(collar)
}

const SPECIAL: Record<string, (build: HumanClothesBuild) => void> = {
  'prince-salesale': addSalesaleRobe,
  'prince-luzurus': addLuzurusVest,
  'morena-prudo': addMorenaBodice,
  'prince-tubeppa': addTubeppaSuit,
  'prince-marayam': addMarayamTuxedo,
  'prince-zhanglei': addZhangLeiTunic,
  'biscuit-krueger': addBiscuitReferenceClothes,
  melody: addMelodySuit,
  padaille: addPadailleShirt,
  luini: addLuiniPatternedJacket,
  bill: addBodyguardReferenceSuit,
  basho: addBodyguardReferenceSuit,
  kurton: addBodyguardReferenceSuit,
  longhi: addLonghiRoyalBodyguardSuit,
  'balsamilco-might': addBalsamilcoPrivateSoldierUniform,
  babimyna: addBabimynaKakinUniform,
  vergei: addVergeiBodyguardSuit,
  vincent: addVincentKakinUniform,
  saiyu: addSaiyuCostume,
  cluck: addCluckFeatherCostume,
  gel: addGelScallopedTop,
  'machi-komacine': machi,
  'shizuku-murasaki': shizuku,
  'feitan-portor': addFeitanCoat,
  'chrollo-lucilfer': addChrolloCrossCoat,
  'phinks-magcub': tracksuit,
  terebellum: addTerebellumSportsJacket,
  'hinrigh-biganduffno': addHinrighStripedJacket,
  'zakuro-custard': addZakuroCroppedJacket,
  rihan: addFurykovPuffer,
  hisoka: addMangaWaistcoat,
  'prince-tserriednich': addMangaHoodie,
  'mizaistom-nana': addMizaistomCowUniform,
  illumi: addIllumiTravelClothes,
  'prince-camilla': addCamillaCourtDress,
  'prince-halkenburg': addHalkenburgPinstripeSuit,
  'beyond-netero': addBeyondRobe,
  furykov: addFurykovPuffer,
  'prince-benjamin': addFurykovPuffer,
  borksen: addBorksenKakinUniform,
  'franklin-bordeau': addFranklinOveralls,
  'bonolenov-ndongo': addMangaBodyBandages,
  dogman: addDogmanShirt,
  shimanu: addShimanuMaidDress,
  'keni-wang': addKeniStripedSuit,
  shikaku: addShikakuUniform,
  'sanbica-norton': addSanbicaMedicalGown,
  tokarine: addTokarineStripedTop,
  'oito-nephew-fake-woble': addFakeWobleRomper,
  'queen-oito': addOitoKimono,
  'nasubi-hui-guo-rou': addNasubiRoyalOrnaments,
  'unma-hui-guo-rou': addUnmaFrillyDress,
  'duazul-hui-guo-rou': addDuazulFormalDress,
  'prince-momoze': addMomozeRoyalGown,
}

export function addMangaCharacterClothes(build: HumanClothesBuild): boolean {
  const custom = SPECIAL[build.profile.likeness ?? '']
  custom?.(build)
  return Boolean(custom)
}

const referenceMaterials = new WeakMap<Material, Map<number, Material>>()
function referenceColour(source: Material, colour: number): Material {
  let cache = referenceMaterials.get(source)
  if (!cache) {
    cache = new Map()
    referenceMaterials.set(source, cache)
  }
  const held = cache.get(colour)
  if (held) return held
  const made = source.clone() as MeshBasicMaterial
  made.color.setHex(colour)
  cache.set(colour, made)
  return made
}
