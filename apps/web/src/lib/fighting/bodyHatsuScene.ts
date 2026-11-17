import { createBodyHatsuClock, type BodyHatsuFrame } from './bodyHatsuPresentation'
import { fineControlEase, fineControlReduced } from './fineControlAnchors'
import { placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Short material accents on the anatomical right hand; the rig owns the arm and tools. */
export function createBodyHatsuScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createBodyHatsuClock()
  const geometry = new THREE.TorusGeometry(0.115, 0.008, 5, 20)
  const accents = (['player', 'opponent'] as const).map((side) => {
    const material = new THREE.MeshBasicMaterial({
      color: 0xc9daa4,
      transparent: true,
      depthWrite: false,
    })
    const ring = new THREE.Mesh(geometry, material)
    ring.name = `body-hatsu:${side}`
    scene.add(ring)
    return { side, ring, material }
  })
  return {
    sync(state) {
      const frames = clock(state)
      for (const { side, ring, material } of accents) {
        const frame = frames[side]
        const age = frame.gel ?? frame.tool
        ring.userData.events = frame
        ring.visible =
          age !== null && !fineControlReduced(options) && options.comfort?.().flashes !== false
        if (age !== null) {
          placeVisitHand(options, { state, side, root: ring, hand: 'right', wrist: true })
          ring.rotateX(Math.PI / 2)
          ring.scale.setScalar(0.6 + fineControlEase(age / 18) * 0.5)
          material.color.setHex(frame.gel !== null ? 0xc9daa4 : 0xd1d5dc)
          material.opacity = Math.sin((Math.PI * (age + 1)) / 19) * 0.45
        }
        poseSelectedTool(options, { state, side, frame })
      }
    },
    dispose() {
      for (const { ring, material } of accents) {
        ring.removeFromParent()
        material.dispose()
      }
      geometry.dispose()
    },
  }
}
function poseSelectedTool(
  options: EffectSceneOptions,
  c: { state: FightState; side: FightSide; frame: BodyHatsuFrame },
) {
  const figure = options.figureOf?.(c.side)
  if (!figure) return
  const reduced = fineControlReduced(options)
  for (const name of ['hammer', 'drill', 'axe']) {
    const tool = figure.getObjectByName(`padaille-${name}-right-hand`)
    if (!tool) continue
    const age = name === c.frame.selected ? c.frame.tool : null
    tool.scale.setScalar(reduced || age === null ? 1 : 0.72 + fineControlEase(age / 18) * 0.28)
  }
  spinDrill(figure, c.state.frame, reduced)
}
function spinDrill(figure: import('three').Object3D, frame: number, reduced: boolean) {
  const drill = figure.getObjectByName('padaille-drill-right-hand')
  if (!drill) return
  const hand = figure.getObjectByName('hand-right')
  drill.rotation.y = (hand?.rotation.y ?? 0) + (reduced ? 0 : (frame / 60) * 22)
}
