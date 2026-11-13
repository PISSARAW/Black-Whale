import type {
  AbilityActionPresentation,
  AbilityActionPresentationText,
  AbilityConditionResult,
  AbilityContext,
  AbilityPresentationProjection,
  CanonSourceRef,
  NenActionWheelEntry,
  NenAbilityModule,
} from '@black-whale/nen-engine'
import type { Catalogue } from '@black-whale/contracts'

export interface CompiledPresentations {
  presentations: AbilityPresentationProjection[]
  problems: string[]
}

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'ability-preview',
  chapterNumber: 0,
  localSequence: 0,
}

function previewContext(module: NenAbilityModule, actionId?: string): AbilityContext {
  return {
    abilityId: module.manifest.id,
    actorId: module.manifest.ownerId || 'preview-actor',
    targets: ['preview-target'],
    eventId: CURSOR.eventId,
    cursor: CURSOR,
    ...(actionId ? { actionId } : {}),
  }
}

const humanize = (value: string): string => {
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
  return spaced ? `${spaced[0]!.toUpperCase()}${spaced.slice(1)}` : value
}

function validSource(source: unknown): source is CanonSourceRef {
  if (!source || typeof source !== 'object') return false
  const candidate = source as Partial<CanonSourceRef>
  if (!candidate.label?.trim()) return false
  if (candidate.kind === 'chapter')
    return Number.isInteger(candidate.chapter) && candidate.chapter! > 0
  return (
    candidate.kind === 'databook' || candidate.kind === 'interview' || candidate.kind === 'other'
  )
}

function englishSource(source: CanonSourceRef): string {
  if (source.kind === 'chapter') return `Chapter ${source.chapter}`
  if (source.kind === 'databook') return 'Databook source'
  if (source.kind === 'interview') return 'Interview source'
  return 'Canonical source'
}

function englishCondition(condition: AbilityConditionResult): string {
  const standard: Record<string, string> = {
    'can-use-nen': 'The actor can use Nen',
    'is-conscious': 'The actor is conscious',
    'use-shown': 'This use is shown in the manga',
    'use-asserted': 'This use is stated by the canon but not shown',
    'use-hypothesis': 'Simulation branch only',
    'use-refused': 'The canon explicitly refuses this use',
    'use-gyo': 'Gyo reveals the concealed effect',
    'requires-target': 'A valid target is selected',
  }
  return standard[condition.id] ?? humanize(condition.id)
}

function localizedActionText(options: {
  actionId: string
  label: string
  hint?: string
  source?: CanonSourceRef
  conditions: AbilityConditionResult[]
  cost?: { label: string; amount?: number; unit?: string }
}): Record<'en' | 'fr', AbilityActionPresentationText> {
  const costSuffix = [options.cost?.amount, options.cost?.unit].filter((part) => part !== undefined)
  return {
    fr: {
      label: options.label,
      ...(options.hint ? { hint: options.hint } : {}),
      ...(options.source ? { source: options.source.label } : {}),
      conditions: options.conditions.map(({ label }) => label),
      ...(options.cost ? { cost: options.cost.label } : {}),
    },
    en: {
      label: humanize(options.actionId),
      ...(options.hint ? { hint: 'Canonical usage note' } : {}),
      ...(options.source ? { source: englishSource(options.source) } : {}),
      conditions: options.conditions.map(englishCondition),
      ...(options.cost
        ? { cost: `Canonical cost${costSuffix.length ? ` — ${costSuffix.join(' ')}` : ''}` }
        : {}),
    },
  }
}

function validateActionSource(options: {
  abilityId: string
  entry: NenActionWheelEntry
  conditions: AbilityConditionResult[]
  problems: string[]
}): void {
  const { abilityId, entry, conditions, problems } = options
  const hasCanonEvidence = conditions.some(({ id }) => id === 'use-shown' || id === 'use-asserted')
  if (hasCanonEvidence && !validSource(entry.source)) {
    problems.push(`${abilityId}/${entry.id}: shown or asserted use lacks CanonSourceRef`)
  }
  if (entry.source !== undefined && !validSource(entry.source)) {
    problems.push(`${abilityId}/${entry.id}: provenance is not a structured CanonSourceRef`)
  }
}

function compileAction(options: {
  abilityId: string
  module: NenAbilityModule
  entry: NenActionWheelEntry
  problems: string[]
}): AbilityActionPresentation {
  const { abilityId, module, entry, problems } = options
  const context = previewContext(module, entry.id)
  const { interaction: _interaction, ...plan } = module.plan(context)
  validateActionSource({ abilityId, entry, conditions: plan.conditions, problems })
  const text = localizedActionText({
    actionId: entry.id,
    label: entry.label,
    ...(entry.hint ? { hint: entry.hint } : {}),
    ...(entry.source ? { source: entry.source } : {}),
    conditions: plan.conditions,
    ...(plan.cost ? { cost: plan.cost } : {}),
  })
  for (const locale of ['en', 'fr'] as const) {
    const incomplete =
      !text[locale].label.trim() || text[locale].conditions.some((label) => !label.trim())
    if (incomplete)
      problems.push(`${abilityId}/${entry.id}: incomplete ${locale} action translation`)
  }
  return { entry, plan, availability: module.explainAction(entry.id, context), text }
}

/** Compile the parts of a module that can safely be shipped to a browser. */
export function compileAbilityPresentations({
  modules,
  catalogue,
}: {
  modules: readonly NenAbilityModule[]
  catalogue: Pick<Catalogue, 'abilities'>
}): CompiledPresentations {
  const moduleById = new Map(modules.map((module) => [module.manifest.id, module]))
  const presentations: AbilityPresentationProjection[] = []
  const problems: string[] = []

  for (const ability of catalogue.abilities) {
    const module = moduleById.get(ability.id)
    if (!module?.manifest.site) continue
    const wheel = module.getActionWheel(previewContext(module))
    if (wheel.length === 0) {
      problems.push(`${ability.id}: its client action wheel is empty`)
      continue
    }
    const componentKey =
      module.getInteractionManifest()?.customComponent ?? module.getUIComponent().componentKey
    const viewLabel = humanize(componentKey)
    presentations.push({
      abilityId: ability.id,
      identity: {
        // Identity is canon data. A module may classify an unrevealed ability
        // operationally so its reducer can choose effects, but that is not
        // permission for the client projection to present the inference as a
        // published Nen category.
        name: ability.name,
        ownerId: ability.ownerId ?? module.manifest.ownerId,
        category: ability.category,
        version: module.manifest.version,
      },
      interactionManifest: module.getInteractionManifest(),
      componentKey,
      viewLabel: { en: viewLabel, fr: viewLabel },
      actions: wheel.map((entry) =>
        compileAction({ abilityId: ability.id, module, entry, problems }),
      ),
    })
  }

  return { presentations, problems }
}
