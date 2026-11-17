import { CatmullRomCurve3, Mesh, MeshBasicMaterial, TubeGeometry, Vector3 } from 'three'
import type { Scene } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { fightWorldX, fightWorldY } from '../../src/lib/fighting/fightCoordinates'

const pink = new MeshBasicMaterial({ color: 0xf28cce, transparent: true, opacity: 0.92 })

/** A close-up strand follows the real hand and the native target; it changes no attachment rule. */
export function presentVictoryTether(scene: Scene, state: FightState) {
  if (!state.bungeeGum) return () => {}
  const native = scene.getObjectByName('hisoka-bungee-gum')!
  const visible = native.visible
  native.visible = false
  const head = scene.getObjectByName('manga-head:hisoka')!
  const root = scene.children.find((node) => node.getObjectByName(head.name) === head)!
  const hand = root.getObjectByName('hand-right')!
  const a = hand.getWorldPosition(new Vector3()).add(new Vector3(0, 0.015, 0.025))
  const target = state[state.bungeeGum.target]
  const b = new Vector3(fightWorldX(target.x), fightWorldY(target.y) + 1.15, 0.28)
  const middle = a.clone().lerp(b, 0.5)
  middle.y -= state.bungeeGum.retracting ? 0.015 : 0.065
  const strand = new Mesh(
    new TubeGeometry(new CatmullRomCurve3([a, middle, b]), 40, 0.012, 8, false),
    pink,
  )
  strand.name = 'hisoka-victory-fine-tether'
  scene.add(strand)
  strand.updateMatrixWorld(true)
  return () => {
    native.visible = visible
    scene.remove(strand)
    strand.geometry.dispose()
  }
}
