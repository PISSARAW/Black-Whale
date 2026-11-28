import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

function addNobunagaMoustache(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  const moustache = new THREE.Mesh(
    geometry(THREE, 'manga:nobunaga-fine-moustache', () =>
      mergeHumanDetails(
        [-1, 1].map(
          (side) =>
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(side * 0.004, -0.092, 0.165),
                new THREE.Vector3(side * 0.023, -0.094, 0.163),
                new THREE.Vector3(side * 0.046, -0.103, 0.154),
              ]),
              12,
              0.0032,
              5,
              false,
            ),
        ),
      ),
    ),
    materials.hairInk,
  )
  moustache.name = 'nobunaga-fine-moustache'
  head.add(moustache)
}

function addVoconteEyeBags(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const bags = new THREE.Mesh(
    geometry(THREE, 'manga:voconte-under-eye-creases', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.TorusGeometry(0.033, 0.0019, 6, 24, Math.PI * 0.8)
            .rotateZ(Math.PI * 1.1)
            .scale(1, 0.44, 1)
            .translate(side * 0.065, -0.019, 0.171),
        ),
      ),
    ),
    glow(0x806759, 0.8),
  )
  bags.name = 'voconte-under-eye-creases'
  head.add(bags)
}

export function addBlackWhaleFaceDetails(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness === 'nobunaga-hazama') addNobunagaMoustache(build, head)
  if (build.profile.likeness === 'voconte') addVoconteEyeBags(build, head)
}
