import type * as Three from 'three'
import { floorOf, type Ship } from './blueprint'
import { MELODY_CONCERT, type ConcertPerformance } from './melodyConcert'
import { buildConcertFlowers } from './concertFlowers'
import { disposeBanquetDetails } from './banquetDetailBuilder'

/** The single local stage spot of the flute solo; hidden outside the performance. */
export class ConcertStageView {
  readonly root: Three.Group
  private readonly beam: Three.Mesh
  private readonly pool: Three.Mesh

  constructor(THREE: typeof Three, scene: Three.Scene, ship: Ship) {
    const fixture = MELODY_CONCERT.performer
    const room = ship.spaces.get(fixture.spaceId)!
    const plan = ship.plans.get(room.tierId)!
    const stage = plan.structures.find(({ id }) => id === 'tier-1-banquet-hall-stage')!
    const floor = floorOf(room, plan.tier) + stage.base + stage.height + 0.07
    const [x, z] = fixture.at
    this.root = new THREE.Group()
    this.root.name = 'melody-concert-spotlight'
    this.root.visible = false
    this.beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 6.8, 32, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfff4d9,
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    this.beam.position.set(x, floor + 3.4, z)
    this.pool = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfff4d9,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    )
    this.pool.rotation.x = -Math.PI / 2
    this.pool.position.set(x, floor, z)
    const spot = new THREE.SpotLight(0xfff4e7, 26, 9, Math.atan2(0.72, 6.8), 0.55, 1)
    spot.position.set(x, floor + 6.8, z)
    spot.target.position.set(x, floor, z)
    this.root.add(this.beam, this.pool, spot, spot.target)
    this.root.add(buildConcertFlowers(THREE, ship))
    scene.add(this.root)
  }

  update(performance: ConcertPerformance, context: { tierId: string; reveal: boolean }): void {
    this.root.visible = performance.playing && context.tierId === 'tier-1' && !context.reveal
  }

  dispose(): void {
    disposeBanquetDetails(this.root)
    this.root.clear()
  }
}
