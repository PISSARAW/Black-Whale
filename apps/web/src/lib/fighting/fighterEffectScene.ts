import { createBashoSupportScene } from './bashoSupportScene'
import { createDeviceScene } from './deviceScene'
import { createPaperDocumentScene } from './paperDocumentScene'
import { createRemainingVisitHatsuScene } from './remainingVisitHatsuScene'
import { createRetrospectiveScene } from './retrospectiveScene'
import { createKallutoPaperScene } from './kallutoScene'
import { createEasterEggScene } from './easterEggScene'
import { createArenaScene } from './arenaScene'
import { createVoconteDoorScene } from './voconteDoorScene'
import { createBloodyMaryScene } from './bloodyMaryScene'
import { createBiohazardDeviceScene } from './biohazardDeviceScene'
import { createBiohazardScene } from './biohazardScene'
import { createCrossGameScene } from './crossGameScene'
import { createPreparationScene } from './preparationScene'
import { createLuiniPassageScene } from './luiniPassageScene'
import { createSecretWindowScene } from './secretWindowScene'
import { createMachiThreadScene } from './machiThreadScene'
import { createBashoFireScene } from './bashoFireScene'
import { createNenFieldScene } from './nenFieldScene'
import { createBenjaminEffectScene } from './benjaminEffectScene'
import { createCamillaCatScene } from './camillaCatScene'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { createChrolloEffectScene } from './chrolloEffectScene'
import { hisokaUtilityMove } from './hisokaTechnique'
import type { FightSide, FightState } from './types'
import type { FightComfort } from './fightComfort'

export interface EffectSceneOptions {
  comfort?: () => FightComfort
  /** The viewing side controls private props such as Combo Master's console. */
  viewer?: () => FightSide
  THREE: typeof import('three')
  scene: import('three').Scene
  worldX: (value: number) => number
  worldY: (value: number) => number
  /** Live posed rig; callbacks also follow aura/body rebuilds. */
  figureOf?: (side: FightSide) => import('three').Object3D | undefined
  handAnchor?: (side: FightSide, hand: 'lead' | 'rear') => import('three').Object3D | undefined
  throwFrame?: () => import('./throwCinematic').ThrowCinematicFrame | null
}

export interface FighterEffectScene {
  sync: (state: FightState, seconds: number) => void
  dispose: () => void
}

export function createFighterEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const arena = createArenaScene(options)
  const paper = createKallutoPaperScene(options)
  const easterEggs = createEasterEggScene(options)
  const doors = createVoconteDoorScene(options)
  const bioDevices = createBiohazardDeviceScene(options)
  const biohazard = createBiohazardScene(options)
  const preparedScene = createPreparationScene(options)
  const luini = createLuiniPassageScene(options)
  const secretWindow = createSecretWindowScene(options)
  const camilla = createCamillaCatScene(options)
  const crossGame = createCrossGameScene(options)
  const mary = createBloodyMaryScene(options)
  const basho = createBashoFireScene(options)
  const nenFields = createNenFieldScene(options)
  const benjamin = createBenjaminEffectScene(options)
  const kurapika = createKurapikaEffectScene(options)
  const machi = createMachiThreadScene(options)
  const visitHatsu = createRemainingVisitHatsuScene(options)
  const retrospective = createRetrospectiveScene(options)
  const devices = createDeviceScene(options)
  const documents = createPaperDocumentScene(options)
  const bashoSupport = createBashoSupportScene(options)
  const chrollo = createChrolloEffectScene(options)
  const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f0e7 })
  const cardGeometry = new THREE.BoxGeometry(0.16, 0.24, 0.018)
  const cards = Array.from({ length: 4 }, () => new THREE.Mesh(cardGeometry, cardMaterial))
  scene.add(...cards)

  const sync = (state: FightState, seconds: number) => {
    easterEggs.sync(state, seconds)
    arena.sync(state, seconds)
    paper.sync(state, seconds)
    doors.sync(state, seconds)
    bioDevices.sync(state, seconds)
    biohazard.sync(state, seconds)
    preparedScene.sync(state, seconds)
    luini.sync(state, seconds)
    secretWindow.sync(state, seconds)
    camilla.sync(state, seconds)
    crossGame.sync(state, seconds)
    mary.sync(state, seconds)
    basho.sync(state, seconds)
    nenFields.sync(state)
    benjamin.sync(state, seconds)
    kurapika.sync(state, seconds)
    machi.sync(state, seconds)
    visitHatsu.sync(state, seconds)
    retrospective.sync(state, seconds)
    devices.sync(state, seconds)
    documents.sync(state, seconds)
    bashoSupport.sync(state, seconds)
    chrollo.sync(state, seconds)
    syncCards(options, { state, meshes: cards, seconds })
  }

  return {
    sync,
    dispose: () => {
      easterEggs.dispose()
      arena.dispose()
      paper.dispose()
      doors.dispose()
      bioDevices.dispose()
      biohazard.dispose()
      preparedScene.dispose()
      luini.dispose()
      secretWindow.dispose()
      camilla.dispose()
      crossGame.dispose()
      mary.dispose()
      basho.dispose()
      nenFields.dispose()
      benjamin.dispose()
      machi.dispose()
      kurapika.dispose()
      visitHatsu.dispose()
      retrospective.dispose()
      devices.dispose()
      documents.dispose()
      bashoSupport.dispose()
      chrollo.dispose()
      scene.remove(...cards)
      cardGeometry.dispose()
      cardMaterial.dispose()
    },
  }
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
