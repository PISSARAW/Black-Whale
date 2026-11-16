import { paperState, paperZonePoint, PAPER_ZONES } from './kallutoPaper'
import { paperListening } from './kallutoListening'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Physical scraps remain visible on the body; the stream is paper, never a blast. */
export function createKallutoPaperScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const geometry = new THREE.BoxGeometry(0.1, 0.15, 0.015)
  const material = new THREE.MeshBasicMaterial({ color: 0xf4e9e5 })
  const group = new THREE.Group()
  group.name = 'kalluto-paper'
  const fragments = Array.from({ length: 8 }, () => new THREE.Mesh(geometry, material))
  const stream = Array.from({ length: 32 }, () => new THREE.Mesh(geometry, material))
  const dolls = (['player', 'opponent'] as const).map(() => {
    const doll = new THREE.Group()
    const body = new THREE.Mesh(geometry, material)
    body.scale.set(1.5, 2, 1)
    const head = new THREE.Mesh(geometry, material)
    head.position.y = 0.23
    const arms = new THREE.Mesh(geometry, material)
    arms.scale.set(3, 0.6, 1)
    const legs = [-1, 1].map((sign) => {
      const leg = new THREE.Mesh(geometry, material)
      leg.position.set(sign * 0.07, -0.2, 0)
      leg.scale.set(0.6, 1.5, 1)
      return leg
    })
    doll.add(body, head, arms, ...legs)
    return doll
  })
  group.add(...fragments, ...stream, ...dolls)
  scene.add(group)
  return {
    sync: (state, seconds) => {
      fragments.forEach((mesh, index) => {
        const side: FightSide = index < 4 ? 'player' : 'opponent'
        const fighter = state[side]
        const zone = PAPER_ZONES[index % 4]
        mesh.visible = Boolean(fighter.plantedPaper?.some((paper) => paper.zone === zone))
        const point = paperZonePoint(fighter, zone)
        mesh.position.set(worldX(point.x), worldY(point.y), 0.42)
        mesh.rotation.z = 0.4
      })
      syncStream(state, seconds)
      dolls.forEach((doll, index) => {
        const side = index === 0 ? 'player' : 'opponent'
        const fighter = state[side]
        doll.visible = Boolean(paperState(fighter).doll)
        const point = paperZonePoint(fighter, 'hands')
        doll.position.set(worldX(point.x) + fighter.facing * 0.22, worldY(point.y) + 0.2, 0.5)
        doll.rotation.z = paperListening(state, side) ? Math.sin(seconds * 3) * 0.08 : 0
      })
    },
    dispose: () => {
      scene.remove(group)
      geometry.dispose()
      material.dispose()
    },
  }
  function syncStream(state: FightState, seconds: number) {
    const shots = state.projectiles.filter((shot) => shot.kallutoPaper === 'serpent')
    stream.forEach((mesh, index) => {
      const shot = shots[Math.floor(index / 16)]
      mesh.visible = Boolean(shot)
      if (!shot) return
      const trail = index % 16
      mesh.position.set(
        worldX(shot.x) - Math.sign(shot.velocityX) * trail * 0.035,
        worldY(shot.y) + Math.sin(seconds * 12 - trail * 0.5) * trail * 0.009,
        0.35,
      )
      mesh.rotation.z = seconds * 7 + index
    })
  }
}
