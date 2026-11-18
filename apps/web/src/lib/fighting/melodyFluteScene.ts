import { hasMelodyFlute } from './melodyRules'
import { createVisitScenePool } from './visitSceneKit'
import { fineControlReduced } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Object3D } from 'three'

/** The native rig shares its flute; a borrower must bring the actual instrument. */
export function createMelodyFluteScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  function syncSide(state: FightState, side: FightSide) {
    const fighter = state[side]
    const signature = options.figureOf?.(side)?.getObjectByName('signature-flute')
    const equipped = hasMelodyFlute(fighter)
    if (signature) signature.visible = equipped
    if (!equipped || !fighter.melodyPerformance) return
    const beat = fineControlReduced(options)
      ? 0
      : Math.sin(fighter.melodyPerformance.playingFrames / 18) * 0.012
    if (signature) {
      signature.rotation.z = Math.PI / 2 + beat
      return
    }
    const flute = pool.get(`melody-borrowed-flute:${side}`, {
      model: 'melody-flute',
      fit: { width: 0.6 },
    })
    placeBorrowedFlute(options, { state, side, root: flute.root })
    flute.root.rotateZ(beat)
  }
  return {
    sync(state) {
      pool.hide()
      syncSide(state, 'player')
      syncSide(state, 'opponent')
    },
    dispose: pool.dispose,
  }
}
function placeBorrowedFlute(
  options: EffectSceneOptions,
  c: { state: FightState; side: FightSide; root: Object3D },
) {
  const figure = options.figureOf?.(c.side)
  let head: Object3D | undefined
  figure?.traverse((part) => {
    if (part.name.startsWith('manga-head:')) head = part
  })
  if (head) {
    c.root.position.copy(head.localToWorld(new options.THREE.Vector3(-0.15, -0.08, 0.17)))
    head.getWorldQuaternion(c.root.quaternion)
  } else {
    c.root.position.set(
      options.worldX(c.state[c.side].x),
      options.worldY(c.state[c.side].y) + 1.58,
      0.3,
    )
    c.root.rotation.set(0, c.state[c.side].facing * 0.5, 0)
  }
  c.root.rotateZ(Math.PI / 2)
}
