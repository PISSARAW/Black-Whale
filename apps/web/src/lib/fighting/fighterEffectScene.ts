import { bungeeVisible, hisokaUtilityMove } from './hisokaTechnique'
import { attackAuraColour } from './techniqueAuraColours'
import type { FightSide, FightState } from './types'

export interface EffectSceneOptions {
  THREE: typeof import('three')
  scene: import('three').Scene
  worldX: (value: number) => number
  worldY: (value: number) => number
}

export interface FighterEffectScene {
  sync: (state: FightState, seconds: number) => void
  dispose: () => void
}

export function createFighterEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const gumMaterial = new THREE.LineBasicMaterial({
    color: 0xff55bb,
    transparent: true,
    opacity: 0,
  })
  const gumGeometry = new THREE.BufferGeometry()
  const gum = new THREE.Line(gumGeometry, gumMaterial)
  const chainMaterial = new THREE.MeshBasicMaterial({ color: 0xd8ecff })
  const chainGeometry = new THREE.TorusGeometry(0.055, 0.018, 4, 7)
  const chain = Array.from({ length: 11 }, () => new THREE.Mesh(chainGeometry, chainMaterial))
  const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f0e7 })
  const cardGeometry = new THREE.BoxGeometry(0.16, 0.24, 0.018)
  const cards = Array.from({ length: 4 }, () => new THREE.Mesh(cardGeometry, cardMaterial))
  scene.add(gum, ...chain, ...cards)

  const sync = (state: FightState, seconds: number) => {
    syncGum(options, { state, line: gum, material: gumMaterial })
    syncChain(options, { state, meshes: chain, seconds })
    const chainSide = attackingSide(state, 'kurapika')
    if (chainSide) chainMaterial.color.set(attackAuraColour(state[chainSide]))
    syncCards(options, { state, meshes: cards, seconds })
  }

  return {
    sync,
    dispose: () => {
      scene.remove(gum, ...chain, ...cards)
      gumGeometry.dispose()
      gumMaterial.dispose()
      chainGeometry.dispose()
      chainMaterial.dispose()
      cardGeometry.dispose()
      cardMaterial.dispose()
    },
  }
}

interface GumSync {
  state: FightState
  line: import('three').Line
  material: import('three').LineBasicMaterial
}

function syncGum(options: EffectSceneOptions, effect: GumSync): void {
  const attachment = effect.state.bungeeGum
  effect.line.visible = bungeeVisible(effect.state)
  if (!attachment) return
  const owner = effect.state[attachment.owner]
  const target = effect.state[attachment.target]
  const points = Array.from({ length: 13 }, (_, index) => {
    const ratio = index / 12
    const sag = Math.sin(ratio * Math.PI) * -0.32
    return new options.THREE.Vector3(
      options.worldX(owner.x + (target.x - owner.x) * ratio),
      options.worldY(owner.y + (target.y - owner.y) * ratio) + 1.15 + sag,
      0.28,
    )
  })
  effect.line.geometry.setFromPoints(points)
  effect.material.opacity = attachment.hidden ? 0.4 : 0.82
}

interface MeshSync {
  state: FightState
  meshes: import('three').Mesh[]
  seconds: number
}

function syncChain(options: EffectSceneOptions, effect: MeshSync): void {
  const side = attackingSide(effect.state, 'kurapika')
  const active = side && effect.state[side].attack?.kind === 'special'
  effect.meshes.forEach((mesh) => (mesh.visible = Boolean(active)))
  if (!active || !side) return
  const fighter = effect.state[side]
  const reach = fighter.x + fighter.facing * 13
  effect.meshes.forEach((mesh, index) => {
    const ratio = index / Math.max(1, effect.meshes.length - 1)
    mesh.position.set(
      options.worldX(fighter.x + (reach - fighter.x) * ratio),
      options.worldY(fighter.y) + 1.25 + Math.sin(ratio * Math.PI * 2) * 0.1,
      0.3,
    )
    mesh.rotation.y = Math.PI / 2
  })
}

function syncCards(options: EffectSceneOptions, effect: MeshSync): void {
  const side = attackingSide(effect.state, 'hisoka')
  const active =
    side && !hisokaUtilityMove(effect.state[side]) && ['heavy', 'ranged', 'special'].includes(effect.state[side].attack?.kind ?? '')
  effect.meshes.forEach((mesh) => (mesh.visible = Boolean(active)))
  if (!active || !side) return
  const fighter = effect.state[side]
  effect.meshes.forEach((mesh, index) => {
    const angle = effect.seconds * 7 + index * 0.38
    mesh.position.set(
      options.worldX(fighter.x) + fighter.facing * (0.45 + index * 0.08),
      options.worldY(fighter.y) + 1.35 + Math.sin(angle) * 0.18,
      0.24 + index * 0.025,
    )
    mesh.rotation.z = angle
  })
}

function attackingSide(state: FightState, fighterId: string): FightSide | null {
  if (state.player.id === fighterId && state.player.attack) return 'player'
  if (state.opponent.id === fighterId && state.opponent.attack) return 'opponent'
  return null
}
