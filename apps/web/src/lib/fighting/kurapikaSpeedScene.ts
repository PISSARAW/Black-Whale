import { retainSpeedFigure } from './fightSpeedVisibility'
import { motionOf } from './fighterMovement'
import type { FightComfort } from './fightComfort'
import { kurapikaSpeedActive, kurapikaSpeedBodyVisible } from './kurapikaIdentity'
import type { FightSide, FightState } from './types'

interface Echo {
  root: import('three').Object3D
  born: number
  material: import('three').MeshBasicMaterial
}

/** 1999-style full-body echoes and shutter cuts; the simulated body is never moved or disabled. */
export function createKurapikaSpeedScene(options: {
  THREE: typeof import('three')
  scene: import('three').Scene
  figureOf: (side: FightSide) => import('three').Object3D | undefined
  comfort: () => FightComfort
}) {
  const { THREE, scene } = options
  const echoes: Echo[] = []
  const previousFrame = new Map<FightSide, number>()
  const previousFigure = new Map<FightSide, import('three').Object3D>()

  function spawnEcho(
    side: FightSide,
    source: import('three').Object3D,
    { now, scarlet }: { now: number; scarlet: boolean },
  ) {
    source.updateWorldMatrix(true, true)
    const root = source.clone(true)
    root.name = `kurapika-afterimage:${side}`
    source.matrixWorld.decompose(root.position, root.quaternion, root.scale)
    const material = new THREE.MeshBasicMaterial({
      color: scarlet ? 0xc94760 : 0x7897ba,
      transparent: true,
      opacity: 0.27,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    })
    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.material = material
        node.renderOrder = -1
      }
    })
    scene.add(root)
    echoes.push({ root, born: now, material })
  }

  function showKuraBody(
    fighter: FightState['player'],
    figure: ReturnType<typeof options.figureOf>,
    enabled: boolean,
  ) {
    // Other presentation scenes own other fighters' visibility (notably Feitan's shutter cut).
    if (figure && fighter.id === 'kurapika')
      figure.visible = !enabled || kurapikaSpeedBodyVisible(fighter)
  }

  return {
    sync(state: FightState, now: number) {
      const enabled = options.comfort().flashes
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const figure = options.figureOf(side)
        retainSpeedFigure(previousFigure, side, figure)
        showKuraBody(fighter, figure, enabled)
        const dash = motionOf(fighter).dash
        if (
          !enabled ||
          state.phase !== 'fighting' ||
          !kurapikaSpeedActive(fighter) ||
          !dash ||
          !figure
        ) {
          previousFrame.delete(side)
          continue
        }
        if (previousFrame.get(side) === dash.frame) continue
        previousFrame.set(side, dash.frame)
        if ([1, 4, 8].includes(dash.frame))
          spawnEcho(side, figure, { now, scarlet: Boolean(fighter.kurapika?.emperorTime) })
      }
    },
    animate(now: number) {
      for (let i = echoes.length - 1; i >= 0; i--) {
        const echo = echoes[i]
        const age = now - echo.born
        echo.material.opacity = Math.max(0, 0.27 * (1 - age / 155))
        if (age >= 155 || !options.comfort().flashes) {
          scene.remove(echo.root)
          echo.material.dispose()
          echoes.splice(i, 1)
        }
      }
    },
    dispose() {
      previousFigure.forEach((figure) => (figure.visible = true))
      echoes.forEach(({ root, material }) => {
        scene.remove(root)
        material.dispose()
      })
      echoes.length = 0
      previousFrame.clear()
      previousFigure.clear()
    },
  }
}
