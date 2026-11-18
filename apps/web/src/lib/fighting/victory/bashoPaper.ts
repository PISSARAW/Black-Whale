import * as T from 'three'
import { BASHO_POEMS } from '../bashoPoem'
import type { VictoryContext } from './types'
import type { BashoPose } from './bashoPose'
import { disposeVictoryObject } from './resources'
import { poetHand } from './bashoHands'
import { bashoCursor } from './bashoCursor'

function paperSurface() {
  if (typeof document === 'undefined') return undefined
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 900
  return { canvas, pen: canvas.getContext('2d')!, texture: new T.CanvasTexture(canvas) }
}
export function createBashoPaper() {
  const root = new T.Group(),
    surface = paperSurface()
  const material = new T.MeshBasicMaterial({
    color: 0xbfb5ad,
    map: surface?.texture ?? null,
    side: T.DoubleSide,
    toneMapped: false,
  })
  const paper = new T.Mesh(new T.PlaneGeometry(0.36, 0.43), material)
  const brush = new T.Group(),
    wood = new T.MeshBasicMaterial({ color: 0x684633 })
  const stem = new T.Mesh(new T.CylinderGeometry(0.007, 0.009, 0.18, 8), wood)
  const nib = new T.Mesh(
    new T.ConeGeometry(0.011, 0.045, 8),
    new T.MeshBasicMaterial({ color: 0x17151b }),
  )
  nib.rotation.z = Math.PI
  nib.position.y = -0.1075
  brush.add(stem, nib)
  root.name = 'basho-authored-haiku'
  root.add(paper, brush)
  let count = -1
  return {
    sync(context: VictoryContext, pose: BashoPose) {
      const chars = Math.floor(BASHO_POEMS.fr.length * pose.writing.progress)
      if (surface && chars !== count) {
        count = chars
        const p = surface.pen
        p.fillStyle = '#f2e5cd'
        p.fillRect(0, 0, 768, 900)
        p.strokeStyle = '#a38a65'
        p.lineWidth = 4
        p.strokeRect(40, 40, 688, 820)
        p.fillStyle = '#231d21'
        p.textAlign = 'center'
        p.font = 'bold 48px Georgia'
        p.fillText('GREAT HIKER', 384, 145)
        p.font = 'bold 50px Georgia'
        p.textAlign = 'left'
        BASHO_POEMS.fr
          .slice(0, chars)
          .split('\n')
          .forEach((line, i) => p.fillText(line, 70, 330 + i * 160, 630))
        if (chars === BASHO_POEMS.fr.length) {
          p.strokeStyle = '#962d2d'
          p.strokeRect(535, 745, 100, 75)
          p.fillStyle = '#962d2d'
          p.textAlign = 'center'
          p.font = 'bold 30px Georgia'
          p.fillText('BASHO', 585, 790)
        }
        surface.texture.needsUpdate = true
      }
      if (surface) surface.pen.font = 'bold 50px Georgia'
      const cursor =
        context.age < 144 && surface
          ? bashoCursor(pose, (text) => surface.pen.measureText(text).width)
          : pose.tip
      if (context.age < 144) {
        pose.handErrors[1] = poetHand(context.hero, 'right', cursor.clone().add(pose.penAxis))
        pose.hand.copy(
          context.hero.root.getObjectByName('hand-right')!.getWorldPosition(new T.Vector3()),
        )
      }
      paper.position.copy(pose.page)
      paper.quaternion.copy(pose.pageQ)
      paper.visible = context.age < 174 || context.age >= 486
      brush.visible = context.age < 150
      brush.position.copy(pose.hand)
      brush.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), pose.penAxis.clone().normalize())
      context.add(root)
      return {
        written: pose.writing.progress === 1,
        pageVisible: paper.visible,
        penError: brush.localToWorld(new T.Vector3(0, -0.13, 0)).distanceTo(cursor),
        recognizedPoem: true,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
