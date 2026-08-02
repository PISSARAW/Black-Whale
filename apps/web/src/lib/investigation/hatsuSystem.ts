import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { InvestigationHatsuRule } from './definition'
import type { InvestigationHatsuUse } from './hatsu'

export interface HatsuInvestigationContext {
  availableEvidenceIds: Iterable<string>
  remainingLifeHours?: number
}

export interface HatsuResolution extends InvestigationHatsuUse {
  ruleId: string | null
  usable: boolean
  missingEvidenceIds: string[]
}

export function resolveInvestigationHatsu(
  profile: HatsuProfile,
  subjectId: string,
  rules: InvestigationHatsuRule[],
  context: HatsuInvestigationContext,
): HatsuResolution {
  const rule = rules.find(
    (candidate) =>
      candidate.kinds.includes(profile.kind) && candidate.subjectIds.includes(subjectId),
  )
  const key = `${profile.id}:${subjectId}`
  if (!rule) {
    return {
      key,
      ruleId: null,
      usable: false,
      title: 'Aucune prise',
      finding: `${profile.name} ne peut établir aucune information sur cette cible.`,
      evidenceIds: [],
      missingEvidenceIds: [],
      lifeHours: 0,
      tone: 'limited',
    }
  }

  const available = new Set(context.availableEvidenceIds)
  const missingEvidenceIds = rule.evidenceIds.filter((id) => !available.has(id))
  const affordable =
    context.remainingLifeHours === undefined || context.remainingLifeHours >= rule.lifeHours
  const usable = rule.outcome !== 'forbidden' && affordable
  const tone =
    !usable || rule.outcome === 'forbidden'
      ? 'forbidden'
      : rule.outcome === 'evidence' || rule.outcome === 'corroboration'
        ? 'success'
        : 'limited'
  const title =
    rule.outcome === 'forbidden'
      ? 'Usage refusé'
      : !affordable
        ? 'Coût impossible'
        : rule.outcome === 'corroboration'
          ? 'Signal corroboré'
          : rule.outcome === 'evidence'
            ? 'Analyse concluante'
            : 'Résultat limité'

  return {
    key,
    ruleId: rule.id,
    usable,
    title,
    finding: findingFor(rule, affordable),
    evidenceIds: usable ? rule.evidenceIds : [],
    missingEvidenceIds,
    lifeHours: usable ? rule.lifeHours : 0,
    tone,
  }
}

function findingFor(rule: InvestigationHatsuRule, affordable: boolean) {
  if (!affordable) return `Cette analyse exige ${rule.lifeHours} heures de vie disponibles.`
  if (rule.outcome === 'forbidden')
    return 'Les conditions éthiques ou procédurales interdisent cet usage.'
  if (rule.outcome === 'limited')
    return 'La capacité confirme ses propres limites sans produire de nouvelle preuve.'
  if (rule.outcome === 'corroboration')
    return 'La capacité renforce une information existante sans la transformer en vérité absolue.'
  return 'La capacité révèle les éléments compatibles avec ses conditions et son coût.'
}
