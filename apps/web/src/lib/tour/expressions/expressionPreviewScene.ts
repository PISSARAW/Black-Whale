import * as THREE from 'three'
import { buildHumanFigure, type HumanFigure, type HumanLook } from '../humanFigure'
import { buildFightFigure } from '../../fighting/fighterFigure'
import { createFightState } from '../../fighting/fightState'
import { fighterDefinition } from '../../fighting/roster'
import { fightBodyMotion } from '../../fighting/fightBodyMotion'
import type { FighterId } from '../../fighting/types'
import type { ExpressionCue } from './types'
import { disposeExpressionEffects } from './faceEffects'

export function createExpressionPreview(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x0d1623, 1)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 30)
  const materials = new Map<number, THREE.MeshBasicMaterial>()
  const glow = (color: number) => {
    let material = materials.get(color)
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color })
      materials.set(color, material)
    }
    return material
  }
  let model: HumanFigure | undefined
  let fighter = createFightState('kurapika', 'hisoka').player
  let mode: 'tour' | 'clash' = 'clash'
  let portrait = true
  let angle = 0
  function select(id: FighterId, nextMode: 'tour' | 'clash') {
    clearModel()
    mode = nextMode
    fighter = createFightState(id, 'hisoka').player
    if (mode === 'clash') model = buildFightFigure({ THREE, glow, fighter })
    else {
      const definition = fighterDefinition(id)
      const seen: HumanLook = {
        id,
        kind: 'avatar',
        spaceId: 'expression-preview',
        tierId: 'tier-1',
        at: [0, 0],
        y: 0,
        size: 0.42,
        colour: 0xffffff,
        stage: 0,
        hidden: false,
        human: {
          role: definition.modelRole,
          identity: definition.modelId,
          pose: 'idle',
          aura: 'none',
        },
      }
      model = buildHumanFigure({ THREE, glow, seen })
    }
    scene.add(model.root)
    frameCamera()
  }
  function frameCamera() {
    if (!model) return
    const eye = model.root.getObjectByName('face-eye-left')
    const subject = portrait ? (eye?.parent ?? model.turns) : model.turns
    model.root.updateWorldMatrix(true, true)
    const bounds = new THREE.Box3().setFromObject(subject)
    const centre = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    const distance = Math.max(size.y, size.x / camera.aspect) * (portrait ? 2.3 : 2.1)
    camera.position.set(
      centre.x + Math.sin(angle) * distance,
      centre.y + size.y * 0.04,
      centre.z + Math.cos(angle) * distance,
    )
    camera.lookAt(centre)
    camera.updateProjectionMatrix()
  }
  function resize() {
    const width = canvas.clientWidth,
      height = canvas.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    frameCamera()
  }
  function draw(seconds: number, cue?: ExpressionCue) {
    if (!model) return
    const motion = mode === 'clash' ? fightBodyMotion({ fighter, seconds, progress: 0 }) : undefined
    model.animate(seconds, 'idle', { expression: cue, motion })
    renderer.render(scene, camera)
    canvas.dataset.expressionReady = 'true'
  }
  function clearModel() {
    if (!model) return
    disposeExpressionEffects(model.root)
    model.root.removeFromParent()
    const geometries = new Set<THREE.BufferGeometry>()
    model.root.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (mesh.geometry && !mesh.geometry.userData.sharedHuman) geometries.add(mesh.geometry)
    })
    geometries.forEach((geometry) => geometry.dispose())
    model = undefined
  }
  return {
    select,
    draw,
    resize,
    camera(fullBody: boolean, rotation: number) {
      portrait = !fullBody
      angle = rotation
      frameCamera()
    },
    dispose() {
      clearModel()
      materials.forEach((material) => material.dispose())
      renderer.dispose()
    },
  }
}
