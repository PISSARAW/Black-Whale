import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

/** Unit furniture coordinates transformed by the current walked solid, including its rotation. */
export class CasinoFixture {
  private readonly matrix: Three.Matrix4

  constructor(
    private readonly THREE: typeof Three,
    private readonly into: BanquetDetailBuilder,
    options: { structure: Structure; floor: number },
  ) {
    const { structure: s, floor } = options
    this.matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(s.at[0], floor + s.base, s.at[1]),
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        (-s.rotation * Math.PI) / 180,
      ),
      new THREE.Vector3(s.size[0], s.height, s.size[1]),
    )
  }

  add(
    geometry: Three.BufferGeometry,
    options: { at: Point3; colour: number; glow?: boolean; rotation?: Point3 },
  ): void {
    const r = options.rotation ?? [0, 0, 0]
    geometry
      .rotateX(r[0])
      .rotateY(r[1])
      .rotateZ(r[2])
      .translate(...options.at)
    geometry.applyMatrix4(this.matrix)
    this.into.add(geometry, { at: [0, 0, 0], colour: options.colour, glow: options.glow })
  }

  box(size: Point3, at: Point3, colour: number): void {
    this.add(new this.THREE.BoxGeometry(...size), { at, colour })
  }

  drum(options: {
    radius: number
    bottom?: number
    height: number
    at: Point3
    colour: number
  }): void {
    this.add(
      new this.THREE.CylinderGeometry(
        options.radius,
        options.bottom ?? options.radius,
        options.height,
        24,
      ),
      options,
    )
  }

  ring(options: {
    radius: number
    tube: number
    at: Point3
    colour: number
    vertical?: boolean
  }): void {
    this.add(new this.THREE.TorusGeometry(options.radius, options.tube, 4, 32), {
      ...options,
      rotation: options.vertical ? [0, 0, 0] : [Math.PI / 2, 0, 0],
    })
  }

  ball(at: Point3, radius: number, colour: number): void {
    this.add(new this.THREE.SphereGeometry(radius, 8, 5), { at, colour })
  }
}
