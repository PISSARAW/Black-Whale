import { resolveIllumiContact } from './illumiImpact'
import { resolveHalkenburgContact } from './halkenburgImpact'

export function resolveMindContact(options: Parameters<typeof resolveIllumiContact>[0]) {
  return resolveIllumiContact(options) ?? resolveHalkenburgContact(options)
}
