import { addFeitanBoots } from './mangaFeitanClothes'
import { addMarayamShorts } from './mangaMarayamClothes'
import { addZhangLeiLimbs } from './mangaZhangLeiLimbs'
import { addMorenaSleevesAndBoots } from './mangaMorenaClothes'
import { addLuzurusLimbs } from './mangaLuzurusLimbs'
import { addSalesaleSleevesAndBoots } from './mangaSalesaleLimbs'
import { addSaiyuLimbs } from './mangaSaiyuLimbs'
import { addCluckLimbCostume } from './mangaCluckLimbs'
import type { Group, Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { shapeGelShoulders } from './mangaGel'
import { addMizaistomCowLimbs } from './mangaMizaistomClothes'
import { addHeillyReferenceLimbs } from './mangaHeillyClothes'
import { shapePadailleSleeves } from './mangaPadaille'
import { shapeMelodyLimbs } from './mangaMelody'
import { addBiscuitLimbClothes } from './mangaBiscuitLimbs'
import { addUnderworldLimbClothes } from './mangaUnderworldLimbs'
import { addRoyalMilitaryLimbDetails } from './mangaRoyalMilitaryLimbs'
import { addZoldyckLimbClothes } from './mangaZoldyckLimbs'
import { addMangaReferenceLimbs } from './mangaReferenceLimbs'
import { addCamillaSleeves } from './mangaCamillaSleeves'
import { kurapikaShoeGeometry } from './kurapikaGeometry'

function machi(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, profile, glow } = build
  const colour = new THREE.Color(profile.hair).lerp(new THREE.Color(0xa894dd), 0.5).getHex()
  for (let i = 0; i < 2; i++) {
    const shorts = new THREE.Mesh(
      geometry(
        THREE,
        'manga:machi-shorts',
        () => new THREE.CylinderGeometry(0.075, 0.069, 0.22, 20),
      ),
      glow(profile.trousers, 1),
    )
    shorts.position.y = -0.065
    limbs.legs[i].add(shorts)
    const warmer = new THREE.Mesh(
      geometry(
        THREE,
        'manga:machi-leg-warmer',
        () =>
          new THREE.LatheGeometry(
            [
              new THREE.Vector2(0.07, -0.43),
              new THREE.Vector2(0.08, -0.37),
              new THREE.Vector2(0.064, -0.3),
              new THREE.Vector2(0.073, -0.15),
              new THREE.Vector2(0.062, -0.03),
            ],
            24,
          ),
      ),
      glow(colour, 1),
    )
    warmer.name = 'machi-leg-warmer'
    limbs.knees[i].add(warmer)
    const shoulder = limbs.arms[i]
    shoulder.children[0].scale.y *= 0.46
    shoulder.children[0].position.y = -0.075
    const bareArm = new THREE.Mesh(
      geometry(
        THREE,
        'manga:machi-upper-arm',
        () => new THREE.CylinderGeometry(0.041, 0.033, 0.245, 16),
      ),
      glow(profile.skin, 1),
    )
    bareArm.position.y = -0.195
    shoulder.add(bareArm)
    ;((limbs.elbows[i].children[0] as Group).children[1] as Mesh).material = glow(profile.skin, 1)
    const glove = new THREE.Mesh(
      geometry(
        THREE,
        'manga:machi-glove',
        () => new THREE.CylinderGeometry(0.036, 0.037, 0.09, 16),
      ),
      glow(profile.trousers, 1),
    )
    glove.position.y = -0.267
    limbs.elbows[i].add(glove)
  }
}

function finishShoes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry } = build
  const shape = geometry(THREE, 'manga:shoes', () => kurapikaShoeGeometry(THREE))
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    const sole = shoe.getObjectByName('shoe-sole-and-toecap')
    // Bare feet deliberately omit shoe details and must retain their own shape.
    if (!sole) continue
    shoe.children.slice(0, 2).forEach((node) => {
      ;(node as Mesh).geometry = shape
    })
    sole.visible = false
  }
}

const REFERENCE_LIMBS: Record<string, (build: HumanLimbsBuild, limbs: HumanLimbs) => void> = {
  'prince-salesale': addSalesaleSleevesAndBoots,
  'prince-luzurus': addLuzurusLimbs,
  'prince-marayam': addMarayamShorts,
  'prince-zhanglei': addZhangLeiLimbs,
  'morena-prudo': addMorenaSleevesAndBoots,
}

