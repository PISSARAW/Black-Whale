import type { Object3D } from 'three'
import type { FightSide } from './types'

export function retainSpeedFigure(
  previous: Map<FightSide, Object3D>,
  side: FightSide,
  figure: Object3D | undefined,
): void {
  const old = previous.get(side)
  if (old && old !== figure) old.visible = true
  if (figure) previous.set(side, figure)
}
