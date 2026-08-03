import type { MeshBasicMaterial } from 'three'
import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { HumanAura, HumanZone } from './humanAura'

/**
 * Moves the aura meshes `buildHumanAura` produced.
 *
 * It is a separate pass from the body's animation because it is driven by the
 * Nen state rather than the pose: a figure standing still with Ren up is not
 * still, and a figure walking in Zetsu is.
 */
export function animateHumanAura(
  aura: HumanAura,
  nen: NenTechniqueState<HumanZone>,
): (seconds: number) => void {
  const {
    onFlames,
    renFlames,
    eyeAuras,
    koPoints,
    ryuPoints,
    enFields,
    onCore,
    zetsuTrace,
    auraShell,
    kenMantle,
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
    if (zetsuTrace) {
      const remnant = 0.985 + Math.sin(seconds * 0.8) * 0.008
      zetsuTrace.scale.set(0.72 * remnant, 1.32, 0.72 * remnant)
      ;(zetsuTrace.material as MeshBasicMaterial).opacity =
        0.003 + Math.max(0, Math.sin(seconds * 0.65)) * 0.004
    }
    if (auraShell) {
      const stable = 1 + Math.sin(seconds * 1.8) * (nen.mode === 'ten' ? 0.012 : 0.025)
      auraShell.scale.set(stable, 1.35 * stable, stable)
      ;(auraShell.material as MeshBasicMaterial).opacity =
        nen.mode === 'ten'
          ? 0.064 + Math.sin(seconds * 1.8) * 0.006
          : 0.14 + Math.sin(seconds * 4.2) * 0.025
    }
    renFlames.forEach((flame, index) => {
      const phase = seconds * (3.4 + (index % 3) * 0.28) + index * 1.37
      const angle = Number(flame.userData.auraAngle) + seconds * -0.14 + Math.sin(phase) * 0.16
      const rise = ((seconds * (0.62 + (index % 2) * 0.09) + index / 4) % 1) * 0.38
      const radius = 0.52 + Math.sin(phase * 0.73) * 0.1
      flame.position.set(
        Math.cos(angle) * radius,
        0.34 + Number(flame.userData.auraLayer) * 0.31 + rise,
        Math.sin(angle) * radius,
      )
      flame.rotation.set(Math.sin(angle) * 0.3, -angle, Math.cos(angle) * -0.3)
      flame.scale.set(0.72 + Math.sin(phase) * 0.22, 0.9 + Math.sin(phase * 1.41) * 0.32, 0.72)
      ;(flame.material as MeshBasicMaterial).opacity = 0.16 + Math.max(0, Math.sin(phase)) * 0.13
    })
    if (kenMantle) {
      const pressure = 1 + Math.sin(seconds * 3.2) * 0.014 + Math.sin(seconds * 7.4) * 0.006
      kenMantle.scale.set(pressure, 1.42 * pressure, pressure)
      ;(kenMantle.material as MeshBasicMaterial).opacity = 0.25 + Math.sin(seconds * 5) * 0.025
    }
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
