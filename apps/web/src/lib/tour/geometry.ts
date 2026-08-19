import type { Ship } from "./blueprint"
import type { Stood } from "./hatsu"
import type { Vec2, Space } from "./types"

export function wanderOffset(id: string, seconds: number): Vec2 {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 360
  const angle = seconds * 0.6 + (phase * Math.PI) / 180
  return [Math.cos(angle) * 1.4, Math.sin(angle) * 1.4]
}
export function danceOffset(id: string, seconds: number): [number, number, number] {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 360
  const beat = seconds * 3.4 + (phase * Math.PI) / 180
  // Off the floor and down again — the rise is `abs`, because a thing that
  // dropped as far below its floor as it rose above it is a thing falling
  // through the deck.
  return [Math.sin(beat * 0.5) * 0.12, Math.abs(Math.sin(beat)) * 0.24, Math.cos(beat * 0.5) * 0.12]
}
export function driftOffset(id: string, seconds: number): [number, number, number, number] {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 360
  const own = (phase * Math.PI) / 180
  // Up and held up: the rise is an offset sine about a metre off the deck
  // rather than one that touches down, because a thing that came back to the
  // floor every few seconds is a thing being bounced rather than one adrift.
  const rise = 1.05 + Math.sin(seconds * 0.5 + own) * 0.45
  return [
    Math.sin(seconds * 0.37 + own) * 0.9,
    rise,
    Math.sin(seconds * 0.29 + own * 1.7) * 0.9,
    seconds * 0.33 + own,
  ]
}
export function distanceTo(
  ship: Ship,
  target: Space,
  from: Stood,
): { metres: number; decks: number } {
  const { at, standingIn } = from
  const centre = centroid(target)
  const here = standingIn ? ship.spaces.get(standingIn) : null
  const fromTier = here ? ship.tiers.findIndex((tier) => tier.id === here.tierId) : -1
  const toTier = ship.tiers.findIndex((tier) => tier.id === target.tierId)
  return {
    metres: Math.round(Math.hypot(centre[0] - at[0], centre[1] - at[1])),
    decks: fromTier < 0 || toTier < 0 ? 0 : Math.abs(toTier - fromTier),
  }
}
export function centroid(space: Space): Vec2 {
  const sum = space.footprint.reduce<[number, number]>(
    (total, point) => [total[0] + point[0], total[1] + point[1]],
    [0, 0],
  )
  return [sum[0] / space.footprint.length, sum[1] / space.footprint.length]
}
