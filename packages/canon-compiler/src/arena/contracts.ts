import type { ArenaContract, NenAbilityModule } from '@black-whale/nen-engine'
import type { Catalogue } from '@black-whale/contracts'

/**
 * The arena's contract table, compiled.
 *
 * Until ADR-001 chantier 3 this table was written by hand in
 * `apps/web/src/lib/arena/hatsu/`: twenty-four contracts for the Black Whale
 * roster in `blackWhale.ts`, four more inline in `arenaDefinition()`. It stated
 * a cost and a condition for abilities whose modules already enforced both —
 * the sixth declaration of the catalogue ADR-001 set out to remove. Nothing is
 * decided here: the compiler joins the modules' `arena` blocks to the
 * catalogue, and every disagreement is a build failure.
 */

export interface CompiledContracts {
  contracts: ArenaContract[]
  /** Everything that stopped a contract from being compiled, by name. */
  problems: string[]
}

export interface ContractsInput {
  modules: readonly NenAbilityModule[]
  catalogue: Pick<Catalogue, 'abilities'>
}

export function compileArenaContracts({ modules, catalogue }: ContractsInput): CompiledContracts {
  const moduleById = new Map(modules.map((module) => [module.manifest.id, module]))
  const problems: string[] = []
  const contracts: ArenaContract[] = []
  const seenMechanics = new Map<string, string>()

  // The catalogue's order, like the registry's: the arena picks its fighters
  // from the profiles, and a reader who wants to change that order changes it
  // in `data/` once, for both.
  for (const ability of catalogue.abilities) {
    const module = moduleById.get(ability.id)
    const arena = module?.manifest.arena
    if (!module || !arena) continue

    // The arena chooses a hatsu by its profile, and the profile comes from the
    // `site` block: a duel contract without one is a fighter nobody can pick.
    if (!module.manifest.site) {
      problems.push(
        `${ability.id}: declares an \`arena\` block but no \`site\` block, so nothing can select it`,
      )
      continue
    }

    if (arena.mechanic) {
      const previous = seenMechanics.get(arena.mechanic)
      if (previous) {
        problems.push(
          `${ability.id}: mechanic "${arena.mechanic}" is already ${previous}'s — the roster individualises them`,
        )
        continue
      }
      seenMechanics.set(arena.mechanic, ability.id)
    }

    contracts.push({ id: ability.id, ...arena })
  }

  for (const module of modules) {
    if (
      module.manifest.arena &&
      !catalogue.abilities.some((ability) => ability.id === module.manifest.id)
    ) {
      problems.push(`${module.manifest.id}: no entry in data/abilities/abilities.json`)
    }
  }

  return { contracts, problems }
}
