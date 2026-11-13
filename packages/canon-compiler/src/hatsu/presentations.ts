import type {
  AbilityContext,
  AbilityPresentationProjection,
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
      actions: wheel.map((entry) => {
        const context = previewContext(module, entry.id)
        const { interaction: _interaction, ...plan } = module.plan(context)
        return { entry, plan, availability: module.explainAction(entry.id, context) }
      }),
    })
  }

  return { presentations, problems }
}
