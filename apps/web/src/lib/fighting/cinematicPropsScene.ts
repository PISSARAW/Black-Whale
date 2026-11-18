import { holdBashoPaper, poseBashoWritingHand } from './bashoWritingPose'
import { bashoInk, poseBashoPen } from './bashoWritingPresentation'
import { fineControlReduced } from './fineControlAnchors'
import { placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Readable physical staging for already simulated writing and console states. No extra ability. */
export function createCinematicPropsScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const geometry = new THREE.PlaneGeometry(0.68, 0.4)
  const penGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.27, 6)
  const penMaterial = new THREE.MeshBasicMaterial({ color: 0x211622 })
  function build(side: FightSide, kind: 'poem' | 'console') {
    const canvas = typeof document === 'undefined' ? null : document.createElement('canvas')
    if (canvas) {
      canvas.width = 768
      canvas.height = 448
    }
    const context = canvas?.getContext('2d')
    const texture = canvas ? new THREE.CanvasTexture(canvas) : null
    if (texture) texture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const root = new THREE.Group()
    root.name = kind === 'poem' ? `basho-poem:${side}` : `combo-master:${side}`
    root.add(new THREE.Mesh(geometry, material))
    const pen = new THREE.Mesh(penGeometry, penMaterial)
    pen.name = kind === 'poem' ? `basho-pen:${side}` : ''
    pen.position.set(0.28, 0.05, 0.04)
    pen.rotation.z = -0.4
    pen.visible = kind === 'poem'
    root.add(pen)
    scene.add(root)
    let text = ''
    return {
      side,
      kind,
      root,
      pen,
      dispose() {
        root.removeFromParent()
        material.dispose()
        texture?.dispose()
      },
      write(lines: string[]) {
        const value = lines.join('\n')
        if (value === text || !context || !texture) return
        text = value
        context.fillStyle = kind === 'poem' ? '#f1e4be' : '#111d2a'
        context.fillRect(0, 0, 768, 448)
        context.strokeStyle = kind === 'poem' ? '#745233' : '#8acbe7'
        context.lineWidth = 8
        context.strokeRect(12, 12, 744, 424)
        context.fillStyle = kind === 'poem' ? '#211622' : '#e5f7ff'
        context.font = 'bold 36px monospace'
        lines.forEach((line, index) => context.fillText(line, 35, 68 + index * 66, 698))
        texture.needsUpdate = true
      },
    }
  }
  const props = (['player', 'opponent'] as const).flatMap((side) => [
    build(side, 'poem'),
    build(side, 'console'),
  ])
  function syncProp(prop: ReturnType<typeof build>, state: FightState) {
    const f = state[prop.side]
    prop.root.visible =
      prop.kind === 'poem'
        ? Boolean(f.bashoPoem)
        : Boolean(f.comboMaster && prop.side === (options.viewer?.() ?? 'player'))
    if (!prop.root.visible) return
    placeVisitHand(options, { state, side: prop.side, root: prop.root, hand: 'left' })
    prop.root.position.z += 0.25
    prop.root.rotation.set(-0.12, 0, -0.08 * f.facing)
    if (prop.kind === 'poem') {
      holdBashoPaper(options, { state, side: prop.side, root: prop.root })
      poseBashoPen(prop.pen, f.bashoPoem!, fineControlReduced(options))
      if (prop.pen.visible) poseBashoWritingHand(options, { side: prop.side, pen: prop.pen })
      prop.root.userData.inkProgress = bashoInk(f.bashoPoem!).progress
    }
    prop.write(prop.kind === 'poem' ? poemLines(state, prop.side) : consoleLines(state, prop.side))
  }
  return {
    sync(state) {
      for (const prop of props) syncProp(prop, state)
    },
    dispose() {
      props.forEach((prop) => prop.dispose())
      geometry.dispose()
      penGeometry.dispose()
      penMaterial.dispose()
    },
  }
}
function poemLines(state: FightState, side: FightSide): string[] {
  return bashoInk(state[side].bashoPoem!).lines
}
function consoleLines(state: FightState, side: FightSide): string[] {
  const alert = state[side].comboMaster?.alert
  if (!alert) return ['COMBO MASTER', '---']
  return [
    'COMBO MASTER',
    alert.incoming ? '!' : '---',
    alert.signature ?? '?',
    alert.affected.join(' / '),
  ]
}
