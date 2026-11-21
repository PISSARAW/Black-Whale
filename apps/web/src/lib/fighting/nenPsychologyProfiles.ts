import type { FighterId } from './types'

export type AuraResponse = 'observe' | 'guard' | 'press'
export type PsychologyEvidence = 'established-characterisation' | 'limited-evidence'

export interface NenPsychologyProfile {
  /** Canon-facing qualitative basis; numeric values below remain Clash tuning. */
  basis: string
  evidence: PsychologyEvidence
  composure: number
  resolve: number
  impactApprehension: number
  impactComposureLoss: number
  successResolve: number
  hatsuCaution: number
  recovery: { composure: number; apprehension: number; resolve: number }
  auraResponse: AuraResponse
  guardAtApprehension: number
}

type ProfileTuning = Omit<NenPsychologyProfile, 'basis' | 'evidence'>

const ANALYTICAL: ProfileTuning = {
  composure: 8_200,
  resolve: 6_500,
  impactApprehension: 80,
  impactComposureLoss: 75,
  successResolve: 90,
  hatsuCaution: 75,
  recovery: { composure: 2, apprehension: 2, resolve: 1 },
  auraResponse: 'observe',
  guardAtApprehension: 0.72,
}
const STOIC: ProfileTuning = {
  composure: 8_500,
  resolve: 7_000,
  impactApprehension: 65,
  impactComposureLoss: 60,
  successResolve: 95,
  hatsuCaution: 65,
  recovery: { composure: 1, apprehension: 2, resolve: 1 },
  auraResponse: 'guard',
  guardAtApprehension: 0.78,
}
const ASSERTIVE: ProfileTuning = {
  composure: 7_000,
  resolve: 8_000,
  impactApprehension: 90,
  impactComposureLoss: 95,
  successResolve: 125,
  hatsuCaution: 90,
  recovery: { composure: 2, apprehension: 2, resolve: 2 },
  auraResponse: 'press',
  guardAtApprehension: 0.82,
}
const GUARDED: ProfileTuning = {
  composure: 7_000,
  resolve: 6_500,
  impactApprehension: 115,
  impactComposureLoss: 90,
  successResolve: 100,
  hatsuCaution: 125,
  recovery: { composure: 2, apprehension: 3, resolve: 1 },
  auraResponse: 'guard',
  guardAtApprehension: 0.6,
}
const PLAYFUL: ProfileTuning = {
  composure: 7_400,
  resolve: 7_000,
  impactApprehension: 85,
  impactComposureLoss: 85,
  successResolve: 115,
  hatsuCaution: 70,
  recovery: { composure: 2, apprehension: 2, resolve: 2 },
  auraResponse: 'press',
  guardAtApprehension: 0.76,
}
const VOLATILE: ProfileTuning = {
  composure: 5_800,
  resolve: 8_000,
  impactApprehension: 125,
  impactComposureLoss: 130,
  successResolve: 140,
  hatsuCaution: 95,
  recovery: { composure: 3, apprehension: 2, resolve: 3 },
  auraResponse: 'press',
  guardAtApprehension: 0.72,
}
const NEUTRAL: ProfileTuning = {
  composure: 7_000,
  resolve: 5_000,
  impactApprehension: 100,
  impactComposureLoss: 100,
  successResolve: 100,
  hatsuCaution: 100,
  recovery: { composure: 1, apprehension: 1, resolve: 1 },
  auraResponse: 'guard',
  guardAtApprehension: 0.65,
}

function profile(
  base: ProfileTuning,
  basis: string,
  overrides: Partial<ProfileTuning> = {},
  evidence: PsychologyEvidence = 'established-characterisation',
): NenPsychologyProfile {
  return {
    ...base,
    ...overrides,
    recovery: { ...base.recovery, ...overrides.recovery },
    basis,
    evidence,
  }
}

/**
 * Explicit roster coverage. Bases come from established characterisation documented in
 * EMOTIONS.md; numbers are bounded duel tuning, not psychological statistics from the manga.
 */
