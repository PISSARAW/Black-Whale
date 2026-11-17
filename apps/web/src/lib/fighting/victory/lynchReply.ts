import * as T from 'three'
import { fighterDefinition } from '../roster'
import type { FighterId } from '../types'
import type { VictoryContext } from './types'
import type { LynchPose } from './lynchPose'
import { disposeVictoryObject } from './resources'

function replyTexture(name: string) {
  if (typeof document === 'undefined') return undefined
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 320
  const pen = canvas.getContext('2d')!
  pen.fillStyle = '#fff7e9'
  pen.beginPath()
  pen.ellipse(384, 135, 365, 110, 0, 0, Math.PI * 2)
  pen.fill()
  pen.beginPath()
  pen.moveTo(180, 210)
  pen.lineTo(55, 310)
  pen.lineTo(260, 225)
  pen.fill()
  pen.strokeStyle = '#301b22'
  pen.lineWidth = 8
  pen.beginPath()
  pen.ellipse(384, 135, 365, 110, 0, 0, Math.PI * 2)
  pen.stroke()
  pen.fillStyle = '#271b22'
  pen.textAlign = 'center'
  pen.textBaseline = 'middle'
  pen.font = `900 ${Math.min(94, (560 / Math.max(5, name.length)) * 1.8)}px Arial`
  pen.fillText(name.toUpperCase(), 384, 135, 635)
  return new T.CanvasTexture(canvas)
}
export function createLynchReply() {
  const root = new T.Group()
  const material = new T.MeshBasicMaterial({
    color: 0xbfb5b0,
    toneMapped: false,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: T.DoubleSide,
  })
  const bubble = new T.Mesh(new T.PlaneGeometry(0.88, 0.37), material)
  bubble.renderOrder = 20
  root.name = 'lynch-body-answer'
  root.add(bubble)
  let target: FighterId | undefined
  return {
    sync(context: VictoryContext, pose: LynchPose) {
      const id = context.state[context.frame.loser].id
      if (target !== id) {
        material.map?.dispose()
        material.map = replyTexture(fighterDefinition(id).name) ?? null
        material.needsUpdate = true
        target = id
      }
      const delta = context.age - pose.beat.contact
      const answer = pose.beat.index < 6 && delta >= 0 && delta < 54 && context.age < 396
      const t = Math.max(0, Math.min(1, delta / 54))
      bubble.visible = answer
      bubble.position.copy(pose.contact).add(new T.Vector3(0.22 + t * 0.1, 0.26 + t * 0.2, 0.32))
      bubble.quaternion.copy(context.camera.quaternion)
      bubble.scale.setScalar(0.6 + Math.min(1, delta / 5) * 0.4)
      material.opacity = 1 - t * t
      context.add(root)
      return {
        answerVisible: answer,
        answerFromBody: true,
        publicNameOnly: true,
        soulExtracted: false,
        afterKoReply: false,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
