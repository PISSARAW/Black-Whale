import { placeVisitHand, createVisitScenePool } from './visitSceneKit'
import { guardianActive } from './tserriednichGuardian'
import { voluntaryNenAvailable } from './nenAccess'
import { chrolloKnifeHand } from './chrolloWeapon'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { HistoricalWeapon } from './historicalWeapons'
import type { FightState, FightSide } from './types'

/** The same held object becomes the released projectile; guardian anatomy comes from the archive. */
export function createHistoricalEquipmentScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options,
    models = new Map<string, import('three').Group>()
  const blade = new THREE.BoxGeometry(0.045, 0.55, 0.018)
  const handle = new THREE.BoxGeometry(0.065, 0.16, 0.055)
  const silver = new THREE.MeshStandardMaterial({
    color: '#d7dce0',
    metalness: 0.7,
    roughness: 0.25,
  })
  const dark = new THREE.MeshStandardMaterial({ color: '#242b31' })
  const wood = new THREE.MeshStandardMaterial({ color: '#987456' })
  const pool = createVisitScenePool(options)
  function weapon(key: string, kind: HistoricalWeapon) {
    let root = models.get(key)
    if (!root) {
      root = new THREE.Group()
      root.name = `historical-weapon:${key}`
      const edge = new THREE.Mesh(blade, kind === 'bokken' ? wood : silver)
      edge.position.y = 0.32
      root.add(edge, new THREE.Mesh(handle, dark))
      if (kind === 'bokken') {
        const second = edge.clone()
        second.position.x = 0.13
        root.add(second)
      }
      scene.add(root)
      models.set(key, root)
    }
    root.visible = true
    root.scale.setScalar(1)
    return root
  }
  function syncHeld(state: import('./types').FightState, viewer: import('./types').FightSide) {
    for (const side of ['player', 'opponent'] as const) {
      const actor = state[side]
      const held =
        actor.historicalWeapon ??
        (!actor.historicalWeaponSpent ? actor.historicalWeaponThrow : undefined)
      if (held && !actor.weaponsConfiscated && !actor.hanzoProjection) {
        placeHeld(state, side, held)
      }
      if (
        side === viewer ||
        !guardianActive(actor) ||
        !voluntaryNenAvailable(state[viewer], { requireHatsu: false })
      )
        continue
      const beast = pool.get(`guardian:${side}`, {
        model: 'tserriednich-guardian',
        anchor: 'floor',
        fit: { height: 1.8, width: 1.5 },
      })
      beast.root.position.set(
        options.worldX(actor.x) - actor.facing * 0.7,
        options.worldY(actor.y),
        -0.6,
      )
      beast.root.rotation.y = actor.facing * 0.4
    }
  }
  function placeHeld(state: FightState, side: FightSide, held: HistoricalWeapon) {
    const actor = state[side]
    const root = weapon(`${side}:${held}`, held)
    placeVisitHand(options, {
      state,
      side,
      root,
      ...(actor.id === 'chrollo' ? { hand: chrolloKnifeHand(actor), wrist: true } : {}),
    })
    root.rotateZ(actor.facing * 0.4)
  }
  return {
    sync(state) {
      pool.hide()
      models.forEach((root) => {
        root.visible = false
      })
      const viewer = options.viewer?.() ?? 'player'
      syncHeld(state, viewer)
      for (const shot of state.projectiles) {
        if (!shot.physicalBlade) continue
        const root = weapon(
          `projectile:${shot.id}:${shot.physicalBlade.weapon}`,
          shot.physicalBlade.weapon,
        )
        root.position.set(options.worldX(shot.x), options.worldY(shot.y), 0.4)
        root.rotation.set(0, 0, (-Math.sign(shot.velocityX) * Math.PI) / 2)
        const generic = scene.getObjectByName(`fight-projectile:${shot.id}`)
        if (generic) generic.visible = false
      }
    },
    dispose() {
      models.forEach((root) => root.removeFromParent())
      models.clear()
      blade.dispose()
      handle.dispose()
      silver.dispose()
      dark.dispose()
      wood.dispose()
      pool.dispose()
    },
  }
}
