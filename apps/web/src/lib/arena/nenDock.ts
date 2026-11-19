import type { BodyZone, FighterState } from '../combat/types'
import type { ArenaCommand } from './nenCommands'

/**
 * Clash's Nen bar, read from Arena's fighter. Ten is what a body does when no
 * other technique is held, so it is lit by default; Ko is one technique among
 * the others, engaged for the next move, never the resting state.
 */
export type DockTechnique = 'ten' | 'ren' | 'ken' | 'zetsu' | 'gyo' | 'in' | 'ko'

export interface DockTechniqueButton {
  id: DockTechnique
  /** The Arena key that already drives it through the shared Nen controller. */
  key: string
  label: string
  active: boolean
}

type DockFighter = Pick<FighterState, 'mode' | 'ken' | 'gyo' | 'in' | 'ko'>

const KEYS: Record<DockTechnique, string> = {
  ten: 'T',
  ren: 'R',
  ken: 'K',
  zetsu: 'X',
  gyo: 'G',
  in: 'I',
  ko: 'C',
}

const LABELS: Record<DockTechnique, string> = {
  ten: 'Ten',
  ren: 'Ren',
  ken: 'Ken',
  zetsu: 'Zetsu',
  gyo: 'Gyo',
  in: 'In',
  ko: 'Ko',
}

const ORDER: readonly DockTechnique[] = ['ten', 'ren', 'ken', 'zetsu', 'gyo', 'in', 'ko']

function isActive(fighter: DockFighter, id: DockTechnique): boolean {
  if (id === 'ten') return fighter.mode === 'ten' && !fighter.ken && !fighter.ko
  if (id === 'ren') return fighter.mode === 'ren' && !fighter.ken
  if (id === 'zetsu') return fighter.mode === 'zetsu'
  if (id === 'ko') return fighter.ko !== null
  return fighter[id]
}

export function nenDockButtons(fighter: DockFighter): DockTechniqueButton[] {
  return ORDER.map((id) => ({
    id,
    key: KEYS[id],
    label: LABELS[id],
    active: isActive(fighter, id),
  }))
}

/**
 * What pressing a technique does. Ren and Zetsu fall back to Ten when pressed
 * again, the way releasing Clash's aura key does; Ko powers the striking limb
 * of the next move, the feet when aiming low.
 */
export function dockTechniqueCommand(
  fighter: DockFighter,
  id: DockTechnique,
  aimed: BodyZone,
): ArenaCommand {
  if (id === 'ko') {
    const zone = aimed === 'legs' ? 'legs' : 'arms'
    return { action: { type: 'KO', side: 'player', zone }, animation: 'ko' }
  }
  if (id === 'ken' || id === 'gyo' || id === 'in') {
    return {
      action: { type: id.toUpperCase() as 'KEN' | 'GYO' | 'IN', side: 'player', on: !fighter[id] },
      animation: id,
    }
  }
  const mode = id !== 'ten' && fighter.mode === id ? 'ten' : id
  return { action: { type: 'MODE', side: 'player', mode }, animation: mode }
}
