import { PerspectiveCamera, Scene, Vector3 } from 'three'
import { fightWorldX, fightWorldY } from '../../src/lib/fighting/fightCoordinates'
import type { FightState } from '../../src/lib/fighting/types'

/** Read-only projection audit of the production main camera; never edits a camera or a pose. */
export function observeFraming(
  current: () => { state: FightState; frame: number; chapter: number },
) {
  const samples = new Set<string>()
  const outside: Array<{ chapter: number; frame: number; side: string; x: number; y: number }> = []
  const missingActors: Array<{ chapter: number; frame: number; side: string }> = []
  const companions = new Set<string>()
  Scene.prototype.onBeforeRender = function (renderer, scene, camera) {
    if (
      !(camera instanceof PerspectiveCamera) ||
      scene.userData.fightView === 'prediction' ||
      renderer.getScissorTest() ||
      !scene.getObjectByName('fight-collision-boxes')
    )
      return
    const c = current()
    const beast = scene.children.find(
      (node) => node.visible && node.name.startsWith('tserriednich-personal-beast:'),
    )
    if (beast) companions.add(beast.name)
    const key = `${c.chapter}:${c.frame}:${camera.aspect.toFixed(3)}`
    if (samples.has(key)) return
    samples.add(key)
    for (const side of ['player', 'opponent'] as const) {
      const f = c.state[side]
      if (!scene.children.some((node) => node.userData.fightSide === side && node.visible))
        missingActors.push({ chapter: c.chapter, frame: c.frame, side })
      const x = f.hanzoProjection?.bodyX ?? f.x
      const y = f.hanzoProjection ? 0 : f.y
      const height = f.id === 'biscuit' ? 2.8 : 2.22
      for (const dx of [-0.55, 0.55])
        for (const dy of [0, height]) {
          const p = new Vector3(fightWorldX(x) + dx, fightWorldY(y) + dy, 0).project(camera)
          if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1)
            outside.push({ chapter: c.chapter, frame: c.frame, side, x: p.x, y: p.y })
        }
    }
  }
  return () => ({
    mainCameraFrames: samples.size,
    actorEnvelopeOutsideViewport: outside,
    missingActors,
    companions: [...companions],
  })
}
