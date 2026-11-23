import { createFightPost, createFightRenderResources } from './fightRenderer'
import type { FightGraphics } from './fightGraphics'
import type { FightStageId } from './stages'
import type { FightState } from './types'

interface StageOptions {
  canvas: HTMLCanvasElement
  graphics?: FightGraphics
  stageId: FightStageId
  state: () => FightState
  reducedMotion: boolean
  disposed: () => boolean
}

/** Mount the WebGL context and asynchronously load the selected arena. */
export async function loadFightStage(options: StageOptions) {
  const { canvas, graphics, stageId, state, reducedMotion, disposed } = options
  const [THREE, { buildFightScenery }] = await Promise.all([
    import('three'),
    import('./stageScenery'),
  ])
  if (disposed()) return null

  const resources = createFightRenderResources(THREE, canvas, graphics)
  let releaseScenery = () => {}
  try {
    const { renderer } = resources
    const scene = new THREE.Scene()
    scene.userData.fightView = 'primary'
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    camera.position.set(0, 2.25, 9.2)
    const scenery = await buildFightScenery({ ...resources, THREE }, stageId, {
      fight: state,
      reducedMotion,
    })
    releaseScenery = scenery.dispose
    if (disposed()) {
      scenery.dispose()
      resources.dispose()
      return null
    }
    renderer.localClippingEnabled = scenery.clipped
    renderer.setClearColor(scenery.fog.colour, 1)
    scene.fog =
      scenery.fog.kind === 'exp2'
        ? new THREE.FogExp2(scenery.fog.colour, scenery.fog.density)
        : new THREE.Fog(scenery.fog.colour, scenery.fog.near, scenery.fog.far)
    camera.far = Math.max(100, scenery.cameraFar)
    scene.add(scenery.root)
    const post = await createFightPost({
      THREE,
      renderer,
      scene,
      camera,
      bloom: scenery.bloom,
      graphics,
    })
    const dispose = () => {
      post?.dispose()
      scenery.dispose()
      resources.dispose()
    }
    if (disposed()) {
      dispose()
      return null
    }
    return { THREE, ...resources, scene, camera, scenery, post, dispose }
  } catch (error) {
    releaseScenery()
    resources.dispose()
    throw error
  }
}
