import type * as Three from 'three'
import { floorOf, type Ship } from './blueprint'
import type { Vec2 } from './types'
import { MELODY_CONCERT, type ConcertPerformance } from './melodyConcert'
import { buildConcertLandscape } from './concertLandscape'
import { ConcertLandscapeWalk, type ConcertLandscapeSpec } from './concertLandscapeWalk'
import { ConcertDreamView, CONCERT_DREAM_LAYER } from './ConcertDreamView'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { concertReferencePosition } from './concertReference'

interface ConcertContext {
  tierId: string
  reveal: boolean
  delta?: number
}
interface ConcertWalkFrame extends ConcertContext {
  at: Vec2
  velocity: Vec2
  delta: number
}

/** The concert owns an imagined landscape, never a replacement physical ship plan. */
export class ConcertStageView {
  readonly root: Three.Group
  private readonly spec: ConcertLandscapeSpec | null
  private readonly dream: ConcertDreamView
  private walk: ConcertLandscapeWalk | null = null
  private bodyAt: Vec2 | null = null
  private blend = 0

  constructor(
    private readonly THREE: typeof Three,
    scene: Three.Scene,
    ship: Ship,
  ) {
    this.root = new THREE.Group()
    this.root.name = 'melody-concert-landscape'
    this.root.visible = false
    this.dream = new ConcertDreamView(THREE, scene)
    const room = ship.spaces.get(MELODY_CONCERT.performer.spaceId)
    const plan = room ? ship.plans.get(room.tierId) : undefined
    const stage = plan?.structures.find(({ id }) => id === 'tier-1-banquet-hall-stage')
    this.spec =
      room && plan && stage
        ? {
            origin: [MELODY_CONCERT.performer.at[0], MELODY_CONCERT.performer.at[1]],
            floor: floorOf(room, plan.tier),
            stageRise: stage.base + stage.height,
          }
        : null
    if (this.spec) scene.add(this.root)
  }

  get active(): boolean {
    return this.root.visible
  }

  update(performance: ConcertPerformance, context: ConcertContext): void {
    const wanted =
      !!this.spec && performance.playing && context.tierId === 'tier-1' && !context.reveal
    if (wanted && !this.root.children.length) this.build()
    const seconds = Math.min(0.1, Math.max(0, context.delta ?? 1 / 60))
    this.blend = Math.max(0, Math.min(1, this.blend + seconds * (wanted ? 0.9 : -1.35)))
    this.root.visible = this.blend > 0 && context.tierId === 'tier-1' && !context.reveal
    this.fadeLandscape(this.blend)
    if (!this.root.visible) {
      this.dream.restore()
      this.walk = null
      this.bodyAt = null
    }
  }

  move(performance: ConcertPerformance, frame: ConcertWalkFrame): Vec2 {
    const wasActive = this.active
    this.update(performance, frame)
    if (!this.active || !this.spec) return wasActive ? [0, 0] : frame.velocity
    if (!this.walk || this.bodyAt?.[0] !== frame.at[0] || this.bodyAt?.[1] !== frame.at[1]) {
      const start =
        performance.presentation === 'manga' ? concertReferencePosition(this.spec) : frame.at
      this.walk = new ConcertLandscapeWalk(this.spec, start)
      this.bodyAt = [...frame.at]
    }
    this.walk.move(frame.velocity, frame.delta)
    return frame.velocity
  }

  render(frame: Parameters<ConcertDreamView['apply']>[0], performance: ConcertPerformance): void {
    if (this.active && this.walk) this.dream.apply(frame, this.walk, performance, this.blend)
  }

  dispose(): void {
    this.dream.restore()
    this.root.traverse((object) => {
      if ((object as Three.InstancedMesh).isInstancedMesh) (object as Three.InstancedMesh).dispose()
      if ((object as Three.Points).isPoints) {
        const points = object as Three.Points
        points.geometry.dispose()
        const materials = Array.isArray(points.material) ? points.material : [points.material]
        for (const material of materials) material.dispose()
      }
      if ((object as Three.LineSegments).isLineSegments) {
        const line = object as Three.LineSegments
        line.geometry.dispose()
        const materials = Array.isArray(line.material) ? line.material : [line.material]
        for (const material of materials) material.dispose()
      }
    })
    disposeBanquetDetails(this.root)
    this.root.clear()
  }

  private build(): void {
    this.root.add(buildConcertLandscape(this.THREE, this.spec!))
    this.root.traverse((object) => object.layers.set(CONCERT_DREAM_LAYER))
  }

  private fadeLandscape(alpha: number): void {
    this.root.traverse((object) => {
      if (
        !(object as Three.Mesh).isMesh &&
        !(object as Three.Points).isPoints &&
        !(object as Three.LineSegments).isLineSegments
      )
        return
      const raw = (object as Three.Mesh).material as Three.Material | Three.Material[]
      const materials: Three.Material[] = Array.isArray(raw) ? raw : [raw]
      for (const material of materials) {
        if (!material || !('opacity' in material)) continue
        const state = material.userData.concertFade ?? {
          opacity: material.opacity,
          transparent: material.transparent,
        }
        material.userData.concertFade = state
        material.transparent = state.transparent || alpha < 0.999
        material.opacity = state.opacity * alpha
      }
    })
  }
}
