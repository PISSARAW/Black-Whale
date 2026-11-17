import { readAura, AURA_ZONES } from './reading'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { FightState, FightNenZone } from '../types'
const anchors: Record<FightNenZone, [number, number]> = {
  head: [0, 11.2],
  torso: [0, 7.5],
  hands: [2, 7],
  feet: [1, 1.2],
}
/** Visible aura allocation becomes a positional cue; choosing where and when to strike remains manual. */
export function createGyoReadingScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const geometry = new THREE.RingGeometry(0.12, 0.15, 16)
  const markers = new Map<
    FightNenZone,
    import('three').Mesh<import('three').RingGeometry, import('three').MeshBasicMaterial>
  >()
  function syncZone(
    zone: FightNenZone,
    context: { target: FightState['player']; reading: ReturnType<typeof readAura> },
  ) {
    const { target, reading } = context
    let mesh = markers.get(zone)
    if (!mesh && reading?.shares) {
      mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: 0xffdc87, transparent: true, depthWrite: false }),
      )
      mesh.name = `gyo-aura:${zone}`
      scene.add(mesh)
      markers.set(zone, mesh)
    }
    if (!mesh) return
    mesh.visible = Boolean(reading?.shares)
    const share = reading?.shares?.[zone] ?? 0,
      [dx, dy] = anchors[zone]
    mesh.material.opacity = 0.2 + share * 0.6
    mesh.scale.setScalar(0.5 + share * 2)
    mesh.position.set(
      options.worldX(target.x + target.facing * dx),
      options.worldY(target.y + dy - Number(target.crouching) * 3),
      0.45,
    )
  }
  return {
    sync(state: FightState) {
      const viewer = options.viewer?.() ?? 'player',
        other = viewer === 'player' ? 'opponent' : 'player'
      const target = state[other],
        reading = readAura(state[viewer], target)
      for (const zone of AURA_ZONES) syncZone(zone, { target, reading })
    },
    dispose() {
      geometry.dispose()
      for (const mesh of markers.values()) {
        scene.remove(mesh)
        mesh.material.dispose()
      }
      markers.clear()
    },
  }
}
