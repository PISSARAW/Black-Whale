import { retainSpeedFigure } from './fightSpeedVisibility'
import { motionOf } from './fighterMovement'
import { feitanSpeedActive, feitanSpeedBodyVisible } from './feitanIdentity'
import type { FightComfort } from './fightComfort'
import type { FightSide, FightState } from './types'

interface Echo {
  root: import('three').Object3D
  born: number
  material: import('three').MeshBasicMaterial
}

interface Accent {
  mesh: import('three').Mesh
  born: number
  life: number
}

/** Full-body shutter echoes, speed cuts and floor dust unique to Feitan. */
export function createFeitanSpeedScene(options: {
  THREE: typeof import('three')
  scene: import('three').Scene
  figureOf: (side: FightSide) => import('three').Object3D | undefined
  comfort: () => FightComfort
  worldX: (value: number) => number
  worldY: (value: number) => number
}) {
  const { THREE, scene } = options
  const echoes: Echo[] = []
  const accents: Accent[] = []
  const previousFrame = new Map<FightSide, number>()
  const previousFigure = new Map<FightSide, import('three').Object3D>()
  const lineGeometry = new THREE.BoxGeometry(0.62, 0.012, 0.012)
  const dustGeometry = new THREE.RingGeometry(0.05, 0.09, 16)
  const lines = new Map<FightSide, import('three').Group>()

  for (const side of ['player', 'opponent'] as const) {
    const group = new THREE.Group()
    group.name = `feitan-speed-lines:${side}`
    for (let i = 0; i < 6; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xd9e3ea : 0x768391,
        transparent: true,
        opacity: 0.2 - i * 0.018,
        depthWrite: false,
        fog: false,
      })
      const line = new THREE.Mesh(lineGeometry, material)
      line.position.set(-i * 0.12, 0.22 + (i % 3) * 0.27, -0.06 - i * 0.012)
      line.scale.x = 1 - i * 0.08
      group.add(line)
    }
    group.visible = false
    scene.add(group)
    lines.set(side, group)
  }

  function spawnEcho(side: FightSide, source: import('three').Object3D, now: number) {
    source.updateWorldMatrix(true, true)
    const root = source.clone(true)
    root.name = `feitan-afterimage:${side}`
    root.matrixAutoUpdate = true
    source.matrixWorld.decompose(root.position, root.quaternion, root.scale)
    const material = new THREE.MeshBasicMaterial({
      color: 0x18202a,
      transparent: true,
      opacity: 0.32,
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

  function spawnDust(side: FightSide, state: FightState, now: number) {
    const fighter = state[side]
    for (let i = 0; i < 3; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xa8a4a0,
        transparent: true,
        opacity: 0.24 - i * 0.045,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(dustGeometry, material)
      mesh.name = `feitan-dash-dust:${side}`
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(
        options.worldX(fighter.x) - fighter.facing * i * 0.045,
        0.025,
        0.05 + i * 0.025,
      )
      scene.add(mesh)
      accents.push({ mesh, born: now + i * 18, life: 210 + i * 25 })
    }
  }

  function showSpeedLines(
    state: FightState,
    side: FightSide,
    { enabled, figure }: { enabled: boolean; figure: ReturnType<typeof options.figureOf> },
  ) {
    const fighter = state[side]
    const active = enabled && state.phase === 'fighting' && feitanSpeedActive(fighter)
    lines.get(side)!.visible = active
    if (active) {
      const group = lines.get(side)!
      group.position.set(options.worldX(fighter.x), options.worldY(fighter.y) + 0.18, 0.1)
      group.scale.x = fighter.facing
    }
    if (figure) figure.visible = !enabled || feitanSpeedBodyVisible(fighter)
    return active
  }

  return {
    sync(state: FightState, now: number) {
      const enabled = options.comfort().flashes
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const figure = options.figureOf(side)
        retainSpeedFigure(previousFigure, side, figure)
        const dash = motionOf(fighter).dash
        const active = showSpeedLines(state, side, { enabled, figure })
        if (!active || !dash || !figure) {
          previousFrame.delete(side)
          continue
        }
        if (previousFrame.get(side) === dash.frame) continue
        previousFrame.set(side, dash.frame)
        if ([1, 4, 8].includes(dash.frame)) spawnEcho(side, figure, now)
        if (dash.frame === 1) spawnDust(side, state, now)
      }
    },
    animate(now: number) {
      for (let i = echoes.length - 1; i >= 0; i--) {
        const echo = echoes[i]
        const age = now - echo.born
        echo.material.opacity = Math.max(0, 0.32 * (1 - age / 170))
        echo.root.scale.x *= 1.002
        if (age >= 170 || !options.comfort().flashes) {
          scene.remove(echo.root)
          echo.material.dispose()
          echoes.splice(i, 1)
        }
      }
      for (let i = accents.length - 1; i >= 0; i--) {
        const accent = accents[i]
        const age = now - accent.born
        accent.mesh.visible = age >= 0
        if (age >= 0) {
          const progress = age / accent.life
          accent.mesh.scale.setScalar(1 + progress * 5)
          ;(accent.mesh.material as import('three').MeshBasicMaterial).opacity = Math.max(
            0,
            0.24 * (1 - progress),
          )
        }
        if (age >= accent.life || !options.comfort().flashes) {
          scene.remove(accent.mesh)
          ;(accent.mesh.material as import('three').Material).dispose()
          accents.splice(i, 1)
        }
      }
    },
    dispose() {
      previousFigure.forEach((figure) => (figure.visible = true))
      echoes.forEach(({ root, material }) => {
        scene.remove(root)
        material.dispose()
      })
      accents.forEach(({ mesh }) => {
        scene.remove(mesh)
        ;(mesh.material as import('three').Material).dispose()
      })
      lines.forEach((group) => {
        scene.remove(group)
        group.traverse((node) => {
          if (node instanceof THREE.Mesh) (node.material as import('three').Material).dispose()
        })
      })
      lineGeometry.dispose()
      dustGeometry.dispose()
      echoes.length = 0
      accents.length = 0
      lines.clear()
    },
  }
}
