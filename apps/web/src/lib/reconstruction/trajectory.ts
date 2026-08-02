export interface Point {
  x: number
  y: number
}

export function trajectoryPath(from: Point, to: Point): string {
  const bend = Math.max(3, Math.abs(to.x - from.x) * 0.18)
  const controlX = (from.x + to.x) / 2 + (from.y === to.y ? 0 : bend)
  const controlY = (from.y + to.y) / 2 - (from.y === to.y ? 3 : 0)
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`
}
