import type { CameraDetail } from './cinematicTypes'

/** The observed application, never a later prepared choice, names this shot. */
export function needleFaceCamera(detail: CameraDetail, mode?: string): CameraDetail {
  return mode === 'face-warp'
    ? {
        ...detail,
        labelFr: 'Visage · Trois aiguilles au front',
        labelEn: 'Face · Three forehead needles',
      }
    : detail
}
