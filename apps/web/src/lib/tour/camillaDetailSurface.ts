import type * as Three from 'three'
import type { Structure } from './types'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'

// Original finishes interpreting monochrome panels, not published colours.
export const CAMILLA_CARPET = 0x858176
export const CAMILLA_GOLD = 0xa78e60
export const CAMILLA_WOOD = 0x695543
export const CAMILLA_VELVET = 0x635454
export const CAMILLA_SILK = 0xe8e1d1
export const CAMILLA_PORCELAIN = 0xf1eee3
export const CAMILLA_SILVER = 0xc2c5bf
export const CAMILLA_STONE = 0xc7bfac

/** Unit coordinates stay inside the current solid's walked footprint and height. */
export class CamillaSurface {
  private readonly matrix: Three.Matrix4

  constructor(
    readonly into: BanquetDetailBuilder,
    readonly THREE: typeof Three,
    readonly placement: { structure: Structure; floor: number },
  ) {
    const { structure: s, floor } = placement
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
    options: { at: Point3; colour: number; rotation?: Point3 },
  ): void {
    const r = options.rotation ?? [0, 0, 0]
    geometry
      .rotateX(r[0])
      .rotateY(r[1])
      .rotateZ(r[2])
      .translate(...options.at)
    geometry.applyMatrix4(this.matrix)
    this.into.add(geometry, { at: [0, 0, 0], colour: options.colour })
  }

  box(size: Point3, at: Point3, colour: number): void {
    this.add(new this.THREE.BoxGeometry(...size), { at, colour })
  }

  sphere(size: Point3, at: Point3, colour: number): void {
    this.add(new this.THREE.SphereGeometry(1, 12, 6).scale(...size), { at, colour })
  }

  cylinder(
    size: { radius: number; height: number; bottom?: number },
    at: Point3,
    colour: number,
  ): void {
    this.add(
      new this.THREE.CylinderGeometry(size.radius, size.bottom ?? size.radius, size.height, 20),
      { at, colour },
    )
  }

  /** Keep plates and glasses circular even when the supporting table is rectangular. */
  roundCylinder(
    size: { radius: number; height: number; bottom?: number },
    at: Point3,
    colour: number,
  ): void {
    const s = this.placement.structure
    const geometry = new this.THREE.CylinderGeometry(
      size.radius,
      size.bottom ?? size.radius,
      size.height,
      20,
    )
    geometry.scale(1 / s.size[0], 1 / s.height, 1 / s.size[1])
    this.add(geometry, { at, colour })
  }

  curve(points: readonly Point3[], radius: number, colour: number): void {
    const path = new this.THREE.CatmullRomCurve3(
      points.map((point) => new this.THREE.Vector3(...point)),
    )
    this.add(new this.THREE.TubeGeometry(path, 12, radius, 5, false), { at: [0, 0, 0], colour })
  }
}
