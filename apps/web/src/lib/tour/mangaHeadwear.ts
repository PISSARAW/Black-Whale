import { addFeitanScarf } from './mangaFeitanHead'
import { addSaiyuHead } from './mangaSaiyuHead'
import { addCluckHeaddress } from './mangaCluckHead'
import { addMizaistomHead } from './mangaMizaistomHead'
import { addHunterHeadDetails } from './mangaHunterDetails'
import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'

export function addMangaHeadwear(build: HumanHeadBuild, head: Group): void {
  const id = build.profile.likeness
  addHunterHeadDetails(build, head)
  addMizaistomHead(build, head)
  addCluckHeaddress(build, head)
  addSaiyuHead(build, head)
  if (id === 'feitan-portor') addFeitanScarf(build, head)
  if (id === 'chrollo-lucilfer') {
    const { THREE, geometry, glow } = build
    const band = new THREE.Mesh(
      geometry(THREE, 'manga:chrollo-white-headband', () =>
        new THREE.CylinderGeometry(0.184, 0.185, 0.085, 32, 1, true).scale(1, 1, 1.09),
      ),
      glow(0xe9ede9, 1),
    )
    band.name = 'chrollo-white-headband'
    band.position.y = 0.106
    head.add(band)
  }
  if (id === 'kalluto-zoldyck') {
    const { THREE, geometry, glow } = build
    const shine = new THREE.Mesh(
      geometry(THREE, 'manga:kalluto-hair-sheen', () => new THREE.PlaneGeometry(0.28, 0.018)),
      glow(0x82749e, 1),
    )
    shine.position.set(0, 0.115, 0.198)
    shine.name = 'kalluto-hair-sheen'
    head.add(shine)
  }
  if (id === 'machi-komacine') {
    const { THREE, geometry, glow } = build
    const band = new THREE.Mesh(
      geometry(THREE, 'manga:machi-hair-band', () =>
        new THREE.TorusGeometry(0.117, 0.012, 6, 24).rotateX(Math.PI / 2).scale(1, 1, 0.6),
      ),
      glow(0x75aeba, 1),
    )
    band.name = 'machi-hair-band'
    band.position.set(0, 0.225, -0.035)
    head.add(band)
  }
}
