import type { MeshBasicMaterial } from 'three'
import type { HumanAura } from './humanAura'
import { placeRenFlame } from './humanAuraFlames'
import { SKIN_TIME } from './humanAuraSkin'

/**
 * Moves the aura meshes `buildHumanAura` produced.
 *
 * It is a separate pass from the body's animation because it is driven by the
 * Nen state rather than the pose: a figure standing still with Ren up is not
 * still, and a figure walking in Zetsu is.
 */
export function animateHumanAura(aura: HumanAura): (seconds: number) => void {
  const {
    onFlames,
    renFlames,
    eyeAuras,
    koPoints,
    ryuPoints,
    enFields,
    onCore,
    auraGlass,
  } = aura
  return (seconds: number) => {
    // The shell breathes by scale and never by material. Its material is shared
    // across every figure wearing the same bend — one upload for a deck of
    // guards — so writing an index of refraction here would be every body on
    // the deck pulsing in lockstep, which is the one thing a crowd never does.
    if (auraGlass) {
      const swell = 1 + Math.sin(seconds * 1.15) * 0.02 + Math.sin(seconds * 2.7) * 0.008
      auraGlass.scale.set(swell, 1.5 * swell, swell)
    }
    // The skin and the En dome move in their shaders, on one shared clock.
    SKIN_TIME.value = seconds
    renFlames.forEach((flame, index) => placeRenFlame(flame, seconds, index))
    eyeAuras.forEach((eye, index) => {
      const focus = 1 + Math.sin(seconds * 11 + index * Math.PI) * 0.14
      eye.scale.set(1.45 * focus, 0.68 * focus, 1.15 * focus)
      ;(eye.material as MeshBasicMaterial).opacity = 0.62 + Math.sin(seconds * 15 + index) * 0.16
    })
    enFields.forEach((field, index) => {
      const sweep = (seconds * (0.42 + index * 0.07) + index / 3) % 1
      field.scale.setScalar(0.92 + sweep * 0.16)
      field.rotation.z = seconds * (index % 2 ? -0.045 : 0.055)
      ;(field.material as MeshBasicMaterial).opacity = (1 - sweep) * (0.28 - index * 0.04)
    })
    koPoints.forEach((point, index) => {
      const base = point.userData.auraBase as [number, number, number]
      const impact = 1 + Math.sin(seconds * 12 + index * Math.PI) * 0.17
      point.position.set(base[0], base[1] + Math.sin(seconds * 8 + index) * 0.018, base[2])
      point.scale.setScalar(impact)
      ;(point.material as MeshBasicMaterial).opacity = 0.7 + Math.sin(seconds * 14 + index) * 0.12
    })
    ryuPoints.forEach((point) => {
      const base = point.userData.auraBase as [number, number, number]
      const share = Number(point.userData.auraShare)
      const phase = seconds * 6.5 + Number(point.userData.auraPhase)
      const flow = 1 + Math.sin(phase) * 0.1
      point.position.set(base[0], base[1] + Math.sin(phase * 0.7) * 0.025, base[2])
      point.scale.setScalar((0.65 + share * 0.85) * flow)
      ;(point.material as MeshBasicMaterial).opacity =
        Math.min(0.72, 0.12 + share * 0.58) + Math.sin(phase) * 0.06
    })
    if (onCore) {
      const breath = 1 + Math.sin(seconds * 5.5) * 0.035 + Math.sin(seconds * 13) * 0.012
      onCore.scale.set(1 * breath, 1.48 + Math.sin(seconds * 8) * 0.07, 1 * breath)
    }
    onFlames.forEach((flame, index) => {
      const phase = seconds * (2.4 + (index % 4) * 0.16) + index * 1.73
      const rise = ((seconds * (0.42 + (index % 3) * 0.06) + index / 7) % 1) * 0.32
      const angle = Number(flame.userData.onAngle) + seconds * 0.22 + Math.sin(phase) * 0.12
      const radius = 0.57 + Math.sin(phase * 0.7) * 0.08
      flame.position.set(
        Math.cos(angle) * radius,
        0.16 + Number(flame.userData.onLayer) * 0.27 + rise,
        Math.sin(angle) * radius,
      )
      flame.rotation.set(Math.sin(angle) * 0.28, -angle, Math.cos(angle) * -0.28)
      flame.scale.set(0.75 + Math.sin(phase) * 0.18, 0.82 + Math.sin(phase * 1.3) * 0.24, 0.75)
    })
  }
}