export const NEN_PSYCHOLOGY_PROFILES: Readonly<Partial<Record<FighterId, NenPsychologyProfile>>> = {
  kurapika: profile(ANALYTICAL, 'Concentration précise et tension contenue.', {
    resolve: 8_500,
    impactApprehension: 85,
  }),
  hisoka: profile(PLAYFUL, 'Amusement joueur face au combat et au danger.', {
    composure: 8_200,
    resolve: 8_500,
    impactApprehension: 55,
    hatsuCaution: 40,
  }),
  chrollo: profile(ANALYTICAL, 'Calme analytique et réactions retenues.', {
    composure: 9_000,
    resolve: 7_500,
    impactApprehension: 55,
    hatsuCaution: 50,
  }),
  benjamin: profile(ASSERTIVE, 'Autorité sévère et engagement militaire frontal.', {
    composure: 7_800,
    resolve: 9_000,
    impactApprehension: 70,
  }),
  tserriednich: profile(ANALYTICAL, 'Dédain froid et irritation maîtrisée.', {
    composure: 8_500,
    resolve: 8_000,
  }),
  feitan: profile(ASSERTIVE, 'Hostilité contenue et douleur convertie en riposte.', {
    composure: 7_600,
    resolve: 8_500,
    impactApprehension: 70,
    successResolve: 135,
  }),
  saiyu: profile(PLAYFUL, 'Vigilance narquoise derrière une garde technique.', {
    composure: 7_200,
    resolve: 6_800,
    auraResponse: 'guard',
  }),
  theta: profile(GUARDED, 'Prudence inquiète soutenue par une décision difficile.', {
    composure: 7_200,
    resolve: 7_800,
    hatsuCaution: 115,
  }),
  biscuit: profile(PLAYFUL, 'Candeur affichée et assurance d’une maîtresse expérimentée.', {
    composure: 9_000,
    resolve: 8_000,
    impactApprehension: 50,
    hatsuCaution: 55,
  }),
  phinks: profile(ASSERTIVE, 'Assurance provocatrice et recherche de l’échange direct.', {
    resolve: 8_500,
    impactApprehension: 80,
  }),
  franklin: profile(STOIC, 'Tempérament placide, solide et mesuré.', {
    composure: 9_000,
    resolve: 8_000,
  }),
  machi: profile(STOIC, 'Froideur attentive et réactions très retenues.', {
    composure: 8_800,
    resolve: 7_500,
  }),
  illumi: profile(STOIC, 'Impassibilité et expression émotionnelle minimale.', {
    composure: 9_500,
    resolve: 8_000,
    impactApprehension: 35,
    impactComposureLoss: 35,
    hatsuCaution: 45,
  }),
  kalluto: profile(GUARDED, 'Réserve, application et curiosité discrète.', {
    composure: 6_800,
    resolve: 6_500,
    impactApprehension: 105,
  }),
  bonolenov: profile(STOIC, 'Gravité rituelle et maîtrise corporelle.', {
    resolve: 7_800,
  }),
  shizuku: profile(STOIC, 'Détachement et faible expressivité.', {
    composure: 8_000,
    resolve: 6_000,
    impactApprehension: 60,
    hatsuCaution: 50,
  }),
  hinrigh: profile(ANALYTICAL, 'Pragmatisme vigilant et assurance mesurée.', {
    resolve: 7_500,
  }),
  mizaistom: profile(ANALYTICAL, 'Sérieux posé et autorité sans agitation.', {
    composure: 8_600,
    resolve: 7_800,
  }),
  leorio: profile(VOLATILE, 'Franchise, détermination et réactions émotionnelles vives.', {
    composure: 6_000,
    resolve: 8_500,
    impactApprehension: 110,
  }),
  hanzo: profile(ANALYTICAL, 'Discipline attentive malgré un effort nerveux.', {
    composure: 7_800,
    resolve: 7_500,
    impactApprehension: 95,
  }),
  rihan: profile(ANALYTICAL, 'Observation prolongée et concentration presque immobile.', {
    composure: 9_200,
    resolve: 7_000,
    hatsuCaution: 40,
  }),
  zakuro: profile(PLAYFUL, 'Aisance joueuse et confiance expressive.', {
    composure: 7_200,
    resolve: 6_500,
  }),
  melody: profile(GUARDED, 'Douceur attentive et inquiétude tournée vers la protection.', {
    composure: 8_500,
    resolve: 8_000,
    impactApprehension: 90,
    hatsuCaution: 80,
    auraResponse: 'observe',
  }),
  basho: profile(ASSERTIVE, 'Assurance bourrue et engagement franc.', {
    composure: 6_800,
    resolve: 7_500,
  }),
  camilla: profile(VOLATILE, 'Arrogance altière et irritation très lisible.', {
    composure: 5_500,
    resolve: 9_000,
    impactApprehension: 130,
    successResolve: 150,
  }),
  halkenburg: profile(ASSERTIVE, 'Gravité, conviction collective et détermination sincère.', {
    composure: 7_600,
    resolve: 9_500,
  }),
  gel: profile(
    NEUTRAL,
    'Assurance calme ; comportement de combat peu documenté.',
    {
      composure: 7_800,
      resolve: 6_000,
      auraResponse: 'observe',
    },
    'limited-evidence',
  ),
  lynch: profile(ASSERTIVE, 'Défi direct et réactions démonstratives.', {
    composure: 6_500,
    resolve: 7_500,
    impactApprehension: 105,
  }),
  luini: profile(VOLATILE, 'Audace inquiétante et goût de l’attaque surprise.', {
    composure: 6_000,
    resolve: 8_000,
    impactApprehension: 110,
  }),
  bill: profile(GUARDED, 'Vigilance protectrice et effort tenace malgré la fatigue.', {
    composure: 6_500,
    resolve: 8_500,
  }),
  furykov: profile(ANALYTICAL, 'Examen soupçonneux et réactions disciplinées.', {
    composure: 8_500,
    resolve: 7_000,
  }),
  cluck: profile(
    NEUTRAL,
    'Attention sévère ; comportement de duel peu documenté.',
    {
      composure: 7_200,
      resolve: 6_500,
      auraResponse: 'guard',
    },
    'limited-evidence',
  ),
  beyond: profile(
    NEUTRAL,
    'Confiance expansive ; aucun combat canonique détaillé.',
    {
      composure: 8_500,
      resolve: 9_000,
      impactApprehension: 70,
      auraResponse: 'press',
    },
    'limited-evidence',
  ),
  longhi: profile(
    NEUTRAL,
    'Fermeté réfléchie ; comportement de duel peu documenté.',
    {
      composure: 7_800,
      resolve: 7_200,
      auraResponse: 'observe',
    },
    'limited-evidence',
  ),
  musse: profile(ANALYTICAL, 'Discrétion professionnelle et tension mesurée.', {
    composure: 8_300,
    resolve: 7_000,
  }),
  padaille: profile(VOLATILE, 'Agressivité frontale et crispation marquée.', {
    composure: 5_500,
    resolve: 7_500,
  }),
  sayird: profile(
    GUARDED,
    'Vigilance inquiète ; son unique affrontement est sous manipulation.',
    {
      composure: 6_000,
      resolve: 5_500,
      impactApprehension: 130,
    },
    'limited-evidence',
  ),
  terebellum: profile(STOIC, 'Robustesse taciturne et tension contenue.', {
    composure: 8_200,
    resolve: 8_000,
  }),
  voconte: profile(PLAYFUL, 'Désinvolture alerte et confiance légère.', {
    resolve: 6_500,
  }),
  yokotani: profile(ANALYTICAL, 'Courtoisie inquiétante et contrôle de la situation.', {
    composure: 8_300,
    resolve: 7_500,
  }),
}

const UNCATALOGUED_PROFILE = profile(
  NEUTRAL,
  'Profil neutre : personnage hors du roster de duel ou caractérisation insuffisante.',
  {},
  'limited-evidence',
)

export function nenPsychologyProfile(id: FighterId): NenPsychologyProfile {
  return NEN_PSYCHOLOGY_PROFILES[id] ?? UNCATALOGUED_PROFILE
}

export function initialNenPsychology(id: FighterId) {
  const selected = nenPsychologyProfile(id)
  return { composure: selected.composure, apprehension: 0, resolve: selected.resolve }
}

export function restedNenPsychology(
  id: FighterId,
  previous?: { composure: number; apprehension: number; resolve: number },
) {
  const selected = nenPsychologyProfile(id)
  const current = previous ?? initialNenPsychology(id)
  return {
    composure: Math.round(selected.composure + (current.composure - selected.composure) * 0.5),
    apprehension: Math.round(current.apprehension * 0.5),
    resolve: Math.round(selected.resolve + (current.resolve - selected.resolve) * 0.5),
  }
}
