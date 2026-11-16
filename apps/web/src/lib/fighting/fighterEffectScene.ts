import { createBenjaminEffectScene } from './benjaminEffectScene'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { bungeeVisible, hisokaUtilityMove } from './hisokaTechnique'
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
  const benjamin = createBenjaminEffectScene(options)
  const kurapika = createKurapikaEffectScene(options)
  const gumMaterial = new THREE.LineBasicMaterial({
    color: 0xff55bb,
    transparent: true,
    opacity: 0,
  })
  const gumGeometry = new THREE.BufferGeometry()
  const gum = new THREE.Line(gumGeometry, gumMaterial)
  const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f0e7 })
  const cardGeometry = new THREE.BoxGeometry(0.16, 0.24, 0.018)
  const cards = Array.from({ length: 4 }, () => new THREE.Mesh(cardGeometry, cardMaterial))
  scene.add(gum, ...cards)

  const sync = (state: FightState, seconds: number) => {
    benjamin.sync(state, seconds)
    kurapika.sync(state, seconds)
    syncGum(options, { state, line: gum, material: gumMaterial })
    syncCards(options, { state, meshes: cards, seconds })
  }

  return {
    sync,
    dispose: () => {
      benjamin.dispose()
      scene.remove(gum, ...cards)
      gumGeometry.dispose()
      gumMaterial.dispose()
      kurapika.dispose()
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

function syncCards(options: EffectSceneOptions, effect: MeshSync): void {
  const side = attackingSide(effect.state, 'hisoka')
  const active =
    side &&
    !hisokaUtilityMove(effect.state[side]) &&
    ['heavy', 'ranged', 'special'].includes(effect.state[side].attack?.kind ?? '')
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
