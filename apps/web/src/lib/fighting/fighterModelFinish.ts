import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'
import { mangaLikeness, type MangaEyes } from '$lib/tour/mangaLikeness'
import { mergeHumanDetails } from '$lib/tour/humanDetailGeometry'

type Three = HumanFigureBuild['THREE']
interface FinishOptions {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
  profile: HumanProfile
}
const CACHE = new WeakMap<Three, Map<string, BufferGeometry>>()
const EYE_HEIGHT: Record<MangaEyes, number> = {
  almond: 0.023,
  round: 0.033,
  narrow: 0.012,
  doll: 0.038,
  heavy: 0.016,
}

function geometry(THREE: Three, key: string, make: () => BufferGeometry): BufferGeometry {
  let cache = CACHE.get(THREE)
  if (!cache) {
    cache = new Map()
    CACHE.set(THREE, cache)
  }
  const held = cache.get(key)
  if (held) return held
  const made = make()
  made.userData.sharedHuman = true
  cache.set(key, made)
  return made
}

/** Close-up finish follows the same head and eye joints in portraits and the live duel. */
export function finishFightModel(options: FinishOptions): void {
  const { model, profile } = options
  // Kurapika already has a separate detailed head. Do not cover its authored contours.
  if (!profile.likeness || profile.likeness === 'kurapika') return
  const eye = model.root.getObjectByName('face-eye-left')
  if (!eye?.parent) return
  const head = eye.parent as Group
  finishEyes(options)
  // Bandages and the high skull collar are physical occluders, not skin.
  if (!['bonolenov-ndongo', 'feitan-portor'].includes(profile.likeness)) finishFace(options, head)
}

function finishEyes({ THREE, glow, model, profile }: FinishOptions): void {
  const look = mangaLikeness(profile)
  const h = EYE_HEIGHT[look.eyes]
  for (const side of ['left', 'right']) {
    const eye = model.root.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    const lid = new THREE.Mesh(
      geometry(THREE, `clash:eyelids:${look.eyes}`, () => {
        const curves = [
          [
            [-0.031, h * 0.8],
            [-0.012, h * 1.55],
            [0.015, h * 1.45],
            [0.031, h * 0.6],
          ],
          [
            [-0.023, -h * 0.82],
            [0, -h * 1.04],
            [0.025, -h * 0.7],
          ],
        ]
        return mergeHumanDetails(
          curves.map(
            (points) =>
              new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0.003))),
                12,
                0.0011,
                4,
                false,
              ),
          ),
        )
      }),
      glow(0x6c554d, 1),
    )
    lid.name = 'clash-eyelid-contours'
    eye.add(lid)
    // Illumi's empty black gaze is intentional and remains featureless.
    if (profile.likeness === 'illumi') continue
    const iris = eye.getObjectByName('eye-pupil') as Mesh | undefined
    if (!iris) continue
    const radius = h * 0.66
    const detail = new THREE.Mesh(
      geometry(THREE, `clash:iris:${look.eyes}`, () => {
        const parts: BufferGeometry[] = [new THREE.CircleGeometry(radius * 0.44, 16)]
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6
          parts.push(
            new THREE.PlaneGeometry(radius * 0.055, radius * 0.26)
              .translate(0, radius * 0.7, 0)
              .rotateZ(angle),
          )
        }
        return mergeHumanDetails(parts)
      }),
      glow(0x625950, 1),
    )
    detail.name = 'clash-iris-fibres'
    detail.position.z = 0.0005
    // The pupil remains darker than the iris fibres; existing catchlights stay above it.
    const pupil = new THREE.Mesh(
      geometry(THREE, `clash:pupil:${look.eyes}`, () => new THREE.CircleGeometry(radius * 0.4, 16)),
      glow(0x171318, 1),
    )
    pupil.name = 'clash-pupil-core'
    pupil.position.z = 0.0008
    iris.add(detail, pupil)
  }
}

function finishFace(options: FinishOptions, head: Group): void {
  const { THREE, glow, profile } = options
  const look = mangaLikeness(profile)
  const key = `${profile.likeness}:${profile.frame}`
  const skinShade = new THREE.Color(profile.skin).multiplyScalar(0.78).getHex()
  const relief = new THREE.Mesh(
    geometry(THREE, `clash:face-relief:${key}`, () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        // Inner ear concha, inside the existing ear; no new silhouette or accessories.
        parts.push(
          new THREE.TorusGeometry(0.009, 0.0018, 4, 12, Math.PI * 1.45)
            .scale(1, 1.65, 1)
            .rotateZ(side * 0.3)
            .translate(side * (look.cheek + 0.006), -0.027, 0.016),
        )
        // Nose wings follow the existing nose's width instead of adding a new nose.
        parts.push(
          new THREE.PlaneGeometry(0.007 * look.nose, 0.0016)
            .rotateZ(side * 0.16)
            .translate(side * 0.009 * look.nose, -0.059, 0.179),
        )
      }
      const mouthRadius = look.jaw + (look.cheek * 0.88 - look.jaw) * 0.4
      parts.push(
        new THREE.PlaneGeometry(look.mouth * 0.56, 0.0015).translate(
          0,
          -0.12,
          Math.min(0.171, mouthRadius * 1.32) + 0.003,
        ),
      )
      return mergeHumanDetails(parts)
    }),
    glow(skinShade, 1),
  )
  relief.name = 'clash-face-contours'
  head.add(relief)
}