export function shapeMangaLimbs(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { profile, THREE } = build
  if (!profile.likeness || profile.likeness === 'kurapika') return
  const slim = profile.build === 'slim'
  for (let i = 0; i < 2; i++) {
    const scale = slim ? 0.84 : 0.96
    limbs.arms[i].children[0].scale.multiply(new THREE.Vector3(scale, 1, scale))
    limbs.arms[i].children[2].scale.multiply(new THREE.Vector3(0.79, 0.82, 0.79))
    limbs.elbows[i].children[0].scale.multiply(new THREE.Vector3(scale, 1, scale))
    limbs.legs[i].position.x *= slim ? 0.88 : 1
    const cuff = limbs.elbows[i].getObjectByName('sleeve-cuff')!
    cuff.visible = profile.clothing === 'suit' || profile.clothing === 'uniform'
  }
  finishShoes(build, limbs)
  kimonoSleeves(build, limbs)
  if (profile.likeness === 'machi-komacine') machi(build, limbs)
  colourShoes(build, limbs)
  hoodieSilhouette(build, limbs)
  addMangaReferenceLimbs(build, limbs)
  addZoldyckLimbClothes(build, limbs)
  addRoyalMilitaryLimbDetails(build, limbs)
  addCamillaSleeves(build, limbs)
  addUnderworldLimbClothes(build, limbs)
  addBiscuitLimbClothes(build, limbs)
  shapeMelodyLimbs(build, limbs)
  shapePadailleSleeves(build, limbs)
  addHeillyReferenceLimbs(build, limbs)
  addMizaistomCowLimbs(build, limbs)
  shapeGelShoulders(build, limbs)
  addCluckLimbCostume(build, limbs)
  addSaiyuLimbs(build, limbs)
  addFeitanBoots(build, limbs)
  REFERENCE_LIMBS[profile.likeness]?.(build, limbs)
}

function colourShoes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const colours: Record<string, number> = {
    'shizuku-murasaki': 0x287f7c,
    'machi-komacine': 0xeeeae1,
    'franklin-bordeau': 0x5d533f,
    'prince-camilla': 0xd8cfbf,
  }
  const colour = colours[build.profile.likeness ?? '']
  if (colour === undefined) return
  for (const knee of limbs.knees)
    (knee.children[1].children[1] as Mesh).material = build.glow(colour, 1)
}

function kimonoSleeves(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.clothing !== 'kimono') return
  const { THREE, geometry, glow, profile } = build
  for (const arm of limbs.arms) {
    const kalluto = profile.likeness === 'kalluto-zoldyck'
    const sleeve = new THREE.Mesh(
      geometry(THREE, kalluto ? 'manga:kalluto-long-kimono-sleeve' : 'manga:kimono-sleeve', () => {
        if (!kalluto) return new THREE.BoxGeometry(0.15, 0.29, 0.16)
        const shape = new THREE.Shape()
        shape.moveTo(-0.1, 0.1)
        shape.lineTo(0.1, 0.1)
        shape.lineTo(0.13, -0.46)
        shape.quadraticCurveTo(0.02, -0.59, -0.1, -0.49)
        shape.closePath()
        return new THREE.ExtrudeGeometry(shape, {
          depth: 0.13,
          bevelEnabled: true,
          bevelSize: 0.004,
          bevelThickness: 0.004,
          bevelSegments: 1,
        }).translate(0, 0, -0.065)
      }),
      glow(profile.jacket, 1),
    )
    sleeve.position.y = -0.2
    sleeve.name = 'kimono-draped-sleeve'
    arm.add(sleeve)
  }
}

function hoodieSilhouette(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'prince-tserriednich') return
  const { THREE } = build
  for (let i = 0; i < 2; i++) {
    limbs.arms[i].children[0].scale.multiply(new THREE.Vector3(1.35, 1, 1.35))
    limbs.arms[i].children[2].scale.multiply(new THREE.Vector3(1.15, 1, 1.15))
    limbs.elbows[i].children[0].scale.multiply(new THREE.Vector3(1.4, 1, 1.4))
    limbs.legs[i].children[0].scale.multiply(new THREE.Vector3(1.5, 1, 1.3))
    limbs.knees[i].children[0].scale.multiply(new THREE.Vector3(1.3, 1, 1.25))
  }
}
