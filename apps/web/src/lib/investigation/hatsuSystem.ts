import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { InvestigationHatsuRule } from './definition'
import type { InvestigationHatsuUse } from './hatsu'
import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'

export interface HatsuInvestigationContext {
  availableEvidenceIds: Iterable<string>
  remainingLifeHours?: number
}

export interface HatsuResolution extends InvestigationHatsuUse {
  ruleId: string | null
  usable: boolean
  missingEvidenceIds: string[]
}

/** Who is being questioned with what, under which case rules. */
export interface InvestigationHatsuAttempt {
  subjectId: string
  rules: InvestigationHatsuRule[]
  context: HatsuInvestigationContext
  locale?: Locale
}

export function resolveInvestigationHatsu(
  profile: HatsuProfile,
  { subjectId, rules, context, locale = 'en' }: InvestigationHatsuAttempt,
): HatsuResolution {
  const rule = rules.find(
    (candidate) =>
      candidate.kinds.includes(profile.kind) && candidate.subjectIds.includes(subjectId),
  )
  const key = `${profile.id}:${subjectId}`
  const msg = messagesFor(locale).investigation.hatsu
  if (!rule) {
    return {
      key,
      ruleId: null,
      usable: false,
      title: msg.noGrip,
      finding: msg.cannotEstablishInfo(profile.name),
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
      ? msg.usageDenied
      : !affordable
        ? msg.impossibleCost
        : rule.outcome === 'corroboration'
          ? msg.corroboratedSignal
          : rule.outcome === 'evidence'
            ? msg.conclusiveAnalysis
            : msg.limitedResult

  return {
    key,
    ruleId: rule.id,
    usable,
    title,
    finding: findingFor(rule, affordable, msg),
    evidenceIds: usable ? rule.evidenceIds : [],
    missingEvidenceIds,
    lifeHours: usable ? rule.lifeHours : 0,
    tone,
  }
}

function findingFor(rule: InvestigationHatsuRule, affordable: boolean, msg: any) {
  if (!affordable) return msg.requiresLifeHours(rule.lifeHours)
  if (rule.outcome === 'forbidden') return msg.ethicalOrProceduralConditions
  if (rule.outcome === 'limited') return msg.confirmsLimits
  if (rule.outcome === 'corroboration') return msg.reinforcesInfo
  return msg.revealsCompatibleElements
}
