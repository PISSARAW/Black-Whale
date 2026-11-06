import type { Vec2 } from './types'

export interface ConcertLandscapeSpec {
  origin: Vec2
  floor: number
  stageRise: number
}

const smooth = (value: number): number => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

/** A gentle mound replaces the stage, retaining Melody's actual foot height. */
export function concertLandscapeHeight(spec: ConcertLandscapeSpec, at: Vec2): number {
  const x = at[0] - spec.origin[0]
  const z = at[1] - spec.origin[1]
  const radius = Math.hypot(x, z)
  const mound = spec.stageRise * (1 - smooth((radius - 0.8) / 3.2))
  const hills = Math.sin(x * 0.075) * Math.cos(z * 0.065) * 1.3
  return spec.floor + mound + hills * smooth((radius - 7) / 14)
}

/** Only the imagined position moves: furniture and the visitor's body stay put. */
export class ConcertLandscapeWalk {
  at: Vec2

  constructor(
    private readonly spec: ConcertLandscapeSpec,
    from: Vec2,
  ) {
    this.at = [...from]
  }

  move(velocity: Vec2, seconds: number): void {
    const x = this.at[0] + velocity[0] * seconds - this.spec.origin[0]
    const z = this.at[1] + velocity[1] * seconds - this.spec.origin[1]
    const scale = Math.min(1, 64 / Math.max(0.001, Math.hypot(x, z)))
    this.at = [this.spec.origin[0] + x * scale, this.spec.origin[1] + z * scale]
  }

  get floor(): number {
    return concertLandscapeHeight(this.spec, this.at)
  }
}
