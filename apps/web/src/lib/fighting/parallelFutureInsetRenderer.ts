import type * as Three from 'three'
import type { buildFightFigure, fightFigureKey } from './fighterFigure'
import type { CameraDetailRect } from './cinematicDetailLayout'
import type { FutureCameraView } from './parallelFutureCamera'
import { fitCinematicView } from './cinematicTrack'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { FIGHTER_FACING_ANGLE, trackFightOpponent } from './fighterFacing'
import { fightGroundContact } from './fightGroundContact'
import { createPresentedModelRefresh } from './refreshPresentedModel'
import { presentedFigures } from './presentation/figures'
import type { PresentationPreferences } from './presentation/collection'
import { disposeMountedVisitHatsu } from './visitHatsuModel'
import { createProjectileScene } from './projectileScene'
import { createFeitanScene } from './feitanScene'
import { createFighterEffectScene } from './fighterEffectScene'
import { arsenalProjectilePresentation } from './retrospectivePresentation'
import { createStrideClocks, FIGHT_MODEL_POSES } from './sceneMotion'
import type { FightComfort } from './fightComfort'
import type { FightSide, FightState } from './types'

type FigureBuilder = typeof buildFightFigure
type Resources = Pick<Parameters<FigureBuilder>[0], 'THREE' | 'glow'> & {
  geometry: <T extends Three.BufferGeometry>(made: T) => T
}
interface InsetOptions {
  resources: Resources
  build: FigureBuilder
  key: typeof fightFigureKey
  comfort: () => FightComfort
  preferences: () => PresentationPreferences
}

export function createParallelFutureInset(options: InsetOptions) {
  let inset: ReturnType<typeof createInsetScene> | null = null
  return {
    draw(
      renderer: Three.WebGLRenderer,
      view: {
        prediction: FutureCameraView | null
        rect: CameraDetailRect
        visible: boolean
        now: number
      },
    ) {
      const { prediction, rect, visible } = view
      if (!prediction || !visible) return
      inset ??= createInsetScene(options, prediction)
      inset.draw(renderer, { view: prediction, rect, frameStarted: view.now })
    },
    dispose: () => inset?.dispose(),
  }
}

function createInsetScene(options: InsetOptions, initial: FutureCameraView) {
  const { resources, build, key } = options
  const { THREE } = resources
  const scene = new THREE.Scene()
  scene.userData.fightView = 'prediction'
  scene.background = new THREE.Color(0x08131c)
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  const floor = new THREE.Mesh(
    resources.geometry(new THREE.PlaneGeometry(24, 12)),
    resources.glow(0x14242e, 1),
  )
  floor.rotation.x = -Math.PI / 2
  const light = new THREE.DirectionalLight(0xffe6c8, 1.8)
  light.position.set(-4, 8, 6)
  scene.add(floor, light, new THREE.AmbientLight(0xffffff, 1.8))

  let current = initial
  const { models, buildFighter, nenKey } = presentedFigures({
    build,
    key,
    resources,
    read: () => ({
      state: current.state,
      viewer: current.owner,
      preferences: options.preferences(),
    }),
  })
  scene.add(models.player.model.root, models.opponent.model.root)
  const modelOf = createPresentedModelRefresh({ scene, models, nenKey, buildFighter })
  const fx = {
    ...resources,
    scene,
    worldX: fightWorldX,
    worldY: fightWorldY,
    viewer: () => current.owner,
    comfort: options.comfort,
    figureOf: (side: FightSide) => models[side].model.turns,
  }
  const missiles = createProjectileScene(fx)
  const hatsu = createFighterEffectScene(fx)
  const feitan = createFeitanScene(fx)
  const viewport = createInsetViewport(THREE, scene, camera)
  const stride = createStrideClocks()
  const reaction = createFightReactionPresentation()
  let posed: FightState | null = null

  function pose(side: FightSide, seconds: number) {
    const { state } = current
    const actor = state[side]
    const rival = state[side === 'player' ? 'opponent' : 'player']
    const model = modelOf(side, actor)
    const bodyAngle = actor.facing * FIGHTER_FACING_ANGLE
    const x = fightWorldX(actor.x)
    model.root.position.set(x, fightWorldY(actor.y), 0)
    model.root.rotation.y = bodyAngle
    model.animate(seconds, FIGHT_MODEL_POSES[actor.pose], {
      motion: trackFightOpponent({
        fighter: actor,
        opponent: rival,
        bodyAngle,
        seconds,
        motion: fightBodyMotion({
          fighter: actor,
          seconds,
          ...reaction(state, side, { fighter: actor, seconds }),
        }),
      }),
      strideClock: stride(side, x, actor.facing),
      afterMotion: fightGroundContact(actor),
    })
  }

  return {
    draw(renderer: Three.WebGLRenderer, frame: InsetPass) {
      const { view } = frame
      current = view
      viewport.draw(renderer, {
        ...frame,
        pose: () => {
          if (posed === view.state) return
          posed = view.state
          const seconds = view.index / 60
          pose('player', seconds)
          pose('opponent', seconds)
          missiles.sync(arsenalProjectilePresentation(posed), seconds, posed[view.owner])
          hatsu.sync(posed, seconds)
          feitan.sync(posed, seconds)
        },
      })
    },
    dispose() {
      viewport.dispose()
      missiles.dispose()
      hatsu.dispose()
      feitan.dispose()
      for (const { model } of Object.values(models)) disposeMountedVisitHatsu(model.root)
    },
  }
}

