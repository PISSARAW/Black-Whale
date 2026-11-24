import type { MoveFollowUp, MoveFollowUpCondition, MoveFollowUpInput } from './movesetTypes'
import { moveById } from './movesets'
import { followUpPhysicsFor } from './moveFollowUpPhysics'

const CONDITION_LABELS: Record<MoveFollowUpCondition, readonly [string, string]> = {
  'on-hit': ['Sur touche', 'On hit'],
  'on-block': ['Sur garde', 'On block'],
  airborne: ['Cible / corps en l’air', 'Airborne'],
  crossed: ['Après traversée', 'After crossing'],
  counter: ['Sur contre', 'On counter'],
}

const INPUT_KEYS: Record<MoveFollowUpInput, string> = {
  light: 'J',
  heavy: 'K',
  special: 'L',
}

export interface FollowUpDisplayRow {
  id: string
  name: string
  sourceName: string
  input: string
  condition: string
  tags: readonly string[]
}

export function formatFollowUpRow(entry: MoveFollowUp, language: 'fr' | 'en'): FollowUpDisplayRow {
  const fr = language === 'fr'
  const source = moveById(entry.sourceMoveId)
  const key = INPUT_KEYS[entry.input]
  const input = entry.condition === 'crossed' ? `← + ${key}` : key
  return {
    id: entry.id,
    name: fr ? entry.move.nameFr : entry.move.nameEn,
    sourceName: source ? (fr ? source.nameFr : source.nameEn) : entry.sourceMoveId,
    input,
    condition: CONDITION_LABELS[entry.condition][fr ? 0 : 1],
    tags: followUpTags(entry.id, fr),
  }
}

function followUpTags(id: string, fr: boolean): string[] {
  const physics = followUpPhysicsFor(id)
  if (!physics) return []
  const tags: string[] = []
  if (physics.launchVelocityY) tags.push(fr ? 'Projection aérienne' : 'Launcher')
  if (physics.crossesPushbox) tags.push(fr ? 'Traversant' : 'Cross-up')
  if (physics.guard === 'low') tags.push(fr ? 'Bas' : 'Low')
  if (physics.guard === 'overhead') tags.push('Overhead')
  return tags
}
