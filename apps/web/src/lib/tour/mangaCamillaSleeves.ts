import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addCamillaSleeves(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'prince-camilla') return
  const { THREE, geometry, glow, profile } = build
  const puff = geometry(THREE, 'manga:camilla-puff-sleeve', () =>
    new THREE.SphereGeometry(1, 20, 14).scale(0.077, 0.12, 0.073),
  )
  const gathers = geometry(THREE, 'manga:camilla-sleeve-gathers', () => {
    const parts = []
    for (let i = 0; i < 7; i++)
      parts.push(
        new THREE.TorusGeometry(0.041 - i * 0.0015, 0.004, 6, 24)
          .rotateX(Math.PI / 2)
          .translate(0, -0.06 - i * 0.035, 0),
      )
    return mergeHumanDetails(parts)
  })
  for (let i = 0; i < 2; i++) {
    const shoulder = new THREE.Mesh(puff, glow(profile.jacket, 1))
    shoulder.position.y = -0.08
    shoulder.name = 'camilla-puff-sleeve'
    limbs.arms[i].add(shoulder)
    const sleeve = new THREE.Mesh(gathers, glow(profile.shirt, 1))
    sleeve.name = 'camilla-ruched-sleeve'
    limbs.elbows[i].add(sleeve)
  }
}
