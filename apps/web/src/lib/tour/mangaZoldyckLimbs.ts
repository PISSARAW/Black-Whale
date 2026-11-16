import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

function sandals(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (const knee of limbs.knees) {
    const foot = knee.children[1]
    const bare = geometry(THREE, 'manga:travel-bare-foot', () =>
      new THREE.SphereGeometry(1, 16, 10).scale(0.046, 0.027, 0.113).translate(0, 0.002, 0.01),
    )
    foot.children.slice(0, 2).forEach((node) => {
      ;(node as Mesh).geometry = bare
    })
    ;(foot.children[1] as Mesh).material = glow(profile.skin, 1)
    const straps = new THREE.Mesh(
      geometry(THREE, 'manga:travel-sandal-straps', () =>
        mergeHumanDetails([
          new THREE.BoxGeometry(0.1, 0.014, 0.25).translate(0, -0.04, 0.01),
          new THREE.BoxGeometry(0.095, 0.014, 0.025).translate(0, 0.028, 0.075),
          new THREE.BoxGeometry(0.095, 0.014, 0.025).translate(0, 0.028, 0.015),
          new THREE.BoxGeometry(0.095, 0.014, 0.025).translate(0, 0.028, -0.05),
        ]),
      ),
      glow(0x4b4941, 1),
    )
    straps.name = 'zoldyck-sandals'
    foot.add(straps)
  }
}

function illumi(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    limbs.legs[i].children[0].scale.x *= 1.23
    limbs.knees[i].children[0].scale.x *= 1.45
    const motif = geometry(THREE, 'manga:illumi-trouser-flames', () => {
      const parts = []
      for (let flame = -1; flame <= 1; flame++) {
        const points = [
          new THREE.Vector3(flame * 0.035, -0.22, 0.073),
          new THREE.Vector3(flame * 0.035 + 0.018, -0.08, 0.073),
          new THREE.Vector3(flame * 0.035 - 0.018, 0.035, 0.073),
          new THREE.Vector3(flame * 0.035 + 0.008, 0.16, 0.073),
        ]
        parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.0018, 5, false))
      }
      return mergeHumanDetails(parts)
    })
    const thigh = new THREE.Mesh(motif, glow(profile.accent, 1))
    thigh.position.y = -0.2
    limbs.legs[i].add(thigh)
    const shin = new THREE.Mesh(motif, glow(profile.accent, 1))
    shin.position.y = -0.21
    limbs.knees[i].add(shin)
    const bracelets = new THREE.Mesh(
      geometry(THREE, 'manga:illumi-wrist-bands', () =>
        mergeHumanDetails([
          new THREE.CylinderGeometry(0.039, 0.039, 0.012, 20).translate(0, -0.24, 0),
          new THREE.CylinderGeometry(0.039, 0.039, 0.012, 20).translate(0, -0.266, 0),
        ]),
      ),
      glow(profile.accent, 1),
    )
    bracelets.name = 'illumi-wrist-bands'
    limbs.elbows[i].add(bracelets)
  }
}

export function addZoldyckLimbClothes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const id = build.profile.likeness
  if (!['illumi', 'kalluto-zoldyck', 'beyond-netero'].includes(id ?? '')) return
  sandals(build, limbs)
  if (id === 'illumi') illumi(build, limbs)
}
