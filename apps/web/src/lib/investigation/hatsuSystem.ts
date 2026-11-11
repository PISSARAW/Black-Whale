import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { InvestigationHatsuRule } from './definition'
import type { InvestigationHatsuUse } from './hatsu'
import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'
import type { Messages } from '$lib/i18n'

export interface HatsuInvestigationContext {
  availableEvidenceIds: Iterable<string>
  remainingLifeHours?: number
  remainingAura?: number
}

export interface HatsuResolution extends InvestigationHatsuUse {
  ruleId: string | null
  usable: boolean
  missingEvidenceIds: string[]
  countered: boolean
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
      auraCost: 0,
      countered: false,
      tone: 'limited',
    }
  }

  const available = new Set(context.availableEvidenceIds)
  const missingEvidenceIds = rule.evidenceIds.filter((id) => !available.has(id))
  const affordable =
    context.remainingLifeHours === undefined || context.remainingLifeHours >= rule.lifeHours
  const auraAffordable =
    context.remainingAura === undefined || context.remainingAura >= rule.auraCost
  const countered = rule.countermeasureEvidenceIds.some((id) => available.has(id))
  const usable = rule.outcome !== 'forbidden' && affordable && auraAffordable && !countered
  const tone =
    !usable || rule.outcome === 'forbidden'
      ? 'forbidden'
      : rule.outcome === 'evidence' || rule.outcome === 'corroboration'
        ? 'success'
        : 'limited'
  const title = countered
    ? msg.countered
    : rule.outcome === 'forbidden'
      ? msg.usageDenied
      : !affordable || !auraAffordable
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
    finding: findingFor(rule, { affordable, auraAffordable, countered }, msg),
    evidenceIds: usable ? rule.evidenceIds : [],
    missingEvidenceIds,
    lifeHours: usable ? rule.lifeHours : 0,
    auraCost: usable ? rule.auraCost : 0,
    countered,
    tone,
  }
}

function findingFor(
  rule: InvestigationHatsuRule,
  state: { affordable: boolean; auraAffordable: boolean; countered: boolean },
  msg: Messages['investigation']['hatsu'],
) {
  if (state.countered) return msg.countermeasureActive
  if (!state.affordable) return msg.requiresLifeHours(rule.lifeHours)
  if (!state.auraAffordable) return msg.requiresAura(rule.auraCost)
  if (rule.outcome === 'forbidden') return msg.ethicalOrProceduralConditions
  if (rule.outcome === 'limited') return msg.confirmsLimits
  if (rule.outcome === 'corroboration') return msg.reinforcesInfo
  return msg.revealsCompatibleElements
}
