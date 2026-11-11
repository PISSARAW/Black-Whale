import type { InvestigationCaseDefinition } from './definition'

export type NotebookNodeKind = 'location' | 'subject' | 'evidence'
export type NotebookEdgeKind = 'present-at' | 'source-of' | 'observed'

export interface NotebookNode {
  id: string
  label: string
  kind: NotebookNodeKind
}

export interface NotebookEdge {
  from: string
  to: string
  kind: NotebookEdgeKind
}

export interface NotebookGraph {
  nodes: NotebookNode[]
  edges: NotebookEdge[]
}

/** Builds only the spatial and relational facts the investigator has actually unlocked. */
export function buildNotebookGraph(input: {
  definition: InvestigationCaseDefinition
  discoveredEvidenceIds: Iterable<string>
  reviewedSubjectIds: Iterable<string>
}): NotebookGraph {
  const discovered = new Set(input.discoveredEvidenceIds)
  const reviewed = new Set(input.reviewedSubjectIds)
  const locationId = `location:${input.definition.scene.spaceId}`
  const evidence = input.definition.content.evidence.filter((item) => discovered.has(item.id))
  const subjects = input.definition.content.subjects.filter(
    (subject) => reviewed.has(subject.id) || evidence.some((item) => item.subjectId === subject.id),
  )
  const subjectIds = new Set(subjects.map((subject) => subject.id))
  const nodes: NotebookNode[] = [
    { id: locationId, label: input.definition.metadata.location, kind: 'location' },
    ...subjects.map((subject) => ({
      id: subject.id,
      label: subject.name,
      kind: 'subject' as const,
    })),
    ...evidence.map((item) => ({ id: item.id, label: item.title, kind: 'evidence' as const })),
  ]
  const edges: NotebookEdge[] = [
    ...subjects.map((subject) => ({
      from: subject.id,
      to: locationId,
      kind: 'present-at' as const,
    })),
    ...evidence.map((item) => ({
      from: item.subjectId,
      to: item.id,
      kind: 'source-of' as const,
    })),
    ...input.definition.scene.sightLines
      .filter(
        (line) => line.visible && subjectIds.has(line.observerId) && subjectIds.has(line.targetId),
      )
      .map((line) => ({
        from: line.observerId,
        to: line.targetId,
        kind: 'observed' as const,
      })),
  ]

  return { nodes, edges: uniqueEdges(edges) }
}

function uniqueEdges(edges: NotebookEdge[]): NotebookEdge[] {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    const key = `${edge.kind}:${edge.from}:${edge.to}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
