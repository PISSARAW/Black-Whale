import { aimCinematicFocus } from './cinematicFocus'
import { PerspectiveCamera, Quaternion, Vector3, Vector4 } from 'three'
import type { Object3D, Scene, WebGLRenderer } from 'three'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import type { CameraDetail } from './cinematicDirector'
import type { CameraDetailRect } from './cinematicDetailLayout'
import type { FightSide, FightState } from './types'

interface DetailOptions {
  scene: Scene
  figureOf: (side: FightSide) => Object3D
}

function visible(node: Object3D): boolean {
  for (let current: Object3D | null = node; current; current = current.parent)
    if (!current.visible) return false
  return true
}

/** Second view of the same posed scene, drawn after the main postprocessing pass. */
export function createCinematicDetailScene({ scene, figureOf }: DetailOptions) {
  const camera = new PerspectiveCamera(28, 1, 0.02, 100)
  const target = new Vector3()
  const position = new Vector3()
  const rotation = new Quaternion()
  const viewport = new Vector4()
  const scissor = new Vector4()

  interface AimContext {
    detail: CameraDetail
    state: FightState
    actor: Object3D
    rival: Object3D
  }
  function aimEyes({ actor, rival }: AimContext): Object3D[] | null {
    const head = actor.getObjectByName('kurapika-head')
    if (!head) return null
    head.getWorldPosition(target)
    head.getWorldQuaternion(rotation)
    position.set(0.055, 0.012, 0.86).applyQuaternion(rotation).add(target)
    target.add(new Vector3(0, -0.015, 0.085).applyQuaternion(rotation))
    camera.position.copy(position)
    camera.lookAt(target)
    return [rival, ...scene.children.filter((node) => node.name === 'benjamin-secret-window')]
  }
  function aimChain({ detail, actor }: AimContext): Object3D[] | null {
    const chains = scene.getObjectByName(`kurapika-chains:${detail.side}`)
    const tip = chains?.getObjectByName(
      detail.kind === 'seal' ? 'kurapika-judgment-seal' : `kurapika-chain-tip:${detail.tip}`,
    )
    if (!tip || !visible(tip)) return null
    tip.getWorldPosition(target)
    const hand = detail.kind === 'chain' ? actor.getObjectByName('hand-right') : null
    if (hand) {
      hand.getWorldPosition(position)
      target.lerp(position, 0.14)
    }
    camera.position.copy(target).add(new Vector3(0.13, 0.12, 1.45))
    camera.lookAt(target)
    return detail.kind === 'seal' || ['syringe', 'blade'].includes(detail.tip ?? '') ? [actor] : []
  }
  function aimSun({ detail, rival }: AimContext): Object3D[] | null {
    const sun = scene.getObjectByName(`rising-sun:${detail.side}`)
    if (!sun || !visible(sun)) return null
    sun.getWorldPosition(position)
    target.y += 1.2
    const distance = Math.max(5.3, target.distanceTo(position) * 2.2)
    target.lerp(position, 0.65)
    camera.position.copy(target).add(new Vector3(0, 0.25, distance))
    camera.lookAt(target)
    return [rival]
  }
  function aimImpact({ detail, state }: AimContext): Object3D[] {
    if (detail.anchors && aimCinematicFocus({ scene, figureOf, camera, state, detail })) return []
    target.set(
      fightWorldX(state[detail.side].x + (detail.offset?.x ?? 0)),
      fightWorldY(state[detail.side].y + (detail.offset?.y ?? 7)),
      0.15,
    )
    camera.position.copy(target).add(new Vector3(0.12, 0.12, 2.9))
    camera.lookAt(target)
    return []
  }
  function aimBody({ detail, state, rival }: AimContext): Object3D[] {
    const tall = Boolean(state[detail.side].biscuitTrueForm)
    target.y += detail.kind === 'armour' ? 1.45 : tall ? 1.3 : 1
    const distance = detail.kind === 'body' ? (tall ? 6.8 : 5.3) : 2.9
    camera.position.copy(target).add(new Vector3(0.12, 0.12, distance))
    camera.lookAt(target)
    return [rival]
  }
  const aims = {
    eyes: aimEyes,
    chain: aimChain,
    seal: aimChain,
    sun: aimSun,
    impact: aimImpact,
    body: aimBody,
    armour: aimBody,
  }
  function aim(detail: CameraDetail, state: FightState): Object3D[] | null {
    const actor = figureOf(detail.side)
    if (!visible(actor) && detail.kind !== 'focus') return null
    actor.updateWorldMatrix(true, true)
    actor.getWorldPosition(target)
    const rival = figureOf(detail.side === 'player' ? 'opponent' : 'player')
    if (detail.kind === 'focus') {
      if (!aimCinematicFocus({ scene, figureOf, camera, state, detail })) return null
      return detail.isolate ? [rival] : []
    }
    let hidden = aims[detail.kind]({ detail, state, actor, rival })
    if (!hidden && detail.anchors && aimCinematicFocus({ scene, figureOf, camera, state, detail }))
      hidden = []
    camera.updateMatrixWorld(true)
    return hidden
  }

  return {
    draw(options: {
      renderer: WebGLRenderer
      state: FightState
      detail: CameraDetail
      rect: CameraDetailRect
    }): boolean {
      const { renderer, state, detail, rect } = options
      camera.aspect =
        (rect.width * renderer.domElement.clientWidth) /
        (rect.height * renderer.domElement.clientHeight)
      camera.updateProjectionMatrix()
      const hidden = aim(detail, state)
      if (!hidden) return false
      const visibility = hidden.map((node) => node.visible)
      const oldTarget = renderer.getRenderTarget()
      renderer.getViewport(viewport)
      renderer.getScissor(scissor)
      const scissorTest = renderer.getScissorTest()
      const autoClear = renderer.autoClear
      const fog = scene.fog
      try {
        hidden.forEach((node) => {
          node.visible = false
        })
        // Fog is tuned to the main camera's distance, not a face or chain tip.
        scene.fog = null
        renderer.setRenderTarget(null)
        const width = renderer.domElement.clientWidth
        const height = renderer.domElement.clientHeight
        renderer.setViewport(
          rect.x * width,
          (1 - rect.y - rect.height) * height,
          rect.width * width,
          rect.height * height,
        )
        renderer.setScissor(
          rect.x * width,
          (1 - rect.y - rect.height) * height,
          rect.width * width,
          rect.height * height,
        )
        renderer.setScissorTest(true)
        renderer.autoClear = true
        renderer.render(scene, camera)
      } finally {
        scene.fog = fog
        hidden.forEach((node, index) => {
          node.visible = visibility[index]
        })
        renderer.autoClear = autoClear
        renderer.setRenderTarget(oldTarget)
        renderer.setViewport(viewport)
        renderer.setScissor(scissor)
        renderer.setScissorTest(scissorTest)
      }
      return true
    },
  }
}
