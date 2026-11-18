import { actualDocuments } from './paperDocuments'
import { paperDocumentWorldPoint } from './paperDocumentAnchor'
import { paintDocumentCanvas } from './paperDocumentPrint'
import { visibleArenaMap, type ArenaMap } from './arenaMap'
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
    model.root.visible = true
    model.root.position.copy(paperDocumentWorldPoint(options, state, entry))
    model.root.rotation.set(holder ? 0 : -Math.PI / 2, 0, 0)
    const viewer = options.viewer?.() ?? 'player'
    const text = canReadDocument(state, viewer, entry) ? displayedDocumentText(state, entry) : ''
    const plan = canReadDocument(state, viewer, entry) ? visibleArenaMap(state, entry) : undefined
    paintDocument(model, text, plan)
  }
  function paintDocument(model: ReturnType<typeof make>, text: string, plan?: ArenaMap) {
    model.root.userData.documentText = text
    model.root.userData.arenaMap = plan
    const key = JSON.stringify([text, plan])
    if (key === model.text) return
    model.text = key
    const context = model.canvas?.getContext('2d')
    if (!context || !model.texture) return
    paintDocumentCanvas(context, text, plan)
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
