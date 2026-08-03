import type { HatsuProfile, NenAbilityModule } from '@black-whale/nen-engine'
import type { Catalogue } from '@black-whale/contracts'

/**
 * The web hatsu registry, compiled.
 *
 * Until ADR-001 chantier 3 this table was written by hand in
 * `apps/web/src/lib/nen/hatsuRegistry.ts`, in parallel with the modules and
 * with `data/abilities/abilities.json`. It had already drifted: four names and
 * fifty-six owners disagreed with the catalogue. Nothing is arbitrated here —
 * the join is total and every disagreement is a build failure, so the drift
 * cannot come back.
 *
 * Who owns what:
 *   - `data/abilities/abilities.json` — the ability's id and name;
 *   - `data/characters/characters.json` — the owner's canonical name;
 *   - the module's `site` block — kind, instruction, rule, cost, colour, action.
 */

export interface CompiledRegistry {
  profiles: HatsuProfile[]
  /** Everything that stopped an ability from being compiled, by name. */
  problems: string[]
}

export interface RegistryInput {
  modules: readonly NenAbilityModule[]
  catalogue: Pick<Catalogue, 'abilities' | 'characters'>
}

export function compileHatsuProfiles({ modules, catalogue }: RegistryInput): CompiledRegistry {
  const moduleById = new Map(modules.map((module) => [module.manifest.id, module]))
  const characterById = new Map(catalogue.characters.map((character) => [character.id, character]))
  const problems: string[] = []
  const profiles: HatsuProfile[] = []
  const seenKinds = new Map<string, string>()

  // The catalogue's order, not the modules' registration order: the picker
  // lists the registry as it comes, so the order is something a reader sees,
  // and `data/` is where a reader can change it.
  for (const ability of catalogue.abilities) {
    const id = ability.id
    const module = moduleById.get(id)
    if (!module) {
      if (ability.moduleKey)
        problems.push(`${id}: declares a moduleKey but no module answers to it`)
      continue
    }
    const site = module.manifest.site

    if (!site) {
      problems.push(`${id}: the module declares no \`site\` block, so the site cannot cast it`)
      continue
    }

    const ownerId = ability.ownerId
    const owner = ownerId ? characterById.get(ownerId) : undefined
    if (!ownerId) {
      problems.push(`${id}: the catalogue entry names no ownerId`)
      continue
    }
    if (!owner) {
      problems.push(`${id}: ownerId "${ownerId}" is in no character of the catalogue`)
      continue
    }

    // A module that disagrees with the catalogue about its own name is the
    // divergence this compiler exists to prevent; it is reported, not silently
    // overwritten, because only a human knows which of the two is the canon.
    if (module.manifest.name !== ability.name) {
      problems.push(
        `${id}: the module calls it "${module.manifest.name}", the catalogue "${ability.name}"`,
      )
      continue
    }
    if (module.manifest.ownerId !== ownerId) {
      problems.push(
        `${id}: the module gives it to "${module.manifest.ownerId}", the catalogue to "${ownerId}"`,
      )
      continue
    }

    const previous = seenKinds.get(site.kind)
    if (previous) {
      problems.push(`${id}: kind "${site.kind}" is already ${previous}'s — renderers switch on it`)
      continue
    }
    seenKinds.set(site.kind, id)

    profiles.push({ id, name: ability.name, owner: owner.canonicalName, ...site })
  }

  for (const module of modules) {
    if (!catalogue.abilities.some((ability) => ability.id === module.manifest.id)) {
      problems.push(`${module.manifest.id}: no entry in data/abilities/abilities.json`)
    }
  }

  return { profiles, problems }
}
