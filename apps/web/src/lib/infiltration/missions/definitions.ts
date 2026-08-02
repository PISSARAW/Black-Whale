import type { MissionDefinition, MissionId, MissionSelection } from './types'
import { seededRandom } from './random'

const commonWitnesses: MissionDefinition['witnesses'] = [
  { id: 'steward', spaceIndex: 2, social: true, usesEn: false, sight: 8 },
  { id: 'guard', spaceIndex: 4, social: false, usesEn: false, sight: 9 },
  { id: 'nenGuard', spaceIndex: 7, social: true, usesEn: true, sight: 11 },
]

const variants = (prefix: string): MissionDefinition['variants'] => [
  { id: `${prefix}-a`, routeOffset: 0, objectiveIndex: 7, decoyIndex: 5, authority: 'maintenance' },
  { id: `${prefix}-b`, routeOffset: 2, objectiveIndex: 6, decoyIndex: 7, authority: 'security' },
  { id: `${prefix}-c`, routeOffset: 4, objectiveIndex: 5, authority: 'service' },
]

export const MISSIONS: Record<MissionId, MissionDefinition> = {
  'missing-report': {
    id: 'missing-report', duration: 10 * 60, witnesses: commonWitnesses,
    teaching: ['movement', 'vision', 'sound', 'social', 'nen', 'traces', 'hatsu'],
    objectives: [
      { id: 'copy-report', kind: 'copy', required: true },
      { id: 'confirm-author', kind: 'identify', required: false },
      { id: 'extract', kind: 'extract', required: true },
    ],
    variants: variants('report'),
  },
  courier: {
    id: 'courier', duration: 15 * 60, witnesses: commonWitnesses,
    teaching: ['vision', 'sound', 'social', 'hatsu'],
    objectives: [
      { id: 'follow-courier', kind: 'follow', required: true },
      { id: 'identify-recipient', kind: 'identify', required: true },
      { id: 'extract', kind: 'extract', required: true },
    ],
    variants: variants('courier'),
  },
  'listening-device': {
    id: 'listening-device', duration: 12 * 60, witnesses: commonWitnesses,
    teaching: ['sound', 'social', 'traces', 'nen'],
    objectives: [
      { id: 'plant-device', kind: 'plant', required: true },
      { id: 'rich-placement', kind: 'identify', required: false, secret: true },
      { id: 'extract', kind: 'extract', required: true },
    ],
    variants: variants('listening'),
  },
  'compromised-shift': {
    id: 'compromised-shift', duration: 16 * 60, witnesses: commonWitnesses,
    teaching: ['social', 'traces', 'nen', 'hatsu'],
    objectives: [
      { id: 'perform-duty', kind: 'plant', required: false },
      { id: 'replace-register', kind: 'copy', required: true },
      { id: 'extract', kind: 'extract', required: true },
    ],
    variants: variants('shift'),
  },
  'impossible-witness': {
    id: 'impossible-witness', duration: 18 * 60, witnesses: commonWitnesses,
    teaching: ['social', 'vision', 'sound', 'traces'],
    objectives: [
      { id: 'gain-trust', kind: 'identify', required: true },
      { id: 'escort-witness', kind: 'follow', required: true },
      { id: 'false-narrative', kind: 'plant', required: false, secret: true },
      { id: 'extract', kind: 'extract', required: true },
    ],
    variants: variants('witness'),
  },
  'three-princes': {
    id: 'three-princes', duration: 20 * 60, witnesses: commonWitnesses,
    teaching: ['social', 'nen', 'traces', 'hatsu'],
    objectives: [
      { id: 'place-sources', kind: 'plant', required: true },
      { id: 'assess-intelligence', kind: 'identify', required: true },
      { id: 'extract', kind: 'extract', required: true },
    ],
    variants: variants('princes'),
  },
}

export function selectMission(id: MissionId, seed: number): MissionSelection {
  const definition = MISSIONS[id]
  const random = seededRandom(seed)
  return { definition, variant: definition.variants[random.integer(definition.variants.length)], seed }
}
