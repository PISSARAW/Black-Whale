import * as THREE from 'three'
import type { VoconteLayout } from './voconteTrack'

function beam() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x33424a }),
  )
}
/** B is bolted to a real platform with a floor, return path and supports. */
export function createVoconteGantry() {
  const root = new THREE.Group(),
    deck = beam()
  const columns = Array.from({ length: 4 }, beam),
    rails = Array.from({ length: 3 }, beam)
  const rungs = Array.from({ length: 12 }, beam)
  root.add(deck, ...columns, ...rails, ...rungs)
  return {
    root,
    sync(layout: VoconteLayout) {
      const { b, width: w, elevation: y } = layout
      root.position.x = b
      deck.position.set(-0.4, y - 0.08, 0)
      deck.scale.set(1.2, 0.16, w * 2.3)
      columns.forEach((column, i) => {
        column.position.set(i < 2 ? -0.9 : 0.12, y / 2, (i % 2 ? 1 : -1) * w)
        column.scale.set(0.1, y, 0.1)
      })
      rails.forEach((rail, i) => {
        rail.position.set(-0.45, y + 0.55, -w * 1.1)
        rail.scale.set(i === 0 ? 1.2 : 0.05, i === 0 ? 0.045 : 1.1, 0.05)
        if (i > 0) rail.position.x = i === 1 ? -0.95 : 0.12
      })
      rungs.forEach((rung, i) => {
        rung.position.set(-0.9, (y * (i + 1)) / 13, -w * 1.15)
        rung.scale.set(0.45, 0.04, 0.04)
      })
    },
  }
}
