import { readFile, writeFile } from 'node:fs/promises'

const blueprintUrl = new URL('../data/ship/blueprint.json', import.meta.url)
const reportUrl = new URL('../data/ship/ROOM_APPEARANCE_AUDIT.md', import.meta.url)
const blueprint = JSON.parse(await readFile(blueprintUrl, 'utf8'))

const provenanceOrder = ['panel', 'plan', 'map', 'inferred']
const provenanceLabel = {
  panel: 'case du manga',
  plan: 'plan publié',
  map: 'reconstruction cartographique',
  inferred: 'liaison déduite',
}

const spacesById = new Map(blueprint.spaces.map((space) => [space.id, space]))
const groups = new Map()

for (const space of blueprint.spaces) {
  if (!space.locationId) continue
  const group = groups.get(space.locationId) ?? { spaces: [], structures: [] }
  group.spaces.push(space)
  groups.set(space.locationId, group)
}

for (const structure of blueprint.structures) {
  const space = spacesById.get(structure.spaceId)
  if (!space?.locationId) continue
  groups.get(space.locationId)?.structures.push(structure)
}

const dimensions = (footprint) => {
  if (!footprint?.length) return null
  const xs = footprint.map(([x]) => x)
  const zs = footprint.map(([, z]) => z)
  const width = Math.max(...xs) - Math.min(...xs)
  const depth = Math.max(...zs) - Math.min(...zs)
  return `${Number(width.toFixed(2))} × ${Number(depth.toFixed(2))} m`
}

const countedKinds = (structures) => {
  const counts = new Map()
  for (const structure of structures)
    counts.set(structure.kind, (counts.get(structure.kind) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([kind, count]) => `${count} ${kind}`)
    .join(', ')
}

const lines = [
  '# Audit de l’apparence des pièces du Black Whale',
  '',
  '> Fichier généré par `node scripts/generate-room-appearance-audit.mjs` à partir de',
  '> `data/ship/blueprint.json`. Il inventorie chaque lieu visitable catalogué, les détails',
  '> effectivement modélisés et la source qui autorise chacun d’eux.',
  '',
  '## Comment lire l’audit',
  '',
  '- **Case du manga** : forme ou objet directement visible ; c’est l’autorité principale.',
  '- **Plan publié** : emprise ou distribution donnée par un plan, sans inventer un décor.',
  '- **Reconstruction cartographique** : détail repris du plan `/ship`, faute de case complète.',
  '- **Liaison déduite** : uniquement ce qui est nécessaire pour rendre le pont parcourable.',
  '- Une pièce vide dans le manga reste vide ici : une absence de meuble attesté est une information.',
  '',
  `**Couverture : ${groups.size} lieux, ${blueprint.spaces.length} espaces, ${blueprint.structures.length} éléments modélisés.**`,
  '',
]

for (const [locationId, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const names = [...new Set(group.spaces.map((space) => space.nameFr || space.name))]
  const tiers = [...new Set(group.spaces.map((space) => space.tierId))]
  const provenances = [...new Set(group.spaces.map((space) => space.provenance))].sort(
    (a, b) => provenanceOrder.indexOf(a) - provenanceOrder.indexOf(b),
  )
  const sources = [...new Set(group.spaces.map((space) => space.sourceFr || space.source))]
  const objectSources = [
    ...new Set(group.structures.map((structure) => structure.sourceFr || structure.source)),
  ]
  const footprints = [
    ...new Set(group.spaces.map((space) => dimensions(space.footprint)).filter(Boolean)),
  ]
  const ceilings = [
    ...new Set(group.spaces.map((space) => space.ceiling).filter((value) => value != null)),
  ]
  const inferred = group.spaces.filter((space) => space.provenance === 'inferred')
  const panelObjects = group.structures.filter((structure) => structure.provenance === 'panel')

  lines.push(`## ${names[0]} — \`${locationId}\``, '')
  lines.push(`- **Pont :** ${tiers.join(', ')}`)
  lines.push(
    `- **Preuve de l’enveloppe :** ${provenances.map((value) => provenanceLabel[value]).join(', ')}`,
  )
  lines.push(`- **Sous-espaces :** ${group.spaces.length}`)
  if (footprints.length) lines.push(`- **Emprises relevées :** ${footprints.join(' ; ')}`)
  if (ceilings.length) lines.push(`- **Hauteurs sous plafond :** ${ceilings.join(', ')} m`)
  lines.push(
    `- **Éléments modélisés :** ${group.structures.length ? countedKinds(group.structures) : 'aucun objet non attesté'}`,
  )
  lines.push(
    `- **Objets directement visibles dans les cases :** ${panelObjects.length}/${group.structures.length}`,
  )
  if (names.length > 1) lines.push(`- **Espaces internes :** ${names.slice(1).join(' ; ')}`)
  lines.push('- **Sources de la pièce :**')
  for (const source of sources) lines.push(`  - ${source}`)
  if (objectSources.length) {
    lines.push('- **Sources du mobilier et des détails :**')
    for (const source of objectSources) lines.push(`  - ${source}`)
  }
  if (inferred.length) {
    lines.push(
      `- **Limite connue :** ${inferred.length} liaison(s) ou volume(s) restent déduits pour assurer la continuité de la visite.`,
    )
  } else if (!group.structures.length) {
    lines.push(
      '- **Limite connue :** aucune case ne justifie davantage de mobilier dans ce volume.',
    )
  }
  lines.push('')
}

await writeFile(reportUrl, lines.join('\n'))
