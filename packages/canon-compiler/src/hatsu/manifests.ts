import type { AbilityInteractionManifest, NenAbilityModule } from '@black-whale/nen-engine'
import type { Catalogue } from '@black-whale/contracts'

/**
 * The interaction manifests, compiled for the renderers.
 *
 * The modules have declared `interactionManifest` since section 18 — input
 * mode, allowed targets, overlays, entry state — and ADR-001 found it with
 * **zero consumers**: the DOM layer and the 3D tour each decided for themselves
 * what a technique may be pointed at, and 24 of the 82 were being cast at a
 * target their own manifest forbade. Compiling the table is what lets a
 * renderer read the declaration instead of restating it.
 *
 * Nothing is decided here. A module that presents itself on the site without
 * declaring how it is interacted with is a build failure, because the renderer
 * would have nothing to read and would go back to guessing.
 */

export interface CompiledManifests {
  manifests: AbilityInteractionManifest[]
  problems: string[]
}

export interface ManifestsInput {
  modules: readonly NenAbilityModule[]
  catalogue: Pick<Catalogue, 'abilities'>
}

export function compileInteractionManifests({
  modules,
  catalogue,
}: ManifestsInput): CompiledManifests {
  const moduleById = new Map(modules.map((module) => [module.manifest.id, module]))
  const problems: string[] = []
  const manifests: AbilityInteractionManifest[] = []

  for (const ability of catalogue.abilities) {
    const module = moduleById.get(ability.id)
    // Only what the site casts: an ability with no `site` block has no
    // renderer, so it has nothing to declare an interaction for.
    if (!module?.manifest.site) continue

    const manifest = module.getInteractionManifest()
    if (!manifest) {
      problems.push(
        `${ability.id}: the site casts it but the module declares no \`interactionManifest\``,
      )
      continue
    }
    if (manifest.abilityId !== ability.id) {
      problems.push(
        `${ability.id}: its manifest is built for "${manifest.abilityId}" — the renderers look it up by id`,
      )
      continue
    }
    if (manifest.allowedTargets.length === 0) {
      problems.push(`${ability.id}: its manifest allows no target, so nothing could ever cast it`)
      continue
    }

    manifests.push(manifest)
  }

  return { manifests, problems }
}