interface InsetPass {
  view: FutureCameraView
  rect: CameraDetailRect
  frameStarted: number
}
interface InsetFrame extends InsetPass {
  pose: () => void
}

/** Refresh the inset up to 30 Hz and composite its texture on every displayed frame. */
function createInsetViewport(
  THREE: typeof Three,
  scene: Three.Scene,
  camera: Three.PerspectiveCamera,
) {
  const viewport = new THREE.Vector4()
  const scissor = new THREE.Vector4()
  const bounds = new THREE.Vector4()
  const target = new THREE.WebGLRenderTarget(384, 216)
  const geometry = new THREE.PlaneGeometry(2, 2)
  const material = new THREE.MeshBasicMaterial({ map: target.texture, toneMapped: false })
  const composite = new THREE.Scene()
  composite.userData.fightView = 'prediction-composite'
  composite.add(new THREE.Mesh(geometry, material))
  const quad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2)
  quad.position.z = 1
  let phase: FutureCameraView['phase'] | undefined
  let last = -Infinity

  function capture(renderer: Three.WebGLRenderer, { view, pose }: InsetFrame) {
    const aspect = bounds.z / bounds.w
    const height = Math.max(1, Math.round(target.width / aspect))
    if (target.height !== height) target.setSize(target.width, height)
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    const framing = fitCinematicView(view.cameraFrame, view.state, aspect)
    camera.position.set(framing.x, framing.y, framing.z)
    camera.lookAt(framing.x, framing.lookY, 0)
    pose()
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
  }

  return {
    draw(renderer: Three.WebGLRenderer, frame: InsetFrame) {
      const { clientWidth: width, clientHeight: height } = renderer.domElement
      if (!width || !height) return
      const { rect, view } = frame
      bounds.set(
        rect.x * width,
        (1 - rect.y - rect.height) * height,
        rect.width * width,
        rect.height * height,
      )
      const previous = renderer.getRenderTarget()
      renderer.getViewport(viewport)
      renderer.getScissor(scissor)
      const scissorTest = renderer.getScissorTest()
      const autoClear = renderer.autoClear
      try {
        renderer.autoClear = true
        const now = performance.now()
        const hasHeadroom = now - frame.frameStarted < 12
        const elapsed = now - last
        if (!phase || elapsed >= 68 || (hasHeadroom && (phase !== view.phase || elapsed >= 31))) {
          capture(renderer, frame)
          phase = view.phase
          last = now
        }
        renderer.setRenderTarget(previous)
        renderer.setViewport(bounds)
        renderer.setScissor(bounds)
        renderer.setScissorTest(true)
        renderer.render(composite, quad)
      } finally {
        renderer.autoClear = autoClear
        renderer.setRenderTarget(previous)
        renderer.setViewport(viewport)
        renderer.setScissor(scissor)
        renderer.setScissorTest(scissorTest)
      }
    },
    dispose() {
      target.dispose()
      geometry.dispose()
      material.dispose()
    },
  }
}
