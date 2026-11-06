import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'
import type { Structure } from './types'

export const PRISON = {
  steel: 0x777e80,
  dark: 0x363b3d,
  linen: 0xd4d1c6,
  seam: 0xa09e94,
  wood: 0x6d6050,
  ceramic: 0xdbdcd4,
}

/** Local fixture coordinates follow the walked solid, including Hatsu rotations. */
export class PrisonFixture {
  constructor(
    readonly into: BanquetDetailBuilder,
    readonly THREE: typeof Three,
    readonly placement: { structure: Structure; floor: number },
  ) {}

  add(
    geometry: Three.BufferGeometry,
    options: {
      at: Point3
      colour: number
      rotation?: Point3
    },
  ): void {
    const { structure, floor } = this.placement
    const rotation = options.rotation ?? [0, 0, 0]
    geometry.rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2])
    geometry.translate(...options.at)
    geometry.rotateY((-structure.rotation * Math.PI) / 180)
    geometry.translate(structure.at[0], floor + structure.base, structure.at[1])
    this.into.add(geometry, { at: [0, 0, 0], colour: options.colour })
  }

  box(size: Point3, at: Point3, colour: number): void {
    this.add(new this.THREE.BoxGeometry(...size), { at, colour })
  }

  cylinder(size: readonly [number, number], at: Point3, colour: number): void {
    this.add(new this.THREE.CylinderGeometry(size[0], size[0], size[1], 16), { at, colour })
  }

  pillow(size: Point3, at: Point3): void {
    this.add(new this.THREE.SphereGeometry(1, 16, 8).scale(...size), {
      at,
      colour: PRISON.linen,
    })
  }

  ring(at: Point3, options: { radius: number; tube: number; rotation?: Point3 }): void {
    this.add(new this.THREE.TorusGeometry(options.radius, options.tube, 6, 20), {
      at,
      colour: PRISON.steel,
      rotation: options.rotation,
    })
  }
}
