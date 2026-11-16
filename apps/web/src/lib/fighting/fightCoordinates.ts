/** Shared simulation-to-scene conversion for bodies, effects and collision diagnostics. */
export const FIGHT_WORLD_X = 0.115
export const FIGHT_WORLD_Y = 0.12
export const fightWorldX = (value: number): number => (value - 50) * FIGHT_WORLD_X
export const fightWorldY = (value: number): number => value * FIGHT_WORLD_Y
