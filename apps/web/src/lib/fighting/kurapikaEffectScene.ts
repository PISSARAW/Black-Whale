import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Each side owns a chain: a maintained capture must stay visible between attacks. */
export function createKurapikaEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const linkGeometry = new THREE.TorusGeometry(0.055, 0.018, 4, 7)
  const barGeometry = new THREE.BoxGeometry(0.055, 0.3, 0.055)
  const needleGeometry = new THREE.ConeGeometry(0.055, 0.28, 6)
  const groups = (['player', 'opponent'] as const).map((side) => {
    const material = new THREE.MeshBasicMaterial({ color: 0xdce7ed })
    const links = Array.from({ length: 30 }, () => new THREE.Mesh(linkGeometry, material))
    const cross = new THREE.Group()
    const vertical = new THREE.Mesh(barGeometry, material)
    const horizontal = new THREE.Mesh(barGeometry, material)
    horizontal.rotation.z = Math.PI / 2
    horizontal.scale.y = 0.65
    cross.add(vertical, horizontal)
    const needle = new THREE.Mesh(needleGeometry, material)
    needle.rotation.z = -Math.PI / 2
    scene.add(...links, cross, needle)
    return { side, material, links, cross, needle }
  })
  function syncGroup(group: (typeof groups)[number], state: FightState) {
    const { fighter, target, jail, drain, healing, active } = chainContext(state, group.side)
    group.links.forEach((mesh) => (mesh.visible = active))
    group.cross.visible = healing
    group.needle.visible = drain || fighter.attack?.moveId === 'kurapika:backSpecial'
    group.material.color.set(healing ? 0x4ee6d6 : jail ? 0xdce7ed : 0xe8d44d)
    if (!active) return
    const endX = chainEndX(state, group.side)
    const endY = jail || drain ? target.y : fighter.y
    group.links.forEach((mesh, index) => {
      const ratio = index / (group.links.length - 1)
      const wrap = jail && ratio > 0.45
      const angle = (ratio - 0.45) * Math.PI * 12
      const x = wrap
        ? worldX(target.x) + Math.cos(angle) * 0.3
        : worldX(fighter.x + (endX - fighter.x) * ratio)
      const y = wrap
        ? worldY(target.y) + 0.6 + ratio * 0.8
        : worldY(fighter.y + (endY - fighter.y) * ratio) + 1.1
      mesh.position.set(x, y, wrap ? Math.sin(angle) * 0.25 : 0.3)
      mesh.rotation.y = index % 2 ? Math.PI / 2 : 0
    })
    group.cross.position.set(worldX(endX), worldY(endY) + 1.1, 0.32)
    group.needle.position.set(worldX(endX), worldY(endY) + 1.1, 0.32)
    group.needle.rotation.z = (-fighter.facing * Math.PI) / 2
  }
  return {
    sync: (state) => {
      for (const group of groups) syncGroup(group, state)
    },
    dispose: () => {
      for (const group of groups) {
        scene.remove(...group.links, group.cross, group.needle)
        group.material.dispose()
      }
      linkGeometry.dispose()
      barGeometry.dispose()
      needleGeometry.dispose()
    },
  }
}

function chainContext(state: FightState, side: FightSide) {
  const fighter = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  const jail = target.chainJail?.owner === side
  const drain = target.drainingChain?.owner === side
  const healing = fighter.attack?.moveId === 'kurapika:downSpecial'
  const attacking =
    fighter.id === 'kurapika' && Boolean(fighter.attack?.moveId?.startsWith('kurapika:'))
  return { fighter, target, jail, drain, healing, active: [jail, drain, attacking].some(Boolean) }
}

function chainEndX(state: FightState, side: FightSide): number {
  const { fighter, target, jail, drain, healing } = chainContext(state, side)
  if (jail || drain) return target.x
  return healing ? fighter.x + fighter.facing * 2 : fighter.x + fighter.facing * 13
}
