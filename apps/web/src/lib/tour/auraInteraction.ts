import { NEN_PRESENTATION } from '@black-whale/nen-engine'
import type * as Three from 'three'

type ThreeModule = typeof import('three')

export type NenObjectInteraction = 'sense' | 'strike' | 'pressure' | 'channel'

/** A solid the aura can act on, as the scene knows it. */
export interface NenObjectExtent {
  id: string
  at: readonly [number, number]
  y: number
  size: readonly [number, number]
  height: number
}

export interface InteractionMarker {
  object: NenObjectExtent
  kind: NenObjectInteraction
  /** Stamped so the animation loop can age the marker. */
  startedAt: number
}

/**
 * One short-lived mark showing that aura touched something.
 *
 * Built here rather than in `NenSceneAura` because it needs nothing from the
 * aura's own state: given a solid and a verb, it returns a group. The class
 * only has to remember to remove it.
 */
export function buildInteractionMarker(
  THREE: ThreeModule,
  { object, kind, startedAt }: InteractionMarker,
): Three.Group {
  const root = new THREE.Group()
  root.name = `nen-object-${kind}-${object.id}`
  root.position.set(object.at[0], object.y + object.height / 2, object.at[1])
  root.userData.started = startedAt
  root.userData.kind = kind
  root.userData.extent = Math.max(object.size[0], object.size[1], object.height, 0.35)
  const colour =
    kind === 'pressure'
      ? NEN_PRESENTATION.on.colours[1]
      : kind === 'strike'
        ? NEN_PRESENTATION.ko.colours[0]
        : NEN_PRESENTATION.gyo.colours[0]
  const material = (opacity: number) =>
    new THREE.MeshBasicMaterial({
      color: colour,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  if (kind === 'sense') {
    for (let index = 0; index < 3; index++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.018, 6, 48), material(0.5))
      ring.rotation.set(index === 0 ? Math.PI / 2 : 0, index === 2 ? Math.PI / 2 : 0, 0)
      ring.userData.phase = index / 3
      root.add(ring)
    }
  } else {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 20, 14),
      material(kind === 'strike' ? 0.48 : 0.3),
    )
    shell.scale.set(
      Math.max(0.4, object.size[0]),
      Math.max(0.4, object.height),
      Math.max(0.4, object.size[1]),
    )
    root.add(shell)
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.31, 64), material(0.72))
    wave.rotation.x = -Math.PI / 2
    wave.userData.wave = true
    root.add(wave)
  }
  return root
}
