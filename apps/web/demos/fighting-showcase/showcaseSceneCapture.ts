import { presentCamillaFace, camillaFaceAudit } from './camillaFaceCamera'
import { presentRangedAura } from './rangedAuraPresentation'
import { drawRangedCloseup, rangedCloseupAudit } from './rangedCloseupRenderer'
import { presentCatsCrush, catsGripAudit } from './catsCrushPresentation'
import type { CatShot } from './catsSpectacle'
import { PerspectiveCamera, Scene } from 'three'
import { applyCinematicFrame } from './cinematicCamera'
import type { CinematicFrame } from './cinematicCamera'
import type { CloseupFrame } from './closeupTrack'
import { drawCloseup } from './closeupRenderer'

export function captureShowcaseScene(options: {
  camera: () => CinematicFrame | undefined
  detail: () => CloseupFrame | null | undefined
  spectacle?: () => CatShot | undefined
  ranged?: boolean
}) {
  let restoreAura: (() => void) | null = null
  let restoreFace: (() => void) | null = null
  let restoreCrush: (() => void) | null = null
  let renders = 0
  let drawingDetail = false
  let restoreCamera: (() => void) | null = null
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (drawingDetail) return
    const frame = options.camera()
    if (
      frame &&
      camera instanceof PerspectiveCamera &&
      scene.getObjectByName('fight-collision-boxes')
    ) {
      restoreFace?.()
      restoreCrush?.()
      restoreCamera?.()
      restoreCamera = applyCinematicFrame(camera, frame)
      restoreAura = options.ranged ? presentRangedAura(scene) : null
      restoreCrush = presentCatsCrush(scene, options.spectacle?.())
      restoreFace = presentCamillaFace(scene, camera, options.spectacle?.())
    }
  }
  Scene.prototype.onAfterRender = function (renderer, scene) {
    if (drawingDetail) return
    restoreAura?.()
    restoreAura = null
    restoreFace?.()
    restoreFace = null
    restoreCrush?.()
    restoreCrush = null
    restoreCamera?.()
    restoreCamera = null
    if (scene.getObjectByName('fight-collision-boxes')) {
      const frame = options.detail()
      if (frame) {
        drawingDetail = true
        try {
          if (options.ranged) drawRangedCloseup(renderer, scene, frame)
          else drawCloseup(renderer, scene, frame)
        } finally {
          drawingDetail = false
        }
      }
      renders++
    }
  }
  return {
    ready: () => renders > 3,
    diagnostics: () => ({
      grip: catsGripAudit(),
      face: camillaFaceAudit(),
      ranged: rangedCloseupAudit(),
    }),
  }
}
