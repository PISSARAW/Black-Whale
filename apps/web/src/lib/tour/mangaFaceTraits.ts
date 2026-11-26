import { addBodyguardFaces } from './mangaBodyguardFaces'
import { addTubeppaFace } from './mangaTubeppaHead'
import { addMarayamFace } from './mangaMarayamHead'
import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addGelFace } from './mangaGel'
import { addHeillyReferenceFace } from './mangaHeillyFaces'
import { addPadailleFace } from './mangaPadaille'
import { addMelodySoftFeatures } from './mangaMelody'
import { addUnderworldFaceDetails } from './mangaUnderworldFaces'
import { addBenjaminDetails } from './mangaBenjamin'
import { addMangaFacialHair } from './mangaFacialHair'
import { addShimanuHeadDetails } from './mangaShimanu'
import { addSakataFace } from './mangaSakata'
import { addKeeneyFace } from './mangaKeeney'
import { addShikakuEarpiece } from './mangaShikaku'
import { addSanbicaMedicalHeadwear } from './mangaSanbica'
import { addTokarineFace } from './mangaTokarine'
import { addFakeWobleFace } from './mangaFakeWoble'
import { addOitoFaceAndHair } from './mangaOito'
import { addNasubiRoyalFace } from './mangaNasubi'
import { addUnmaFaceAndHair } from './mangaUnma'
import { addDuazulGentleFaceAndWaves } from './mangaDuazul'
import { addTangZhaoLiPortraitFace } from './mangaTangZhaoLi'
import { addTwinHairDetails } from './mangaTwinHair'
import { addMomozeElaboratePonytail } from './mangaMomoze'
import { addKurtonAngularFace } from './mangaKurton'
import { addLonghiGauntFaceAndPonytail } from './mangaLonghi'
import { addBalsamilcoScarAndAge } from './mangaBalsamilco'
import { addBabimynaFadeAndEarpiece } from './mangaBabimyna'
import { addVergeiAngularFaceAndHair } from './mangaVergei'
import { addVincentShavenFaceAndEarpiece } from './mangaVincent'
import { addSaquelleFace } from './mangaSaquelle'
import { addOrauFaceAndEarpiece } from './mangaOrau'
import { addKanjidolRoundFace } from './mangaKanjidol'
import { addKakinAnnouncerCatFace } from './mangaKakinAnnouncer'
import { addCleapatroEgyptianHeaddress } from './mangaCleapatro'
import { addPeuckertFaceAndHair } from './mangaPeuckert'
import { addSteinerHazelEyesAndHair } from './mangaSteiner'
import { addWorioBaySquareFace } from './mangaWorioBay'

export const MANGA_FACE_SIGNATURES = new Set([
  'lips-full',
  'face-paint-star-tear',
  'bandages-full',
  'beard-full',
  'moustache',
  'mutton-chops',
  'goatee',
])

function facePaint(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  const star = new THREE.Mesh(
    geometry(THREE, 'manga:hisoka-star', () => {
      const shape = new THREE.Shape()
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2
        const r = i % 2 ? 0.012 : 0.027
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      shape.closePath()
      return new THREE.ShapeGeometry(shape)
    }),
    materials.ink,
  )
  star.name = 'signature-star'
  star.position.set(-0.087, -0.046, 0.174)
  const tear = new THREE.Mesh(
    geometry(THREE, 'manga:hisoka-tear', () => {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0.026)
      shape.bezierCurveTo(-0.003, 0.008, -0.021, -0.008, -0.012, -0.02)
      shape.bezierCurveTo(0, -0.035, 0.03, -0.015, 0, 0.026)
      return new THREE.ShapeGeometry(shape, 10)
    }),
    materials.ink,
  )
  tear.name = 'signature-tear'
  tear.position.set(0.087, -0.049, 0.174)
  head.add(star, tear)
}

function franklin(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  head.getObjectByName('manga-face')!.name = 'franklin-square-jaw'
  const creases = new THREE.Mesh(
    geometry(THREE, 'manga:franklin-face-creases', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.093, 0.0025).translate(0, 0.123, 0.173),
        new THREE.PlaneGeometry(0.075, 0.0025).translate(0, 0.145, 0.16),
        new THREE.PlaneGeometry(0.003, 0.07).rotateZ(0.17).translate(-0.12, -0.08, 0.174),
        new THREE.PlaneGeometry(0.003, 0.07).rotateZ(-0.17).translate(0.12, -0.08, 0.174),
      ]),
    ),
    glow(0x5a433b, 0.7),
  )
  creases.name = 'franklin-face-creases'
  head.add(creases)
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(
      geometry(THREE, 'manga:franklin-earlobe', () =>
        new THREE.SphereGeometry(1, 12, 8).scale(0.022, 0.08, 0.021),
      ),
      materials.skin,
    )
    lobe.name = 'franklin-long-earlobe'
    lobe.position.set(side * 0.186, -0.09, 0.004)
    const ring = new THREE.Mesh(
      geometry(THREE, 'manga:franklin-earring', () => new THREE.TorusGeometry(0.023, 0.005, 6, 18)),
      glow(0xb0a16c, 1),
    )
    ring.position.set(side * 0.186, -0.16, 0.013)
    head.add(lobe, ring)
  }
}

