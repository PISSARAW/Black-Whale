import { requireValidContract } from './validate'
import { HUNT_CONTRACT_SCHEMA_VERSION, type HuntContractV3 } from './types'

// Annotated as `HuntContractV3[]` before `.map`, not after: without it the
// literals widen to a union of their own shapes and `requireValidContract`
// no longer accepts them, even though each entry is a valid contract.
const declared: HuntContractV3[] = [
  {
    schemaVersion: HUNT_CONTRACT_SCHEMA_VERSION,
    id: 'royal-apartments',
    title: { en: 'Royal apartments', fr: 'Appartements royaux' },
    description: {
      en: 'Cross three royal suites while the hunter closes the distance.',
      fr: 'Traversez trois suites royales tandis que le chasseur réduit la distance.',
    },
    terrainSequence: ['tserriednich', 'tubeppa', 'woble'],
    objectives: [{ kind: 'reach', terrain: 'woble' }],
    allowedHatsu: ['bungee-gum', 'parallel-future', 'dowsing-chain'],
    hunterProfiles: ['methodical', 'aggressive', 'cautious'],
    environment: { lighting: 'normal', acoustics: 'clear', sealableExits: false },
    durationSeconds: 900,
    seed: 0x5eed,
  },
  {
    schemaVersion: HUNT_CONTRACT_SCHEMA_VERSION,
    id: 'blackout-siege',
    title: { en: 'Blackout siege', fr: 'Siège dans le noir' },
    description: {
      en: 'Survive a sealed, reverberant apartment without reliable sight.',
      fr: 'Survivez dans un appartement scellé et réverbérant sans vision fiable.',
    },
    terrainSequence: ['tubeppa'],
    objectives: [
      { kind: 'survive', seconds: 360 },
      { kind: 'misdirect', falseTrails: 2 },
    ],
    allowedHatsu: ['parallel-future', 'dowsing-chain'],
    hunterProfiles: ['aggressive'],
    environment: { lighting: 'blackout', acoustics: 'reverberant', sealableExits: true },
    durationSeconds: 420,
    seed: 0xb1ac,
  },
]

const contracts: HuntContractV3[] = declared.map(requireValidContract)

export function listHuntContracts(): HuntContractV3[] {
  return [...contracts]
}

export function huntContractById(id: string): HuntContractV3 | null {
  return contracts.find((contract) => contract.id === id) ?? null
}
