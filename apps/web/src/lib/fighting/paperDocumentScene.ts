import { actualDocuments, documentPosition, paperBodyRef, samePaperBody } from './paperDocuments'
import { displayedDocumentText } from './paperTexture'
import { canReadDocument } from './paperDocumentReading'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

/** Real sheets follow the posed hand; drawing a surface never changes its physical support. */
export function createPaperDocumentScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const geometry = new THREE.BoxGeometry(0.24, 0.32, 0.007)
  const models = new Map<string, ReturnType<typeof make>>()
  function make(entry: PreparedEntity) {
    const canvas = typeof document === 'undefined' ? undefined : document.createElement('canvas')
    if (canvas) {
      canvas.width = 256
      canvas.height = 320
    }
    const texture = canvas ? new THREE.CanvasTexture(canvas) : undefined
    const material = new THREE.MeshBasicMaterial({ color: 0xf3ebd5, map: texture ?? null })
    const root = new THREE.Mesh(geometry, material)
    root.name = `document:${entry.id}`
    scene.add(root)
    return { root, material, texture, canvas, text: undefined as string | undefined }
  }
  function syncDocument(state: FightState, entry: PreparedEntity, model: ReturnType<typeof make>) {
    const holder = entry.document!.holder
    const point = documentPosition(state, entry)
    model.root.visible = true
    model.root.position.set(options.worldX(point.x), options.worldY(point.y) + 0.015, 0.48)
    model.root.rotation.set(holder ? 0 : -Math.PI / 2, 0, 0)
    carrierHand(state, entry)?.getWorldPosition(model.root.position)
    const viewer = options.viewer?.() ?? 'player'
    const text = canReadDocument(state, viewer, entry) ? displayedDocumentText(state, entry) : ''
    paintDocument(model, text)
  }
  function carrierHand(state: FightState, entry: PreparedEntity) {
    const holder = entry.document!.holder
    if (!holder || state[holder.owner].hanzoProjection) return undefined
    if (!samePaperBody(holder, paperBodyRef(state, holder.owner))) return undefined
    return options.handAnchor?.(holder.owner, holder.hand === 'left' ? 'rear' : 'lead')
  }
  function paintDocument(model: ReturnType<typeof make>, text: string) {
    model.root.userData.documentText = text
    if (text === model.text) return
    model.text = text
    const context = model.canvas?.getContext('2d')
    if (!context || !model.texture) return
    context.fillStyle = '#f3ebd5'
    context.fillRect(0, 0, 256, 320)
    context.fillStyle = '#25222b'
    context.font = '18px sans-serif'
    text
      .match(/.{1,20}/gu)
      ?.slice(0, 12)
      .forEach((line, index) => {
        context.fillText(line, 12, 30 + index * 23, 232)
      })
    model.texture.needsUpdate = true
  }
  return {
    sync(state) {
      for (const model of models.values()) model.root.visible = false
      for (const entry of actualDocuments(state)) {
        let model = models.get(entry.id)
        if (!model) {
          model = make(entry)
          models.set(entry.id, model)
        }
        syncDocument(state, entry, model)
      }
    },
    dispose() {
      for (const model of models.values()) {
        model.root.removeFromParent()
        model.texture?.dispose()
        model.material.dispose()
      }
      models.clear()
      geometry.dispose()
    },
  }
}
