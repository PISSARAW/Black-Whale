import {
  catsName,
  luiniSpatialTeleportation,
  silentMajority,
  surveillancePaperDolls,
} from '@black-whale/ability-modules'

export type HatsuEvidenceKind =
  | 'spatial-disappearance'
  | 'reused-location'
  | 'post-mortem-aura'
  | 'direct-killer-condition'
  | 'remote-attack'
  | 'multiple-suspects'
  | 'paper-fragment'
  | 'remote-surveillance'

export interface HatsuEvidence {
  kind: HatsuEvidenceKind
  source: 'observed' | 'witness' | 'residue'
  observedAt: number
  confidence: number
}

export interface HuntHatsuHypothesis {
  abilityId: string
  name: string
  signatures: HatsuEvidenceKind[]
  countermeasure: string
}

export interface HuntHatsuIntel {
  evidence: HatsuEvidence[]
  candidates: HuntHatsuHypothesis[]
  confirmedAbilityId: string | null
  countermeasures: string[]
}

export const HUNT_HATSU_HYPOTHESES: readonly HuntHatsuHypothesis[] = [
  {
    abilityId: luiniSpatialTeleportation.manifest.id,
    name: luiniSpatialTeleportation.manifest.name,
    signatures: ['spatial-disappearance', 'reused-location'],
    countermeasure: 'invalidate-visited-anchor',
  },
  {
    abilityId: catsName.manifest.id,
    name: catsName.manifest.name,
    signatures: ['post-mortem-aura', 'direct-killer-condition'],
    countermeasure: 'capture-without-killing',
  },
  {
    abilityId: silentMajority.manifest.id,
    name: silentMajority.manifest.name,
    signatures: ['remote-attack', 'multiple-suspects'],
    countermeasure: 'isolate-host-and-doll',
  },
  {
    abilityId: surveillancePaperDolls.manifest.id,
    name: surveillancePaperDolls.manifest.name,
    signatures: ['paper-fragment', 'remote-surveillance'],
    countermeasure: 'remove-paper-observers',
  },
]

export function initialHatsuIntel(): HuntHatsuIntel {
  return {
    evidence: [],
    candidates: HUNT_HATSU_HYPOTHESES.map((hypothesis) => ({ ...hypothesis })),
    confirmedAbilityId: null,
    countermeasures: [],
  }
}

export function recordHatsuEvidence(
  state: HuntHatsuIntel,
  evidence: HatsuEvidence,
): HuntHatsuIntel {
  const nextEvidence = [...state.evidence, evidence]
  const observedKinds = new Set(
    nextEvidence.filter((entry) => entry.confidence >= 0.5).map((entry) => entry.kind),
  )
  const candidates = state.candidates.filter((candidate) =>
    [...observedKinds].every((kind) => candidate.signatures.includes(kind)),
  )
  const confirmed = candidates.length === 1 ? candidates[0] : null
  const fullyUnderstood =
    confirmed && confirmed.signatures.every((signature) => observedKinds.has(signature))
  return {
    evidence: nextEvidence,
    candidates,
    confirmedAbilityId: confirmed?.abilityId ?? null,
    countermeasures: fullyUnderstood ? [confirmed.countermeasure] : [],
  }
}