function kaiserBrows(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const old = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (old) old.visible = false
    for (const inner of [false, true]) {
      const brow = new THREE.Mesh(
        geometry(THREE, 'manga:kaiser-arched-brow', () => new THREE.PlaneGeometry(0.041, 0.006)),
        materials.ink,
      )
      brow.name = `kaiser-arched-brow-${side}-${inner ? 'inner' : 'outer'}`
      brow.position.set(side * (inner ? 0.05 : 0.084), 0.069, 0.176)
      brow.rotation.z = side * (inner ? 0.42 : -0.42)
      head.add(brow)
    }
  }
  const comb = new THREE.Mesh(
    geometry(THREE, 'manga:kaiser-combed-hair-lines', () => {
      const lines = []
      for (let i = 0; i < 6; i++)
        lines.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-0.105 + i * 0.028, 0.102, 0.17),
              new THREE.Vector3(-0.065 + i * 0.033, 0.164, 0.16),
              new THREE.Vector3(-0.01 + i * 0.035, 0.218, 0.09),
            ]),
            10,
            0.0015,
            4,
            false,
          ),
        )
      return mergeHumanDetails(lines)
    }),
    glow(0x55565c, 1),
  )
  comb.name = 'kaiser-combed-hair-lines'
  head.add(comb)
}

function sarahellGuardianFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const liner = new THREE.Mesh(
      geometry(THREE, 'manga:sarahell-outer-eyeliner', () => {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.lineTo(0.037, 0.006)
        shape.lineTo(0.046, 0.016)
        shape.lineTo(0.033, 0.011)
        shape.closePath()
        return new THREE.ShapeGeometry(shape)
      }),
      materials.ink,
    )
    liner.name = 'sarahell-outer-eyeliner'
    liner.position.set(side * 0.047, 0.018, 0.181)
    liner.scale.x = side
    head.add(liner)

    const fold = new THREE.Mesh(
      geometry(
        THREE,
        'manga:sarahell-nasolabial-fold',
        () =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0.012, 0),
              new THREE.Vector3(0.012, -0.006, 0.002),
              new THREE.Vector3(0.017, -0.036, 0),
              new THREE.Vector3(0.026, -0.06, -0.004),
            ]),
            10,
            0.0018,
            4,
            false,
          ),
      ),
      glow(0x765b50, 0.78),
    )
    fold.name = 'sarahell-nasolabial-fold'
    fold.position.set(side * 0.026, -0.025, 0.177)
    fold.scale.x = side
    head.add(fold)
  }
}

function maorAgeLines(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const lines = new THREE.Mesh(
    geometry(THREE, 'manga:maor-age-lines', () => {
      const parts = []
      for (let i = 0; i < 3; i++)
        parts.push(
          new THREE.PlaneGeometry(0.087 - i * 0.01, 0.0022).translate(
            0.012,
            0.143 + i * 0.018,
            0.176 - i * 0.004,
          ),
        )
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.052, 0.0024)
            .rotateZ(side * -0.15)
            .translate(side * 0.076, 0.016, 0.18),
        )
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.072)
            .rotateZ(side * -0.18)
            .translate(side * 0.112, -0.06, 0.174),
        )
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.061)
            .rotateZ(side * 0.22)
            .translate(side * 0.052, -0.078, 0.18),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x775f54, 0.76),
  )
  lines.name = 'maor-age-lines'
  head.add(lines)
}

const REFERENCE_FACES: Record<string, (build: HumanHeadBuild, head: Group) => void> = {
  kaiser: kaiserBrows,
  sarahell: sarahellGuardianFace,
  maor: maorAgeLines,
  shimanu: addShimanuHeadDetails,
  sakata: addSakataFace,
  keeney: addKeeneyFace,
  shikaku: addShikakuEarpiece,
  'sanbica-norton': addSanbicaMedicalHeadwear,
  tokarine: addTokarineFace,
  'oito-nephew-fake-woble': addFakeWobleFace,
  'queen-oito': addOitoFaceAndHair,
  'nasubi-hui-guo-rou': addNasubiRoyalFace,
  'unma-hui-guo-rou': addUnmaFaceAndHair,
  'duazul-hui-guo-rou': addDuazulGentleFaceAndWaves,
  'tang-zhao-li-hui-guo-rou': addTangZhaoLiPortraitFace,
  'prince-kacho': addTwinHairDetails,
  'prince-fugetsu': addTwinHairDetails,
  'prince-momoze': addMomozeElaboratePonytail,
  kurton: addKurtonAngularFace,
  longhi: addLonghiGauntFaceAndPonytail,
  'balsamilco-might': addBalsamilcoScarAndAge,
  babimyna: addBabimynaFadeAndEarpiece,
  vergei: addVergeiAngularFaceAndHair,
  vincent: addVincentShavenFaceAndEarpiece,
  saquelle: addSaquelleFace,
  orau: addOrauFaceAndEarpiece,
  kanjidol: addKanjidolRoundFace,
  'kakin-announcer': addKakinAnnouncerCatFace,
  cleapatro: addCleapatroEgyptianHeaddress,
  peuckert: addPeuckertFaceAndHair,
  steiner: addSteinerHazelEyesAndHair,
  'worio-bay': addWorioBaySquareFace,
}

export function addMangaFaceTraits(build: HumanHeadBuild, head: Group): void {
  const id = build.profile.likeness ?? ''
  if (id === 'hisoka' && build.profile.hairStyle !== 'bob') facePaint(build, head)
  if (id === 'melody') addMelodySoftFeatures(build, head)
  if (id === 'franklin-bordeau') franklin(build, head)
  REFERENCE_FACES[id]?.(build, head)
  addMangaFacialHair(build, head)
  addBenjaminDetails(build, head)
  addUnderworldFaceDetails(build, head)
  addPadailleFace(build, head)
  addHeillyReferenceFace(build, head)
  addGelFace(build, head)
  addBodyguardFaces(build, head)
  if (id === 'prince-tubeppa') addTubeppaFace(build, head)
  if (id === 'prince-marayam') addMarayamFace(build, head)
  if (id === 'cheadle-yorkshire') {
    const nose = head.getObjectByName('face-relief') as Mesh
    nose.material = build.materials.ink
    nose.scale.set(1.6, 0.65, 0.6)
  }
}
