import { bashoInk, poseBashoPen } from './bashoWritingPresentation'
import { holdBashoPaper, poseBashoWritingHand } from './bashoWritingPose'
import { fineControlReduced } from './fineControlAnchors'
import { sleepingBody } from './hanzoProjection'
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
    pen.name = kind === 'poem' ? `basho-brush:${side}` : `combo-stylus:${side}`
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
  function propVisible(prop: ReturnType<typeof build>, state: FightState): boolean {
    const actor = state[prop.side]
    if (prop.kind === 'poem') return Boolean(actor.bashoPoem || actor.bashoArchive?.length)
    return Boolean(actor.comboMaster && prop.side === (options.viewer?.() ?? 'player'))
  }
  const rightPoint = new THREE.Vector3()
  function placePoem(prop: ReturnType<typeof build>, state: FightState) {
    const actor = state[prop.side],
      writing = isWriting(state, prop.side)
    prop.pen.visible = writing && Boolean(actor.writingKit?.brush)
    prop.root.scale.setScalar(writing ? 1 : 0.45)
    if (!writing) {
      const body = sleepingBody(actor)
      prop.root.position.set(options.worldX(body.x), options.worldY(body.y) + 0.9, 0.3)
      return
    }
    const right = options.figureOf?.(prop.side)?.getObjectByName('hand-right')
    holdBashoPaper(options, { state, side: prop.side, root: prop.root })
    poseBashoPen(prop.pen, actor.bashoPoem!, fineControlReduced(options))
    if (prop.pen.visible) poseBashoWritingHand(options, { side: prop.side, pen: prop.pen })
    prop.root.userData.inkProgress = bashoInk(actor.bashoPoem!).progress
    if (!right) return
    right.getWorldPosition(rightPoint)
    prop.root.updateMatrixWorld(true)
    prop.pen.position.copy(prop.root.worldToLocal(rightPoint))
  }
  return {
    sync(state) {
      for (const prop of props) {
        const f = state[prop.side]
        prop.root.visible = propVisible(prop, state)
        if (!prop.root.visible) {
          prop.pen.visible = false
          continue
        }
        placeVisitHand(options, { state, side: prop.side, root: prop.root, hand: 'left' })
        prop.root.position.z += 0.25
        prop.root.rotation.set(-0.12, 0, -0.08 * f.facing)
        if (prop.kind === 'poem') placePoem(prop, state)
        prop.write(
          prop.kind === 'poem' ? poemLines(state, prop.side) : consoleLines(state, prop.side),
        )
      }
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
  const poem = state[side].bashoPoem ?? state[side].bashoArchive!.at(-1)!
  return bashoInk(poem).lines
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

function isWriting(state: FightState, side: FightSide) {
  return (state[side].bashoPoem?.writingFrames ?? 0) > 0
}
